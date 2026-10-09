'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { AnnualPlaceControl, useAnnualFetch, type AnnualPlace } from './annualShared';
import { getUtcOffsetHours } from '@/lib/timezone';
import {
  abhijit, choghadiya, clockTime, gulikaKala, rahuKala, yamaganda, WEEKDAY_NAMES,
  type ChoghadiyaPart, type DayTimes, type Span,
} from '@/lib/muhurta';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  /** The date to show, YYYY-MM-DD. */
  targetDate: string;
  /** Time zone of the birthplace, for the daylight-saving time of the date. */
  ianaTimezone?: string;
};

const QUALITY_CLASS = {
  good: 'text-emerald-700 dark:text-green-400',
  neutral: 'text-zinc-600 dark:text-zinc-300',
  bad: 'text-rose-600 dark:text-rose-400',
} as const;

function range(span: Span) {
  return `${clockTime(span.start)} – ${clockTime(span.end)}`;
}

/**
 * The muhūrta times of a date: Rāhu Kāla, Yamaganḍa, Gulika Kāla, Abhijit and
 * the Choghaḍiyā of the day and of the night. The place is the birthplace unless
 * another one is looked up, so the times can be read for where the native is now.
 */
export default function MuhurtaPanel({ chart, targetDate, ianaTimezone }: Props) {
  const t = useT();
  const [place, setPlace] = useState<AnnualPlace>(null);
  // The moment the panel was opened, to mark the part that is running.
  const [now] = useState(() => Date.now());

  const geo = useMemo(() => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(targetDate);
    if (!match || !chart.debug) return null;
    const [year, month, day] = match.slice(1).map(Number);
    // Midday of the date, to find the daylight-saving offset that day.
    const noon = new Date(Date.UTC(year, month - 1, day, 12));
    const zone = place ? place.timezone : ianaTimezone;
    const tz = zone ? getUtcOffsetHours(zone, noon) : chart.debug.utcOffset;
    return {
      year, month, day,
      weekday: noon.getUTCDay(),
      lat: place ? place.latitude : chart.debug.latitude,
      lng: place ? place.longitude : chart.debug.longitude,
      tz,
    };
  }, [chart.debug, ianaTimezone, place, targetDate]);

  const query = geo ? `date=${targetDate}&lat=${geo.lat}&lng=${geo.lng}&tz=${geo.tz}` : '';
  const { data, error, loading } = useAnnualFetch<DayTimes>('/api/muhurta', query);

  const times = useMemo(() => {
    if (!geo || !data) return null;
    return {
      rahu: rahuKala(data, geo.weekday),
      yama: yamaganda(data, geo.weekday),
      gulika: gulikaKala(data, geo.weekday),
      abhijit: abhijit(data),
      choghadiya: choghadiya(data, geo.weekday),
    };
  }, [data, geo]);

  // The moment now at the place, in hours since midnight of the date, to mark the part that is running.
  const nowHours = geo ? (now + geo.tz * 3600000 - Date.UTC(geo.year, geo.month - 1, geo.day)) / 3600000 : -1;
  const inside = (span: Span) => nowHours >= span.start && nowHours < span.end;

  const parts = (label: string, list: ChoghadiyaPart[]) => (
    <div className="min-w-0">
      <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{label}</div>
      <ul className="space-y-0.5">
        {list.map((part, index) => (
          <li
            key={index}
            data-choghadiya={part.name}
            className={`flex items-baseline gap-2 rounded px-1.5 py-0.5 text-xs font-mono ${inside(part) ? 'bg-cyan-50 ring-1 ring-cyan-300 dark:bg-cyan-900/20 dark:ring-cyan-700' : ''}`}
          >
            <span className={`w-14 shrink-0 font-bold ${QUALITY_CLASS[part.quality]}`}>{part.name}</span>
            <span className="min-w-0 text-zinc-600 dark:text-zinc-300">{range(part)}</span>
            <span className="ml-auto shrink-0 text-[9px] text-zinc-400 dark:text-zinc-600">{t(part.quality)}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const row = (label: string, span: Span, key: string, note?: string) => (
    <tr key={key} data-muhurta={key} className={`border-b border-zinc-100 dark:border-zinc-800 ${inside(span) ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''}`}>
      <td className="whitespace-nowrap py-1.5 pr-3 font-bold text-emerald-700 dark:text-green-400">{label}</td>
      <td className="whitespace-nowrap py-1.5 pr-3 text-zinc-700 dark:text-zinc-200">{range(span)}</td>
      <td className="py-1.5 text-[10px] text-zinc-400 dark:text-zinc-600">{note}</td>
    </tr>
  );

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Muhurta')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Rahu Kala, Yamaganda, Gulika Kala, Abhijit and the Choghadiya, from the true sunrise and sunset of the date and place. Times are local to the place.')}
        </p>
      </div>

      <AnnualPlaceControl place={place} onChange={setPlace} />

      {geo && (
        <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
          {targetDate} · {t(WEEKDAY_NAMES[geo.weekday])}
        </div>
      )}

      {error && <p className="text-xs font-mono text-rose-500">{error}</p>}
      {loading && !times && <p className="text-xs font-mono text-zinc-400">…</p>}

      {times && data && (
        <>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono" data-muhurta="sun">
            {([['sunrise', data.sunrise], ['sunset', data.sunset], ['next sunrise', data.nextSunrise]] as const).map(([label, hours]) => (
              <div key={label}>
                <div className="text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t(label)}</div>
                <div className="text-zinc-800 dark:text-zinc-100">{clockTime(hours)}</div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <tbody>
                {row('Rahu Kala', times.rahu, 'rahu', t('avoid beginning new work'))}
                {row('Yamaganda', times.yama, 'yamaganda')}
                {row('Gulika Kala', times.gulika, 'gulika')}
                {row('Abhijit', times.abhijit, 'abhijit', t('the midday muhurta, favourable'))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {parts(t('Choghadiya, day'), times.choghadiya.day)}
            {parts(t('Choghadiya, night'), times.choghadiya.night)}
          </div>
        </>
      )}
    </div>
  );
}
