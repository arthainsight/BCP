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

import {
  SYNODIC_MONTH,
  annualYearAt,
  anniversaryJd,
  elongationAt,
  findElongation,
  findSolarLongitude,
  masaOfNewMoon,
  newMoonBefore,
  siderealSun,
  signedDelta,
} from './lunisolar';

export { jdFromLocal, localPartsFromJd, newMoonBefore, vedicDayAt, type VedicDay } from './lunisolar';

export type TithiPravesaMethod = 'lunar-month' | 'solar-return';


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
  const { current, next } = await annualYearAt((year) => calculateTithiPravesa({ ...input, year }), input.targetJd);
  return { current, next };
}
