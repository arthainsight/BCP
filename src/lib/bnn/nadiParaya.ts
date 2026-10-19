import { SIGN_NAMES } from '@/lib/signs';
import type { ParayaSpeed } from '@/types';

/** The Paraya grahas that are tried out (beta): Mars, Mercury and Venus, moved by age like the four. */
export type ParayaBetaBody = 'Mars' | 'Mercury' | 'Venus';

export type ParayaBody = 'Jupiter' | 'Saturn' | 'Rahu' | 'Ketu' | ParayaBetaBody;

/** The four Paraya grahas, in the order they are listed. */
export const PARAYA_BODIES: readonly ParayaBody[] = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];

/** The beta Paraya grahas, which are off until they are chosen. */
export const PARAYA_BETA_BODIES: readonly ParayaBetaBody[] = ['Mars', 'Mercury', 'Venus'];

/** All seven, the four first. */
export const ALL_PARAYA_BODIES: readonly ParayaBody[] = [...PARAYA_BODIES, ...PARAYA_BETA_BODIES];

/**
 * Years spent in each sign by the beta grahas: what the graha takes in the sky on average, as the four take theirs (Jupiter a year, Saturn
 * 2½, Rahu 1½). Mars takes two months, which is two years round the zodiac; Mercury and Venus keep the pace of the Sun, a month a sign and
 * a year a round.
 */
export const PARAYA_BETA_YEARS: Record<ParayaBetaBody, number> = { Mars: 1 / 6, Mercury: 1 / 12, Venus: 1 / 12 };

/**
 * The natal sign (0–11) of a beta graha and the degree it stood at in it (0–30; 0 when not given), and whether it was going backwards, which
 * starts its walk one sign back as for Jupiter and Saturn. The beta grahas begin at their natal degree: Mercury at 7° and Venus at 18° of Libra
 * are in different places on their way round, and reach the same degree of another sign at different times.
 */
export type ParayaBetaNatal = Partial<Record<ParayaBetaBody, { signIndex: number; degree?: number; retrograde?: boolean }>>;

/** The choices for how Saturn and Rahu (and so Ketu) stay in each sign. */
export interface ParayaOptions {
  saturn: ParayaSpeed;
  rahu: ParayaSpeed;
}

export const DEFAULT_PARAYA_OPTIONS: ParayaOptions = { saturn: 'alternating', rahu: 'alternating' };

/**
 * Years spent in each sign in turn. Jupiter stays a year; Saturn alternates 3
 * and 2 years or stays 2.5; Rahu alternates 2 and 1 or stays 1.5. Either way a
 * round takes 12, 30 and 18 years.
 */
export function parayaDurations(body: Exclude<ParayaBody, 'Ketu'>, options: ParayaOptions = DEFAULT_PARAYA_OPTIONS): readonly number[] {
  if (body === 'Jupiter') return [1];
  if (body === 'Mars' || body === 'Mercury' || body === 'Venus') return [PARAYA_BETA_YEARS[body]];
  if (body === 'Saturn') return options.saturn === 'even' ? [2.5] : [3, 2];
  return options.rahu === 'even' ? [1.5] : [2, 1];
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
};

export type NadiParayaResult = {
  ageYears: number;
  jupiter: ParayaPeriod;
  saturn: ParayaPeriod;
  rahu: ParayaPeriod;
  ketu: ParayaPeriod;
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
  /** The degree of the sign the walk is at when the age is 0 (the beta grahas): the walk begins part of the way through its first stay. */
  startDegree?: number;
};

/** How much of the first stay has already gone at age 0, in years: the start degree as a part of the stay (0 when the walk begins at the start of the sign). */
function phaseOf(params: PeriodParams): number {
  return params.startDegree ? (Math.max(0, Math.min(30, params.startDegree)) / 30) * params.durations[0] : 0;
}

/** The length of a round, in years: the stays in the twelve signs added up. */
function cycleLengthOf(durations: readonly number[]): number {
  return durations.reduce((sum, duration) => sum + duration, 0) * (12 / durations.length);
}

/** One period: the stay of `step` (0–11) in the round `completedCycles` (from 0), with the Paraya graha `progress` (0–1) of the way through it. */
function makePeriod(params: PeriodParams, completedCycles: number, step: number, startAgeInCycle: number, progress: number): ParayaPeriod {
  const startSign = normalizeSign(params.natalSignIndex - (params.retrogradeStartShift ? 1 : 0));
  const durationYears = params.durations[step % params.durations.length];
  const cycleLength = cycleLengthOf(params.durations);
  const signIndex = normalizeSign(startSign + params.direction * step);
  const degree = params.direction === 1
    ? progress * 30
    : Math.min(29.999999, (1 - progress) * 30);
  return {
    body: params.body,
    signIndex,
    signName: SIGN_NAMES[signIndex],
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
    retrogradeStartShift: params.jupiterRetrograde,
  });
  const saturn = periodAtAge({
    body: 'Saturn',
    natalSignIndex: params.natalSaturnSignIndex,
    ageYears,
    durations: parayaDurations('Saturn', params.options),
    direction: 1,
    retrogradeStartShift: params.saturnRetrograde,
  });
  const rahu = periodAtAge({
    body: 'Rahu',
    natalSignIndex: params.natalRahuSignIndex,
    ageYears,
    durations: parayaDurations('Rahu', params.options),
    direction: -1,
  });
  const ketuSignIndex = normalizeSign(rahu.signIndex + 6);
  const ketu: ParayaPeriod = {
    ...rahu,
    body: 'Ketu',
    signIndex: ketuSignIndex,
    signName: SIGN_NAMES[ketuSignIndex],
  };

  return { ageYears, jupiter, saturn, rahu, ketu };
}

/** The beta Paraya grahas at an age: Mars, Mercury and Venus, in that order, for those that are given. */
export function calculateBetaParaya(params: { ageYears: number; natal: ParayaBetaNatal }): ParayaPeriod[] {
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
      retrogradeStartShift: natal.retrograde,
      startDegree: natal.degree,
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
    retrogradeStartShift: params.body !== 'Rahu' && params.retrograde,
    startDegree: params.startDegree,
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
  /** The natal signs of Mars, Mercury and Venus, which the beta grahas need. */
  natalBeta?: ParayaBetaNatal;
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
  const natalSignIndex = beta
    ? beta.signIndex
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
    startDegree: beta?.degree,
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
    // A beta graha begins part of the way through its first stay: a position it has already gone past in that stay was reached before birth.
    .filter(match => match.ageYears >= 0 && match.ageYears <= maxAge);
}
