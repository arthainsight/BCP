// Tithi Praveśa — the Vedic annual chart.
//
// The year begins at the moment the Moon stands at exactly the same angular
// distance from the Sun as it did at birth (the same tithi, to the arc-second),
// within the same lunar month as birth. It is the lunar counterpart of the
// solar return: the solar return repeats the Sun's longitude, Tithi Praveśa
// repeats the Sun–Moon relationship.
//
// Two ways of choosing which of the year's twelve or thirteen repetitions
// counts are offered:
//
// - 'lunar-month' (default, after Sanjay Rath and P.V.R. Narasimha Rao): the
//   repetition inside the amānta lunar month that bears the same name as the
//   birth month. A month is named by the sidereal sign the Sun occupies at the
//   new moon that opens it, so the month stays tied to the solar year. When two
//   consecutive new moons fall with the Sun in the same sign (an adhika year),
//   the second, nija month is taken, which is also the month a birth in an
//   adhika month celebrates.
//
// - 'solar-return': the repetition nearest the moment the Sun returns to its
//   natal sidereal longitude. Simpler, and always within about fifteen days of
//   the solar return.
//
// The Sun–Moon elongation is independent of the ayanamsa, so the moment itself
// does not depend on it. The ayanamsa only matters for naming the lunar month.

import { SE_MOON, SE_SUN, sweCalcUt, sweGetAyanamsa, sweJulday } from './ephemerisAdapter';
import { applyAyanamsaOffset, resolveAyanamsaMode } from './ayanamsas';
import { normalizeDegrees } from './angles';
import { calculateSunTimes } from './sunTimes';

export type TithiPravesaMethod = 'lunar-month' | 'solar-return';

/** Mean synodic month in days. Only used to seed the root finders. */
const SYNODIC_MONTH = 29.530588853;
/** Mean sidereal year in days. Only used to seed the root finders. */
const SIDEREAL_YEAR = 365.256363;
/** Convergence tolerance for the root finders: about 0.1 s. */
const JD_TOLERANCE = 1e-6;

export interface TithiPravesaInput {
  /** Julian day (UT) of birth. */
  birthJd: number;
  /** Gregorian year whose Tithi Praveśa is wanted. */
  year: number;
  method?: TithiPravesaMethod;
  ayanamsa?: string;
  ayanamsaOffsetDegrees?: number;
}

export interface TithiPravesaResult {
  /** Julian day (UT) of the Tithi Praveśa moment. */
  jd: number;
  year: number;
  method: TithiPravesaMethod;
  /** Moon − Sun at birth, degrees in [0, 360). */
  natalElongation: number;
  /** Moon − Sun at the returned moment; equals natalElongation to within ~0.01″. */
  elongation: number;
  /** Tithi index 0–29 (0 = Śukla Pratipadā, 15 = Kṛṣṇa Pratipadā). */
  tithiIndex: number;
  /** Lunar month index 0–11 (0 = Chaitra), the birth month. */
  masaIndex: number;
  /** True when the birth itself fell in an adhika (intercalary) month. */
  birthInAdhikaMasa: boolean;
  /** Start of the lunar month in which the Tithi Praveśa falls (UT JD). Only for 'lunar-month'. */
  monthStartJd?: number;
}

async function elongationAt(jd: number): Promise<{ value: number; rate: number }> {
  const sun = await sweCalcUt(jd, SE_SUN);
  const moon = await sweCalcUt(jd, SE_MOON);
  return { value: normalizeDegrees(moon.longitude - sun.longitude), rate: moon.speed - sun.speed };
}

/** Signed difference a − b wrapped into [−180, 180). */
function signedDelta(a: number, b: number): number {
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
  throw new Error('Tithi Praveśa: elongation search did not converge');
}

/** The new moon at or before `jd`. */
export async function newMoonBefore(jd: number): Promise<number> {
  const { value } = await elongationAt(jd);
  let nm = await findElongation(0, jd - value / (360 / SYNODIC_MONTH));
  // The guess can land on the following new moon when the Moon moves fast.
  if (nm > jd) nm = await findElongation(0, nm - SYNODIC_MONTH);
  return nm;
}

async function siderealSun(jd: number, ayanamsa: string, offset: number): Promise<number> {
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
async function masaOfNewMoon(nmJd: number, ayanamsa: string, offset: number): Promise<number> {
  return ((await sunSign(nmJd, ayanamsa, offset)) + 1) % 12;
}

/** Instant near `guessJd` when the Sun's sidereal longitude equals `target`. */
async function findSolarLongitude(target: number, guessJd: number, ayanamsa: string, offset: number): Promise<number> {
  let jd = guessJd;
  for (let i = 0; i < 50; i++) {
    const lon = await siderealSun(jd, ayanamsa, offset);
    const { speed } = await sweCalcUt(jd, SE_SUN);
    const step = signedDelta(lon, target) / speed;
    jd -= step;
    if (Math.abs(step) < JD_TOLERANCE) return jd;
  }
  throw new Error('Tithi Praveśa: solar return search did not converge');
}

/** Julian day (UT) of the given year's anniversary of the birth date and time. */
function anniversaryJd(birthJd: number, year: number): number {
  return birthJd + (year - yearOfJd(birthJd)) * SIDEREAL_YEAR;
}

/** Gregorian year containing `jd` (UT). */
export function yearOfJd(jd: number): number {
  // JD 2440587.5 is 1970-01-01T00:00Z.
  return new Date((jd - 2440587.5) * 86400000).getUTCFullYear();
}

export async function calculateTithiPravesa(input: TithiPravesaInput): Promise<TithiPravesaResult> {
  const { birthJd, year } = input;
  const method = input.method ?? 'lunar-month';
  const ayanamsa = input.ayanamsa ?? 'lahiri';
  const offset = input.ayanamsaOffsetDegrees ?? 0;

  const natal = await elongationAt(birthJd);
  const natalElongation = natal.value;
  const tithiIndex = Math.floor(natalElongation / 12);

  const birthNm = await newMoonBefore(birthJd);
  const nextNm = await findElongation(0, birthNm + SYNODIC_MONTH);
  const birthMasa = await masaOfNewMoon(birthNm, ayanamsa, offset);
  const birthInAdhikaMasa = (await masaOfNewMoon(nextNm, ayanamsa, offset)) === birthMasa;

  const anniversary = anniversaryJd(birthJd, year);

  if (method === 'solar-return') {
    const natalSun = await siderealSun(birthJd, ayanamsa, offset);
    const solarReturn = await findSolarLongitude(natalSun, anniversary, ayanamsa, offset);
    const { value } = await elongationAt(solarReturn);
    const guess = solarReturn + signedDelta(natalElongation, value) / (360 / SYNODIC_MONTH);
    const jd = await findElongation(natalElongation, guess);
    return {
      jd, year, method, natalElongation,
      elongation: (await elongationAt(jd)).value,
      tithiIndex, masaIndex: birthMasa, birthInAdhikaMasa,
    };
  }

  // Walk the new moons around the anniversary and keep those that open a month
  // with the birth month's name. Three months either side always contains it:
  // the month drifts at most about a month from the Gregorian anniversary.
  const start = await newMoonBefore(anniversary - 3 * SYNODIC_MONTH);
  const matches: number[] = [];
  let nm = start;
  for (let i = 0; i < 8; i++) {
    if ((await masaOfNewMoon(nm, ayanamsa, offset)) === birthMasa) matches.push(nm);
    nm = await findElongation(0, nm + SYNODIC_MONTH);
  }
  if (matches.length === 0) throw new Error('Tithi Praveśa: no lunar month matched the birth month');

  // Matches either stand alone or come as an adhika–nija pair; group them by
  // month so the nija of each pair is taken, then pick the group nearest the
  // anniversary.
  const groups: number[][] = [];
  for (const m of matches) {
    const last = groups[groups.length - 1];
    if (last && m - last[last.length - 1] < SYNODIC_MONTH * 1.5) last.push(m);
    else groups.push([m]);
  }
  const monthStartJd = groups
    .map((g) => g[g.length - 1])
    .reduce((best, m) => (Math.abs(m - anniversary) < Math.abs(best - anniversary) ? m : best));

  const jd = await findElongation(natalElongation, monthStartJd + natalElongation / (360 / SYNODIC_MONTH));
  return {
    jd, year, method, natalElongation,
    elongation: (await elongationAt(jd)).value,
    tithiIndex, masaIndex: birthMasa, birthInAdhikaMasa, monthStartJd,
  };
}

/**
 * The Tithi Praveśa year in force at `targetJd`: the latest Tithi Praveśa at
 * or before it, together with the next one, which closes the year.
 */
export async function tithiPravesaYearAt(
  input: Omit<TithiPravesaInput, 'year'> & { targetJd: number },
): Promise<{ current: TithiPravesaResult; next: TithiPravesaResult }> {
  // A birthday near New Year can put a year's Tithi Praveśa in the neighbouring
  // Gregorian year, so step in whichever direction is needed rather than
  // trusting the calendar year of the target.
  let current = await calculateTithiPravesa({ ...input, year: yearOfJd(input.targetJd) });
  while (current.jd > input.targetJd) {
    current = await calculateTithiPravesa({ ...input, year: current.year - 1 });
  }
  let next = await calculateTithiPravesa({ ...input, year: current.year + 1 });
  while (next.jd <= input.targetJd) {
    current = next;
    next = await calculateTithiPravesa({ ...input, year: current.year + 1 });
  }
  return { current, next };
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
