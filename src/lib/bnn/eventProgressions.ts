import type { ChartData } from '@/types';
import type { HitRelation } from '@/lib/transitHits';
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
  const natal = PROGRESSION_NATAL.flatMap(name => {
    const point = name === 'Asc' ? chart.ascendant : chart.planets.find(planet => planet.name === name);
    return point ? [{ name, signIndex: point.sign - 1, degree: point.degree }] : [];
  });
  const ageYears = (time - birthTime) / JULIAN_YEAR_MS;
  return parayaPeriodsOf(chart, ageYears, options, true)
    .filter(period => bodies.includes(period.body))
    .map(period => ({
      body: period.body,
      signIndex: period.signIndex,
      degree: period.degree,
      house: ((period.signIndex + 1 - chart.ascendant.sign + 12) % 12) + 1,
      aspects: natal.flatMap(point => {
        const relation = aspectRelationOf(period.signIndex, point.signIndex);
        if (!relation) return [];
        const orb = Math.abs(period.degree - point.degree);
        return [{ natal: point.name, relation, orb, exact: orb <= EXACT_ORB }];
      }),
    }));
}
