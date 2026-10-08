'use client';

import { useMemo, useState } from 'react';
import type { DashaSettings, PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { calculateDashaEventSnapshots } from '@/lib/dashaEvents';
import { dashaSnapshotOptions, enabledSnapshots, levelValue, periodChanges } from '@/lib/dashaView';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

type Props = {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  dashaSettings: DashaSettings;
  targetDate?: string;
};

const ROWS = 21;

/**
 * Year by year: one row per calendar year, one column per daśā system, with the
 * running mahādaśā and antardaśā on the 1st of July. A new MD or AD since the
 * row above is marked. Twenty-one years at a time, around the target date.
 */
export default function DashaYearly({ planets, ascendant, birthDatetime, dashaSettings, targetDate }: Props) {
  const t = useT();
  const { translate } = useGrahaNames();
  const birth = parseDateTime(birthDatetime);
  const target = (targetDate && parseTargetDateString(targetDate)) || new Date();
  const [firstYear, setFirstYear] = useState(() => Math.max(birth?.getFullYear() ?? 1900, target.getFullYear() - 10));

  const table = useMemo(() => {
    if (!birth) return { labels: [] as string[], rows: [] as { year: number; cells: ReturnType<typeof enabledSnapshots> }[] };
    const { charaOptions, rasiOptions, variantChoice, enabled } = dashaSnapshotOptions(dashaSettings);
    const rows = Array.from({ length: ROWS }, (_, index) => {
      const year = firstYear + index;
      const eventDate = new Date(year, 6, 1, 12);
      const snapshots = enabledSnapshots(calculateDashaEventSnapshots({ eventDate, birthDate: birth, planets, ascendant, charaOptions, rasiOptions, variantChoice }), enabled);
      return { year, cells: snapshots };
    });
    return { labels: rows[0]?.cells.map(cell => cell.label) ?? [], rows };
  }, [birth, dashaSettings, planets, ascendant, firstYear]);

  const changes = table.labels.map((_, column) => periodChanges(table.rows.map(row => row.cells[column])));
  const birthYear = birth?.getFullYear() ?? 0;
  const targetYear = target.getFullYear();

  const move = (years: number) => setFirstYear(current => Math.max(birthYear, current + years));
  const button = 'min-h-9 rounded border border-zinc-300 px-2.5 py-1.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:text-zinc-300';

  return (
    <section aria-label={t('yearly dashas')} className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-950/40">
      <div>
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t('Yearly dashas')}</h3>
        <p className="text-[10px] text-zinc-500">{t('Running MD – AD on 1 July of each year. A new MD (amber) or AD (blue) since the row above is marked.')}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        <button type="button" className={button} onClick={() => move(-10)}>−10 {t('yr')}</button>
        <button type="button" className={button} onClick={() => move(-1)}>−1</button>
        <button type="button" className={button} onClick={() => setFirstYear(Math.max(birthYear, targetYear - 10))}>{t('target year')}</button>
        <button type="button" className={button} onClick={() => move(1)}>+1</button>
        <button type="button" className={button} onClick={() => move(10)}>+10 {t('yr')}</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-[11px] font-mono">
          <thead>
            <tr className="text-left text-[9px] uppercase tracking-widest text-zinc-400">
              <th className="sticky left-0 bg-zinc-50 py-1 pr-2 dark:bg-zinc-950">{t('year')}</th>
              <th className="py-1 pr-2">{t('age')}</th>
              {table.labels.map(label => <th key={label} className="whitespace-nowrap py-1 pr-3">{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={row.year} className={`border-t border-zinc-100 dark:border-zinc-800 ${row.year === targetYear ? 'bg-emerald-50/70 dark:bg-emerald-950/20' : ''}`}>
                <td className="sticky left-0 whitespace-nowrap bg-inherit py-1 pr-2 font-semibold text-zinc-700 dark:text-zinc-200">{row.year}</td>
                <td className="py-1 pr-2 text-zinc-400">{row.year - birthYear}</td>
                {row.cells.map((cell, column) => {
                  const change = changes[column]?.[rowIndex];
                  const md = levelValue(cell, 'MD');
                  const ad = levelValue(cell, 'AD');
                  return (
                    <td
                      key={cell.key}
                      className={`whitespace-nowrap py-1 pr-3 ${change?.md ? 'bg-amber-100/70 font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300' : change?.ad ? 'bg-sky-100/60 text-sky-800 dark:bg-sky-950/30 dark:text-sky-300' : 'text-zinc-600 dark:text-zinc-300'}`}
                    >
                      {md ? translate(ad ? `${md} – ${ad}` : md) : <span className="italic text-zinc-300 dark:text-zinc-600">–</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
