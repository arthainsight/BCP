// The Mahādoṣas that are a stretch of time around an event of the sky: the Saṅkrānti (the Sun at 0° of a sign), the
// eclipses, and the Vyatipāta and Vaidhṛti (the Sun and the Moon at the same distance from the equator, on the same side
// or on opposite sides). The events are found in a span of time, and the stretches to keep clear of are built from them.

import { SE_MOON, SE_SUN, sweCalcUt, sweCalcUtEquatorial, sweNextLunarEclipse, sweNextSolarEclipse } from './ephemerisAdapter';
import { MINUTE_JD } from './muhurtaFinder';

/** A stretch of Julian days (UT). */
export interface JdWindow {
  startJd: number;
  endJd: number;
}

/** The stretches put in order, those that touch or overlap made one. */
export function mergeWindows(windows: JdWindow[]): JdWindow[] {
  const sorted = [...windows].sort((a, b) => a.startJd - b.startJd);
  const merged: JdWindow[] = [];
  for (const window of sorted) {
    const last = merged[merged.length - 1];
    if (last && window.startJd <= last.endJd) last.endJd = Math.max(last.endJd, window.endJd);
    else merged.push({ ...window });
  }
  return merged;
}

/** Whether a Julian day is inside one of the (merged, ordered) stretches. */
export function insideWindows(windows: JdWindow[], jd: number): boolean {
  let low = 0;
  let high = windows.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (jd < windows[middle].startJd) high = middle - 1;
    else if (jd >= windows[middle].endJd) low = middle + 1;
    else return true;
  }
  return false;
}

/** The stretch from `before` days before an event to `after` days after it. */
export const aroundEvent = (jd: number, before: number, after: number): JdWindow => ({ startJd: jd - before, endJd: jd + after });

/**
 * The calendar days of the place: the day of the event with `daysBefore` days before it and `daysAfter` days after it,
 * from the local midnight that begins the first to the local midnight that ends the last. `offsetHours` is the clock's
 * offset from UT at the event.
 */
export function calendarDays(jd: number, offsetHours: number, daysBefore: number, daysAfter: number): JdWindow {
  // Julian days begin at noon; the local midnight that begins a date is at an x.5 minus the offset.
  const localDay = Math.floor(jd + 0.5 + offsetHours / 24);
  const midnight = localDay - 0.5 - offsetHours / 24;
  return { startJd: midnight - daysBefore, endJd: midnight + 1 + daysAfter };
}

/** The moment between `low` (where `isAfter` is false) and `high` (where it is true), to a minute, by halving. */
async function bisect(isAfter: (jd: number) => Promise<boolean>, low: number, high: number): Promise<number> {
  let a = low;
  let b = high;
  while (b - a > MINUTE_JD) {
    const middle = (a + b) / 2;
    if (await isAfter(middle)) b = middle; else a = middle;
  }
  return b;
}

/** The moments between `fromJd` and `toJd` when the sidereal Sun enters a sign, looked at every day. */
export async function sankrantiMoments(sunLongitude: (jd: number) => Promise<number>, fromJd: number, toJd: number): Promise<number[]> {
  const moments: number[] = [];
  let previousJd = fromJd;
  let previousSign = Math.floor((await sunLongitude(fromJd)) / 30);
  for (let jd = fromJd + 1; ; jd += 1) {
    const at = Math.min(jd, toJd);
    const sign = Math.floor((await sunLongitude(at)) / 30);
    if (sign !== previousSign) moments.push(await bisect(async moment => Math.floor((await sunLongitude(moment)) / 30) === sign, previousJd, at));
    previousSign = sign;
    previousJd = at;
    if (at >= toJd) break;
  }
  return moments;
}

/**
 * The moments when the Sun and the Moon are at the same distance from the equator on the same side (Vyatipāta) and on
 * opposite sides (Vaidhṛti), by the declinations of the ephemeris (the latitude of the Moon is in them), looked at every
 * 6 hours. The declinations are equal at the new Moon and the full Moon too, which are not these: a Vyatipāta is where the
 * longitudes of the two add up to 180° and a Vaidhṛti where they add up to 360°, to within `SUM_TOLERANCE` (the latitude of
 * the Moon moves the moment by up to a few hours, which is some degrees of the sum).
 */
export async function declinationEqualities(fromJd: number, toJd: number): Promise<{ vyatipata: number[]; vaidhriti: number[] }> {
  const difference = async (jd: number, sign: 1 | -1) => (await sweCalcUtEquatorial(jd, SE_SUN)).declination - sign * (await sweCalcUtEquatorial(jd, SE_MOON)).declination;
  /** How far the sum of the (tropical) longitudes is from `target` degrees, round the circle. */
  const sumOff = async (jd: number, target: number) => {
    const sum = ((await sweCalcUt(jd, SE_SUN)).longitude + (await sweCalcUt(jd, SE_MOON)).longitude) % 360;
    const off = Math.abs(sum - target) % 360;
    return Math.min(off, 360 - off);
  };
  const found = { vyatipata: [] as number[], vaidhriti: [] as number[] };
  // Vyatipāta: Sun − Moon = 0 with the sum 180°. Vaidhṛti: Sun + Moon = 0 with the sum 360°.
  for (const [key, sign, target] of [['vyatipata', 1, 180], ['vaidhriti', -1, 0]] as const) {
    let previousJd = fromJd;
    let previous = await difference(fromJd, sign);
    for (let jd = fromJd + 0.25; ; jd += 0.25) {
      const at = Math.min(jd, toJd);
      const value = await difference(at, sign);
      if (Math.sign(value) !== Math.sign(previous) && value !== 0) {
        const wasPositive = previous > 0;
        const moment = await bisect(async time => ((await difference(time, sign)) > 0) !== wasPositive, previousJd, at);
        if ((await sumOff(moment, target)) < SUM_TOLERANCE) found[key].push(moment);
      }
      previous = value;
      previousJd = at;
      if (at >= toJd) break;
    }
  }
  return found;
}

/** Degrees of the sum of the longitudes of the Sun and the Moon within which an equal declination is a Vyatipāta or a Vaidhṛti. */
const SUM_TOLERANCE = 30;

/** The moments of the maximum of the solar and the (visible) lunar eclipses between `fromJd` and `toJd`. */
export async function eclipseMoments(fromJd: number, toJd: number): Promise<{ solar: number[]; lunar: number[] }> {
  const collect = async (next: (jd: number) => Promise<number | null>) => {
    const moments: number[] = [];
    // The search goes forward from just before the span; an eclipse is at least a few months from the next of its kind.
    for (let from = fromJd; ;) {
      const found = await next(from);
      if (found === null || found > toJd) break;
      moments.push(found);
      from = found + 20;
    }
    return moments;
  };
  return { solar: await collect(sweNextSolarEclipse), lunar: await collect(sweNextLunarEclipse) };
}
