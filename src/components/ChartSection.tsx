'use client';

import { useEffect, useState } from 'react';
import { BcpResult, ChartData, ChartDisplaySettings, ChartStyle, PlanetData } from '@/types';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';
import VargaMatrix from '@/pages/VargaMatrix';
import { getAshtakavargaOverlay } from '@/lib/ashtakavarga';

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

function isBcpEnabled(): boolean {
  try {
    const raw = localStorage.getItem('dashaSettings');
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    return parsed?.dashas?.bcp !== false;
  } catch {
    return true;
  }
}

export default function ChartSection({
  bcp, chart, transitPlanets, chartDisplaySettings, karakaByPlanet,
  transitDatetime, onTransitDatetimeChange, onCalculateTransit, transitLoading,
}: ChartSectionProps) {
  const [chartStyle, setChartStyle] = useState<ChartStyle>(chartDisplaySettings.chartStyle ?? 'north');
  const [showBcpHighlights, setShowBcpHighlights] = useState<boolean>(isBcpEnabled());
  const [view, setView] = useState<'chart' | 'varga'>('chart');

  useEffect(() => {
    setChartStyle(chartDisplaySettings.chartStyle ?? 'north');
  }, [chartDisplaySettings.chartStyle]);

  useEffect(() => {
    const handleChartStyleChange = (event: Event) => {
      const customEvent = event as CustomEvent<ChartStyle>;
      if (customEvent.detail === 'north' || customEvent.detail === 'south') {
        setChartStyle(customEvent.detail);
        setView('chart');
      }
    };

    const handleBcpToggle = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setShowBcpHighlights(customEvent.detail);
        return;
      }
      setShowBcpHighlights(isBcpEnabled());
    };

    const handleShowVarga = () => setView('varga');

    window.addEventListener('bcp:chart-style-change', handleChartStyleChange);
    window.addEventListener('bcp:dasha-bcp-toggle', handleBcpToggle);
    window.addEventListener('bcp:show-varga-matrix', handleShowVarga);

    return () => {
      window.removeEventListener('bcp:chart-style-change', handleChartStyleChange);
      window.removeEventListener('bcp:dasha-bcp-toggle', handleBcpToggle);
      window.removeEventListener('bcp:show-varga-matrix', handleShowVarga);
    };
  }, []);

  if (!bcp || !chart) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">
        Enter birth data in Data tab, then click "$ run bcp"
      </div>
    );
  }

  const yearHouse = showBcpHighlights ? bcp.activeYearHouse : 0;
  const monthHouse = showBcpHighlights ? bcp.activeMonthHouse : 0;
  const ashtakavargaOverlay = getAshtakavargaOverlay(chart);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {showBcpHighlights && view === 'chart' ? (
          <div className="flex gap-4 text-xs font-mono px-1">
            <span className="text-cyan-600 dark:text-cyan-400">Y: H{bcp.activeYearHouse}</span>
            <span className="text-emerald-700 dark:text-green-400">M: H{bcp.activeMonthHouse}</span>
          </div>
        ) : <div />}

        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setView('chart')}
            className={`px-2 py-1 text-[10px] font-mono rounded-md ${view === 'chart' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-green-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            Chart
          </button>
          <button
            type="button"
            onClick={() => setView('varga')}
            className={`px-2 py-1 text-[10px] font-mono rounded-md ${view === 'varga' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-green-400 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            Varga Matrix
          </button>
        </div>
      </div>

      {view === 'varga' ? (
        <VargaMatrix chart={chart} />
      ) : chartStyle === 'south' ? (
        <SouthIndianChart
          activeYearHouse={yearHouse}
          activeMonthHouse={monthHouse}
          ascendantSign={chart.ascendant.sign}
          planets={chart.planets}
          specialLagnas={chart.specialLagnas ?? []}
          transitPlanets={transitPlanets}
          ashtakavargaOverlay={ashtakavargaOverlay}
          showSigns={chartDisplaySettings.showSigns}
          showNatalPlanets={chartDisplaySettings.showNatalPlanets}
          showTransitPlanets={chartDisplaySettings.showTransitPlanets}
          showDegrees={chartDisplaySettings.showDegrees}
          showCharaKaraka={chartDisplaySettings.showCharaKaraka}
          showNakshatra={chartDisplaySettings.showNakshatra}
          showOuterPlanets={chartDisplaySettings.showOuterPlanets}
          showSpecialLagnas={chartDisplaySettings.showSpecialLagnas}
          karakaByPlanet={karakaByPlanet}
        />
      ) : (
        <NorthIndianChart
          activeYearHouse={yearHouse}
          activeMonthHouse={monthHouse}
          ascendantSign={chart.ascendant.sign}
          planets={chart.planets}
          specialLagnas={chart.specialLagnas ?? []}
          transitPlanets={transitPlanets}
          ashtakavargaOverlay={ashtakavargaOverlay}
          showSigns={chartDisplaySettings.showSigns}
          showNatalPlanets={chartDisplaySettings.showNatalPlanets}
          showTransitPlanets={chartDisplaySettings.showTransitPlanets}
          showDegrees={chartDisplaySettings.showDegrees}
          showCharaKaraka={chartDisplaySettings.showCharaKaraka}
          showNakshatra={chartDisplaySettings.showNakshatra}
          showOuterPlanets={chartDisplaySettings.showOuterPlanets}
          showSpecialLagnas={chartDisplaySettings.showSpecialLagnas}
          showBcpHighlights={showBcpHighlights}
          karakaByPlanet={karakaByPlanet}
        />
      )}
    </div>
  );
}
