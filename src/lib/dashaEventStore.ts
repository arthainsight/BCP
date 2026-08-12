export const DASHA_EVENT_CATEGORIES = ['work', 'money', 'relationship', 'health', 'home', 'family', 'spiritual', 'other'] as const;
export const DASHA_EVENT_VARGAS = ['D1', 'D7', 'D9', 'D10', 'D12', 'D60'] as const;

export type DashaEventCategory = typeof DASHA_EVENT_CATEGORIES[number];
export type DashaEventVarga = typeof DASHA_EVENT_VARGAS[number];

export interface StoredDashaEvent {
  id: string;
  name: string;
  date: string;
  category: DashaEventCategory;
  varga: DashaEventVarga;
  notes: string;
  tags: string[];
  significance: number;
}

export const DASHA_EVENT_CATEGORY_LABELS: Record<DashaEventCategory, string> = {
  work: 'Work', money: 'Money', relationship: 'Relationship', health: 'Health', home: 'Home / move', family: 'Family', spiritual: 'Spiritual', other: 'Other',
};

const validCategory = (value: unknown): value is DashaEventCategory => DASHA_EVENT_CATEGORIES.includes(value as DashaEventCategory);
const validVarga = (value: unknown): value is DashaEventVarga => DASHA_EVENT_VARGAS.includes(value as DashaEventVarga);

export function parseStoredDashaEvents(raw: string | null): StoredDashaEvent[] {
  const parsed: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).id === 'string' && typeof (item as Record<string, unknown>).name === 'string' && typeof (item as Record<string, unknown>).date === 'string')).map(item => ({
    id: String(item.id),
    name: String(item.name),
    date: String(item.date),
    category: validCategory(item.category) ? item.category : 'other',
    varga: validVarga(item.varga) ? item.varga : 'D1',
    notes: String(item.notes ?? ''),
    tags: Array.isArray(item.tags) ? item.tags.map(String).map(tag => tag.trim()).filter(Boolean) : [],
    significance: Math.min(5, Math.max(1, Number(item.significance) || 3)),
  }));
}
