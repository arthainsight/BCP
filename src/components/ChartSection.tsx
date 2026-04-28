'use client';

import { useEffect, useState } from 'react';
import { BcpResult, ChartData, ChartDisplaySettings, ChartStyle, PlanetData } from '@/types';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

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

  useEffect(() => {
    setChartStyle(chartDisplaySettings.chartStyle ?? 'north');
  }, [chartDisplaySettings.chartStyle]);

  useEffect(() => {
    const handleChartStyleChange = (event: Event) => {
      const customEvent = event as CustomEvent<ChartStyle>;
      if (customEvent.detail === 'north' || customEvent.detail === 'south') {
        setChartStyle(customEvent.detail);
      }
    };

    const handleBcpToggle = () => {
      setShowBcpHighlights(isBcpEnabled());
    };

    window.addEventListener('bcp:chart-style-change', handleChartStyleChange);
    window.addEventListener('bcp:dasha-bcp-toggle', handleBcpToggle);

    return () => {
      window.removeEventListener('bcp:chart-style-change', handleChartStyleChange);
      window.removeEventListener('bcp:dasha-bcp-toggle', handleBcpToggle);
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

  return (
    <div className="space-y-3">
      {showBcpHighlights && (
        <div className="flex gap-4 text-xs font-mono px-1">
          <span className="text-cyan-600 dark:text-cyan-400">Y: H{bcp.activeYearHouse}</span>
          <span className="text-emerald-700 dark:text-green-400">M: H{bcp.activeMonthHouse}</span>
        </div>
      )}

      {chartStyle === 'south' ? (
        <SouthIndianChart
          activeYearHouse={yearHouse}
          activeMonthHouse={monthHouse}
          ascendantSign={chart.ascendant.sign}
          planets={chart.planets}
          transitPlanets={transitPlanets}
          showSigns={chartDisplaySettings.showSigns}
          showNatalPlanets={chartDisplaySettings.showNatalPlanets}
          showTransitPlanets={chartDisplaySettings.showTransitPlanets}
          showDegrees={chartDisplaySettings.showDegrees}
          showCharaKaraka={chartDisplaySettings.showCharaKaraka}
          showNakshatra={chartDisplaySettings.showNakshatra}
          showOuterPlanets={chartDisplaySettings.showOuterPlanets}
          karakaByPlanet={karakaByPlanet}
        />
      ) : (
        <NorthIndianChart
          activeYearHouse={yearHouse}
          activeMonthHouse={monthHouse}
          ascendantSign={chart.ascendant.sign}
          planets={chart.planets}
          transitPlanets={transitPlanets}
          showSigns={chartDisplaySettings.showSigns}
          showNatalPlanets={chartDisplaySettings.showNatalPlanets}
          showTransitPlanets={chartDisplaySettings.showTransitPlanets}
          showDegrees={chartDisplaySettings.showDegrees}
          showCharaKaraka={chartDisplaySettings.showCharaKaraka}
          showNakshatra={chartDisplaySettings.showNakshatra}
          showOuterPlanets={chartDisplaySettings.showOuterPlanets}
          showBcpHighlights={showBcpHighlights}
          karakaByPlanet={karakaByPlanet}
        />
      )}
    </div>
  );
}
