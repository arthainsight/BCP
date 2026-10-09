import { DEFAULT_CHART_DISPLAY, type ChartDisplaySettings } from '@/types';
import { PARAYA_BODIES } from '@/lib/bnn/nadiParaya';

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
  // Only the known chart styles are kept.
  if (!['north', 'south', 'both'].includes(result.chartStyle as string)) result.chartStyle = DEFAULT_CHART_DISPLAY.chartStyle;
  // The Paraya grahas that are drawn: only the four known ones are kept, in their order.
  if (Array.isArray(parsed.parayaBodies)) result.parayaBodies = PARAYA_BODIES.filter(body => (parsed.parayaBodies as unknown[]).includes(body));
  // Settings from before degreePrecision only had an on/off degrees switch.
  if (!parsed.degreePrecision && parsed.showDegrees === true) result.degreePrecision = 'degree';
  return result as unknown as ChartDisplaySettings;
}
