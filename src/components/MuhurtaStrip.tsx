'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { localParts } from '@/lib/muhurtaFinder';
import type { StripResult } from '@/lib/muhurtaStrip';
import { stripRows, vtnOfState, type StripChoices, type StripRowId, type StripTone } from '@/lib/muhurtaStripView';
import { vtnVerdict } from '@/lib/vtnYogas';
import { NAKSHATRA_NAMES } from '@/lib/nakshatras';
import { YOGA_NAMES } from '@/lib/panchang';
import { KARANA_NAMES, tithiLabel } from '@/lib/muhurtaFinder';
import { useT } from '@/lib/i18n';

type Props = {
  /** The day the strip first looks at (YYYY-MM-DD): the strip begins at the first of its month. */
  start: string;
  lat: number;
  lng: number;
  tz: number;
  zone?: string;
  /** The ayanamsa and the others of the calculation choices, as parameters of the address. */
  calculation: Record<string, string>;
  choices: StripChoices;
};

const TONE_CLASS: Record<StripTone, string> = {
  good: 'bg-emerald-500/80 text-white dark:bg-green-600/80',
  middling: 'bg-amber-400/90 text-zinc-900',
  bad: 'bg-red-500/80 text-white dark:bg-red-600/80',
  none: 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
};
const ROW_NAMES: Record<StripRowId, string> = {
  vara: 'Vāra', nakshatra: 'Nakṣatra', tara: 'Tarabala', chandra: 'Chandrabala', tithi: 'Tithi', karana: 'Karaṇa', yoga: 'Yoga', vtn: 'Vāra–Tithi–Nakṣatra yogas',
};
const VERDICT_TEXT = {
  good: 'Judgement of the combinations: auspicious',
  mixed: 'Judgement of the combinations: mixed (auspicious and inauspicious of equal strength)',
  bad: 'Judgement of the combinations: inauspicious',
  none: '',
} as const;
const WEEKDAY_INITIAL = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (value: number) => String(value).padStart(2, '0');

const monthOf = (date: string) => date.slice(0, 7);
const shiftMonth = (month: string, by: number) => {
  const [year, number] = month.split('-').map(Number);
  const moved = new Date(Date.UTC(year, number - 1 + by, 1));
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}`;
};
const daysIn = (month: string) => {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number, 0)).getUTCDate();
};

/** The month strip: when the vāra, nakṣatra, tithi, karaṇa and yoga (and the Tarabala and Chandrabala) are what the book wants for the event, and what the combinations of vāra, tithi and nakṣatra say. */
export default function MuhurtaStrip({ start, lat, lng, tz, zone, calculation, choices }: Props) {
  const t = useT();
  // The strip follows the month of `start` until a month is picked with the arrows.
  const [picked, setPicked] = useState<string | null>(null);
  const month = picked ?? monthOf(start);
  const [data, setData] = useState<{ key: string; result?: StripResult; error?: string }>({ key: '' });
  const [at, setAt] = useState<number | null>(null);
  const request = useRef(0);
  const key = useMemo(
    () => new URLSearchParams({ start: `${month}-01`, days: String(daysIn(month)), lat: String(lat), lng: String(lng), tz: String(tz), ...(zone ? { zone } : {}), ...calculation }).toString(),
    [month, lat, lng, tz, zone, calculation],
  );

  useEffect(() => {
    const id = ++request.current;
    fetch(`/api/muhurta-strip?${key}`)
      .then(response => response.json())
      .then(body => { if (id === request.current) setData(body.error ? { key, error: String(body.error) } : { key, result: body as StripResult }); })
      .catch(error => { if (id === request.current) setData({ key, error: String(error) }); });
  }, [key]);

  const loading = data.key !== key;
  const result = loading ? undefined : data.result;
  const goTo = (by: number) => { setPicked(shiftMonth(month, by)); setAt(null); };
  const rows = useMemo(() => (result ? stripRows(result.states, choices) : []), [result, choices]);
  if (!result) {
    return <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600" data-finder-strip-status>{loading ? t('calculating') : data.error}</p>;
  }

  const span = result.end - result.start;
  const left = (ms: number) => `${((ms - result.start) / span) * 100}%`;
  const width = (from: number, to: number) => `${((to - from) / span) * 100}%`;
  const [year, number] = month.split('-').map(Number);
  const atState = at === null ? undefined : result.states.find(state => state.start <= at && at < state.end);
  const clock = (ms: number) => {
    const parts = localParts(ms, zone, tz);
    return `${pad(parts.day)}.${pad(parts.month)}. ${pad(parts.hour)}:${pad(parts.minute)}`;
  };
  const yogas = atState ? vtnOfState(atState, choices) : [];

  return (
    <div className="space-y-1.5" data-finder-strip>
      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        <button type="button" className="rounded border border-zinc-300 px-2 py-0.5 dark:border-zinc-600" aria-label={t('previous month')} onClick={() => goTo(-1)}>‹</button>
        <span className="min-w-28 text-center font-semibold" data-finder-strip-month>{t(MONTH_NAMES[number - 1])} {year}</span>
        <button type="button" className="rounded border border-zinc-300 px-2 py-0.5 dark:border-zinc-600" aria-label={t('next month')} onClick={() => goTo(1)}>›</button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[900px] space-y-px">
          <div className="grid grid-cols-[6.5rem_1fr] items-end gap-1">
            <span />
            <div className="relative h-7">
              {result.days.map(day => (
                <div key={day.start} className="absolute top-0 h-full border-l border-zinc-300 text-center text-[8px] font-mono leading-tight text-zinc-500 dark:border-zinc-700 dark:text-zinc-400" style={{ left: left(day.start), width: `${100 / result.days.length}%` }}>
                  <div>{WEEKDAY_INITIAL[day.weekday]}</div>
                  <div>{day.date}</div>
                </div>
              ))}
            </div>
          </div>
          {rows.map(row => (
            <div key={row.id} className="grid grid-cols-[6.5rem_1fr] items-center gap-1" data-finder-strip-row={row.id}>
              <span className="truncate text-[9px] font-mono text-zinc-500 dark:text-zinc-400" title={t(ROW_NAMES[row.id])}>{t(ROW_NAMES[row.id])}</span>
              <div
                className="relative h-5 cursor-crosshair overflow-hidden rounded-sm bg-zinc-100 dark:bg-zinc-900"
                onClick={event => {
                  const box = event.currentTarget.getBoundingClientRect();
                  setAt(Math.round(result.start + ((event.clientX - box.left) / box.width) * span));
                }}
              >
                {row.segments.map(segment => (
                  <div
                    key={segment.start}
                    className={`absolute top-0 h-full overflow-hidden border-l border-white/40 text-center text-[8px] font-mono leading-5 dark:border-black/30 ${TONE_CLASS[segment.tone]}`}
                    style={{ left: left(segment.start), width: width(segment.start, segment.end) }}
                    data-finder-strip-tone={segment.tone}
                    title={`${segment.title ? `${segment.title} · ` : ''}${clock(segment.start)} – ${clock(segment.end)}`}
                  >
                    {segment.end - segment.start > span / 40 ? segment.label : ''}
                  </div>
                ))}
                {at !== null && <div className="pointer-events-none absolute top-0 h-full w-px bg-zinc-900 dark:bg-white" style={{ left: left(at) }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        <span className="text-emerald-600 dark:text-green-500">■</span> {t('chosen (favourable in the book)')} · <span className="text-amber-500">■</span> {t('middling in the book')} · <span className="text-red-500">■</span> {t('not chosen')}
      </p>
      {atState && (
        <div className="rounded-md border border-zinc-200 p-2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:text-zinc-300" data-finder-strip-detail>
          <div className="font-semibold">{clock(at!)}</div>
          <div>
            {t(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][atState.vara])} · {tithiLabel(atState.tithi)} · {NAKSHATRA_NAMES[atState.nakshatra]} · {KARANA_NAMES[atState.karana]} · {YOGA_NAMES[atState.yoga]}
          </div>
          <div className="mt-1" data-finder-strip-yogas>
            {yogas.length === 0
              ? t('No combination of vāra, tithi and nakṣatra of the book is formed.')
              : yogas.map(yoga => (
                <span key={yoga.id} className={`mr-1 inline-block rounded px-1 ${yoga.nature === 'auspicious' ? 'bg-emerald-100 text-emerald-800 dark:bg-green-900/40 dark:text-green-300' : yoga.nature === 'inauspicious' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                  {yoga.kind} {yoga.name}
                </span>
              ))}
          </div>
          {yogas.length > 0 && <div className="mt-1 text-zinc-400 dark:text-zinc-500">{t(VERDICT_TEXT[vtnVerdict(yogas)])}</div>}
        </div>
      )}
    </div>
  );
}
