import type { DashaEventSnapshot } from './dashaEvents';

export interface DashaPatternRecord {
  eventId: string;
  category: string;
  snapshot: DashaEventSnapshot;
}

export interface DashaEventPattern {
  key: string;
  dasha: string;
  level: string;
  value: string;
  count: number;
  eventIds: string[];
}

export function analyzeDashaEventPatterns(records: DashaPatternRecord[], category = 'all'): DashaEventPattern[] {
  const patterns = new Map<string, DashaEventPattern>();
  for (const record of records) {
    if (category !== 'all' && record.category !== category) continue;
    for (const level of record.snapshot.levels) {
      const key = `${record.snapshot.key}|${level.level}|${level.value}`;
      const existing = patterns.get(key) ?? { key, dasha: record.snapshot.label, level: level.level, value: level.value, count: 0, eventIds: [] };
      if (!existing.eventIds.includes(record.eventId)) {
        existing.eventIds.push(record.eventId);
        existing.count = existing.eventIds.length;
      }
      patterns.set(key, existing);
    }
  }
  return [...patterns.values()].filter(pattern => pattern.count >= 2).sort((a, b) => b.count - a.count || a.dasha.localeCompare(b.dasha) || a.level.localeCompare(b.level));
}
