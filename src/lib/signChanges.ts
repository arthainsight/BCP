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

export interface Station {
  body: string;
  time: number;
  /** The direction the graha turns into. */
  turnsTo: 'retrograde' | 'direct';
  /** Sign the graha is in at the turn, 1 = Aries … 12 = Pisces. */
  sign: number;
}

/**
 * Moments a graha turns retrograde or direct: where its motion between two
 * samples changes sign. The moment is interpolated between the midpoints of
 * the two steps, where the motion is measured.
 */
export function findStations(body: string, series: LongitudeSeries): Station[] {
  const stations: Station[] = [];
  const { longitudes, start, step } = series;
  const motion = longitudes.slice(1).map((lon, i) => signedDistance(lon, longitudes[i]));
  for (let i = 1; i < motion.length; i++) {
    const before = motion[i - 1];
    const after = motion[i];
    const toRetrograde = before > 0 && after <= 0;
    const toDirect = before < 0 && after >= 0;
    if (!toRetrograde && !toDirect) continue;
    const fraction = before / (before - after);
    stations.push({
      body,
      time: start + (i - 0.5 + fraction) * step,
      turnsTo: toRetrograde ? 'retrograde' : 'direct',
      sign: signOf(longitudes[i]),
    });
  }
  return stations;
}

export interface CombustChange {
  body: string;
  time: number;
  /** True when the graha comes within the orb of the Sun, false when it leaves it. */
  combust: boolean;
}

/** Classical combustion orbs in degrees, narrower while the graha is retrograde. */
export const COMBUST_ORBS: Record<string, { direct: number; retrograde: number }> = {
  Mercury: { direct: 14, retrograde: 12 },
  Venus: { direct: 10, retrograde: 8 },
};

/** Moments a graha enters or leaves combustion. Both series must share start, step and length. */
export function findCombustion(
  body: string,
  series: LongitudeSeries,
  sun: LongitudeSeries,
  orbs = COMBUST_ORBS[body],
): CombustChange[] {
  if (!orbs) return [];
  const { longitudes, start, step } = series;
  // Distance to the Sun less the orb: negative while combust.
  const margin = longitudes.map((lon, i) => {
    const next = longitudes[i + 1] ?? lon;
    const retrograde = i + 1 < longitudes.length ? signedDistance(next, lon) < 0 : signedDistance(lon, longitudes[i - 1] ?? lon) < 0;
    return Math.abs(signedDistance(lon, sun.longitudes[i])) - (retrograde ? orbs.retrograde : orbs.direct);
  });
  const changes: CombustChange[] = [];
  for (let i = 0; i + 1 < margin.length; i++) {
    const was = margin[i] < 0;
    const now = margin[i + 1] < 0;
    if (was === now) continue;
    const fraction = margin[i] / (margin[i] - margin[i + 1]);
    changes.push({ body, time: start + (i + fraction) * step, combust: now });
  }
  return changes;
}

/** Grahas that turn retrograde; the Sun, Moon and the mean nodes do not (or always are). */
export const STATION_BODIES = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

export type TimingEvent =
  | ({ kind: 'sign' } & SignChange)
  | ({ kind: 'station' } & Station)
  | ({ kind: 'combust' } & CombustChange);

/**
 * Sign changes of the chosen grahas, and with `stations` their stations and the
 * combustion of Mercury and Venus, in time order. Combustion needs the Sun's series.
 */
export function collectTimingEvents(
  series: Record<string, LongitudeSeries>,
  bodies: readonly string[],
  stations: boolean,
): TimingEvent[] {
  const all: TimingEvent[] = [];
  for (const body of bodies) {
    if (!series[body]) continue;
    all.push(...findSignChanges(body, series[body]).map(c => ({ kind: 'sign' as const, ...c })));
    if (!stations) continue;
    if (STATION_BODIES.includes(body)) all.push(...findStations(body, series[body]).map(c => ({ kind: 'station' as const, ...c })));
    if (body in COMBUST_ORBS && series.Sun) all.push(...findCombustion(body, series[body], series.Sun).map(c => ({ kind: 'combust' as const, ...c })));
  }
  return all.sort((a, b) => a.time - b.time);
}
