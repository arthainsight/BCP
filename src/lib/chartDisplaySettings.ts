import { DEFAULT_CHART_DISPLAY, type ChartDisplaySettings } from '@/types';
import { ALL_PARAYA_BODIES } from '@/lib/bnn/nadiParaya';
import { clampFontScale } from '@/lib/chartFont';
import { VARGA_DIVISIONS } from '@/lib/vargaChart';

/**
 * Reads stored chart display settings. Keys that are no longer settings (the
 * BNN switches and others removed in v2.23 because nothing read them) are
 * dropped, missing keys take their defaults, and a value of the wrong type is
 * ignored.
 */
export function migrateChartDisplaySettings(stored: unknown): ChartDisplaySettings {
  const parsed = stored && typeof stored === 'object' ? (stored as Record<string, unknown>) : {};
  const result: Record<string, unknown> = { ...DEFAULT_CHART_DISPLAY };
  for (const [key, fallback] of Object.entries(DEFAULT_CHART_DISPLAY)) {
    if (typeof parsed[key] === typeof fallback) result[key] = parsed[key];
  }
  // The text size stays within what the chart can show.
  result.chartFontScale = clampFontScale(result.chartFontScale);
  // Only the known chart styles are kept.
  // v2.84 had one mixed style, which was North and South Indian charts one inside the other; the North layout of v2.85 takes its place.
  if (parsed.chartStyle === 'mixed') result.chartStyle = 'mixedNorth';
  if (!['north', 'south', 'both', 'mixedNorth', 'mixedSouth'].includes(result.chartStyle as string)) result.chartStyle = DEFAULT_CHART_DISPLAY.chartStyle;
  // The outer chart of the mixed style is one of the vargas there are.
  if (!(VARGA_DIVISIONS as readonly number[]).includes(result.mixedOuterDivision as number)) result.mixedOuterDivision = DEFAULT_CHART_DISPLAY.mixedOuterDivision;
  // The Paraya grahas that are drawn: only the known ones (the four and the three of the beta) are kept, in their order.
  if (Array.isArray(parsed.parayaBodies)) result.parayaBodies = ALL_PARAYA_BODIES.filter(body => (parsed.parayaBodies as unknown[]).includes(body));
  // Settings from before degreePrecision only had an on/off degrees switch.
  if (!parsed.degreePrecision && parsed.showDegrees === true) result.degreePrecision = 'degree';
  return result as unknown as ChartDisplaySettings;
}
