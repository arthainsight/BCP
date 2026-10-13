'use client';

import type { ComponentProps } from 'react';
import type { ChartStyle } from '@/types';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart, { LABEL_PX } from './SouthIndianChart';
import { useChartFontScale } from '@/lib/chartFont';

type ChartProps = ComponentProps<typeof NorthIndianChart>;

/**
 * Both charts at once: the South Indian chart, whose twelve sign cells frame
 * the outside, with the North Indian chart in the empty middle. The inner chart
 * is kept to planet codes, since it has half the room, and its labels are drawn
 * as large on the screen as the outer chart's, whatever the width.
 */
export function CombinedChart(props: ChartProps) {
  const labelPx = LABEL_PX * useChartFontScale();
  const inner: ChartProps = { ...props, compact: false, fontPx: labelPx, degreePrecision: 'off', showCharaKaraka: false, showNakshatra: false };
  return <SouthIndianChart {...props} centerContent={<NorthIndianChart {...inner} />} />;
}

/**
 * Two different charts at once: the South Indian chart of one chart (a varga, say the navamsa) frames the outside, and the
 * North Indian chart of another (the D1 chart) is in the middle. Like the inner chart of the combined one, the inner chart
 * is kept to planet codes, in labels as large as those of the outer chart.
 */
export function MixedChart({ outer, inner }: { outer: ChartProps; inner: ChartProps }) {
  const labelPx = LABEL_PX * useChartFontScale();
  const middle: ChartProps = { ...inner, compact: false, fontPx: labelPx, degreePrecision: 'off', showCharaKaraka: false, showNakshatra: false };
  return <SouthIndianChart {...outer} centerContent={<NorthIndianChart {...middle} />} />;
}

/**
 * A chart in the style the viewer chose. In a small chart of a grid there is no
 * room for two, so the South Indian chart stands for "both" there. The mixed style
 * needs two charts, which only the main chart has (see MixedChart); wherever a single
 * chart is drawn it is shown as "both".
 */
export default function StyledChart({ style, ...props }: ChartProps & { style: ChartStyle }) {
  if (style === 'south') return <SouthIndianChart {...props} />;
  if (style === 'both' || style === 'mixed') return props.compact ? <SouthIndianChart {...props} /> : <CombinedChart {...props} />;
  return <NorthIndianChart {...props} />;
}
