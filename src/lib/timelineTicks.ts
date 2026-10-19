import { DAY_MS } from './time';
import { pad2 } from './dateFormat';

// The marks along the time axis of a timeline: months for a year or two, years for longer, at most about `maxLabels` of them and always on the calendar
// (a mark at every second or fifth year is a year that divides by it).

export interface Tick {
  time: number;
  label: string;
}

/** Marks between two moments (in local time): the first of a month (MM.YYYY) when the stretch is under about two years, otherwise the first of January (YYYY). */
export function timelineTicks(fromTime: number, toTime: number, maxLabels = 6): Tick[] {
  if (!(toTime > fromTime)) return [];
  const spanDays = (toTime - fromTime) / DAY_MS;
  const start = new Date(fromTime);
  const ticks: Tick[] = [];
  if (spanDays <= 800) {
    const step = Math.max(1, Math.ceil(spanDays / 30.44 / maxLabels));
    for (let month = start.getFullYear() * 12 + start.getMonth() + 1; ; month++) {
      const time = new Date(Math.floor(month / 12), month % 12, 1).getTime();
      if (time >= toTime) break;
      if (month % step === 0) ticks.push({ time, label: `${pad2((month % 12) + 1)}.${Math.floor(month / 12)}` });
    }
    return ticks;
  }
  // (A little slack, so that thirty years with their leap days are still five a mark and not six.)
  const step = Math.max(1, Math.ceil(spanDays / 365.25 / maxLabels - 0.01));
  for (let year = start.getFullYear() + 1; ; year++) {
    const time = new Date(year, 0, 1).getTime();
    if (time >= toTime) break;
    if (year % step === 0) ticks.push({ time, label: String(year) });
  }
  return ticks;
}
