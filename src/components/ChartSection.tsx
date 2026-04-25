'use client';

import { BcpResult, ChartData, PlanetData } from '@/types';
import NorthIndianChart from './NorthIndianChart';

type ChartOptionKey = 'showSigns' | 'showNatalPlanets' | 'showTransitPlanets';

export interface ChartSectionProps {
  bcp: BcpResult | null;
  chart: ChartData | null;
  transitPlanets: PlanetData[];
  chartOptions: Record<ChartOptionKey, boolean>;
  onToggleOption: (key: ChartOptionKey) => void;
  transitDatetime: string;
  onTransitDatetimeChange: (v: string) => void;
  onCalculateTransit: () => void;
  transitLoading: boolean;
}

export default function ChartSection({
  bcp, chart, transitPlanets, chartOptions, onToggleOption,
  transitDatetime, onTransitDatetimeChange, onCalculateTransit, transitLoading,
}: ChartSectionProps) {
  if (!bcp || !chart) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">
        Enter birth data in Settings tab, then click &ldquo;$ run bcp&rdquo;
      </div>
    );
  }

  const OPTION_LABELS: { key: ChartOptionKey; label: string }[] = [
    { key: 'showSigns', label: 'signs' },
    { key: 'showNatalPlanets', label: 'natal' },
    { key: 'showTransitPlanets', label: 'transit' },
  ];

  return (
    <div className="space-y-3">
      {/* BCP house indicator */}
      <div className="flex gap-4 text-xs font-mono px-1">
        <span className="text-cyan-600 dark:text-cyan-400">Y: H{bcp.activeYearHouse}</span>
        <span className="text-emerald-700 dark:text-green-400">M: H{bcp.activeMonthHouse}</span>
        <span className="text-zinc-400 dark:text-zinc-500">
          age {bcp.completedAge} · yr {bcp.runningYear}
        </span>
      </div>

      {/* Chart option toggles */}
      <div className="flex flex-wrap gap-2">
        {OPTION_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onToggleOption(key)}
            className={`px-2 py-0.5 rounded text-xs font-mono border transition-colors ${
              chartOptions[key]
                ? 'bg-emerald-100 dark:bg-green-900/60 text-emerald-700 dark:text-green-400 border-emerald-400 dark:border-green-700'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transit input */}
      {chartOptions.showTransitPlanets && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={transitDatetime}
            onChange={(e) => onTransitDatetimeChange(e.target.value)}
            placeholder="transit: dd.mm.yyyy hh.mm.ss"
            className="flex-1 px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            onClick={onCalculateTransit}
            disabled={transitLoading || !transitDatetime.trim()}
            className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-cyan-500 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400 rounded text-xs font-mono hover:bg-cyan-50 dark:hover:bg-zinc-700 disabled:opacity-30 whitespace-nowrap transition-colors"
          >
            {transitLoading ? '...' : '$ transit'}
          </button>
        </div>
      )}

      <NorthIndianChart
        activeYearHouse={bcp.activeYearHouse}
        activeMonthHouse={bcp.activeMonthHouse}
        ascendantSign={chart.ascendant.sign}
        planets={chart.planets}
        transitPlanets={transitPlanets}
        showSigns={chartOptions.showSigns}
        showNatalPlanets={chartOptions.showNatalPlanets}
        showTransitPlanets={chartOptions.showTransitPlanets}
      />
    </div>
  );
}
