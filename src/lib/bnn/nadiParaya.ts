import { SIGN_NAMES } from '@/lib/varga/index';
import type { ParayaSpeed } from '@/types';

export type ParayaBody = 'Jupiter' | 'Saturn' | 'Rahu' | 'Ketu';

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

function periodAtAge(params: {
  body: ParayaBody;
  natalSignIndex: number;
  ageYears: number;
  durations: readonly number[];
  direction: 1 | -1;
  retrogradeStartShift?: boolean;
}): ParayaPeriod {
  const ageYears = Math.max(0, params.ageYears);
  const startSign = normalizeSign(params.natalSignIndex - (params.retrogradeStartShift ? 1 : 0));
  const cycleLength = params.durations.reduce((sum, duration) => sum + duration, 0) * (12 / params.durations.length);
  const completedCycles = Math.floor(ageYears / cycleLength);
  const ageInCycle = ageYears - completedCycles * cycleLength;

  let startAgeInCycle = 0;
  for (let step = 0; step < 12; step++) {
    const durationYears = params.durations[step % params.durations.length];
    const endAgeInCycle = startAgeInCycle + durationYears;
    if (ageInCycle < endAgeInCycle || step === 11) {
      const signIndex = normalizeSign(startSign + params.direction * step);
      const elapsedInPeriod = Math.max(0, ageInCycle - startAgeInCycle);
      const progress = Math.max(0, Math.min(1, elapsedInPeriod / durationYears));
      const degree = params.direction === 1
        ? progress * 30
        : Math.min(29.999999, (1 - progress) * 30);
      return {
        body: params.body,
        signIndex,
        signName: SIGN_NAMES[signIndex],
        startAge: completedCycles * cycleLength + startAgeInCycle,
        endAge: completedCycles * cycleLength + endAgeInCycle,
        durationYears,
        cycleNumber: completedCycles + 1,
        degree,
      };
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

export function buildParayaTimeline(params: {
  body: Exclude<ParayaBody, 'Ketu'>;
  natalSignIndex: number;
  maxAge: number;
  retrograde?: boolean;
  options?: ParayaOptions;
}): ParayaPeriod[] {
  const config = { durations: parayaDurations(params.body, params.options), direction: params.body === 'Rahu' ? -1 as const : 1 as const };
  const periods: ParayaPeriod[] = [];
  let age = 0;
  while (age < params.maxAge) {
    const period = periodAtAge({
      body: params.body,
      natalSignIndex: params.natalSignIndex,
      ageYears: age,
      durations: config.durations,
      direction: config.direction,
      retrogradeStartShift: params.body !== 'Rahu' && params.retrograde,
    });
    periods.push(period);
    age = period.endAge;
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
  maxAge?: number;
  options?: ParayaOptions;
}): ParayaPositionMatch[] {
  const maxAge = params.maxAge ?? 120;
  const targetSignIndex = normalizeSign(params.targetSignIndex);
  const degree = Math.max(0, Math.min(29.999999, params.degree));
  const sourceBody = params.body === 'Ketu' ? 'Rahu' : params.body;
  const sourceTargetSign = params.body === 'Ketu' ? normalizeSign(targetSignIndex - 6) : targetSignIndex;
  const natalSignIndex = sourceBody === 'Jupiter'
    ? params.natalJupiterSignIndex
    : sourceBody === 'Saturn'
      ? params.natalSaturnSignIndex
      : params.natalRahuSignIndex;
  const retrograde = sourceBody === 'Jupiter'
    ? params.jupiterRetrograde
    : sourceBody === 'Saturn'
      ? params.saturnRetrograde
      : false;
  const timeline = buildParayaTimeline({
    body: sourceBody,
    natalSignIndex,
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
    .filter(match => match.ageYears <= maxAge);
}
