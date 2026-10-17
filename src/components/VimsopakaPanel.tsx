'use client';

import { useState } from 'react';
import type { ChartData } from '@/types';
import { calculateVimsopaka, formatScore, VIMSOPAKA_SCHEMES, type SchemeKey } from '@/lib/vargaMatrix';
import { vimsopakaBy } from '@/lib/balaView';
import { useT } from '@/lib/i18n';
import { HorizontalBars, SERIES_COLORS } from './BalaCharts';
import { Heading, NAME_CELL, ROW, ScrollTable, TOTAL_CELL } from './balaShared';

const SCHEME_KEYS = Object.keys(VIMSOPAKA_SCHEMES) as SchemeKey[];

/** Vimśopaka Bala: how well each graha stands in the divisional charts, out of 20, as a bar chart and a table. */
export default function VimsopakaPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const [scheme, setScheme] = useState<SchemeKey>('shodasavarga');
  const { rows } = calculateVimsopaka(chart);
  const sorted = vimsopakaBy(rows, scheme);
  const label = VIMSOPAKA_SCHEMES[scheme].label;

  return (
    <div className="min-w-0 space-y-4">
      <div className="inline-flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50" role="group" aria-label={t('Vimśopaka scheme')}>
        {SCHEME_KEYS.map(key => (
          <button
            key={key}
            type="button"
            aria-pressed={scheme === key}
            onClick={() => setScheme(key)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-mono ${scheme === key ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            {VIMSOPAKA_SCHEMES[key].label}
          </button>
        ))}
      </div>

      <HorizontalBars
        title={`${t('Vimśopaka Bala')} · ${label}`}
        note={t('Points out of 20 from the dignity of the graha in the divisional charts of the scheme, strongest first. 10 is the middle; hover or focus a bar for all four schemes.')}
        ariaLabel={`${t('Vimśopaka Bala')} ${label}`}
        max={20}
        referenceAt={10}
        referenceLabel="10"
        rows={sorted.map(row => ({
          key: row.planet,
          label: row.planet,
          value: row[scheme],
          display: formatScore(row[scheme]),
          color: SERIES_COLORS[0],
          title: row.planet,
          lines: SCHEME_KEYS.map(key => ({ label: VIMSOPAKA_SCHEMES[key].label, value: `${formatScore(row[key])} / 20` })),
        }))}
      />

      <div className="space-y-2">
        <Heading command="varga.strength.vimsopaka">{t('Four weighted calculations out of 20. Rahu/Ketu and Lagna excluded.')}</Heading>
        <ScrollTable minWidth="min-w-[720px]" headers={[t('Planet'), ...SCHEME_KEYS.map(key => VIMSOPAKA_SCHEMES[key].label)]}>
          {rows.map(row => (
            <tr key={row.planet} className={ROW}>
              <td className={NAME_CELL}>{row.planet}</td>
              {SCHEME_KEYS.map(key => <td key={key} className={TOTAL_CELL}>{formatScore(row[key])} / 20</td>)}
            </tr>
          ))}
        </ScrollTable>
      </div>
    </div>
  );
}
