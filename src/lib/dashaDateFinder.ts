import type { DashaEventSnapshot } from './dashaEvents';

export interface DashaDateMatch {
  date: Date;
  snapshots: DashaEventSnapshot[];
}

export function snapshotMatches(snapshot: DashaEventSnapshot, filters: { md: string; ad: string; pd: string }): boolean {
  const value = (level: string) => snapshot.levels.find(item => item.level === level)?.value.toLocaleLowerCase() ?? '';
  return (filters.md.trim() === '' || value('MD').includes(filters.md.trim().toLocaleLowerCase()))
    && (filters.ad.trim() === '' || value('AD').includes(filters.ad.trim().toLocaleLowerCase()))
    && (filters.pd.trim() === '' || value('PD').includes(filters.pd.trim().toLocaleLowerCase()));
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
