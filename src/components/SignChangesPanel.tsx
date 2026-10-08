'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { COMBUST_ORBS, collectTimingEvents, type TimingEvent } from '@/lib/signChanges';
import type { LongitudeSeries } from '@/lib/transitHits';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  targetDate: string;
  calculationSettings?: CalculationSettings;
  /** Moves the transit overlay to a moment (DD.MM.YYYY HH.MM.SS). */
  onSetTransit?: (value: string) => void;
};

const BODIES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
const CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const RANGES = [
  { label: '1 mo', days: 31 },
  { label: '3 mo', days: 92 },
  { label: '12 mo', days: 366 },
];
const FIRST_ROWS = 20;
type Event = TimingEvent & { time: number };
const DEFAULT_BODIES = BODIES.filter(body => body !== 'Moon');

type Loaded = { key: string; start: number; series: Record<string, { step: number; longitudes: number[] }> };

const pad = (value: number) => String(value).padStart(2, '0');

function formatMoment(time: number): string {
  const d = new Date(time);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * When a graha moves into the next sign, from the target date onwards, with
 * the house the new sign is from the natal ascendant. Loaded only when opened.
 */
export default function SignChangesPanel({ chart, targetDate, calculationSettings, onSetTransit }: Props) {
  const t = useT();
  const [selected, setSelected] = useState<string[]>([...DEFAULT_BODIES]);
  const [days, setDays] = useState(92);
  const [stations, setStations] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState('');

  const bodies = BODIES.filter(body => selected.includes(body));
  // Combustion compares Mercury and Venus with the Sun, so the Sun is fetched along.
  const needsSun = stations && bodies.some(body => body in COMBUST_ORBS);
  const requested = needsSun ? BODIES.filter(body => body === 'Sun' || bodies.includes(body)) : bodies;
  const key = [
    targetDate, days, requested.join(','),
    calculationSettings?.ayanamsa ?? 'lahiri',
    calculationSettings?.ayanamsaOffsetDegrees ?? 0,
    calculationSettings?.nodeMode ?? 'mean',
  ].join('|');

  useEffect(() => {
    if (bodies.length === 0 || data?.key === key) return;
    const controller = new AbortController();
    // Wait for the date to settle while it is being stepped.
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({
        start: targetDate,
        days: String(days),
        bodies: requested.join(','),
        ayanamsa: calculationSettings?.ayanamsa ?? 'lahiri',
        ayanamsaOffset: String(calculationSettings?.ayanamsaOffsetDegrees ?? 0),
        nodeMode: calculationSettings?.nodeMode ?? 'mean',
      });
      try {
        const response = await fetch(`/api/sign-changes?${params}`, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? 'Request failed');
        setData({ key, start: json.start, series: json.series });
        setError('');
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Request failed');
      }
    }, 400);
    return () => { window.clearTimeout(timer); controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, data?.key]);

  const events: Event[] = useMemo(() => {
    if (!data) return [];
    const series: Record<string, LongitudeSeries> = {};
    for (const [body, s] of Object.entries(data.series)) {
      series[body] = { start: data.start, step: s.step, longitudes: s.longitudes };
    }
    return collectTimingEvents(series, bodies, stations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, stations]);

  const loading = bodies.length > 0 && data?.key !== key && !error;
  const rows = showAll ? events : events.slice(0, FIRST_ROWS);
  const house = (sign: number) => ((sign - chart.ascendant.sign + 12) % 12) + 1;

  const toggle = (body: string) => {
    setSelected(current => current.includes(body) ? current.filter(item => item !== body) : [...current, body]);
    setShowAll(false);
  };
  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 dark:border-green-600 bg-emerald-500 dark:bg-green-600 text-white'
      : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`;

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        {t('sign changes')}
      </div>
      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        {t('When a graha moves into the next sign, from the target date. H is the house from the natal ascendant. ℞ marks a move backwards. Stations are the turns to retrograde or direct; combustion is Mercury or Venus coming within the orb of the Sun.')}
      </p>
      <div className="flex flex-wrap gap-1">
        {BODIES.map(body => (
          <button key={body} type="button" aria-pressed={selected.includes(body)} onClick={() => toggle(body)} className={chip(selected.includes(body))}>
            {CODES[body]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        <button type="button" aria-pressed={stations} onClick={() => { setStations(v => !v); setShowAll(false); }} className={chip(stations)}>
          {t('stations & combustion')}
        </button>
        <span className="mx-1 self-stretch border-l border-zinc-200 dark:border-zinc-700" />
        {RANGES.map(range => (
          <button key={range.days} type="button" aria-pressed={days === range.days} onClick={() => { setDays(range.days); setShowAll(false); }} className={chip(days === range.days)}>
            {t(range.label)}
          </button>
        ))}
      </div>
      {error && <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">{t('Could not load sign changes:')} {error}</p>}
      {loading && <p className="text-[10px] font-mono text-zinc-400">{t('Calculating…')}</p>}
      {bodies.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('Pick at least one graha.')}</p>}
      {!loading && !error && bodies.length > 0 && events.length === 0 && (
        <p className="text-[10px] font-mono text-zinc-400">{t('No sign changes in this period.')}</p>
      )}
      {!loading && bodies.length > 0 && rows.length > 0 && (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map(event => (
            <li key={`${event.kind}-${event.body}-${event.time}`} className="flex items-center gap-2 py-1 text-[11px] font-mono">
              <span className="w-32 shrink-0 text-zinc-500 dark:text-zinc-400">{formatMoment(event.time)}</span>
              <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">
                {event.kind === 'sign' && (
                  <>
                    <span className="font-bold text-rose-500">{CODES[event.body]}{event.retrograde ? '℞' : ''}</span>
                    {` → `}
                    <span className="whitespace-nowrap"><span className="font-bold">{SIGNS[event.to - 1]}</span><span className="text-zinc-400 dark:text-zinc-500"> H{house(event.to)}</span></span>
                  </>
                )}
                {event.kind === 'station' && (
                  <>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{CODES[event.body]}</span>
                    {` ${event.turnsTo === 'retrograde' ? t('turns retrograde') + ' ℞' : t('turns direct')} `}
                    <span className="whitespace-nowrap text-zinc-400 dark:text-zinc-500">{SIGNS[event.sign - 1]} H{house(event.sign)}</span>
                  </>
                )}
                {event.kind === 'combust' && (
                  <>
                    <span className="font-bold text-orange-600 dark:text-orange-400">{CODES[event.body]}</span>
                    {` ${event.combust ? t('becomes combust') : t('leaves combustion')}`}
                  </>
                )}
              </span>
              {onSetTransit && (
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(event.time);
                    onSetTransit(`${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}.${pad(d.getMinutes())}.00`);
                  }}
                  className="shrink-0 rounded border border-violet-300 px-2 py-1.5 text-[10px] sm:px-1.5 sm:py-0.5 text-violet-700 dark:border-violet-700 dark:text-violet-300"
                >
                  {t('set transit')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!loading && events.length > FIRST_ROWS && (
        <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
          {showAll ? t('show fewer') : `${t('show all')} ${events.length}`}
        </button>
      )}
    </div>
  );
}
