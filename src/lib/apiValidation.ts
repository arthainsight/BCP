// What the routes of the API accept: numbers inside the range that means something, and lists of grahas without
// repeats. Every route reads its query through these, so that a value that is not a number or lies outside the sky
// is answered with an error at once instead of reaching the ephemeris, and a long request cannot be made longer by
// asking for the same graha again and again.

export interface NumberRange {
  min: number;
  max: number;
  /** The value when the parameter is absent or empty; without one the parameter is required. */
  fallback?: number;
}

/** The moment of birth (or of any chart) as the chart routes take it. Year, month and day are required. */
export const MOMENT_RANGES = {
  year: { min: 1, max: 9999 },
  month: { min: 1, max: 12 },
  day: { min: 1, max: 31 },
  hour: { min: 0, max: 23, fallback: 0 },
  minute: { min: 0, max: 59, fallback: 0 },
  second: { min: 0, max: 59, fallback: 0 },
} as const satisfies Record<string, NumberRange>;

/** The place of a chart: latitude and longitude in degrees, and the UTC offset in hours (fallback: Greenwich). */
export const PLACE_RANGES = {
  lat: { min: -90, max: 90, fallback: 0 },
  lng: { min: -180, max: 180, fallback: 0 },
  tz: { min: -14, max: 14, fallback: 0 },
} as const satisfies Record<string, NumberRange>;

/** The signed offset from the Lahiri ayanamsa, in degrees. */
export const AYANAMSA_OFFSET_RANGE = { min: -360, max: 360, fallback: 0 } as const satisfies NumberRange;

const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)$/;

/**
 * Numbers from a query. A value that is not a number (including "12abc", "Infinity" and "1e999") or lies outside its
 * range gives an error that names the parameter; an absent one takes its fallback, or is an error when it has none.
 */
export function readNumbers<K extends string>(
  params: URLSearchParams,
  ranges: Record<K, NumberRange>,
): { values: Record<K, number> } | { error: string } {
  const values = {} as Record<K, number>;
  for (const key of Object.keys(ranges) as K[]) {
    const { min, max, fallback } = ranges[key];
    const raw = params.get(key)?.trim() ?? '';
    if (raw === '') {
      if (fallback === undefined) return { error: `Missing required parameter: ${key}` };
      values[key] = fallback;
      continue;
    }
    // Plain decimals only: Number() would also take "0x10", "1e3" and " Infinity".
    const value = DECIMAL.test(raw) ? Number(raw) : NaN;
    if (!Number.isFinite(value)) return { error: `${key} is not a number` };
    if (value < min || value > max) return { error: `${key} must be between ${min} and ${max}` };
    values[key] = value;
  }
  return { values };
}

/**
 * A whole number from a query, kept inside its range; a value that is absent or not a number gives the fallback.
 * (The routes that limit a length of time quietly use the longest the route allows, as they always have.)
 */
export function readClampedInt(params: URLSearchParams, key: string, { min, max, fallback }: { min: number; max: number; fallback: number }): number {
  const raw = params.get(key)?.trim() ?? '';
  const value = DECIMAL.test(raw) ? Math.trunc(Number(raw)) : NaN;
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/**
 * The grahas named in a comma-separated list, each once and in the order of `allowed`. A name that is not in
 * `allowed` is dropped (only the list itself is looked at, so names such as "constructor" are not grahas).
 */
export function readBodies<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (raw === null) return [...allowed];
  const named = new Set(raw.split(',').map(name => name.trim()));
  return allowed.filter(body => named.has(body));
}
