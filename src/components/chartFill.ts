import { createContext, useContext } from 'react';

/**
 * True inside the full-screen chart view. Charts then grow to fit the screen
 * (as wide as the height allows) instead of stopping at their usual width.
 */
export const ChartFillContext = createContext(false);

export function useChartFill(): boolean {
  return useContext(ChartFillContext);
}

/** Square charts in full screen: as wide as possible while still fitting the screen height. */
export const FILL_MAX_WIDTH = 'min(100%, calc(100dvh - 9rem))';
