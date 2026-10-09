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
 * A chart in the style the viewer chose. In a small chart of a grid there is no
 * room for two, so the South Indian chart stands for "both" there.
 */
export default function StyledChart({ style, ...props }: ChartProps & { style: ChartStyle }) {
  if (style === 'south') return <SouthIndianChart {...props} />;
  if (style === 'both') return props.compact ? <SouthIndianChart {...props} /> : <CombinedChart {...props} />;
  return <NorthIndianChart {...props} />;
}
