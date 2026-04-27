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

export default function ChartSection({
  bcp, chart, transitPlanets, chartDisplaySettings, karakaByPlanet,
  transitDatetime, onTransitDatetimeChange, onCalculateTransit, transitLoading,
}: ChartSectionProps) {
  const [chartStyle, setChartStyle] = useState<ChartStyle>(chartDisplaySettings.chartStyle ?? 'north');

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

    window.addEventListener('bcp:chart-style-change', handleChartStyleChange);
    return () => window.removeEventListener('bcp:chart-style-change', handleChartStyleChange);
  }, []);

  if (!bcp || !chart) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">
        Enter birth data in Data tab, then click "$ run bcp"
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-xs font-mono px-1">
        <span className="text-cyan-600 dark:text-cyan-400">Y: H{bcp.activeYearHouse}</span>
        <span className="text-emerald-700 dark:text-green-400">M: H{bcp.activeMonthHouse}</span>
      </div>

      {chartStyle === 'south' ? (
        <SouthIndianChart
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
      ) : (
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
      )}
    </div>
  );
}
