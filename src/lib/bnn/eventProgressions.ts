import type { ChartData } from '@/types';
import { PROGRESSION_RELATIONS, type HitRelation, type RelationsOf } from '@/lib/transitHits';
import { JULIAN_YEAR_MS } from '@/lib/time';
import { parayaPeriodsOf } from './bnnHouses';
import { aspectRelationOf } from './parayaAspects';
import type { ParayaBody, ParayaOptions } from './nadiParaya';
import { PROGRESSION_NATAL } from './parayaProgression';

// The progressions (Paraya) at a moment such as the day of an event: where each progressing graha stands, and which natal points it aspects by
// sign (the same sign, or the 5th, 7th or 9th from it), with how far from the natal degree it is.

/** Within this many degrees of the natal point's degree the aspect is counted as exact, as the hits are. */
export const EXACT_ORB = 1;

export interface EventAspect {
  natal: string;
  relation: HitRelation;
  /** How many degrees the graha stands from the degree of the natal point, within the sign. */
  orb: number;
  exact: boolean;
}

export interface EventProgression {
  body: ParayaBody;
  signIndex: number;
  degree: number;
  /** House from the natal ascendant, 1–12. */
  house: number;
  aspects: EventAspect[];
}

/** A directional Nāḍī relationship between two progressing grahas at an event. */
export interface ProgressedGrahaRelation {
  from: string;
  to: string;
  relation: HitRelation;
  /** Absolute difference between the two degrees within their signs. */
  orb: number;
  exact: boolean;
}

/** All directed 1st, 5th, 7th and 9th sign relationships among the progressing grahas themselves. */
export function progressedRelationsOf(progressions: readonly EventProgression[]): ProgressedGrahaRelation[] {
  const result: ProgressedGrahaRelation[] = [];
  for (const from of progressions) {
    for (const to of progressions) {
      if (from.body === to.body) continue;
      const distance = (to.signIndex - from.signIndex + 12) % 12;
      if (![0, 4, 6, 8].includes(distance)) continue;
      const relation = (distance + 1) as HitRelation;
      const orb = Math.abs(from.degree - to.degree);
      result.push({ from: from.body, to: to.body, relation, orb, exact: orb <= EXACT_ORB });
    }
  }
  return result.sort((a, b) => Number(b.exact) - Number(a.exact) || a.relation - b.relation || a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
}

/** A graha's place: its sign (0–11) and the degree within it. */
export interface GrahaPosition {
  body: string;
  signIndex: number;
  degree: number;
}

/**
 * What the places of some grahas mean for a chart: each one's house from the ascendant, and which natal points it aspects by sign (the same sign, or the 5th, 7th
 * or 9th from it, for the progressions; the transiting grahas have their own aspects, given in `relations`) with how far from the natal degree it stands. The grahas can
 * be the progressing ones or the transiting ones.
 */
export function describePositions(chart: ChartData, positions: readonly GrahaPosition[], relations: RelationsOf = PROGRESSION_RELATIONS): EventProgression[] {
  const natal = PROGRESSION_NATAL.flatMap(name => {
    const point = name === 'Asc' ? chart.ascendant : chart.planets.find(planet => planet.name === name);
    return point ? [{ name, signIndex: point.sign - 1, degree: point.degree }] : [];
  });
  return positions.map(position => ({
    body: position.body as ParayaBody,
    signIndex: position.signIndex,
    degree: position.degree,
    house: ((position.signIndex + 1 - chart.ascendant.sign + 12) % 12) + 1,
    aspects: natal.flatMap(point => {
      const relation = aspectRelationOf(position.signIndex, point.signIndex, relations, position.body);
      if (!relation) return [];
      const orb = Math.abs(position.degree - point.degree);
      return [{ natal: point.name, relation, orb, exact: orb <= EXACT_ORB }];
    }),
  }));
}

/** The progressing grahas at a moment, in the order Jupiter, Saturn, Rahu, Ketu (then Mars, Mercury, Venus); null before birth. */
export function progressionsAt(params: {
  chart: ChartData;
  birthTime: number;
  time: number;
  options?: ParayaOptions;
  bodies: readonly ParayaBody[];
}): EventProgression[] | null {
  const { chart, birthTime, time, options, bodies } = params;
  if (time < birthTime) return null;
  const ageYears = (time - birthTime) / JULIAN_YEAR_MS;
  return describePositions(chart, parayaPeriodsOf(chart, ageYears, options, true).filter(period => bodies.includes(period.body)));
}
