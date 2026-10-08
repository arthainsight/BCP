'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { findParayaHits } from '@/lib/bnn/parayaHits';
import { HIT_RELATIONS } from '@/lib/transitHits';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  birthDatetime: string;
  targetDate: string;
  /** Moves the target moment (DD.MM.YYYY HH.MM.SS). */
  onSetTarget?: (value: string) => void;
};

const CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Asc: 'Asc',
};
const RANGES = [
  { label: '1 yr', years: 1 },
  { label: '3 yr', years: 3 },
  { label: '10 yr', years: 10 },
];
const FIRST_ROWS = 12;
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');
const formatMoment = (time: number) => {
  const d = new Date(time);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * The Nāḍī Paraya hits: when Jupiter, Saturn, Rahu and Ketu, moved by age
 * through the signs, reach each natal graha or the ascendant, and the same
 * degree in its 5th and 9th sign. Worked out in the browser from the age.
 */
export default function ParayaHitsPanel({ chart, birthDatetime, targetDate, onSetTarget }: Props) {
  const t = useT();
  const [years, setYears] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const hits = useMemo(() => {
    const birth = parseDateTime(birthDatetime);
    const from = parseTargetDateString(targetDate);
    if (!birth || !from) return [];
    return findParayaHits({
      chart,
      birthTime: birth.getTime(),
      fromTime: from.getTime(),
      toTime: from.getTime() + years * YEAR_MS,
      relations: HIT_RELATIONS,
    });
  }, [chart, birthDatetime, targetDate, years]);

  const rows = showAll ? hits : hits.slice(0, FIRST_ROWS);
  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;

  return (
    <section aria-label={t('paraya hits')} className="space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        {t('paraya hits · from target')}
      </div>
      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        {t('Paraya Ju Sa Ra Ke, moved by age, reaching a natal graha or the ascendant, and the same degree in its 5th and 9th sign.')}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {RANGES.map(range => (
          <button key={range.years} type="button" aria-pressed={years === range.years} onClick={() => { setYears(range.years); setShowAll(false); }} className={chip(years === range.years)}>
            {t(range.label)}
          </button>
        ))}
      </div>

      {hits.length === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No paraya hits in this period.')}</p>}
      {rows.length > 0 && (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map(hit => (
            <li key={`${hit.body}-${hit.natal}-${hit.relation}-${hit.time}`} className="flex items-center gap-2 py-1 text-[11px] font-mono">
              <span className="w-32 shrink-0 text-zinc-500 dark:text-zinc-400">{formatMoment(hit.time)}</span>
              <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">
                <span className="font-bold text-violet-600 dark:text-violet-400">{CODES[hit.body]}</span>
                {` ${hit.relation === 1 ? t('over natal') : hit.relation === 5 ? t('5th from natal') : t('9th from natal')} `}
                <span className="font-bold">{CODES[hit.natal]}</span>
                <span className="text-zinc-400 dark:text-zinc-500"> · {t('age')} {hit.ageYears.toFixed(1)}</span>
              </span>
              {onSetTarget && (
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(hit.time);
                    onSetTarget(`${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}.${pad(d.getMinutes())}.00`);
                  }}
                  className="shrink-0 rounded border border-violet-300 px-2 py-1.5 text-[10px] text-violet-700 sm:px-1.5 sm:py-0.5 dark:border-violet-700 dark:text-violet-300"
                >
                  {t('set target')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {hits.length > FIRST_ROWS && (
        <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
          {showAll ? t('show fewer') : `${t('show all')} ${hits.length}`}
        </button>
      )}
    </section>
  );
}
