// Lengths of time. The daśā systems count their years as Julian years, 365.25 days.

export const DAY_MS = 24 * 60 * 60 * 1000;
export const JULIAN_YEAR_MS = 365.25 * DAY_MS;

/** The date a number of daśā years (Julian years, fractions allowed) after another. */
export function addDashaYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * JULIAN_YEAR_MS);
}
