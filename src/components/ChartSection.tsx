'use client';

import { useEffect, useState } from 'react';
import { BcpResult, ChartData, ChartDisplaySettings, ChartStyle, PlanetData } from '@/types';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';
import VargaMatrix from '@/pages/VargaMatrix';
import DrishtiPanel from '@/components/DrishtiPanel';
import { getAshtakavargaOverlay } from '@/lib/ashtakavarga';

export default function ChartSection({ bcp, chart, transitPlanets, chartDisplaySettings, karakaByPlanet }: any) {
  const [chartStyle, setChartStyle] = useState(chartDisplaySettings.chartStyle ?? 'north');
  const [view, setView] = useState<'chart' | 'varga' | 'drishti'>('chart');

  if (!bcp || !chart) {
    return <div className="flex items-center justify-center h-40 text-zinc-400 text-xs font-mono">Run chart</div>;
  }

  const ashtakavargaOverlay = getAshtakavargaOverlay(chart);

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <button onClick={() => setView('chart')}>Chart</button>
        <button onClick={() => setView('varga')}>Varga</button>
        <button onClick={() => setView('drishti')}>Drishti</button>
      </div>

      {view === 'varga' && <VargaMatrix chart={chart} />}
      {view === 'drishti' && <DrishtiPanel chart={chart} />}

      {view === 'chart' && (
        chartStyle === 'south'
          ? <SouthIndianChart ascendantSign={chart.ascendant.sign} planets={chart.planets} ashtakavargaOverlay={ashtakavargaOverlay} />
          : <NorthIndianChart ascendantSign={chart.ascendant.sign} planets={chart.planets} ashtakavargaOverlay={ashtakavargaOverlay} />
      )}
    </div>
  );
}
