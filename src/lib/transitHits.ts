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

export interface TransitHit {
  transit: string;
  natal: string;
  time: number;
  retrograde: boolean;
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

/** All crossings of every transiting body over every natal point, in time order. */
export function findTransitHits(series: Record<string, LongitudeSeries>, natal: NatalPoint[]): TransitHit[] {
  const hits: TransitHit[] = [];
  for (const [transit, s] of Object.entries(series)) {
    for (const point of natal) {
      for (const crossing of findCrossings(s, point.longitude)) {
        hits.push({ transit, natal: point.name, ...crossing });
      }
    }
  }
  return hits.sort((a, b) => a.time - b.time);
}
