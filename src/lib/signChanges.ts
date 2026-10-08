// When a graha moves from one sign to the next.
//
// The positions come from the ephemeris as evenly spaced samples. A sign
// change is where two neighbouring samples lie in different signs; its moment
// is interpolated linearly between them. A retrograde graha can leave a sign
// backwards and cross the same boundary again, so one boundary can appear
// several times.

import type { LongitudeSeries } from './transitHits';

export interface SignChange {
  body: string;
  time: number;
  /** Sign left and sign entered, 1 = Aries … 12 = Pisces. */
  from: number;
  to: number;
  retrograde: boolean;
}

const signOf = (longitude: number) => Math.floor((((longitude % 360) + 360) % 360) / 30) + 1;

/** Signed angle from b to a, in (-180, 180]. */
function signedDistance(a: number, b: number): number {
  const d = ((a - b) % 360 + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

/** Sign changes of one series, in time order. */
export function findSignChanges(body: string, series: LongitudeSeries): SignChange[] {
  const changes: SignChange[] = [];
  const { longitudes, start, step } = series;
  for (let i = 0; i + 1 < longitudes.length; i++) {
    const a = longitudes[i];
    const b = longitudes[i + 1];
    const from = signOf(a);
    const to = signOf(b);
    if (from === to) continue;
    // Neighbouring signs only; a larger jump is a gap in the data.
    const forward = (to - from + 12) % 12 === 1;
    const backward = (from - to + 12) % 12 === 1;
    if (!forward && !backward) continue;
    const boundary = (forward ? to - 1 : from - 1) * 30;
    const d0 = signedDistance(a, boundary);
    const d1 = signedDistance(b, boundary);
    const fraction = d1 === d0 ? 0 : Math.min(1, Math.max(0, -d0 / (d1 - d0)));
    changes.push({ body, time: start + (i + fraction) * step, from, to, retrograde: backward });
  }
  return changes;
}

/** Sign changes of several bodies, in time order. */
export function findAllSignChanges(series: Record<string, LongitudeSeries>): SignChange[] {
  return Object.entries(series)
    .flatMap(([body, s]) => findSignChanges(body, s))
    .sort((a, b) => a.time - b.time);
}
