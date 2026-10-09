'use client';

import { useState } from 'react';
import type { ChartData, ChartDisplaySettings, PlanetData } from '@/types';
import { VARGA_NAMES, VARGA_SIGNIFICATIONS } from '@/lib/vargaChart';
import { vargaChartProps } from '@/lib/vargaChartProps';
import { useArudhaPadas } from '@/hooks/useArudhaPadas';
import { useChartPoints } from '@/hooks/useChartPoints';
import type { DashaLordMarks } from './chartLayers';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

type Props = {
  chart: ChartData;
  divisions: number[];
  chartStyle: 'north' | 'south';
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet?: Record<string, string>;
  nakshatraAdjust?: number;
  dashaLords?: DashaLordMarks | null;
  /** Transiting grahas drawn on every chart, for example those of an event's day. */
  transitPlanets?: PlanetData[];
  /** Called with one division to show it on its own, full size. */
  onFocus: (division: number) => void;
};

/**
 * Several divisional charts side by side, small like the Vargas grid. A tap on
 * a planet follows it through every chart; a tap on a title shows that chart
 * alone, with all its layers.
 */
export default function ChartDivisionsView({ chart, divisions, chartStyle, chartDisplaySettings, karakaByPlanet, nakshatraAdjust, dashaLords, transitPlanets, onFocus }: Props) {
  const [highlight, setHighlight] = useState<string | null>(null);
  const [arudhaPadas] = useArudhaPadas();
  const points = useChartPoints();
  const toggleHighlight = (name: string) => setHighlight(current => (current === name ? null : name));
  const Chart = chartStyle === 'south' ? SouthIndianChart : NorthIndianChart;
  // A single chart is drawn full size with the display settings, like D1.
  const compact = divisions.length > 1;

  return (
    <div className="@container">
      <div className={`grid gap-2 ${!compact ? 'grid-cols-1' : chartStyle === 'south' ? 'grid-cols-1 @xl:grid-cols-2' : 'grid-cols-2 @3xl:grid-cols-3'}`}>
        {divisions.map(division => (
          <div key={division} className="min-w-0 rounded-lg border border-zinc-200 p-1.5 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => onFocus(division)}
              title={VARGA_SIGNIFICATIONS[division]}
              className="mb-1 flex w-full min-w-0 items-baseline gap-1 text-left font-mono"
            >
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">D{division}</span>
              <span className="truncate text-[9px] text-zinc-400 dark:text-zinc-500">{VARGA_NAMES[division]}</span>
            </button>
            <Chart {...vargaChartProps({ chart, division, compact, chartDisplaySettings, karakaByPlanet, nakshatraAdjust, dashaLords, highlight, onPlanetClick: toggleHighlight, transitPlanets, arudhaPadas, points })} />
          </div>
        ))}
      </div>
    </div>
  );
}
