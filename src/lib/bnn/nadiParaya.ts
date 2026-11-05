import { SIGN_NAMES } from '@/lib/signs';
import type { ParayaRetro, ParayaSpeed } from '@/types';

/** The Paraya grahas that are tried out (beta): Mars, Mercury and Venus, moved by age like the six standard grahas. */
export type ParayaBetaBody = 'Mars' | 'Mercury' | 'Venus';

export type ParayaBody = 'Jupiter' | 'Saturn' | 'Rahu' | 'Ketu' | 'Moon' | 'Sun' | ParayaBetaBody;

/** The six standard Paraya grahas, in the order used by the app. */
export const PARAYA_BODIES: readonly ParayaBody[] = ['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Moon', 'Sun'];

/** The beta Paraya grahas, which are off until they are chosen. */
export const PARAYA_BETA_BODIES: readonly ParayaBetaBody[] = ['Mars', 'Mercury', 'Venus'];

/** All nine: the six standard grahas followed by the three beta grahas. */
export const ALL_PARAYA_BODIES: readonly ParayaBody[] = [...PARAYA_BODIES, ...PARAYA_BETA_BODIES];

/** Table-derived stay used by Mars and the Rāhu/Ketu axis: 522.5 sāvana days per sign. */
export const PARAYA_TABLE_SIGN_YEARS = 522.5 / 360;

/**
 * Years spent in each sign by the optional beta grahas. The supplied table gives
 * Mars 522.5 sāvana days per sign, and Mercury and Venus 360 days per sign.
 */
export const PARAYA_BETA_YEARS: Record<ParayaBetaBody, number> = { Mars: PARAYA_TABLE_SIGN_YEARS, Mercury: 1, Venus: 1 };

/**
 * The natal sign (0–11) and degree (0–30) of a beta graha, and whether it was retrograde,
 * which can shift its starting sign back as for Jupiter and Saturn. Progression starts at
 * the natal degree, so different degrees reach the same point at different times.
 */
export type ParayaBetaNatal = Partial<Record<ParayaBetaBody, { signIndex: number; degree?: number; retrograde?: boolean }>>;

/** Saturn's stay pattern is configurable. Rāhu/Ketu use the table-derived fixed stay below. */
export interface ParayaOptions {
  saturn: ParayaSpeed;
  /** @deprecated Legacy Rahu-speed selector; ignored in favour of the table-derived fixed duration. */
  rahu?: ParayaSpeed;
  /** Where a graha that was retrograde at birth begins: one sign back (the default) or in its natal sign. Rahu and Ketu have no such shift. */
  retro?: ParayaRetro;
  /** Equal-bhāva cusp degree (the natal Lagna degree), used to assign a Rāśi position to a bhāva. */
  bhavaCuspDegree?: number;
  /** Ascendant sign (0–11), needed to derive the equal-bhāva house number. */
  bhavaAscendantSignIndex?: number;
}

export const DEFAULT_PARAYA_OPTIONS: ParayaOptions = { saturn: 'alternating', rahu: 'alternating', retro: 'previous' };

/** Whether a graha that was retrograde at birth begins one sign back. */
const shiftsBack = (options?: ParayaOptions) => (options?.retro ?? 'previous') === 'previous';

/**
 * Years spent in each sign. Jupiter, Moon, Sun, Mercury and Venus stay one
 * year; Saturn alternates 3 and 2 years or stays 2.5; Mars and Rāhu/Ketu use
 * the table-derived 522.5 sāvana-day stay. Rāhu and Ketu move backwards.
 */
export function parayaDurations(body: Exclude<ParayaBody, 'Ketu'>, options: ParayaOptions = DEFAULT_PARAYA_OPTIONS): readonly number[] {
  if (body === 'Jupiter' || body === 'Moon' || body === 'Sun') return [1];
  if (body === 'Mars' || body === 'Mercury' || body === 'Venus') return [PARAYA_BETA_YEARS[body]];
  if (body === 'Saturn') return options.saturn === 'even' ? [2.5] : [3, 2];
  return [PARAYA_TABLE_SIGN_YEARS];
}

export type NadiParayaHouseActivation = {
  body: ParayaBody;
  house: number;
  degree: number;
};

export type ParayaPeriod = {
  body: ParayaBody;
  signIndex: number;
  signName: string;
  startAge: number;
  endAge: number;
  durationYears: number;
  cycleNumber: number;
  degree: number;
  /** Equal-bhāva house, when the cusp mode is on. */
  house?: number;
};

export type NadiParayaResult = {
  ageYears: number;
  jupiter: ParayaPeriod;
  saturn: ParayaPeriod;
  rahu: ParayaPeriod;
  ketu: ParayaPeriod;
  moon?: ParayaPeriod;
  sun?: ParayaPeriod;
};

export type ParayaPositionMatch = {
  body: ParayaBody;
  ageYears: number;
  signIndex: number;
  degree: number;
  cycleNumber: number;
};

function normalizeSign(signIndex: number): number {
  return ((Math.floor(signIndex) % 12) + 12) % 12;
}

type PeriodParams = {
  body: ParayaBody;
  natalSignIndex: number;
  durations: readonly number[];
  direction: 1 | -1;
  retrogradeStartShift?: boolean;
  /** The degree of the sign the walk is at when the age is 0 (the natal degree): the walk begins part of the way through its first stay. */
  startDegree?: number;
  /** Assigns the physical Rāśi position to an equal-bhāva house when set. */
  boundaryDegree?: number;
  ascendantSignIndex?: number;
};

/**
 * How much of the first stay has elapsed at birth. The natal degree is retained
 * as the physical Rāśi position; Bhāva cusps affect only the assigned house.
 */
function phaseOf(params: PeriodParams): number {
  if (params.startDegree === undefined) return 0;
  const degree = Math.max(0, Math.min(30, params.startDegree));
  return (params.direction === 1 ? degree / 30 : 1 - degree / 30) * params.durations[0];
}

/** Retrograde placement may shift the initial sign; cusp mode does not alter the physical Rāśi. */
function periodStartSign(params: PeriodParams): number {
  return normalizeSign(params.natalSignIndex - (params.retrogradeStartShift ? 1 : 0));
}

/** Equal-bhāva assignment: each house cusp is the Lagna degree in its own sign. */
function bhavaHouseOf(signIndex: number, degree: number, ascendantSignIndex: number, cuspDegree: number): number {
  const rasiHouse = ((signIndex - ascendantSignIndex + 12) % 12) + 1;
  // A position calculated at an exact cusp can differ by a few floating-point ulps.
  // Treat that boundary as entered, rather than incorrectly leaving the graha in the prior bhāva.
  return degree + 1e-9 >= cuspDegree ? rasiHouse : ((rasiHouse + 10) % 12) + 1;
}

/** The length of a round, in years: the stays in the twelve signs added up. */
function cycleLengthOf(durations: readonly number[]): number {
  return durations.reduce((sum, duration) => sum + duration, 0) * (12 / durations.length);
}

/** One period: the stay of `step` (0–11) in the round `completedCycles` (from 0), with the Paraya graha `progress` (0–1) of the way through it. */
function makePeriod(params: PeriodParams, completedCycles: number, step: number, startAgeInCycle: number, progress: number): ParayaPeriod {
  const startSign = periodStartSign(params);
  const durationYears = params.durations[step % params.durations.length];
  const cycleLength = cycleLengthOf(params.durations);
  const signIndex = normalizeSign(startSign + params.direction * step);
  const degree = params.direction === 1 ? progress * 30 : Math.min(29.999999, (1 - progress) * 30);
  const house = params.boundaryDegree !== undefined && params.ascendantSignIndex !== undefined
    ? bhavaHouseOf(signIndex, degree, params.ascendantSignIndex, params.boundaryDegree)
    : undefined;
  return {
    body: params.body,
    signIndex,
    signName: SIGN_NAMES[signIndex],
    ...(house !== undefined ? { house } : {}),
    startAge: completedCycles * cycleLength + startAgeInCycle - phaseOf(params),
    endAge: completedCycles * cycleLength + startAgeInCycle + durationYears - phaseOf(params),
    durationYears,
    cycleNumber: completedCycles + 1,
    degree,
  };
}

function periodAtAge(params: PeriodParams & { ageYears: number }): ParayaPeriod {
  const ageYears = Math.max(0, params.ageYears) + phaseOf(params);
  const cycleLength = cycleLengthOf(params.durations);
  const completedCycles = Math.floor(ageYears / cycleLength);
  const ageInCycle = ageYears - completedCycles * cycleLength;

  let startAgeInCycle = 0;
  for (let step = 0; step < 12; step++) {
    const durationYears = params.durations[step % params.durations.length];
    const endAgeInCycle = startAgeInCycle + durationYears;
    if (ageInCycle < endAgeInCycle || step === 11) {
      const elapsedInPeriod = Math.max(0, ageInCycle - startAgeInCycle);
      const progress = Math.max(0, Math.min(1, elapsedInPeriod / durationYears));
      return makePeriod(params, completedCycles, step, startAgeInCycle, progress);
    }
    startAgeInCycle = endAgeInCycle;
  }

  throw new Error('Unable to resolve Nadi paraya period');
}

export function calculateNadiParaya(params: {
  ageYears: number;
  natalJupiterSignIndex: number;
  natalSaturnSignIndex: number;
  natalRahuSignIndex: number;
  /** The natal degrees (0–30) the walks begin at; when they are not given the walk begins at the start of the natal sign (the end of it for Rahu). */
  natalJupiterDegree?: number;
  natalSaturnDegree?: number;
  natalRahuDegree?: number;
  natalMoonSignIndex?: number;
  natalSunSignIndex?: number;
  natalMoonDegree?: number;
  natalSunDegree?: number;
  jupiterRetrograde?: boolean;
  saturnRetrograde?: boolean;
  options?: ParayaOptions;
}): NadiParayaResult {
  const ageYears = Math.max(0, params.ageYears);
  const jupiter = periodAtAge({
    body: 'Jupiter',
    natalSignIndex: params.natalJupiterSignIndex,
    ageYears,
    durations: parayaDurations('Jupiter', params.options),
    direction: 1,
    retrogradeStartShift: params.jupiterRetrograde && shiftsBack(params.options),
    startDegree: params.natalJupiterDegree,
    boundaryDegree: params.options?.bhavaCuspDegree,
    ascendantSignIndex: params.options?.bhavaAscendantSignIndex,
  });
  const saturn = periodAtAge({
    body: 'Saturn',
    natalSignIndex: params.natalSaturnSignIndex,
    ageYears,
    durations: parayaDurations('Saturn', params.options),
    direction: 1,
    retrogradeStartShift: params.saturnRetrograde && shiftsBack(params.options),
    startDegree: params.natalSaturnDegree,
    boundaryDegree: params.options?.bhavaCuspDegree,
    ascendantSignIndex: params.options?.bhavaAscendantSignIndex,
  });
  const rahu = periodAtAge({
    body: 'Rahu',
    natalSignIndex: params.natalRahuSignIndex,
    ageYears,
    durations: parayaDurations('Rahu', params.options),
    direction: -1,
    startDegree: params.natalRahuDegree,
    boundaryDegree: params.options?.bhavaCuspDegree,
    ascendantSignIndex: params.options?.bhavaAscendantSignIndex,
  });
  const moon = params.natalMoonSignIndex === undefined ? undefined : periodAtAge({
    body: 'Moon', natalSignIndex: params.natalMoonSignIndex, ageYears,
    durations: parayaDurations('Moon', params.options), direction: 1,
    startDegree: params.natalMoonDegree, boundaryDegree: params.options?.bhavaCuspDegree,
    ascendantSignIndex: params.options?.bhavaAscendantSignIndex,
  });
  const sun = params.natalSunSignIndex === undefined ? undefined : periodAtAge({
    body: 'Sun', natalSignIndex: params.natalSunSignIndex, ageYears,
    durations: parayaDurations('Sun', params.options), direction: 1,
    startDegree: params.natalSunDegree, boundaryDegree: params.options?.bhavaCuspDegree,
    ascendantSignIndex: params.options?.bhavaAscendantSignIndex,
  });
  const ketuSignIndex = normalizeSign(rahu.signIndex + 6);
  const ketuRasiHouse = params.options?.bhavaAscendantSignIndex === undefined
    ? undefined
    : ((ketuSignIndex - params.options.bhavaAscendantSignIndex + 12) % 12) + 1;
  const ketuHouse = ketuRasiHouse === undefined || params.options?.bhavaCuspDegree === undefined
    ? undefined
    : rahu.degree >= params.options.bhavaCuspDegree ? ketuRasiHouse : ((ketuRasiHouse + 10) % 12) + 1;
  const ketu: ParayaPeriod = {
    ...rahu,
    body: 'Ketu',
    signIndex: ketuSignIndex,
    signName: SIGN_NAMES[ketuSignIndex],
    house: ketuHouse,
  };

  return { ageYears, jupiter, saturn, rahu, ketu, ...(moon ? { moon } : {}), ...(sun ? { sun } : {}) };
}

/** The beta Paraya grahas at an age: Mars, Mercury and Venus, in that order, for those that are given. */
export function calculateBetaParaya(params: { ageYears: number; natal: ParayaBetaNatal; options?: ParayaOptions }): ParayaPeriod[] {
  const ageYears = Math.max(0, params.ageYears);
  return PARAYA_BETA_BODIES.flatMap(body => {
    const natal = params.natal[body];
    if (!natal) return [];
    return [periodAtAge({
      body,
      natalSignIndex: natal.signIndex,
      ageYears,
      durations: parayaDurations(body),
      direction: 1,
      retrogradeStartShift: natal.retrograde && shiftsBack(params.options),
      startDegree: natal.degree,
      boundaryDegree: params.options?.bhavaCuspDegree,
    ascendantSignIndex: params.options?.bhavaAscendantSignIndex,
    })];
  });
}

export function buildParayaTimeline(params: {
  body: Exclude<ParayaBody, 'Ketu'>;
  natalSignIndex: number;
  /** The natal degree the walk starts from (the beta grahas); the first period then begins before age 0. */
  startDegree?: number;
  maxAge: number;
  retrograde?: boolean;
  options?: ParayaOptions;
}): ParayaPeriod[] {
  const config: PeriodParams = {
    body: params.body,
    natalSignIndex: params.natalSignIndex,
    durations: parayaDurations(params.body, params.options),
    direction: params.body === 'Rahu' ? -1 : 1,
    retrogradeStartShift: params.body !== 'Rahu' && params.retrograde && shiftsBack(params.options),
    startDegree: params.startDegree,
    boundaryDegree: params.options?.bhavaCuspDegree,
    ascendantSignIndex: params.options?.bhavaAscendantSignIndex,
  };
  // The periods are laid out round by round, each from the sum of the ones before it, and not found again from the age at which the one before
  // ended: a stay of a twelfth of a year does not add up to exactly a year in floating point, and an age that falls a hair short of a boundary
  // would give the same period again for ever.
  const periods: ParayaPeriod[] = [];
  const cycleLength = cycleLengthOf(config.durations);
  for (let cycle = 0; cycle * cycleLength - phaseOf(config) < params.maxAge; cycle++) {
    let startAgeInCycle = 0;
    for (let step = 0; step < 12; step++) {
      const period = makePeriod(config, cycle, step, startAgeInCycle, 0);
      if (period.startAge >= params.maxAge) return periods;
      periods.push(period);
      startAgeInCycle += config.durations[step % config.durations.length];
    }
  }
  return periods;
}

export function findParayaAgesForPosition(params: {
  body: ParayaBody;
  targetSignIndex: number;
  degree: number;
  natalJupiterSignIndex: number;
  natalSaturnSignIndex: number;
  natalRahuSignIndex: number;
  jupiterRetrograde?: boolean;
  saturnRetrograde?: boolean;
  /** The natal degrees of Jupiter, Saturn and Rahu (the walks begin there); the beta grahas have theirs in `natalBeta`. */
  natalDegrees?: Partial<Record<'Jupiter' | 'Saturn' | 'Rahu', number>>;
  /** The natal signs of Mars, Mercury and Venus, which the beta grahas need. */
  natalBeta?: ParayaBetaNatal;
  /** The natal Sun and Moon positions, which may also be progressed as Parāya grahas. */
  natalPositions?: Partial<Record<'Sun' | 'Moon', { signIndex: number; degree: number }>>;
  maxAge?: number;
  options?: ParayaOptions;
}): ParayaPositionMatch[] {
  const maxAge = params.maxAge ?? 120;
  const targetSignIndex = normalizeSign(params.targetSignIndex);
  const degree = Math.max(0, Math.min(29.999999, params.degree));
  const sourceBody = params.body === 'Ketu' ? 'Rahu' : params.body;
  const sourceTargetSign = params.body === 'Ketu' ? normalizeSign(targetSignIndex - 6) : targetSignIndex;
  const beta = (PARAYA_BETA_BODIES as readonly ParayaBody[]).includes(sourceBody) ? params.natalBeta?.[sourceBody as ParayaBetaBody] : undefined;
  if ((PARAYA_BETA_BODIES as readonly ParayaBody[]).includes(sourceBody) && !beta) return [];
  const solarLunar = sourceBody === 'Sun' || sourceBody === 'Moon' ? params.natalPositions?.[sourceBody] : undefined;
  if ((sourceBody === 'Sun' || sourceBody === 'Moon') && !solarLunar) return [];
  const natalSignIndex = beta
    ? beta.signIndex
    : solarLunar
      ? solarLunar.signIndex
      : sourceBody === 'Jupiter'
        ? params.natalJupiterSignIndex
        : sourceBody === 'Saturn'
          ? params.natalSaturnSignIndex
          : params.natalRahuSignIndex;
  const retrograde = beta
    ? beta.retrograde
    : sourceBody === 'Jupiter'
      ? params.jupiterRetrograde
      : sourceBody === 'Saturn'
        ? params.saturnRetrograde
        : false;
  const timeline = buildParayaTimeline({
    body: sourceBody,
    natalSignIndex,
    startDegree: beta ? beta.degree : solarLunar?.degree ?? params.natalDegrees?.[sourceBody as 'Jupiter' | 'Saturn' | 'Rahu'],
    maxAge,
    retrograde,
    options: params.options,
  });
  const backward = sourceBody === 'Rahu';

  return timeline
    .filter(period => period.signIndex === sourceTargetSign)
    .map(period => {
      const progress = backward ? (30 - degree) / 30 : degree / 30;
      return {
        body: params.body,
        ageYears: period.startAge + progress * period.durationYears,
        signIndex: targetSignIndex,
        degree,
        cycleNumber: period.cycleNumber,
      };
    })
    // A graha begins part of the way through its first stay, at its natal degree: a position it has already gone past in that stay was reached before birth.
    .filter(match => match.ageYears >= 0 && match.ageYears <= maxAge);
}
