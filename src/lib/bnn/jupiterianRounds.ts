import { SIGN_NAMES } from '@/lib/varga/index';

export type JupiterianRound = {
  roundNumber: number;
  startAge: number;
  endAge: number;
  activeSignIndex: number;
  activeSignName: string;
};

export type JupiterianRoundsResult = {
  natalJupiterSignIndex: number;
  natalJupiterDegree: number;
  balanceDegrees: number;
  firstRoundLength: number;
  currentAge: number;
  currentRound: JupiterianRound | null;
  rounds: JupiterianRound[];
};

export function calculateJupiterianRounds(params: {
  natalJupiterSignIndex: number;
  natalJupiterDegree: number;
  ageYears: number;
  maxAge?: number;
}): JupiterianRoundsResult {
  const { ageYears, maxAge = 96 } = params;
  const natalJupiterSignIndex = Math.max(0, Math.min(11, Math.floor(params.natalJupiterSignIndex)));
  const natalJupiterDegree = Math.max(0, Math.min(29.99, params.natalJupiterDegree));

  const balanceDegrees = 30 - natalJupiterDegree;
  const firstRoundLength = Math.max(1, Math.round(balanceDegrees / 2.3));

  const rounds: JupiterianRound[] = [];

  // Round 1: natal Jupiter sign, age 0 → firstRoundLength
  rounds.push({
    roundNumber: 1,
    startAge: 0,
    endAge: firstRoundLength,
    activeSignIndex: natalJupiterSignIndex,
    activeSignName: SIGN_NAMES[natalJupiterSignIndex],
  });

  // Subsequent rounds: each adds 12 years, one sign forward per round
  let roundStart = firstRoundLength;
  let roundNumber = 2;
  while (roundStart < maxAge) {
    const signOffset = roundNumber - 1;
    const activeSignIndex = (natalJupiterSignIndex + signOffset) % 12;
    const endAge = roundStart + 12;
    rounds.push({
      roundNumber,
      startAge: roundStart,
      endAge,
      activeSignIndex,
      activeSignName: SIGN_NAMES[activeSignIndex],
    });
    roundStart = endAge;
    roundNumber++;
  }

  // Boundary rule: age >= startAge and age < endAge; exact boundary goes to the new round.
  const currentRound = rounds.find(r => ageYears >= r.startAge && ageYears < r.endAge) ?? null;

  return {
    natalJupiterSignIndex,
    natalJupiterDegree,
    balanceDegrees,
    firstRoundLength,
    currentAge: ageYears,
    currentRound,
    rounds,
  };
}

// Returns house number 1–12 from active Jupiterian round rashi as temporary lagna.
// Both indices are 0-based (0 = Aries).
export function getHouseFromTemporaryLagna(activeSignIndex: number, planetSignIndex: number): number {
  return ((planetSignIndex - activeSignIndex + 12) % 12) + 1;
}
