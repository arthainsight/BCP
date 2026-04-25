/**
 * Returns the UTC offset in hours for an IANA timezone at a given date.
 * Uses the date to correctly resolve DST — e.g. Europe/Helsinki is +2 in winter, +3 in summer.
 *
 * The `date` argument should approximate the local birth time (treated as UTC for DST lookup).
 * This approximation is accurate for all cases except births at the exact DST transition hour.
 */
export function getUtcOffsetHours(ianaTimezone: string, date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);

    const offsetStr = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    const match = offsetStr.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return 0;

    const sign = match[1] === '+' ? 1 : -1;
    const h = parseInt(match[2], 10);
    const m = parseInt(match[3] ?? '0', 10);
    return sign * (h + m / 60);
  } catch {
    return 0;
  }
}

/** Parses "dd.mm.yyyy hh.mm.ss" into a Date (treating the numbers as UTC for DST lookup). */
export function parseBirthDatetimeForTz(dt: string): Date | null {
  const match = dt.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!match) return null;
  const [, dd, mm, yyyy, hh, min, ss] = match;
  return new Date(
    Date.UTC(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd), parseInt(hh), parseInt(min), parseInt(ss))
  );
}
