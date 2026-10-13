import type { DashaEventCategory, DashaEventVarga, StoredDashaEvent } from './dashaEventStore';

/** What is done to many events at once. Only what is given changes. */
export interface BulkChange {
  category?: DashaEventCategory;
  varga?: DashaEventVarga;
  significance?: number;
  addTags?: string[];
  removeTags?: string[];
  /** Make them single days again. */
  clearEnd?: boolean;
}

/** The tags typed in a box, separated by commas or semicolons. */
export function parseTagInput(text: string): string[] {
  const seen = new Set<string>();
  return text.split(/[;,]/).map(tag => tag.trim()).filter(tag => {
    const key = tag.toLocaleLowerCase();
    if (!tag || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

/** In date order; events of the same day keep the order they were in. */
export function sortEvents(events: StoredDashaEvent[]): StoredDashaEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

export function applyBulkChange(events: StoredDashaEvent[], ids: ReadonlySet<string>, change: BulkChange): StoredDashaEvent[] {
  const remove = new Set((change.removeTags ?? []).map(tag => tag.toLocaleLowerCase()));
  return events.map(item => {
    if (!ids.has(item.id)) return item;
    const next: StoredDashaEvent = { ...item };
    if (change.category) next.category = change.category;
    if (change.varga) next.varga = change.varga;
    if (change.significance !== undefined) next.significance = Math.min(5, Math.max(1, Math.round(change.significance)));
    if (change.clearEnd) delete next.endDate;
    if (remove.size) next.tags = next.tags.filter(tag => !remove.has(tag.toLocaleLowerCase()));
    if (change.addTags?.length) {
      const have = new Set(next.tags.map(tag => tag.toLocaleLowerCase()));
      next.tags = [...next.tags, ...change.addTags.filter(tag => !have.has(tag.toLocaleLowerCase()))];
    }
    return next;
  });
}

export function removeEvents(events: StoredDashaEvent[], ids: ReadonlySet<string>): StoredDashaEvent[] {
  return events.filter(item => !ids.has(item.id));
}

/** How many of the events there are in each year, for the headings of a list grouped by year. */
export function countByYear(events: StoredDashaEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of events) counts.set(item.date.slice(0, 4), (counts.get(item.date.slice(0, 4)) ?? 0) + 1);
  return counts;
}
