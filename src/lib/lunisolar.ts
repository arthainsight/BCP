// Shared lunisolar timing: Sun–Moon elongation, new moons, the amānta lunar
// month, the Sun's sidereal return, and the Vedic day reckoned from sunrise.
// Used by Tithi Praveśa, Tājika Varṣaphala and the Pañcāṅga.
//
// Everything here calls the ephemeris, so it runs on the server only.

import { SE_MOON, SE_SUN, sweCalcUt, sweGetAyanamsa, sweJulday } from './ephemerisAdapter';
import { applyAyanamsaOffset, resolveAyanamsaMode } from './ayanamsas';
import { normalizeDegrees } from './angles';
import { calculateSunTimes } from './sunTimes';

/** Mean synodic month in days. Only used to seed the root finders. */
export const SYNODIC_MONTH = 29.530588853;
/** Mean sidereal year in days. Only used to seed the root finders. */
export const SIDEREAL_YEAR = 365.256363;
/** Convergence tolerance for the root finders: about 0.1 s. */
const JD_TOLERANCE = 1e-6;

export async function elongationAt(jd: number): Promise<{ value: number; rate: number }> {
  const sun = await sweCalcUt(jd, SE_SUN);
  const moon = await sweCalcUt(jd, SE_MOON);
  return { value: normalizeDegrees(moon.longitude - sun.longitude), rate: moon.speed - sun.speed };
}

/** Signed difference a − b wrapped into [−180, 180). */
export function signedDelta(a: number, b: number): number {
  return normalizeDegrees(a - b + 180) - 180;
}

/**
 * Newton iteration for the instant near `guessJd` where Moon − Sun equals
 * `target`. The elongation grows by 10–15° a day and never stalls, so the
 * iteration converges to the nearest root from any guess within about a week.
 */
export async function findElongation(target: number, guessJd: number): Promise<number> {
  let jd = guessJd;
  for (let i = 0; i < 50; i++) {
    const { value, rate } = await elongationAt(jd);
    const step = signedDelta(value, target) / rate;
    jd -= step;
    if (Math.abs(step) < JD_TOLERANCE) return jd;
  }
  throw new Error('Elongation search did not converge');
}

/** The new moon at or before `jd`. */
export async function newMoonBefore(jd: number): Promise<number> {
  const { value } = await elongationAt(jd);
  let nm = await findElongation(0, jd - value / (360 / SYNODIC_MONTH));
  // The guess can land on the following new moon when the Moon moves fast.
  if (nm > jd) nm = await findElongation(0, nm - SYNODIC_MONTH);
  return nm;
}

export async function siderealSun(jd: number, ayanamsa: string, offset: number): Promise<number> {
  const mode = resolveAyanamsaMode(ayanamsa);
  const { longitude } = await sweCalcUt(jd, SE_SUN);
  if (mode === 'tropical') return normalizeDegrees(longitude);
  const ay = applyAyanamsaOffset(await sweGetAyanamsa(jd, mode), mode, offset);
  return normalizeDegrees(longitude - ay);
}

/** Sidereal sign index 0–11 of the Sun at `jd`. */
async function sunSign(jd: number, ayanamsa: string, offset: number): Promise<number> {
  return Math.floor((await siderealSun(jd, ayanamsa, offset)) / 30) % 12;
}

/**
 * Masa (0 = Chaitra) for an amānta month opening at new moon `nmJd`. Chaitra
 * opens with the Sun in Mīna (Pisces, sign index 11), so the month index is
 * one ahead of the Sun's sign.
 */
export async function masaOfNewMoon(nmJd: number, ayanamsa: string, offset: number): Promise<number> {
  return ((await sunSign(nmJd, ayanamsa, offset)) + 1) % 12;
}

/** Instant near `guessJd` when the Sun's sidereal longitude equals `target`. */
export async function findSolarLongitude(target: number, guessJd: number, ayanamsa: string, offset: number): Promise<number> {
  let jd = guessJd;
  for (let i = 0; i < 50; i++) {
    const lon = await siderealSun(jd, ayanamsa, offset);
    const { speed } = await sweCalcUt(jd, SE_SUN);
    const step = signedDelta(lon, target) / speed;
    jd -= step;
    if (Math.abs(step) < JD_TOLERANCE) return jd;
  }
  throw new Error('Solar return search did not converge');
}


/** Gregorian year containing `jd` (UT). */
export function yearOfJd(jd: number): number {
  // JD 2440587.5 is 1970-01-01T00:00Z.
  return new Date((jd - 2440587.5) * 86400000).getUTCFullYear();
}


/** Julian day (UT) from local civil date-time parts and a UTC offset in hours. */
export async function jdFromLocal(
  year: number, month: number, day: number, hour: number, minute: number, second: number, tzOffset: number,
): Promise<number> {
  return sweJulday(year, month, day, hour + minute / 60 + second / 3600 - tzOffset);
}

/** Local civil date-time parts for a Julian day (UT) at a UTC offset in hours. */
export function localPartsFromJd(jd: number, tzOffset: number) {
  // Round to the nearest second first so 59.9995 s never prints as 60.
  const ms = Math.round(((jd - 2440587.5) * 86400 + tzOffset * 3600)) * 1000;
  const d = new Date(ms);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
  };
}

const VARA_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const VARA_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
// Each horā passes to the next planet in descending orbital order.
const HORA_CYCLE = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];

export interface VedicDay {
  /** Weekday reckoned from sunrise, so a moment before sunrise belongs to the previous day. */
  vara: string;
  /** Lord of the vāra. In Tithi Praveśa this is the lord of the year. */
  varaLord: string;
  /** Lord of the horā (planetary hour) running at the moment. */
  horaLord: string;
  /** False when sunrise or sunset could not be found (polar day or night); the horā then assumes 06:00–18:00. */
  sunTimesFound: boolean;
}

/**
 * Vāra and horā for a moment. The Vedic day runs from sunrise to sunrise and
 * is divided into twelve day and twelve night horās of unequal length; the
 * first horā belongs to the lord of the day.
 */
export async function vedicDayAt(jd: number, latitude: number, longitude: number, tzOffset: number): Promise<VedicDay> {
  const local = localPartsFromJd(jd, tzOffset);
  const localHours = local.hour + local.minute / 60 + local.second / 3600;
  const midnight = await jdFromLocal(local.year, local.month, local.day, 0, 0, 0, tzOffset);
  let times = await calculateSunTimes(midnight, latitude, longitude);
  let hours = localHours;
  let weekday = new Date(Date.UTC(local.year, local.month - 1, local.day)).getUTCDay();

  // Before today's sunrise the previous Vedic day is still running.
  if (times.sunrise !== undefined && localHours < times.sunrise) {
    times = await calculateSunTimes(midnight - 1, latitude, longitude);
    hours = localHours + 24;
    weekday = (weekday + 6) % 7;
  }

  const sunTimesFound = times.sunrise !== undefined && times.sunset !== undefined && times.nextSunrise !== undefined;
  const sunrise = times.sunrise ?? 6;
  const sunset = times.sunset ?? 18;
  const nextSunrise = times.nextSunrise ?? 30;

  let horaIndex: number;
  if (hours < sunset) horaIndex = Math.floor(((hours - sunrise) / (sunset - sunrise)) * 12);
  else horaIndex = 12 + Math.floor(((hours - sunset) / (nextSunrise - sunset)) * 12);
  horaIndex = Math.max(0, Math.min(23, horaIndex));

  const varaLord = VARA_LORDS[weekday];
  const horaLord = HORA_CYCLE[(HORA_CYCLE.indexOf(varaLord) + horaIndex) % 7];
  return { vara: VARA_NAMES[weekday], varaLord, horaLord, sunTimesFound };
}

export interface LunarMonth {
  /** 0 = Chaitra … 11 = Phālguna. */
  masaIndex: number;
  /** True for an adhika (intercalary) month: no saṅkrānti falls inside it. */
  adhika: boolean;
  /** New moon opening the month (UT JD). */
  startJd: number;
  /** New moon closing the month (UT JD). */
  endJd: number;
}

/**
 * The amānta lunar month running at `jd`. It is named by the Sun's sidereal
 * sign at its opening new moon; when the closing new moon finds the Sun still
 * in the same sign, no saṅkrānti fell inside and the month is adhika.
 */
export async function lunarMonthAt(jd: number, ayanamsa = 'lahiri', offset = 0): Promise<LunarMonth> {
  const startJd = await newMoonBefore(jd);
  const endJd = await findElongation(0, startJd + SYNODIC_MONTH);
  const masaIndex = await masaOfNewMoon(startJd, ayanamsa, offset);
  const adhika = (await masaOfNewMoon(endJd, ayanamsa, offset)) === masaIndex;
  return { masaIndex, adhika, startJd, endJd };
}
