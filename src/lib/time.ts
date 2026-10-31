// Lengths of time. The daśā systems count their years in days, and the texts do not say how many: BPHS counts the years of a daśā
// and leaves the length of a year alone. The user chooses (DashaSettings.yearLength); the start is the Julian year, 365.25 days.

export const DAY_MS = 24 * 60 * 60 * 1000;
export const JULIAN_YEAR_MS = 365.25 * DAY_MS;

/** The years a daśā can be counted in, in days: the Julian year, the sidereal year (PyJHora's 365.256364), the tropical year, and the 360 days of the sāvana year. */
export const DASHA_YEAR_LENGTHS = { julian: 365.25, sidereal: 365.256364, tropical: 365.2422, savana: 360 } as const;
export type DashaYearLength = keyof typeof DASHA_YEAR_LENGTHS;
export const DASHA_YEAR_KEYS = Object.keys(DASHA_YEAR_LENGTHS) as DashaYearLength[];
export const isDashaYearLength = (value: unknown): value is DashaYearLength => typeof value === 'string' && value in DASHA_YEAR_LENGTHS;

let current: DashaYearLength = 'julian';

/** Sets the year the daśās count in. It is set where the setting changes (never while a page renders), and the panels that show daśās start afresh when it changes. */
export function setDashaYearLength(length: DashaYearLength) {
  current = length;
}
export const getDashaYearLength = () => current;

/** Runs something with the daśās counted in another year, and puts the year back (for a reference that was worked out in one). */
export function withDashaYear<T>(length: DashaYearLength, run: () => T): T {
  const before = current;
  current = length;
  try { return run(); } finally { current = before; }
}

/** A year of a daśā in milliseconds. */
export const dashaYearMs = () => DASHA_YEAR_LENGTHS[current] * DAY_MS;

/** The date a number of daśā years (fractions allowed) after another. */
export function addDashaYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * dashaYearMs());
}
