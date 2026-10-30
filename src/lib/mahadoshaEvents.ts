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

/** The angle from `b` to `a` in degrees, wrapped to (−180, 180]. */
const signedAngle = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

/**
 * The stretches around the Sun entering a sign (Saṅkrānti): `solsticeDegrees` of the Sun's longitude before and after the
 * entry into Cancer and Capricorn (signs 3 and 9 of the zodiac the longitudes are in), `arcMinutes` before and after the
 * entry into the others. The longitudes are in the zodiac of the chart (the sidereal when the ayanamsa is, the tropical when
 * it is not): the entry is taken in the zodiac one uses.
 */
export async function sankrantiWindows(
  sunLongitude: (jd: number) => Promise<number>,
  fromJd: number,
  toJd: number,
  arcMinutes: number,
  solsticeDegrees: number,
): Promise<JdWindow[]> {
  const windows: JdWindow[] = [];
  // The Sun moves about a degree a day (0.95 at the slowest): the days a stretch of `degrees` takes, with a little over.
  const days = (degrees: number) => degrees / 0.95 + 0.5;
  for (const entry of await sankrantiMoments(sunLongitude, fromJd - days(solsticeDegrees), toJd + days(solsticeDegrees))) {
    const sign = Math.floor((await sunLongitude(entry + 0.01)) / 30) % 12;
    const boundary = sign * 30;
    const degrees = sign === 3 || sign === 9 ? solsticeDegrees : arcMinutes / 60;
    const reach = days(degrees);
    // The Sun is `degrees` short of the boundary at the start and `degrees` past it at the end.
    const startJd = await bisect(async jd => signedAngle(await sunLongitude(jd), boundary) >= -degrees, entry - reach, entry);
    const endJd = await bisect(async jd => signedAngle(await sunLongitude(jd), boundary) >= degrees, entry, entry + reach);
    windows.push({ startJd, endJd });
  }
  return windows;
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

/** The hours before and after the exact moment that the book gives for the time of Vyatipāta and Vaidhṛti that is most terrible (the mean apparent discs of the Sun and the Moon over the difference of their mean daily motions: 1.036 hours). */
export const VYATIPATA_SHORT_HOURS = 1.036;

/**
 * The Viṣanāḍī of a weekday (Vara Vishanadi): 4 nāḍīs from the nāḍī `start`, counted from sunrise in the weekday that lasts
 * to the next sunrise and has 60 nāḍīs.
 */
export function varaVishanadi(sunriseJd: number, nextSunriseJd: number, start: number, nadis = 4): JdWindow {
  const nadi = (nextSunriseJd - sunriseJd) / 60;
  return { startJd: sunriseJd + start * nadi, endJd: sunriseJd + (start + nadis) * nadi };
}

/**
 * The Ardhayāma of a weekday: multiply the number of the weekday (Sunday 1) by 3, divide by 8, add 1 to the remainder; the
 * eighth of the day (sunrise to sunset) with that number, and of the night (sunset to the next sunrise).
 */
export function ardhayama(weekday: number, sunriseJd: number, sunsetJd: number, nextSunriseJd: number): JdWindow[] {
  const part = (((weekday + 1) * 3) % 8) + 1;
  const eighth = (from: number, to: number): JdWindow => ({ startJd: from + ((part - 1) * (to - from)) / 8, endJd: from + (part * (to - from)) / 8 });
  return [eighth(sunriseJd, sunsetJd), eighth(sunsetJd, nextSunriseJd)];
}
