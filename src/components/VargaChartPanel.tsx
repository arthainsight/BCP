'use client';

import { useState } from 'react';
import type { ChartData, ChartDisplaySettings, DegreePrecision } from '@/types';
import { VARGA_DIVISIONS, VARGA_NAMES, VARGA_SIGNIFICATIONS, buildVargaChart } from '@/lib/vargaChart';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

type Props = {
  chart: ChartData;
  chartStyle: 'north' | 'south';
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet?: Record<string, string>;
  nakshatraAdjust?: number;
};

export default function VargaChartPanel({
  chart,
  chartStyle,
  chartDisplaySettings,
  karakaByPlanet = {},
  nakshatraAdjust = 0,
}: Props) {
  const [division, setDivision] = useState<number>(9);
  const varga = buildVargaChart(chart, division);

  // BCP highlighting and the transit overlay are rāśi concepts, so they are
  // deliberately left off here — a divisional chart shows the division alone.
  const shared = {
    activeYearHouse: 0,
    activeMonthHouse: 0,
    ascendantSign: varga.ascendantSign,
    planets: varga.planets,
    specialLagnas: chartDisplaySettings.showSpecialLagnas ? varga.specialLagnas : [],
    showSigns: chartDisplaySettings.showSigns,
    showNatalPlanets: chartDisplaySettings.showNatalPlanets,
    showTransitPlanets: false,
    degreePrecision: (chartDisplaySettings.degreePrecision ?? 'off') as DegreePrecision,
    showCharaKaraka: chartDisplaySettings.showCharaKaraka,
    showNakshatra: division === 1 ? chartDisplaySettings.showNakshatra : false,
    showOuterPlanets: chartDisplaySettings.showOuterPlanets,
    showSpecialLagnas: chartDisplaySettings.showSpecialLagnas,
    showBcpHighlights: false,
    karakaByPlanet,
    nakshatraAdjust,
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
          Divisional chart — D{division} {VARGA_NAMES[division]}
        </div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          {VARGA_SIGNIFICATIONS[division]}. Houses are counted from the D{division} ascendant.
          {division !== 1 && ' Degrees show the position within the divisional sign.'}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex min-w-max gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
          {VARGA_DIVISIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDivision(option)}
              title={`${VARGA_NAMES[option]} — ${VARGA_SIGNIFICATIONS[option]}`}
              className={`shrink-0 rounded-md px-2 py-1.5 text-[10px] font-mono ${
                division === option
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              D{option}
            </button>
          ))}
        </div>
      </div>

      {chartStyle === 'south' ? <SouthIndianChart {...shared} /> : <NorthIndianChart {...shared} />}

      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
        Lagna in D{division}: {['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'][varga.ascendantSign - 1]}
      </div>
    </div>
  );
}
