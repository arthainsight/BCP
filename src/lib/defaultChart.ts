// The chart the page opens with: the moment of opening, at Porvoo. The place can be changed in the form; the
// chart of another moment is made by typing it. Opening blank can be chosen in Settings.

/** Where the chart opens, as the lookup of the city "Porvoo" gives it (so that looking it up again changes nothing). */
export const DEFAULT_PLACE = {
  city: 'Porvoo',
  latitude: '60.39233',
  longitude: '25.66507',
  ianaTimezone: 'Europe/Helsinki',
} as const;

/** The key of the choice, in the browser's storage: the page opens with the chart unless this says 'false'. */
export const OPEN_WITH_CHART_KEY = 'openWithNowChart';

/** Whether the page opens with the chart of now. It is read at once, when the page has opened, not waited for. */
export function openWithChartEnabled(): boolean {
  try {
    return localStorage.getItem(OPEN_WITH_CHART_KEY) !== 'false';
  } catch {
    return true;
  }
}

/**
 * A moment as the clock of a place shows it, in the form the birth data takes: dd.mm.yyyy hh.mm.ss. The clock is that of
 * the place, not of the browser, so the chart of Porvoo is the chart of the time it is in Porvoo wherever it is opened from.
 */
export function wallClockIn(ianaTimezone: string, now: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: ianaTimezone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(now);
    const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
    return `${part('day')}.${part('month')}.${part('year')} ${part('hour')}.${part('minute')}.${part('second')}`;
  } catch {
    // A zone the browser does not know: its own clock, which is the best left.
    return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
  }
}
