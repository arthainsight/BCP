// Nakṣatra Praveśa and Yoga Praveśa — annual charts counted like Tithi Praveśa.
//
// Tithi Praveśa casts the chart for the moment the Moon stands at the same distance from the Sun as at birth.
// These two repeat other relations of the Moon:
//
// - Nakṣatra Praveśa: the Moon returns to exactly its natal sidereal longitude (the same nakṣatra, pada and
//   place in it, to the arc-second). The Moon takes 27.32 days for the round.
// - Yoga Praveśa: the sum of the sidereal longitudes of the Sun and the Moon returns to its natal value (the same
//   yoga, and the same part of it spent). The sum takes about 25.4 days for the round. As it is a sum of two
//   sidereal longitudes it depends on the ayanamsa twice.
//
// Either happens about thirteen times a year, so a rule says which one begins the year:
//
// - 'lunar-month' (the default, as in Tithi Praveśa): the return inside the lunar month of birth (the amānta month
//   that bears the birth month's name); when the month has two, the last one at or before the Tithi Praveśa, the
//   lunar birthday, and the first one when both come after it.
// - 'before-birthday': the last return at or before the birthday, the birth date and time of day carried to the year.
//
// Everything here calls the ephemeris, so it runs on the server only.

import { SE_MOON, SE_SUN, sweCalcUt, sweGetAyanamsa } from './ephemerisAdapter';
import { applyAyanamsaOffset, resolveAyanamsaMode } from './ayanamsas';
import { normalizeDegrees } from './angles';
import { SYNODIC_MONTH, SIDEREAL_YEAR, anniversaryJd, annualYearAt, findElongation, signedDelta } from './lunisolar';
import { calculateTithiPravesa } from './tithiPravesha';

export type PraveshaKind = 'nakshatra' | 'yoga';
export type PraveshaMethod = 'lunar-month' | 'before-birthday';

/** Mean length in days of one round of the quantity; only used to seed the root finder and to step. */
const SIDEREAL_MONTH = 27.321661;
export const PRAVESHA_PERIOD: Record<PraveshaKind, number> = {
  nakshatra: SIDEREAL_MONTH,
  yoga: 360 / (360 / SIDEREAL_MONTH + 360 / SIDEREAL_YEAR),
};
/** Convergence tolerance: about 0.1 s. */
const JD_TOLERANCE = 1e-6;

async function ayanamsaAt(jd: number, ayanamsa: string, offset: number): Promise<number> {
  const mode = resolveAyanamsaMode(ayanamsa);
  if (mode === 'tropical') return 0;
  return applyAyanamsaOffset(await sweGetAyanamsa(jd, mode), mode, offset);
}

/**
 * The quantity a Praveśa repeats at `jd`, in degrees [0, 360), and how fast it grows (degrees a day):
 * the Moon's sidereal longitude, or the sum of the Sun's and the Moon's.
 */
export async function praveshaValueAt(kind: PraveshaKind, jd: number, ayanamsa = 'lahiri', offset = 0): Promise<{ value: number; rate: number }> {
  const ay = await ayanamsaAt(jd, ayanamsa, offset);
  const moon = await sweCalcUt(jd, SE_MOON);
  if (kind === 'nakshatra') return { value: normalizeDegrees(moon.longitude - ay), rate: moon.speed };
  const sun = await sweCalcUt(jd, SE_SUN);
  return { value: normalizeDegrees(sun.longitude + moon.longitude - 2 * ay), rate: sun.speed + moon.speed };
}

/** Newton iteration for the instant near `guessJd` where the quantity equals `target`. Neither quantity ever stalls. */
export async function findPraveshaReturn(kind: PraveshaKind, target: number, guessJd: number, ayanamsa = 'lahiri', offset = 0): Promise<number> {
  let jd = guessJd;
  for (let i = 0; i < 50; i++) {
    const { value, rate } = await praveshaValueAt(kind, jd, ayanamsa, offset);
    const step = signedDelta(value, target) / rate;
    jd -= step;
    if (Math.abs(step) < JD_TOLERANCE) return jd;
  }
  throw new Error('Praveśa search did not converge');
}

/** Every return of the quantity to `natal` from `fromJd` up to (not including) `toJd`, in order. */
export async function praveshaReturnsBetween(kind: PraveshaKind, natal: number, fromJd: number, toJd: number, ayanamsa = 'lahiri', offset = 0): Promise<number[]> {
  const period = PRAVESHA_PERIOD[kind];
  const start = await praveshaValueAt(kind, fromJd, ayanamsa, offset);
  let jd = await findPraveshaReturn(kind, natal, fromJd + normalizeDegrees(natal - start.value) / start.rate, ayanamsa, offset);
  // The seed can land just before the start; the return that counts is the next one.
  if (jd < fromJd - JD_TOLERANCE) jd = await findPraveshaReturn(kind, natal, jd + period, ayanamsa, offset);
  const returns: number[] = [];
  while (jd < toJd) {
    returns.push(jd);
    jd = await findPraveshaReturn(kind, natal, jd + period, ayanamsa, offset);
  }
  return returns;
}

export interface PraveshaInput {
  kind: PraveshaKind;
  /** Julian day (UT) of birth. */
  birthJd: number;
  /** Gregorian year whose Praveśa is wanted. */
  year: number;
  method?: PraveshaMethod;
  /** The birthday of a Gregorian year as a Julian day (UT): the birth date and time carried to that year. Defaults to whole sidereal years from birth. */
  birthdayJd?: (year: number) => number | Promise<number>;
  ayanamsa?: string;
  ayanamsaOffsetDegrees?: number;
}

export interface PraveshaResult {
  /** Julian day (UT) of the Praveśa moment. */
  jd: number;
  year: number;
  kind: PraveshaKind;
  method: PraveshaMethod;
  /** The quantity at birth, degrees in [0, 360). */
  natalValue: number;
  /** The quantity at the returned moment; equals natalValue to within about a hundredth of an arc-second. */
  value: number;
  /** The Tithi Praveśa of the year, the lunar birthday the 'lunar-month' rule counts from (UT JD). */
  tithiPravesaJd: number;
  /** Lunar month index 0–11 (0 = Chaitra), the birth month. */
  masaIndex: number;
  birthInAdhikaMasa: boolean;
  /** Start and end of the lunar month of the Praveśa; only for 'lunar-month'. */
  monthStartJd?: number;
  monthEndJd?: number;
}

export async function calculatePravesha(input: PraveshaInput): Promise<PraveshaResult> {
  const { kind, birthJd, year } = input;
  const method = input.method ?? 'lunar-month';
  const ayanamsa = input.ayanamsa ?? 'lahiri';
  const offset = input.ayanamsaOffsetDegrees ?? 0;

  const natalValue = (await praveshaValueAt(kind, birthJd, ayanamsa, offset)).value;
  const tp = await calculateTithiPravesa({ birthJd, year, method: 'lunar-month', ayanamsa, ayanamsaOffsetDegrees: offset });
  const base = { year, kind, method, natalValue, tithiPravesaJd: tp.jd, masaIndex: tp.masaIndex, birthInAdhikaMasa: tp.birthInAdhikaMasa };

  if (method === 'before-birthday') {
    const birthday = input.birthdayJd ? await input.birthdayJd(year) : anniversaryJd(birthJd, year);
    // One round before the birthday always holds a return.
    const returns = await praveshaReturnsBetween(kind, natalValue, birthday - PRAVESHA_PERIOD[kind] * 1.2, birthday + JD_TOLERANCE, ayanamsa, offset);
    const jd = returns[returns.length - 1];
    if (jd === undefined) throw new Error('Praveśa: no return before the birthday');
    return { ...base, jd, value: (await praveshaValueAt(kind, jd, ayanamsa, offset)).value };
  }

  const monthStartJd = tp.monthStartJd!;
  const monthEndJd = await findElongation(0, monthStartJd + SYNODIC_MONTH);
  const inMonth = await praveshaReturnsBetween(kind, natalValue, monthStartJd, monthEndJd, ayanamsa, offset);
  if (inMonth.length === 0) throw new Error('Praveśa: no return inside the lunar month');
  const before = inMonth.filter((jd) => jd <= tp.jd);
  const jd = before.length > 0 ? before[before.length - 1] : inMonth[0];
  return { ...base, jd, value: (await praveshaValueAt(kind, jd, ayanamsa, offset)).value, monthStartJd, monthEndJd };
}

/** The Praveśa year in force at `targetJd`: the latest Praveśa at or before it, and the next one, which closes the year. */
export async function praveshaYearAt(
  input: Omit<PraveshaInput, 'year'> & { targetJd: number },
): Promise<{ current: PraveshaResult; next: PraveshaResult }> {
  const { current, next } = await annualYearAt((year) => calculatePravesha({ ...input, year }), input.targetJd);
  return { current, next };
}
