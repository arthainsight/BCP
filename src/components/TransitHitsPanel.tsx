'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { HIT_RELATIONS, findTransitHits, type HitRelation, type LongitudeSeries, type TransitHit } from '@/lib/transitHits';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  targetDate: string;
  calculationSettings?: CalculationSettings;
  /** Moves the transit overlay to a date (DD.MM.YYYY HH.MM.SS). */
  onSetTransit?: (value: string) => void;
};

const CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Asc: 'Asc',
};
const NATAL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const FIRST_ROWS = 12;

type Series = { start: number; step: number; longitudes: Record<string, number[]> };

function formatDay(time: number): string {
  const date = new Date(time);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/**
 * The twelve months after the target date: when Jupiter, Saturn, Rahu and
 * Ketu cross a natal graha or the ascendant. Loaded only when opened.
 */
export default function TransitHitsPanel({ chart, targetDate, calculationSettings, onSetTransit }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // Which houses from the natal point count: 1 is the point itself, 5 and 9 its trines (off to start with).
  const [relations, setRelations] = useState<HitRelation[]>([1]);
  const [data, setData] = useState<{ key: string; series: Series } | null>(null);
  const [error, setError] = useState('');

  const key = [
    targetDate,
    calculationSettings?.ayanamsa ?? 'lahiri',
    calculationSettings?.ayanamsaOffsetDegrees ?? 0,
    calculationSettings?.nodeMode ?? 'mean',
  ].join('|');

  useEffect(() => {
    if (!open || data?.key === key) return;
    const controller = new AbortController();
    // Wait for the date to settle while it is being stepped.
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({
        start: targetDate,
        days: '366',
        ayanamsa: calculationSettings?.ayanamsa ?? 'lahiri',
        ayanamsaOffset: String(calculationSettings?.ayanamsaOffsetDegrees ?? 0),
        nodeMode: calculationSettings?.nodeMode ?? 'mean',
      });
      try {
        const response = await fetch(`/api/transit-hits?${params}`, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? 'Request failed');
        setData({ key, series: json });
        setError('');
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Request failed');
      }
    }, 400);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, key, data?.key, targetDate, calculationSettings]);

  const hits: TransitHit[] = useMemo(() => {
    if (!data) return [];
    const series: Record<string, LongitudeSeries> = {};
    for (const [body, longitudes] of Object.entries(data.series.longitudes)) {
      series[body] = { start: data.series.start, step: data.series.step, longitudes };
    }
    const natal = [
      ...chart.planets.filter(p => NATAL.includes(p.name)).map(p => ({ name: p.name, longitude: p.longitude })),
      { name: 'Asc', longitude: chart.ascendant.longitude },
    ];
    return findTransitHits(series, natal, relations);
  }, [data, chart, relations]);

  const loading = open && data?.key !== key && !error;
  const rows = showAll ? hits : hits.slice(0, FIRST_ROWS);

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} className="flex w-full items-center gap-2 text-left">
        <span className="flex-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          {t('transit hits · 12 months from target')}
        </span>
        <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div className="space-y-1">
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('Jupiter, Saturn, Rahu and Ketu crossing a natal graha or the ascendant, to the day, and the same degree in its 5th and 9th sign. ℞ marks a retrograde pass.')}
          </p>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('houses from the natal graha')}>
            <span className="mr-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('houses from natal')}</span>
            {HIT_RELATIONS.map(relation => {
              const on = relations.includes(relation);
              return (
                <button
                  key={relation}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    // At least one stays on.
                    setRelations(current => on ? (current.length > 1 ? current.filter(r => r !== relation) : current) : [...current, relation].sort((a, b) => a - b));
                    setShowAll(false);
                  }}
                  className={`rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
                    ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
                    : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`}
                >
                  {relation}
                </button>
              );
            })}
          </div>
          {error && <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">{t('Could not load transits:')} {error}</p>}
          {loading && <p className="text-[10px] font-mono text-zinc-400">{t('Calculating…')}</p>}
          {!loading && !error && hits.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No crossings in these twelve months.')}</p>}
          {!loading && rows.length > 0 && (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map(hit => (
                <li key={`${hit.transit}-${hit.natal}-${hit.relation}-${hit.time}`} className="flex items-center gap-2 py-1 text-[11px] font-mono">
                  <span className="w-20 shrink-0 text-zinc-500 dark:text-zinc-400">{formatDay(hit.time)}</span>
                  <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">
                    <span className="font-bold text-rose-500">{CODES[hit.transit]}{hit.retrograde ? '℞' : ''}</span>
                    {` ${hit.relation === 1 ? t('over natal') : hit.relation === 5 ? t('5th from natal') : t('9th from natal')} `}
                    <span className="font-bold">{CODES[hit.natal]}</span>
                  </span>
                  {onSetTransit && (
                    <button
                      type="button"
                      onClick={() => onSetTransit(`${formatDay(hit.time)} 12.00.00`)}
                      className="shrink-0 rounded border border-violet-300 px-1.5 py-0.5 text-[10px] text-violet-700 dark:border-violet-700 dark:text-violet-300"
                    >
                      {t('set transit')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!loading && hits.length > FIRST_ROWS && (
            <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
              {showAll ? t('show fewer') : `${t('show all')} ${hits.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
