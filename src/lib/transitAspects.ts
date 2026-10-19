import { findSignChanges } from './signChanges';
import type { Stay } from './bnn/parayaAspects';
import type { LongitudeSeries } from './transitHits';
import { JULIAN_YEAR_MS } from './time';
import { normalizeDegrees } from './angles';

// The stays of the transiting grahas in the signs, for the aspect view: from the sampled longitudes of a graha, the stretches of time it spends in one
// sign, on the same axis as the progressions (the age in years since birth). A retrograde graha that leaves a sign and comes back gives the sign two stays.

const signIndexOf = (longitude: number) => Math.floor(normalizeDegrees(longitude) / 30);

/** The stays of one graha through the sampled time, from the first sample to the last. */
export function transitStays(body: string, series: LongitudeSeries, birthTime: number): Stay[] {
  const { longitudes, start, step } = series;
  if (longitudes.length < 2) return [];
  const ageOf = (time: number) => (time - birthTime) / JULIAN_YEAR_MS;
  const end = start + (longitudes.length - 1) * step;
  const stays: Stay[] = [];
  let cursor = start;
  let signIndex = signIndexOf(longitudes[0]);
  for (const change of findSignChanges(body, series)) {
    stays.push({ body, signIndex, startAge: ageOf(cursor), endAge: ageOf(change.time) });
    cursor = change.time;
    signIndex = change.to - 1;
  }
  stays.push({ body, signIndex, startAge: ageOf(cursor), endAge: ageOf(end) });
  return stays;
}
