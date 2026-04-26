'use client';

import { BcpResult, ChartData, ChartDisplaySettings, PlanetData } from '@/types';
import NorthIndianChart from './NorthIndianChart';

export interface ChartSectionProps {
  bcp: BcpResult | null;
  chart: ChartData | null;
  transitPlanets: PlanetData[];
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet: Record<string, string>;
  transitDatetime: string;
  onTransitDatetimeChange: (v: string) => void;
  onCalculateTransit: () => void;
  transitLoading: boolean;
}

export default function ChartSection({
  bcp, chart, transitPlanets, chartDisplaySettings, karakaByPlanet,
  transitDatetime, onTransitDatetimeChange, onCalculateTransit, transitLoading,
}: ChartSectionProps) {
  if (!bcp || !chart) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">
        Enter birth data in Data tab, then click &ldquo;$ run bcp&rdquo;
      </div>
    );
  }

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

      {/* Transit input — shown when transit overlay is enabled */}
      {chartDisplaySettings.showTransitPlanets && (
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
        showSigns={chartDisplaySettings.showSigns}
        showNatalPlanets={chartDisplaySettings.showNatalPlanets}
        showTransitPlanets={chartDisplaySettings.showTransitPlanets}
        showDegrees={chartDisplaySettings.showDegrees}
        showCharaKaraka={chartDisplaySettings.showCharaKaraka}
        showNakshatra={chartDisplaySettings.showNakshatra}
        karakaByPlanet={karakaByPlanet}
      />
    </div>
  );
}
