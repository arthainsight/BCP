'use client';

import { useState } from 'react';
import type { ChartData, ChartDisplaySettings, ChartStyle, PlanetData } from '@/types';
import { VARGA_NAMES } from '@/lib/vargaChart';
import { vargaChartProps } from '@/lib/vargaChartProps';
import { useArudhaPadas } from '@/hooks/useArudhaPadas';
import { useChartPoints } from '@/hooks/useChartPoints';
import type { DashaLordMarks } from './chartLayers';
import StyledChart from './StyledChart';
import NestedChart from './NestedChart';
import VargaChartGrid from './VargaChartGrid';
import { mixedShape } from '@/lib/chartStyle';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  divisions: number[];
  chartStyle: ChartStyle;
  chartDisplaySettings: ChartDisplaySettings;
  karakaByPlanet?: Record<string, string>;
  nakshatraAdjust?: number;
  dashaLords?: DashaLordMarks | null;
  /** Transiting grahas drawn on every chart, for example those of an event's day. */
  transitPlanets?: PlanetData[];
  /** The varga drawn outside the D1 chart in the mixed style (a single chart is then D1 inside and this one outside). */
  outerDivision?: number;
  /** Called with one division to show it on its own, full size. */
  onFocus: (division: number) => void;
};

/**
 * Several divisional charts side by side, small like the Vargas grid. A tap on
 * a planet follows it through every chart; a tap on a title shows that chart
 * alone, with all its layers.
 */
export default function ChartDivisionsView({ chart, divisions, chartStyle, chartDisplaySettings, karakaByPlanet, nakshatraAdjust, dashaLords, transitPlanets, outerDivision, onFocus }: Props) {
  const t = useT();
  const [highlight, setHighlight] = useState<string | null>(null);
  const [arudhaPadas] = useArudhaPadas();
  const points = useChartPoints();
  const toggleHighlight = (name: string) => setHighlight(current => (current === name ? null : name));
  // A single chart is drawn full size with the display settings, like D1.
  const compact = divisions.length > 1;

  // The mixed styles: the D1 chart in the inner part of every house and the chosen varga in the outer part, a planet tapped marked in both.
  const shape = mixedShape(chartStyle);
  if (shape && outerDivision !== undefined && !compact) {
    const common = { chart, compact: false, chartDisplaySettings, karakaByPlanet, nakshatraAdjust, dashaLords, highlight, onPlanetClick: toggleHighlight, transitPlanets, arudhaPadas, points };
    return (
      <div className="@container">
        <NestedChart
          shape={shape}
          inner={vargaChartProps({ ...common, division: 1 })}
          outer={vargaChartProps({ ...common, division: outerDivision })}
          innerTitle={`D1 ${VARGA_NAMES[1]}`}
          outerTitle={`D${outerDivision} ${VARGA_NAMES[outerDivision]}`}
          innerWord={t('inner chart')}
          outerWord={t('outer chart')}
        />
      </div>
    );
  }

  return (
    <VargaChartGrid
      divisions={divisions}
      chartStyle={chartStyle}
      width={compact ? 'narrow' : 'single'}
      onSelect={onFocus}
      renderChart={division => (
        <StyledChart style={chartStyle} {...vargaChartProps({ chart, division, compact, chartDisplaySettings, karakaByPlanet, nakshatraAdjust, dashaLords, highlight, onPlanetClick: toggleHighlight, transitPlanets, arudhaPadas, points })} />
      )}
    />
  );
}
