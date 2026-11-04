'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { transitSeriesUrl } from '@/lib/apiParams';
import { useDebouncedJson } from '@/hooks/useDebouncedJson';
import { collectTimingEvents, type TimingEvent } from '@/lib/signChanges';
import type { LongitudeSeries } from '@/lib/transitHits';
import { GOCHARA_PLANETS, gocharaRowOf, gocharaTables } from '@/lib/gochara';
import { SIGN_ABBR, SIGN_NAMES } from '@/lib/signs';
import { pad2 } from '@/lib/dateFormat';
import { useGrahaNames } from '@/lib/grahaNames';
import { useT } from '@/lib/i18n';

type Loaded = { start: number; series: Record<string, { step: number; longitudes: number[] }> };
type CalendarDay = {
  day: number;
  dateKey: string;
  positions: { body: string; sign: number }[];
  events: TimingEvent[];
  favourableStrong: number;
  blocked: number;
};

const BODIES = [...GOCHARA_PLANETS];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function monthDays(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}
function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
function formatEvent(event: TimingEvent, code: (body: string) => string, t: (value: string) => string): string {
  if (event.kind === 'sign') return `${code(event.body)} → ${SIGN_ABBR[event.to - 1]}${event.retrograde ? ' ℞' : ''}`;
  if (event.kind === 'station') return `${code(event.body)} ${event.turnsTo === 'retrograde' ? '℞' : 'D'}`;
  return `${code(event.body)} ${event.combust ? t('becomes combust') : t('leaves combustion')}`;
}

/** A daily transit calendar: daily sidereal positions, sign ingresses, stations,
 * Mercury/Venus combustion changes, and Gochara/BAV context against the natal chart.
 * Day cells are sampled at 00:00 UTC; event dates therefore have daily rather than
 * exact-clock precision.
 */
export default function TransitCalendarPanel({
  chart,
  calculationSettings,
  onSetTransit,
}: {
  chart: ChartData;
  calculationSettings?: CalculationSettings;
  onSetTransit?: (value: string) => void;
}) {
  const t = useT();
  const { code } = useGrahaNames();
  const now = new Date();
  const [monthKey, setMonthKey] = useState(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}`);
  const [selectedBodies, setSelectedBodies] = useState<string[]>(BODIES);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showGochara, setShowGochara] = useState(true);
  const days = monthDays(monthKey);
  const [year, month] = monthKey.split('-').map(Number);
  const start = `${monthKey}-01`;
  const { data, error, loading } = useDebouncedJson<Loaded>(
    selectedBodies.length ? transitSeriesUrl(start, days, selectedBodies, calculationSettings, 1) : null,
  );
  const tables = useMemo(() => gocharaTables(chart), [chart]);

  const calendar = useMemo<CalendarDay[]>(() => {
    if (!data || !tables) return [];
    const series: Record<string, LongitudeSeries> = {};
    for (const [body, item] of Object.entries(data.series)) {
      series[body] = { start: data.start, step: item.step, longitudes: item.longitudes };
    }
    const events = collectTimingEvents(series, selectedBodies, true);
    const byDay = new Map<string, TimingEvent[]>();
    for (const event of events) {
      const key = new Date(event.time).toISOString().slice(0, 10);
      byDay.set(key, [...(byDay.get(key) ?? []), event]);
    }
    return Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const key = dateKey(year, month, day);
      const positions = BODIES.flatMap(body => {
        const values = series[body]?.longitudes;
        const longitude = values?.[index];
        return typeof longitude === 'number' ? [{ body, sign: Math.floor(longitude / 30) + 1 }] : [];
      });
      const others = positions.map(position => ({ planet: position.body as typeof GOCHARA_PLANETS[number], sign: position.sign }));
      const rows = others.map(position => gocharaRowOf(tables, position.planet, position.sign, others));
      return {
        day, dateKey: key, positions, events: byDay.get(key) ?? [],
        favourableStrong: rows.filter(row => row.favourable && row.strength === 'strong' && row.blockedBy.length === 0).length,
        blocked: rows.reduce((sum, row) => sum + row.blockedBy.length, 0),
      };
    });
  }, [data, days, month, selectedBodies, tables, year]);

  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (CalendarDay | null)[] = [...Array.from({ length: offset }, () => null), ...calendar];
  while (cells.length % 7) cells.push(null);
  const eventCount = calendar.reduce((sum, day) => sum + day.events.length, 0);
  const toggleBody = (body: string) => {
    setSelectedBodies(current => current.includes(body) ? current.filter(item => item !== body) : [...current, body]);
  };
  const shiftMonth = (delta: number) => {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setMonthKey(`${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}`);
  };
  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const buttonClass = (active: boolean) => `rounded border px-2 py-1 text-[10px] font-mono ${active ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-green-300' : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;

  return (
    <div className="min-w-0 space-y-3" data-transit-calendar>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Transit calendar')}</div>
          <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">{monthLabel}</div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => shiftMonth(-1)} className={buttonClass(false)} aria-label={t('Previous month')}>←</button>
          <input aria-label={t('Month')} type="month" value={monthKey} onChange={event => setMonthKey(event.target.value)} className="rounded border border-zinc-200 bg-white px-2 py-1 text-[10px] font-mono text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" />
          <button type="button" onClick={() => shiftMonth(1)} className={buttonClass(false)} aria-label={t('Next month')}>→</button>
        </div>
      </div>

      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('Daily sidereal positions with sign ingresses, stations and Mercury/Venus combustion changes. Gochara strength uses the natal BAV and Moon-based Vedha. Positions are sampled at 00:00 UTC; event dates are day-level estimates, not exact local clock times.')}</p>

      <div className="flex flex-wrap gap-1">
        {BODIES.map(body => (
          <button key={body} type="button" aria-pressed={selectedBodies.includes(body)} onClick={() => toggleBody(body)} className={buttonClass(selectedBodies.includes(body))}>{code(body)}</button>
        ))}
        <button type="button" aria-pressed={showGochara} onClick={() => setShowGochara(v => !v)} className={buttonClass(showGochara)}>{t('Gochara')}</button>
      </div>

      {error && <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">{t('Could not load transits:')} {error}</p>}
      {loading && <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{t('Calculating daily ephemeris…')}</p>}
      {!loading && !error && selectedBodies.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('Select at least one graha.')}</p>}
      {!loading && !error && selectedBodies.length > 0 && calendar.length > 0 && (
        <>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map(day => <div key={day} className="py-1 text-center text-[9px] font-mono uppercase text-zinc-400">{t(day)}</div>)}
            {cells.map((day, index) => day ? (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => onSetTransit?.(`${pad2(day.day)}.${pad2(month)}.${year} 12.00.00`)}
                title={day.events.map(event => formatEvent(event, code, t)).join(' · ')}
                className="min-h-[112px] min-w-0 rounded border border-zinc-200 bg-white p-1 text-left align-top hover:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-200">{day.day}</span>
                  {showGochara && <span className="text-[8px] font-mono text-emerald-700 dark:text-green-400">{day.favourableStrong}★</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-1 gap-y-0.5">
                  {day.positions.map(position => {
                    const eventToday = day.events.some(event => event.body === position.body && event.kind === 'sign');
                    return <span key={position.body} className={`text-[8px] font-mono ${eventToday ? 'font-bold text-violet-700 dark:text-violet-300' : 'text-zinc-500 dark:text-zinc-400'}`} title={`${position.body}: ${SIGN_NAMES[position.sign - 1]}`}>{code(position.body)}:{SIGN_ABBR[position.sign - 1]}</span>;
                  })}
                </div>
                {showGochara && day.blocked > 0 && <div className="mt-1 text-[8px] font-mono text-rose-600 dark:text-rose-400">{day.blocked} {t('vedha')}</div>}
                {day.events.length > 0 && (
                  <div className="mt-1 space-y-0.5 border-t border-zinc-100 pt-1 dark:border-zinc-800">
                    {(showAllEvents ? day.events : day.events.slice(0, 2)).map((event, eventIndex) => (
                      <div key={`${event.body}-${event.time}-${eventIndex}`} className="truncate text-[8px] font-mono text-violet-700 dark:text-violet-300">{formatEvent(event, code, t)}</div>
                    ))}
                    {!showAllEvents && day.events.length > 2 && <div className="text-[8px] font-mono text-zinc-400">+{day.events.length - 2}</div>}
                  </div>
                )}
              </button>
            ) : <div key={`empty-${index}`} className="min-h-[112px]" />)}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
            <span>{t('Violet marks indicate sign ingresses. Click a day to set the transit moment to noon.')}</span>
            <button type="button" onClick={() => setShowAllEvents(v => !v)} className="text-emerald-700 dark:text-green-400">{showAllEvents ? t('Show compact events') : t('Show all daily events')} · {eventCount}</button>
          </div>
        </>
      )}
    </div>
  );
}
