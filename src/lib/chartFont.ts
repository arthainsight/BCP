import { createContext, useContext } from 'react';

/** The smallest and largest chart text size on offer, as a multiple of the usual size. */
export const FONT_SCALE_MIN = 0.7;
export const FONT_SCALE_MAX = 1.6;
export const FONT_SCALE_STEP = 0.05;

/** A stored or typed size brought into the range on offer; anything that is not a number is the usual size. */
export function clampFontScale(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 1;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round(value * 100) / 100));
}

/** The chart text size chosen in Settings; the full-size charts read it, the small ones in grids keep their own. */
export const ChartFontContext = createContext(1);

export function useChartFontScale(): number {
  return useContext(ChartFontContext);
}

/** The size as a percentage of the usual: 1.25 is "125%". */
export const fontScaleLabel = (scale: number) => `${Math.round(scale * 100)}%`;
