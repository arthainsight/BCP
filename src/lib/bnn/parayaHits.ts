import type { ChartData } from '@/types';
import { RELATION_OFFSET, type HitRelation } from '@/lib/transitHits';
import { findParayaAgesForPosition, PARAYA_BETA_BODIES, type ParayaBetaNatal, type ParayaBody, type ParayaOptions } from './nadiParaya';
import { JULIAN_YEAR_MS } from '../time';

// When the Nāḍī Paraya grahas (Jupiter, Saturn, Rahu and Ketu, and Mars, Mercury and Venus as beta, moved by age
// through the signs) reach a natal graha: the same degree in its own sign, or
// in its 5th or 9th sign. The Paraya positions follow the age, not the sky, so
// these dates are worked out from the age rather than from the ephemeris.

export const PARAYA_BODIES: ParayaBody[] = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];

/** The grahas whose natal positions the Paraya hits are counted to. */
const NATAL_GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

export interface ParayaHit {
  body: ParayaBody;
  natal: string;
  relation: HitRelation;
  ageYears: number;
  /** Moment of the hit, in ms since the epoch. */
  time: number;
}

/**
 * Paraya hits to the natal grahas and the ascendant between two moments, in
 * time order. `relations` picks the 1st (the point itself), 5th and 9th sign.
 */
export function findParayaHits(params: {
  chart: ChartData;
  birthTime: number;
  fromTime: number;
  toTime: number;
  relations: readonly HitRelation[];
  options?: ParayaOptions;
  /** The Paraya grahas to count: the four to begin with; Mars, Mercury and Venus (beta) when they are given. */
  bodies?: readonly ParayaBody[];
}): ParayaHit[] {
  const { chart, birthTime, fromTime, toTime, relations, options, bodies = PARAYA_BODIES } = params;
  const jupiter = chart.planets.find(p => p.name === 'Jupiter');
  const saturn = chart.planets.find(p => p.name === 'Saturn');
  const rahu = chart.planets.find(p => p.name === 'Rahu');
  if (!jupiter || !saturn || !rahu) return [];

  const fromAge = Math.max(0, (fromTime - birthTime) / JULIAN_YEAR_MS);
  const toAge = (toTime - birthTime) / JULIAN_YEAR_MS;
  if (toAge <= fromAge) return [];

  const natal = [
    ...chart.planets.filter(p => NATAL_GRAHAS.includes(p.name)).map(p => ({ name: p.name, signIndex: p.sign - 1, degree: p.degree })),
    { name: 'Asc', signIndex: chart.ascendant.sign - 1, degree: chart.ascendant.degree },
  ];

  const natalBeta: ParayaBetaNatal = {};
  for (const body of PARAYA_BETA_BODIES) {
    const planet = chart.planets.find(p => p.name === body);
    if (planet) natalBeta[body] = { signIndex: planet.sign - 1, degree: planet.degree, retrograde: Boolean(planet.isRetrograde) };
  }

  const hits: ParayaHit[] = [];
  for (const body of bodies) {
    for (const point of natal) {
      for (const relation of relations) {
        const signsOn = RELATION_OFFSET[relation] / 30;
        const matches = findParayaAgesForPosition({
          body,
          targetSignIndex: (point.signIndex + signsOn) % 12,
          degree: point.degree,
          natalJupiterSignIndex: jupiter.sign - 1,
          natalSaturnSignIndex: saturn.sign - 1,
          natalRahuSignIndex: rahu.sign - 1,
          jupiterRetrograde: Boolean(jupiter.isRetrograde),
          saturnRetrograde: Boolean(saturn.isRetrograde),
          natalBeta,
          maxAge: Math.ceil(toAge) + 1,
          options,
        });
        for (const match of matches) {
          if (match.ageYears < fromAge || match.ageYears > toAge) continue;
          hits.push({ body, natal: point.name, relation, ageYears: match.ageYears, time: birthTime + match.ageYears * JULIAN_YEAR_MS });
        }
      }
    }
  }
  return hits.sort((a, b) => a.time - b.time);
}
