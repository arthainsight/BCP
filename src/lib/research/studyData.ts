import { DEFAULT_CALCULATION_SETTINGS, type CalculationSettings } from '@/types';
import { calculationParams } from '@/lib/apiParams';
import { parseDateTime } from '@/lib/bcp';
import { dashaEventsStorageKey, parseEventDate, parseStoredDashaEvents, type StoredDashaEvent } from '@/lib/dashaEventStore';
import type { SavedChart, SavedChartData } from '@/lib/savedCharts';
import { parseClock } from '@/lib/specialSphutas';
import { localToUtcOffsetHours, parseBirthDatetimeForTz } from '@/lib/timezone';
import type { DateAccuracy, StudyEvent } from './eventStudy';

// What the research needs from what the user has saved: the charts and, for each, the events of its birth moment, and the address of the chart to calculate.

export interface ResearchSource {
  id: string;
  name: string;
  /** Who the chart belongs to, or ''. */
  client: string;
  saved: SavedChartData;
  events: StoredDashaEvent[];
}

/** One saved chart's own key: charts saved twice for one birth moment and place are one chart. */
const sourceKey = (data: SavedChartData) => `${data.birthDatetime.trim()}|${data.manualLat.trim()}|${data.manualLng.trim()}`;

/**
 * The saved charts with their events, one for each birth moment and place (a chart saved under two names counts once, under the first). `readEvents`
 * gives the stored text of the events of a birth moment, or null.
 */
export function researchSources(charts: readonly SavedChart[], readEvents: (birthDatetime: string) => string | null): ResearchSource[] {
  const seen = new Set<string>();
  const sources: ResearchSource[] = [];
  for (const chart of charts) {
    const key = sourceKey(chart.chartData);
    if (seen.has(key)) continue;
    seen.add(key);
    let events: StoredDashaEvent[] = [];
    try { events = parseStoredDashaEvents(readEvents(chart.chartData.birthDatetime)); } catch { /* an unreadable list is no events */ }
    sources.push({ id: chart.id, name: chart.name, client: chart.client?.trim() ?? '', saved: chart.chartData, events });
  }
  return sources;
}

/** The events kept in this browser for a birth moment. */
export function readStoredEvents(birthDatetime: string): string | null {
  try { return localStorage.getItem(dashaEventsStorageKey(birthDatetime)); } catch { return null; }
}

/**
 * How exactly the day of an event is known. An event pasted with only a month or a year is tagged "approx. date" and given the middle of it (the 15th of the month,
 * 1 July for a year), so that tag tells month from year by the day; "approx. month" and "approx. year" say it outright. Any other event is to the day.
 */
export function accuracyOf(event: { date: string; tags: readonly string[] }): DateAccuracy {
  const tags = event.tags.map(tag => tag.trim().toLocaleLowerCase());
  if (tags.includes('approx. year')) return 'year';
  if (tags.includes('approx. month')) return 'month';
  if (tags.includes('approx. date')) return event.date.endsWith('-07-01') ? 'year' : 'month';
  return 'day';
}

/** The events as the study takes them: their day at noon, with how exactly it is known; one that is not a real day is left out. */
export function studyEventsOf(events: readonly StoredDashaEvent[]): StudyEvent[] {
  return events.flatMap(event => {
    const day = parseEventDate(event.date);
    return day ? [{ id: event.id, name: event.name, time: day.getTime(), category: event.category, tags: event.tags, accuracy: accuracyOf(event) }] : [];
  });
}

/** The birth moment of a saved chart, as the rest of the app counts ages from it; null when it is not a date. */
export function birthTimeOf(data: SavedChartData): number | null {
  return parseDateTime(data.birthDatetime)?.getTime() ?? null;
}

/**
 * The address that calculates a saved chart, with the calculation settings it was saved with (or `fallback`), or null when the chart lacks a birth
 * moment, a place or a time zone.
 */
export function chartRequestUrl(data: SavedChartData, fallback: CalculationSettings = DEFAULT_CALCULATION_SETTINGS): string | null {
  const match = data.birthDatetime.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
  const lat = parseFloat(data.manualLat);
  const lng = parseFloat(data.manualLng);
  if (!match || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  let offset: number | null = null;
  if (data.tzOverride !== '') {
    const override = parseFloat(data.tzOverride);
    if (!Number.isNaN(override)) offset = override;
  } else if (data.ianaTimezone) {
    const wallClock = parseBirthDatetimeForTz(data.birthDatetime);
    if (wallClock) offset = localToUtcOffsetHours(data.ianaTimezone, wallClock);
  }
  if (offset === null) return null;
  const [, dd, mm, yyyy, hh, min, ss] = match;
  const settings = data.calculationSettings ?? fallback;
  const params = new URLSearchParams({
    year: yyyy, month: mm, day: dd, hour: hh, minute: min, second: ss,
    lat: String(lat), lng: String(lng), tz: String(offset),
    ...calculationParams(settings),
    sunrise: settings.sunriseMode ?? 'true',
    ...(parseClock(settings.sunriseManual ?? '') !== null ? { sunriseManual: settings.sunriseManual.trim() } : {}),
  });
  return `/api/chart?${params}`;
}
