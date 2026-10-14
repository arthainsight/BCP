'use client';

import type { ReactNode } from 'react';
import type { ChartStyle } from '@/types';
import { VARGA_NAMES, VARGA_SIGNIFICATIONS } from '@/lib/vargaChart';
import { useT } from '@/lib/i18n';

/** How many charts fit in a row: one on its own, beside other panels, or across the whole width. */
export type VargaGridWidth = 'single' | 'narrow' | 'wide';

// South Indian cells are a quarter of the chart wide, so small South charts need
// a wider place than North ones. The container query classes follow the width
// of the grid, not of the screen.
const COLUMNS: Record<VargaGridWidth, { north: string; south: string }> = {
  single: { north: 'grid-cols-1', south: 'grid-cols-1' },
  narrow: { north: 'grid-cols-2 @3xl:grid-cols-3', south: 'grid-cols-1 @xl:grid-cols-2' },
  wide: {
    north: 'grid-cols-2 @xl:grid-cols-3 @3xl:grid-cols-4 @5xl:grid-cols-5 @7xl:grid-cols-6',
    south: 'grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 @7xl:grid-cols-5',
  },
};

/**
 * Divisional charts in cards side by side, each with its title (D9 Navāṁśa).
 * A tap on a title is up to the caller: the Varga view opens the chart full
 * size under the grid, and the chart workspace shows it alone.
 */
export default function VargaChartGrid({ divisions, chartStyle, width, active = null, onSelect, renderChart }: {
  divisions: number[];
  chartStyle: ChartStyle;
  width: VargaGridWidth;
  /** The division whose card is marked, for example the one shown full size. */
  active?: number | null;
  onSelect: (division: number) => void;
  renderChart: (division: number) => ReactNode;
}) {
  const t = useT();
  const columns = COLUMNS[width][chartStyle === 'north' ? 'north' : 'south'];
  return (
    <div className="@container">
      <div className={`grid gap-2 ${columns}`}>
        {divisions.map(division => (
          <div
            key={division}
            className={`min-w-0 rounded-lg border p-1.5 ${active === division ? 'border-emerald-500 dark:border-green-600' : 'border-zinc-200 dark:border-zinc-700'}`}
          >
            <button
              type="button"
              onClick={() => onSelect(division)}
              title={t(VARGA_SIGNIFICATIONS[division])}
              className="mb-1 flex w-full min-w-0 items-baseline gap-1 text-left font-mono"
            >
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">D{division}</span>
              <span className="truncate text-[9px] text-zinc-400 dark:text-zinc-500">{VARGA_NAMES[division]}</span>
            </button>
            {renderChart(division)}
          </div>
        ))}
      </div>
    </div>
  );
}
