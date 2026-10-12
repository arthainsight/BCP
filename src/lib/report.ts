// Small helpers of the client report.

const pad = (value: number) => String(value).padStart(2, '0');

/** A date as it is written on the report: day.month.year. */
export function reportDate(date: Date): string {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/**
 * The first title of a report: its name, then the name of the chart that is open, or else the day of birth
 * (the birth time is written day.month.year hours.minutes.seconds, and only the day is kept).
 */
export function reportTitle(chartName: string | null, birthDatetime: string, label: string): string {
  const name = chartName?.trim();
  if (name) return `${label} · ${name}`;
  const day = birthDatetime.trim().split(/\s+/)[0];
  return day ? `${label} · ${day}` : label;
}
