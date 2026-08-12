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
  kind: 'level' | 'combination' | 'ruler';
  sampleSize: number;
  support: number;
  confidence: 'low sample' | 'indicative' | 'strong';
}

const SIGN_LORDS: Record<string, string> = { ar: 'Mars', ta: 'Venus', ge: 'Mercury', cn: 'Moon', le: 'Sun', vi: 'Mercury', li: 'Venus', sc: 'Mars', sg: 'Jupiter', cp: 'Saturn', aq: 'Saturn', pi: 'Jupiter' };

export function analyzeDashaEventPatterns(records: DashaPatternRecord[], category = 'all'): DashaEventPattern[] {
  const patterns = new Map<string, DashaEventPattern>();
  const filtered = records.filter(record => category === 'all' || record.category === category);
  const sampleSize = new Set(filtered.map(record => record.eventId)).size;
  for (const record of filtered) {
    const candidates: { level: string; value: string; kind: DashaEventPattern['kind'] }[] = record.snapshot.levels.map(level => ({ ...level, kind: 'level' }));
    for (let length = 2; length <= record.snapshot.levels.length; length++) {
      const levels = record.snapshot.levels.slice(0, length);
      candidates.push({ level: levels.map(item => item.level).join(' + '), value: levels.map(item => item.value).join(' › '), kind: 'combination' });
    }
    for (const level of record.snapshot.levels) {
      const lord = SIGN_LORDS[level.value.toLocaleLowerCase()];
      if (lord) candidates.push({ level: `${level.level} ruler`, value: lord, kind: 'ruler' });
    }
    for (const candidate of candidates) {
      const key = `${record.snapshot.key}|${candidate.kind}|${candidate.level}|${candidate.value}`;
      const existing = patterns.get(key) ?? { key, dasha: record.snapshot.label, level: candidate.level, value: candidate.value, count: 0, eventIds: [], kind: candidate.kind, sampleSize, support: 0, confidence: 'low sample' };
      if (!existing.eventIds.includes(record.eventId)) {
        existing.eventIds.push(record.eventId);
        existing.count = existing.eventIds.length;
      }
      patterns.set(key, existing);
    }
  }
  return [...patterns.values()].map(pattern => {
    const support = sampleSize ? pattern.count / sampleSize : 0;
    return { ...pattern, sampleSize, support, confidence: sampleSize < 5 ? 'low sample' as const : pattern.count >= 5 && support >= 0.5 ? 'strong' as const : 'indicative' as const };
  }).filter(pattern => pattern.count >= 2).sort((a, b) => b.count - a.count || b.support - a.support || a.dasha.localeCompare(b.dasha) || a.level.localeCompare(b.level));
}
