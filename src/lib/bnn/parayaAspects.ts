import type { HitRelation } from '@/lib/transitHits';

// Which grahas aspect a natal point by sign, and when: a graha in the same sign as the natal point (1) or in its 5th, 7th or 9th sign aspects it,
// wherever in the sign it stands. Not the exact degree (that is the hits of the Paraya tab), the sign: the whole stay of the graha in such a sign.
// The grahas are the progressing (Paraya) ones, whose stays are laid out by age, or the transiting ones, whose stays come from the sky; both are
// stays on one axis, the age in years since birth. Nothing here knows about screens.

/** A graha's stay in one sign (signs are 0–11), from age `startAge` to `endAge` in years. */
export interface Stay {
  body: string;
  signIndex: number;
  /** The start of the first stay of a progressing graha that begins part of the way through it is before birth. */
  startAge: number;
  endAge: number;
}

/** The relation of a graha's sign to a natal point's sign, 1, 5, 7 or 9; null when the graha does not aspect it. Signs are 0–11. */
export function aspectRelationOf(bodySign: number, natalSign: number): HitRelation | null {
  const difference = (((bodySign - natalSign) % 12) + 12) % 12;
  return difference === 0 ? 1 : difference === 4 ? 5 : difference === 6 ? 7 : difference === 8 ? 9 : null;
}

export interface AspectPeriod {
  body: string;
  /** The natal point aspected. */
  natal: string;
  relation: HitRelation;
  /** In years of age; the start of the first stay is before birth for a graha that begins part of the way through it. */
  startAge: number;
  endAge: number;
}

/** The stays of a graha (its timeline) in which it aspects a natal point, with the relation of each. */
export function aspectPeriodsOf(
  stays: readonly Stay[],
  natal: { name: string; signIndex: number },
  relations: readonly HitRelation[],
): AspectPeriod[] {
  const periods: AspectPeriod[] = [];
  for (const stay of stays) {
    const relation = aspectRelationOf(stay.signIndex, natal.signIndex);
    if (relation && relations.includes(relation)) periods.push({ body: stay.body, natal: natal.name, relation, startAge: stay.startAge, endAge: stay.endAge });
  }
  return periods;
}

export interface Convergence {
  natal: string;
  startAge: number;
  endAge: number;
  /** The grahas that aspect the point through the whole time, each with its relation. */
  aspects: { body: string; relation: HitRelation }[];
}

/** Shorter than this (a few minutes) a stretch of time is the same moment seen by two grahas that change sign together, and is left out. */
const MIN_YEARS = 1e-6;

/**
 * The stretches of time in which at least `min` grahas aspect the same natal point together, from the aspect periods of that one point. A stretch
 * ends and the next begins whenever a graha comes or goes, so each has the same grahas throughout.
 */
export function convergencesOf(periods: readonly AspectPeriod[], min: number): Convergence[] {
  if (periods.length === 0 || min < 1) return [];
  const bounds = [...new Set(periods.flatMap(period => [period.startAge, period.endAge]))].sort((a, b) => a - b);
  const stretches: Convergence[] = [];
  for (let i = 0; i + 1 < bounds.length; i++) {
    const start = bounds[i];
    const end = bounds[i + 1];
    if (end - start < MIN_YEARS) continue;
    const middle = (start + end) / 2;
    const active = periods.filter(period => period.startAge <= middle && middle < period.endAge);
    if (active.length < min) continue;
    const aspects = active.map(period => ({ body: period.body, relation: period.relation }));
    const last = stretches[stretches.length - 1];
    const same = last && Math.abs(last.endAge - start) < MIN_YEARS
      && last.aspects.length === aspects.length
      && last.aspects.every(item => aspects.some(other => other.body === item.body && other.relation === item.relation));
    if (same) last.endAge = end;
    else stretches.push({ natal: active[0].natal, startAge: start, endAge: end, aspects });
  }
  return stretches;
}

/** The grahas that aspect a natal sign at one moment, from their current stays. */
export function aspectsAt(
  current: readonly Pick<Stay, 'body' | 'signIndex'>[],
  natalSignIndex: number,
  relations: readonly HitRelation[],
): { body: string; relation: HitRelation }[] {
  const aspects: { body: string; relation: HitRelation }[] = [];
  for (const stay of current) {
    const relation = aspectRelationOf(stay.signIndex, natalSignIndex);
    if (relation && relations.includes(relation)) aspects.push({ body: stay.body, relation });
  }
  return aspects;
}

/** The aspect periods and stretches that overlap an age range (touching it is not overlapping). */
export function overlapping<T extends { startAge: number; endAge: number }>(items: readonly T[], fromAge: number, toAge: number): T[] {
  return items.filter(item => item.endAge > fromAge && item.startAge < toAge);
}

export interface Grouped<T> {
  /** The natal points that share the row: those in the same sign have the same grahas aspecting them for the same time. */
  natals: string[];
  signIndex: number;
  item: T;
}

/**
 * Puts together the rows of natal points that stand in one sign: they are aspected by the same grahas at the same times, so a row for each of them
 * only repeats itself. The rows come in the order of the first of each group; the points in a group keep the order they came in.
 */
export function groupBySign<T extends { natal: string; startAge: number; endAge: number }>(
  items: readonly T[],
  signOf: (natal: string) => number,
  sameness: (item: T) => string,
): Grouped<T>[] {
  const groups = new Map<string, Grouped<T>>();
  for (const item of items) {
    const signIndex = signOf(item.natal);
    const key = `${signIndex}|${item.startAge}|${item.endAge}|${sameness(item)}`;
    const group = groups.get(key);
    if (group) group.natals.push(item.natal);
    else groups.set(key, { natals: [item.natal], signIndex, item });
  }
  return [...groups.values()];
}

/** The moment a graha stands at the exact degree of a natal point (in its own sign or in the 5th, 7th or 9th from it): a Paraya hit or a transit hit. */
export interface ExactHit {
  body: string;
  natal: string;
  relation: HitRelation;
  /** In ms since the epoch. */
  time: number;
  /** A transit crossing while the graha moves backwards. */
  retrograde?: boolean;
}

/** A moment is counted to a stretch when it falls within this much of it, so that a hit at the very edge of a stay is not lost to rounding. */
const EDGE_MS = 60 * 60 * 1000;

/**
 * The exact-degree hits that fall inside one stretch: by one of the grahas that aspect during it, to one of the natal points of the row, in the kind
 * of aspect it has. A stay of a graha in a sign gives one pass over each degree (a retrograde transit can give three), so this is when, inside the
 * stretch, the aspect becomes exact.
 */
export function hitsWithin(
  hits: readonly ExactHit[],
  stretch: { natals: readonly string[]; aspects: readonly { body: string; relation: HitRelation }[]; startTime: number; endTime: number },
): ExactHit[] {
  return hits
    .filter(hit => hit.time >= stretch.startTime - EDGE_MS && hit.time < stretch.endTime + EDGE_MS
      && stretch.natals.includes(hit.natal)
      && stretch.aspects.some(aspect => aspect.body === hit.body && aspect.relation === hit.relation))
    .sort((a, b) => a.time - b.time);
}

export interface StripRow {
  /** The natal points of one sign: the same grahas aspect them at the same times. */
  natals: string[];
  signIndex: number;
  /** The stretches in which at least one graha aspects them, with how many and which, clipped to the range. */
  segments: Convergence[];
}

/**
 * For the timeline: a row for each sign that holds natal points, with the stretches of the range and the grahas that aspect during each. The rows keep
 * the order of the natal points given; the stretches are cut at the edges of the range.
 */
export function stripRows(
  natal: readonly { name: string; signIndex: number }[],
  periodsByNatal: ReadonlyMap<string, readonly AspectPeriod[]>,
  fromAge: number,
  toAge: number,
): StripRow[] {
  const rows: StripRow[] = [];
  for (const point of natal) {
    const row = rows.find(item => item.signIndex === point.signIndex);
    if (row) {
      row.natals.push(point.name);
      continue;
    }
    const segments = overlapping(convergencesOf(periodsByNatal.get(point.name) ?? [], 1), fromAge, toAge)
      .map(segment => ({ ...segment, startAge: Math.max(segment.startAge, fromAge), endAge: Math.min(segment.endAge, toAge) }));
    rows.push({ natals: [point.name], signIndex: point.signIndex, segments });
  }
  return rows;
}
