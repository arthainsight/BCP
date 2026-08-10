import { SIGN_NAMES } from '@/lib/varga/index';

export type ParayaBody = 'Jupiter' | 'Saturn' | 'Rahu' | 'Ketu';

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
}): NadiParayaResult {
  const ageYears = Math.max(0, params.ageYears);
  const jupiter = periodAtAge({
    body: 'Jupiter',
    natalSignIndex: params.natalJupiterSignIndex,
    ageYears,
    durations: [1],
    direction: 1,
    retrogradeStartShift: params.jupiterRetrograde,
  });
  const saturn = periodAtAge({
    body: 'Saturn',
    natalSignIndex: params.natalSaturnSignIndex,
    ageYears,
    durations: [3, 2],
    direction: 1,
    retrogradeStartShift: params.saturnRetrograde,
  });
  const rahu = periodAtAge({
    body: 'Rahu',
    natalSignIndex: params.natalRahuSignIndex,
    ageYears,
    durations: [2, 1],
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
}): ParayaPeriod[] {
  const config = params.body === 'Jupiter'
    ? { durations: [1] as const, direction: 1 as const }
    : params.body === 'Saturn'
      ? { durations: [3, 2] as const, direction: 1 as const }
      : { durations: [2, 1] as const, direction: -1 as const };
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
