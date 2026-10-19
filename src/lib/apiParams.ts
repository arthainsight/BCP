import type { CalculationSettings } from '@/types';

/** The calculation settings that the chart routes of the API take as query parameters. */
export function calculationParams(settings?: Partial<Pick<CalculationSettings, 'ayanamsa' | 'ayanamsaOffsetDegrees' | 'nodeMode'>>): Record<string, string> {
  return {
    ayanamsa: settings?.ayanamsa ?? 'lahiri',
    ayanamsaOffset: String(settings?.ayanamsaOffsetDegrees ?? 0),
    nodeMode: settings?.nodeMode ?? 'mean',
  };
}

/** The address of the sign changes (and stations) of some grahas, from a day on. */
export function signChangesUrl(start: string, days: number, bodies: readonly string[], settings?: CalculationSettings): string {
  return `/api/sign-changes?${new URLSearchParams({ start, days: String(days), bodies: bodies.join(','), ...calculationParams(settings) })}`;
}

/** The address of the longitudes of the slow grahas for twelve months from a day on, for the transit hits. */
export function transitHitsUrl(start: string, settings?: CalculationSettings): string {
  return `/api/transit-hits?${new URLSearchParams({ start, days: '366', ...calculationParams(settings) })}`;
}

/** The address of the longitudes of some grahas for a number of days from a day on, for the aspect view of the transits. */
export function transitSeriesUrl(start: string, days: number, bodies: readonly string[], settings?: CalculationSettings): string {
  return `/api/transit-series?${new URLSearchParams({ start, days: String(days), bodies: bodies.join(','), ...calculationParams(settings) })}`;
}
