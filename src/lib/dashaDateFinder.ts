import type { DashaEventSnapshot } from './dashaEvents';

export interface DashaDateMatch {
  date: Date;
  snapshots: DashaEventSnapshot[];
}

export interface DashaDateFilters { md: string; ad: string; pd: string; any: string; operator: 'and' | 'or'; }

export function snapshotMatches(snapshot: DashaEventSnapshot, filters: DashaDateFilters): boolean {
  const value = (level: string) => snapshot.levels.find(item => item.level === level)?.value.toLocaleLowerCase() ?? '';
  const conditions = [
    filters.md.trim() && value('MD').includes(filters.md.trim().toLocaleLowerCase()),
    filters.ad.trim() && value('AD').includes(filters.ad.trim().toLocaleLowerCase()),
    filters.pd.trim() && value('PD').includes(filters.pd.trim().toLocaleLowerCase()),
    filters.any.trim() && snapshot.levels.some(item => item.value.toLocaleLowerCase().includes(filters.any.trim().toLocaleLowerCase())),
  ].filter((item): item is boolean => typeof item === 'boolean');
  return conditions.length > 0 && (filters.operator === 'and' ? conditions.every(Boolean) : conditions.some(Boolean));
}

export function groupDailyMatches(matches: DashaDateMatch[]): { start: Date; end: Date; snapshots: DashaEventSnapshot[] }[] {
  const day = 24 * 60 * 60 * 1000;
  return matches.reduce<{ start: Date; end: Date; snapshots: DashaEventSnapshot[] }[]>((groups, match) => {
    const signature = match.snapshots.map(snapshot => `${snapshot.key}:${snapshot.levels.map(level => level.value).join('/')}`).join('|');
    const previous = groups.at(-1);
    const previousSignature = previous?.snapshots.map(snapshot => `${snapshot.key}:${snapshot.levels.map(level => level.value).join('/')}`).join('|');
    if (previous && match.date.getTime() - previous.end.getTime() === day && signature === previousSignature) previous.end = match.date;
    else groups.push({ start: match.date, end: match.date, snapshots: match.snapshots });
    return groups;
  }, []);
}
