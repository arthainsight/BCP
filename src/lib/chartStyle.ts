import type { ChartStyle } from '@/types';

/** The layout of a chart within a chart, or null for a style that draws one chart. */
export function mixedShape(style: ChartStyle): 'north' | 'south' | null {
  return style === 'mixedNorth' ? 'north' : style === 'mixedSouth' ? 'south' : null;
}
