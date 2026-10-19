export const DASHA_EVENT_CATEGORIES = ['work', 'money', 'relationship', 'health', 'home', 'family', 'spiritual', 'other'] as const;
export const DASHA_EVENT_VARGAS = ['D1', 'D7', 'D9', 'D10', 'D12', 'D60'] as const;

export type DashaEventCategory = typeof DASHA_EVENT_CATEGORIES[number];
export type DashaEventVarga = typeof DASHA_EVENT_VARGAS[number];

/** How exactly the day of an event is known: to the day, to the month (the day is the middle of it) or to the year (the middle of it). */
export const DASHA_EVENT_ACCURACIES = ['day', 'month', 'year'] as const;
export type DashaEventAccuracy = typeof DASHA_EVENT_ACCURACIES[number];
export const DASHA_EVENT_ACCURACY_LABELS: Record<DashaEventAccuracy, string> = { day: 'to the day', month: 'to the month', year: 'to the year' };

export interface StoredDashaEvent {
  id: string;
  name: string;
  /** The day the event happened, or began (YYYY-MM-DD). */
  date: string;
  /** The last day of an event that lasted for a while (YYYY-MM-DD, not before `date`). */
  endDate?: string;
  category: DashaEventCategory;
  varga: DashaEventVarga;
  notes: string;
  tags: string[];
  significance: number;
  /** How exactly the day is known, when chosen: it then outweighs what the tags say. Otherwise `accuracyOf` reads it from the tags. */
  accuracy?: DashaEventAccuracy;
}

/**
 * How exactly the day of an event is known: what was chosen for it, or else what the tags say. An event pasted with only a month or a year is tagged "approx. date"
 * and given the middle of it (the 15th of the month, 1 July for a year), so that tag tells month from year by the day; "approx. month" and "approx. year" say it
 * outright. Any other event is to the day.
 */
export function accuracyOf(event: { date: string; tags: readonly string[]; accuracy?: DashaEventAccuracy }): DashaEventAccuracy {
  if (event.accuracy) return event.accuracy;
  const tags = event.tags.map(tag => tag.trim().toLocaleLowerCase());
  if (tags.includes('approx. year')) return 'year';
  if (tags.includes('approx. month')) return 'month';
  if (tags.includes('approx. date')) return event.date.endsWith('-07-01') ? 'year' : 'month';
  return 'day';
}

export const DASHA_EVENT_CATEGORY_LABELS: Record<DashaEventCategory, string> = {
  work: 'Work', money: 'Money', relationship: 'Relationship', health: 'Health', home: 'Home / move', family: 'Family', spiritual: 'Spiritual', other: 'Other',
};

/** An event's day (YYYY-MM-DD) as a Date at noon, or null when it is not a real day. */
export function parseEventDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** An event's day (YYYY-MM-DD) as DD.MM.YYYY. */
export function formatEventDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

/** Where the events of a chart are kept: one list for each birth moment. */
export const dashaEventsStorageKey = (birthDatetime: string) => `bhrigu:dasha-events:${birthDatetime.trim()}`;

const validIsoDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
const validCategory = (value: unknown): value is DashaEventCategory => DASHA_EVENT_CATEGORIES.includes(value as DashaEventCategory);
const validVarga = (value: unknown): value is DashaEventVarga => DASHA_EVENT_VARGAS.includes(value as DashaEventVarga);
const validAccuracy = (value: unknown): value is DashaEventAccuracy => DASHA_EVENT_ACCURACIES.includes(value as DashaEventAccuracy);

export function parseStoredDashaEvents(raw: string | null): StoredDashaEvent[] {
  const parsed: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).id === 'string' && typeof (item as Record<string, unknown>).name === 'string' && typeof (item as Record<string, unknown>).date === 'string')).map(item => ({
    id: String(item.id),
    name: String(item.name),
    date: String(item.date),
    ...(validIsoDate(item.endDate) && item.endDate >= String(item.date) ? { endDate: item.endDate } : {}),
    category: validCategory(item.category) ? item.category : 'other',
    varga: validVarga(item.varga) ? item.varga : 'D1',
    notes: String(item.notes ?? ''),
    tags: Array.isArray(item.tags) ? item.tags.map(String).map(tag => tag.trim()).filter(Boolean) : [],
    significance: Math.min(5, Math.max(1, Number(item.significance) || 3)),
    ...(validAccuracy(item.accuracy) ? { accuracy: item.accuracy } : {}),
  }));
}
