'use client';

import type { ComponentProps } from 'react';
import type { ChartStyle } from '@/types';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';

type ChartProps = ComponentProps<typeof NorthIndianChart>;

/**
 * Both charts at once: the South Indian chart, whose twelve sign cells frame
 * the outside, with the North Indian chart in the empty middle. The outer chart
 * follows the display settings; the inner one is kept to planet codes, since it
 * has half the room.
 */
export function CombinedChart(props: ChartProps) {
  const inner: ChartProps = { ...props, compact: true, degreePrecision: 'off', showCharaKaraka: false, showNakshatra: false };
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
