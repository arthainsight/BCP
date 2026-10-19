import type { ParayaBody } from './nadiParaya';
import type { ParayaHit } from './parayaHits';
import type { HitRelation } from '@/lib/transitHits';
import { pad2 } from '@/lib/dateFormat';

// What the Paraya tab shows of the progressions: the hits of the seven progressing grahas to the natal points, which of them to look at,
// the overview of the seven by the ten natal points, and the hits in months. Nothing here knows about screens.

/** The natal points a progression can hit, in the order of the overview: the nine grahas and the ascendant. */
export const PROGRESSION_NATAL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Asc'] as const;

export interface HitFilter {
  bodies: readonly ParayaBody[];
  relations: readonly HitRelation[];
  /** Only the hits of this progressing graha, or to this natal point: the cell of the overview that was chosen. */
  body?: ParayaBody | null;
  natal?: string | null;
}

/** The hits that pass the filter, in the order they came. */
export function filterHits(hits: readonly ParayaHit[], filter: HitFilter): ParayaHit[] {
  return hits.filter(hit =>
    filter.bodies.includes(hit.body)
    && filter.relations.includes(hit.relation)
    && (!filter.body || hit.body === filter.body)
    && (!filter.natal || hit.natal === filter.natal));
}

export interface OverviewCell {
  /** The first hit of the pair, and how many there are. */
  first: ParayaHit;
  count: number;
}

/** The overview: for each progressing graha and natal point with a hit, the first hit and the number of hits. Keyed `body|natal`. */
export function overviewOf(hits: readonly ParayaHit[]): Map<string, OverviewCell> {
  const cells = new Map<string, OverviewCell>();
  for (const hit of hits) {
    const key = `${hit.body}|${hit.natal}`;
    const cell = cells.get(key);
    if (!cell) cells.set(key, { first: hit, count: 1 });
    else {
      cell.count += 1;
      if (hit.time < cell.first.time) cell.first = hit;
    }
  }
  return cells;
}

/** The first hit of each progressing graha. */
export function nextHitOf(hits: readonly ParayaHit[]): Map<ParayaBody, ParayaHit> {
  const next = new Map<ParayaBody, ParayaHit>();
  for (const hit of hits) {
    const current = next.get(hit.body);
    if (!current || hit.time < current.time) next.set(hit.body, hit);
  }
  return next;
}

export interface MonthGroup {
  /** `2026-11`. */
  key: string;
  year: number;
  /** 0–11. */
  month: number;
  hits: ParayaHit[];
}

/** The hits in the order of time, in groups of the calendar month they fall in (local time). */
export function groupByMonth(hits: readonly ParayaHit[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const hit of [...hits].sort((a, b) => a.time - b.time)) {
    const date = new Date(hit.time);
    const key = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.hits.push(hit);
    else groups.push({ key, year: date.getFullYear(), month: date.getMonth(), hits: [hit] });
  }
  return groups;
}

/** 19.10.2026 */
export function formatHitDay(time: number): string {
  const date = new Date(time);
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** 19.10.26: the short date of a cell of the overview. */
export function formatHitDayShort(time: number): string {
  const date = new Date(time);
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${pad2(date.getFullYear() % 100)}`;
}

export interface ShownGroup extends MonthGroup {
  /** The hits of the group that are shown. */
  rows: ParayaHit[];
}

/** The first `max` hits of the groups, in order, and the groups that have any of them; `max` of null shows them all. */
export function limitGroups(groups: readonly MonthGroup[], max: number | null): ShownGroup[] {
  let left = max ?? Infinity;
  const shown: ShownGroup[] = [];
  for (const group of groups) {
    if (left <= 0) break;
    const rows = group.hits.slice(0, left);
    left -= rows.length;
    shown.push({ ...group, rows });
  }
  return shown;
}
