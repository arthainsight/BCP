'use client';

import { useMemo } from 'react';
import type { CalculationSettings, ChartData, DashaSettings } from '@/types';
import { DEFAULT_DASHA_SETTINGS } from '@/types';
import { calculateDashaEventSnapshots } from '@/lib/dashaEvents';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { collectTimingEvents, type TimingEvent } from '@/lib/signChanges';
import { HIT_RELATIONS, findTransitHits, type LongitudeSeries } from '@/lib/transitHits';
import { useDebouncedJson } from '@/hooks/useDebouncedJson';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  birthDatetime: string;
  targetDate: string;
  dashaSettings: DashaSettings;
  calculationSettings?: CalculationSettings;
};

const CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Asc: 'Asc',
};
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
// The Moon changes sign every two to three days and would crowd the list out.
const BODIES = ['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const NATAL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SIGN_ROWS = 8;
const HIT_ROWS = 6;

type SignSeries = { start: number; series: Record<string, { step: number; longitudes: number[] }> };
type HitSeries = { start: number; step: number; longitudes: Record<string, number[]> };

const pad = (value: number) => String(value).padStart(2, '0');
const day = (time: number) => { const d = new Date(time); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`; };
const moment = (time: number) => { const d = new Date(time); return `${day(time)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/**
 * Everything about the target day on one page: the running daśās, the next
 * sign changes and stations, and the next transit hits. The Print button saves
 * the page as a PDF through the browser.
 */
export default function TimingSummary({ chart, birthDatetime, targetDate, dashaSettings, calculationSettings }: Props) {
  const t = useT();
  const house = (sign: number) => ((sign - chart.ascendant.sign + 12) % 12) + 1;

  const dashas = useMemo(() => {
    const birthDate = parseDateTime(birthDatetime);
    if (!birthDate) return [];
    const eventDate = parseTargetDateString(targetDate) ?? new Date();
    const enabled = { ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas };
    const charaOptions = dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions;
    const rasiOptions = { ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...dashaSettings.rasiOptions };
    return calculateDashaEventSnapshots({ eventDate, birthDate, planets: chart.planets, ascendant: chart.ascendant, charaOptions, rasiOptions })
      .filter(snapshot => enabled[snapshot.key as keyof typeof enabled]);
  }, [birthDatetime, targetDate, dashaSettings, chart]);

  const settings = new URLSearchParams({
    start: targetDate,
    ayanamsa: calculationSettings?.ayanamsa ?? 'lahiri',
    ayanamsaOffset: String(calculationSettings?.ayanamsaOffsetDegrees ?? 0),
    nodeMode: calculationSettings?.nodeMode ?? 'mean',
  });
  const validDate = Boolean(parseTargetDateString(targetDate));
  const signUrl = validDate ? `/api/sign-changes?${new URLSearchParams({ days: '92', bodies: BODIES.join(','), ...Object.fromEntries(settings) })}` : null;
  const hitUrl = validDate ? `/api/transit-hits?${new URLSearchParams({ days: '366', ...Object.fromEntries(settings) })}` : null;
  const signs = useDebouncedJson<SignSeries>(signUrl);
  const hits = useDebouncedJson<HitSeries>(hitUrl);

  const events: TimingEvent[] = useMemo(() => {
    if (!signs.data) return [];
    const series: Record<string, LongitudeSeries> = {};
    for (const [body, s] of Object.entries(signs.data.series)) series[body] = { start: signs.data.start, step: s.step, longitudes: s.longitudes };
    return collectTimingEvents(series, BODIES, true).slice(0, SIGN_ROWS);
  }, [signs.data]);

  const transitHits = useMemo(() => {
    if (!hits.data) return [];
    const series: Record<string, LongitudeSeries> = {};
    for (const [body, longitudes] of Object.entries(hits.data.longitudes)) series[body] = { start: hits.data.start, step: hits.data.step, longitudes };
    const natal = [
      ...chart.planets.filter(p => NATAL.includes(p.name)).map(p => ({ name: p.name, longitude: p.longitude })),
      { name: 'Asc', longitude: chart.ascendant.longitude },
    ];
    return findTransitHits(series, natal, HIT_RELATIONS).slice(0, HIT_ROWS);
  }, [hits.data, chart]);

  const heading = 'text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600';
  const target = parseTargetDateString(targetDate);

  return (
    <div id="timing-summary" className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-mono font-semibold text-zinc-800 dark:text-zinc-100">
          {t('Summary for')} {target ? day(target.getTime()) : targetDate}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden shrink-0 rounded-md border border-zinc-200 px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 sm:px-2 sm:py-1 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {t('Print / PDF')}
        </button>
      </div>

      <section className="space-y-1">
        <div className={heading}>{t('running dashas')}</div>
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {dashas.map(snapshot => (
            <li key={snapshot.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1 text-[11px] font-mono">
              <span className="w-36 shrink-0 font-semibold text-zinc-700 dark:text-zinc-200">{snapshot.label}</span>
              <span className="min-w-0 break-words text-zinc-600 dark:text-zinc-300">
                {snapshot.levels.length > 0 ? snapshot.levels.map(level => level.value).join(' – ') : snapshot.note}
              </span>
              {snapshot.mdRange && (
                <span className="text-zinc-400 dark:text-zinc-500">MD {day(snapshot.mdRange.startDate.getTime())} – {day(snapshot.mdRange.endDate.getTime())}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-1">
        <div className={heading}>{t('next sign changes and stations')}</div>
        {signs.error && <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">{t('Could not load sign changes:')} {signs.error}</p>}
        {signs.loading && <p className="text-[10px] font-mono text-zinc-400">{t('Calculating…')}</p>}
        {!signs.loading && !signs.error && events.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No sign changes in this period.')}</p>}
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {events.map(event => (
            <li key={`${event.kind}-${event.body}-${event.time}`} className="flex items-baseline gap-2 py-1 text-[11px] font-mono">
              <span className="w-32 shrink-0 text-zinc-500 dark:text-zinc-400">{moment(event.time)}</span>
              <span className="min-w-0 text-zinc-700 dark:text-zinc-200">
                <span className="font-bold text-rose-500">{CODES[event.body]}{event.kind === 'sign' && event.retrograde ? '℞' : ''}</span>
                {event.kind === 'sign' && <> → <span className="whitespace-nowrap"><span className="font-bold">{SIGNS[event.to - 1]}</span> <span className="text-zinc-400 dark:text-zinc-500">H{house(event.to)}</span></span></>}
                {event.kind === 'station' && <> {event.turnsTo === 'retrograde' ? `${t('turns retrograde')} ℞` : t('turns direct')} <span className="whitespace-nowrap text-zinc-400 dark:text-zinc-500">{SIGNS[event.sign - 1]} H{house(event.sign)}</span></>}
                {event.kind === 'combust' && <> {event.combust ? t('becomes combust') : t('leaves combustion')}</>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-1">
        <div className={heading}>{t('next transit hits')}</div>
        {hits.error && <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">{t('Could not load transits:')} {hits.error}</p>}
        {hits.loading && <p className="text-[10px] font-mono text-zinc-400">{t('Calculating…')}</p>}
        {!hits.loading && !hits.error && transitHits.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No crossings in these twelve months.')}</p>}
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {transitHits.map(hit => (
            <li key={`${hit.transit}-${hit.natal}-${hit.relation}-${hit.time}`} className="flex items-baseline gap-2 py-1 text-[11px] font-mono">
              <span className="w-32 shrink-0 text-zinc-500 dark:text-zinc-400">{day(hit.time)}</span>
              <span className="min-w-0 text-zinc-700 dark:text-zinc-200">
                <span className="font-bold text-rose-500">{CODES[hit.transit]}{hit.retrograde ? '℞' : ''}</span>
                {` ${hit.relation === 1 ? t('over natal') : hit.relation === 5 ? t('5th from natal') : t('9th from natal')} `}
                <span className="font-bold">{CODES[hit.natal]}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
