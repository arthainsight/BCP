export const DASHA_EVENT_CATEGORIES = ['work', 'money', 'relationship', 'health', 'home', 'family', 'spiritual', 'other'] as const;
export const DASHA_EVENT_VARGAS = ['D1', 'D7', 'D9', 'D10', 'D12', 'D60'] as const;

export type DashaEventCategory = typeof DASHA_EVENT_CATEGORIES[number];
export type DashaEventVarga = typeof DASHA_EVENT_VARGAS[number];

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
  }));
}
