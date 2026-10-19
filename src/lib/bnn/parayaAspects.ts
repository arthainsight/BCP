import type { HitRelation } from '@/lib/transitHits';
import type { ParayaBody, ParayaPeriod } from './nadiParaya';

// Which progressing (Paraya) grahas aspect a natal point by sign, and when: a graha in the same sign as the natal point (1) or in its 5th, 7th or 9th
// sign aspects it, wherever in the sign it stands. Not the exact degree (that is the hits of the Paraya tab), the sign: the whole stay of the graha
// in such a sign. Nothing here knows about screens.

/** The relation of a graha's sign to a natal point's sign, 1, 5, 7 or 9; null when the graha does not aspect it. Signs are 0–11. */
export function aspectRelationOf(bodySign: number, natalSign: number): HitRelation | null {
  const difference = (((bodySign - natalSign) % 12) + 12) % 12;
  return difference === 0 ? 1 : difference === 4 ? 5 : difference === 6 ? 7 : difference === 8 ? 9 : null;
}

export interface AspectPeriod {
  body: ParayaBody;
  /** The natal point aspected. */
  natal: string;
  relation: HitRelation;
  /** In years of age; the start of the first stay is before birth for a graha that begins part of the way through it. */
  startAge: number;
  endAge: number;
}

/** The stays of a graha (its timeline) in which it aspects a natal point, with the relation of each. */
export function aspectPeriodsOf(
  stays: readonly ParayaPeriod[],
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
  aspects: { body: ParayaBody; relation: HitRelation }[];
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
  current: readonly ParayaPeriod[],
  natalSignIndex: number,
  relations: readonly HitRelation[],
): { body: ParayaBody; relation: HitRelation }[] {
  const aspects: { body: ParayaBody; relation: HitRelation }[] = [];
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
