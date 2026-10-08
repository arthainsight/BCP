import type { ChartData } from '@/types';
import { RELATION_OFFSET, type HitRelation } from '@/lib/transitHits';
import { findParayaAgesForPosition, type ParayaBody } from './nadiParaya';

// When the Nāḍī Paraya grahas (Jupiter, Saturn, Rahu and Ketu, moved by age
// through the signs) reach a natal graha: the same degree in its own sign, or
// in its 5th or 9th sign. The Paraya positions follow the age, not the sky, so
// these dates are worked out from the age rather than from the ephemeris.

export const PARAYA_BODIES: ParayaBody[] = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
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
}): ParayaHit[] {
  const { chart, birthTime, fromTime, toTime, relations } = params;
  const jupiter = chart.planets.find(p => p.name === 'Jupiter');
  const saturn = chart.planets.find(p => p.name === 'Saturn');
  const rahu = chart.planets.find(p => p.name === 'Rahu');
  if (!jupiter || !saturn || !rahu) return [];

  const fromAge = Math.max(0, (fromTime - birthTime) / YEAR_MS);
  const toAge = (toTime - birthTime) / YEAR_MS;
  if (toAge <= fromAge) return [];

  const natal = [
    ...chart.planets.filter(p => NATAL_GRAHAS.includes(p.name)).map(p => ({ name: p.name, signIndex: p.sign - 1, degree: p.degree })),
    { name: 'Asc', signIndex: chart.ascendant.sign - 1, degree: chart.ascendant.degree },
  ];

  const hits: ParayaHit[] = [];
  for (const body of PARAYA_BODIES) {
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
          maxAge: Math.ceil(toAge) + 1,
        });
        for (const match of matches) {
          if (match.ageYears < fromAge || match.ageYears > toAge) continue;
          hits.push({ body, natal: point.name, relation, ageYears: match.ageYears, time: birthTime + match.ageYears * YEAR_MS });
        }
      }
    }
  }
  return hits.sort((a, b) => a.time - b.time);
}
