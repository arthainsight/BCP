// When slow transiting grahas cross natal points.
//
// The positions come from the ephemeris as one sample a day. Between two
// samples a body moves at most a few arc-minutes, so a crossing is found where
// the signed distance to the natal point changes sign, and its moment is
// interpolated linearly. A retrograde loop gives the classic three passes.

export interface LongitudeSeries {
  /** Time of the first sample, in ms since the epoch. */
  start: number;
  /** Time between samples, in ms. */
  step: number;
  /** Sidereal longitudes, one per sample. */
  longitudes: number[];
}

export interface NatalPoint {
  name: string;
  longitude: number;
}

/**
 * For the progressions, which house from the natal point the graha stands in: 1 is the point itself, 5 and 9 are its trines, 7 is the opposite sign. For the transits,
 * where each graha has aspects of its own, which house from the graha the natal point is: Saturn aspects the 3rd, 7th and 10th from itself, Mars the 4th, 7th and 8th
 * (and every graha the 1st, the sign it stands in).
 */
export type HitRelation = 1 | 3 | 4 | 5 | 7 | 8 | 9 | 10;

/** Degrees ahead of the natal point, in the zodiac: the 3rd sign is 60° on, the 4th 90°, the 5th 120°, the 7th 180°, the 8th 210°, the 9th 240°, the 10th 270°. */
export const RELATION_OFFSET: Record<HitRelation, number> = { 1: 0, 3: 60, 4: 90, 5: 120, 7: 180, 8: 210, 9: 240, 10: 270 };

/** The relation that a graha in a sign has to a natal point when it is this many signs on from it (0–11), where it has one. */
export const RELATION_AT_SIGNS_ON: Partial<Record<number, HitRelation>> = { 0: 1, 2: 3, 3: 4, 4: 5, 6: 7, 7: 8, 8: 9, 9: 10 };

/** The aspects of each graha by its own rule, counted from the graha: the natal point is the 3rd, 7th or 10th house from Saturn that aspects it. */
export type OwnAspects = (body: string) => readonly HitRelation[];

/**
 * The relations to look at: one list for every graha, counted from the natal point (the progressions, to which the Nāḍī method gives every graha the same), or a function
 * that gives each graha its own, counted from the graha (the transits).
 */
export type RelationsOf = readonly HitRelation[] | OwnAspects;

export const relationsOfBody = (relations: RelationsOf, body: string): readonly HitRelation[] => (typeof relations === 'function' ? relations(body) : relations);

/** The hits of the transits and of the Paraya hits of Transit Hits: the point itself and its trines. */
export const HIT_RELATIONS: readonly HitRelation[] = [1, 5, 9];

/** The hits of the progressions (the Paraya tab): the point itself, its trines and the opposite sign. The Nāḍī method gives every graha these. */
export const PROGRESSION_RELATIONS: readonly HitRelation[] = [1, 5, 7, 9];

/**
 * The aspects of the transiting grahas, each by its own: the point itself (the graha over it, in the same sign) and the signs it aspects. Saturn the 3rd, 7th and 10th,
 * Jupiter the 5th, 7th and 9th, Mars the 4th, 7th and 8th, Rahu and Ketu the 5th and 9th; the Sun, the Moon, Mercury and Venus the 7th only.
 */
export const TRANSIT_ASPECTS: Readonly<Record<string, readonly HitRelation[]>> = {
  Sun: [1, 7], Moon: [1, 7], Mercury: [1, 7], Venus: [1, 7],
  Mars: [1, 4, 7, 8],
  Jupiter: [1, 5, 7, 9],
  Saturn: [1, 3, 7, 10],
  Rahu: [1, 5, 9],
  Ketu: [1, 5, 9],
};

/** Every relation some transiting graha has, in order. */
export const TRANSIT_RELATIONS: readonly HitRelation[] = [1, 3, 4, 5, 7, 8, 9, 10];

/** The aspects of a transiting graha (a graha that is not known aspects the 7th only). */
export const transitRelationsOf = (body: string): readonly HitRelation[] => TRANSIT_ASPECTS[body] ?? [1, 7];

export interface TransitHit {
  transit: string;
  natal: string;
  time: number;
  retrograde: boolean;
  relation: HitRelation;
}

/** Signed angle from b to a, in (-180, 180]. */
function signedDistance(a: number, b: number): number {
  const d = ((a - b) % 360 + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

/** Moments at which the series passes the target longitude, with the direction of motion. */
export function findCrossings(series: LongitudeSeries, target: number): { time: number; retrograde: boolean }[] {
  const hits: { time: number; retrograde: boolean }[] = [];
  const { longitudes, start, step } = series;
  for (let i = 0; i + 1 < longitudes.length; i++) {
    const d0 = signedDistance(longitudes[i], target);
    const d1 = signedDistance(longitudes[i + 1], target);
    // A jump of half the circle is the far side of the zodiac, not a crossing.
    if (Math.abs(d1 - d0) > 90) continue;
    const crosses = (d0 < 0 && d1 >= 0) || (d0 > 0 && d1 <= 0);
    if (!crosses) continue;
    // Landing exactly on the point is counted at the sample that reaches it.
    const fraction = d1 === d0 ? 0 : -d0 / (d1 - d0);
    hits.push({ time: start + (i + fraction) * step, retrograde: d1 < d0 });
  }
  return hits;
}

/**
 * All crossings of every transiting body over every natal point, and with
 * `relations` (the same for every body, or of each body by name) over the same
 * degree in the signs it aspects too, in time order.
 */
export function findTransitHits(
  series: Record<string, LongitudeSeries>,
  natal: NatalPoint[],
  relations: RelationsOf = [1],
): TransitHit[] {
  const hits: TransitHit[] = [];
  for (const [transit, s] of Object.entries(series)) {
    for (const point of natal) {
      for (const relation of relationsOfBody(relations, transit)) {
        // A graha's own aspects reach forward from it, so it stands that far behind the point; the relations of the progressions are the house of the graha from the point.
        const offset = RELATION_OFFSET[relation];
        const target = (typeof relations === 'function' ? point.longitude - offset + 360 : point.longitude + offset) % 360;
        for (const crossing of findCrossings(s, target)) {
          hits.push({ transit, natal: point.name, relation, ...crossing });
        }
      }
    }
  }
  return hits.sort((a, b) => a.time - b.time);
}
