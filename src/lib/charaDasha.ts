import { PlanetData } from '@/types';

export type CharaLevel = 'md' | 'ad' | 'pd';

export interface CharaDashaEntry {
  sign: number;
  signName: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  level: CharaLevel;
}

export interface CharaDashaResult {
  entries: CharaDashaEntry[];
  method: string;
}

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries',
  2: 'Taurus',
  3: 'Gemini',
  4: 'Cancer',
  5: 'Leo',
  6: 'Virgo',
  7: 'Libra',
  8: 'Scorpio',
  9: 'Sagittarius',
  10: 'Capricorn',
  11: 'Aquarius',
  12: 'Pisces',
};

const SIGN_ABBR: Record<number, string> = {
  1: 'Ar', 2: 'Ta', 3: 'Ge', 4: 'Cn', 5: 'Le', 6: 'Vi',
  7: 'Li', 8: 'Sc', 9: 'Sg', 10: 'Cp', 11: 'Aq', 12: 'Pi',
};

const SIGN_LORDS: Record<number, string> = {
  1: 'Mars',
  2: 'Venus',
  3: 'Mercury',
  4: 'Moon',
  5: 'Sun',
  6: 'Mercury',
  7: 'Venus',
  8: 'Mars',
  9: 'Jupiter',
  10: 'Saturn',
  11: 'Saturn',
  12: 'Jupiter',
};

const EXALTATION_SIGNS: Record<string, number> = {
  Sun: 1,
  Moon: 2,
  Mars: 10,
  Mercury: 6,
  Jupiter: 4,
  Venus: 12,
  Saturn: 7,
};

const DEBILITATION_SIGNS: Record<string, number> = {
  Sun: 7,
  Moon: 8,
  Mars: 4,
  Mercury: 12,
  Jupiter: 10,
  Venus: 6,
  Saturn: 1,
};

export function charaSignName(sign: number): string {
  return SIGN_NAMES[sign] ?? `Sign ${sign}`;
}

export function charaSignAbbr(sign: number): string {
  return SIGN_ABBR[sign] ?? String(sign);
}

function normalizeSign(sign: number): number {
  return ((sign - 1 + 12 * 20) % 12) + 1;
}

function isOddSign(sign: number): boolean {
  return sign % 2 === 1;
}

function nextSign(sign: number, direction: 1 | -1): number {
  return normalizeSign(sign + direction);
}

function sequenceFrom(startSign: number): number[] {
  const direction: 1 | -1 = isOddSign(startSign) ? 1 : -1;
  const signs: number[] = [];
  let cursor = startSign;

  for (let i = 0; i < 12; i++) {
    signs.push(cursor);
    cursor = nextSign(cursor, direction);
  }

  return signs;
}

function countInclusive(fromSign: number, toSign: number, direction: 1 | -1): number {
  let count = 1;
  let cursor = fromSign;

  while (cursor !== toSign && count <= 12) {
    cursor = nextSign(cursor, direction);
    count++;
  }

  return count;
}

function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
}

function planetSign(planets: PlanetData[], planetName: string): number | null {
  const planet = planets.find((p) => p.name === planetName);
  return planet?.sign ?? null;
}

function signDurationYears(sign: number, planets: PlanetData[]): number | null {
  const lord = SIGN_LORDS[sign];
  const lordSign = planetSign(planets, lord);
  if (!lord || !lordSign) return null;

  const direction: 1 | -1 = isOddSign(sign) ? 1 : -1;
  let years = lordSign === sign ? 12 : countInclusive(sign, lordSign, direction) - 1;

  if (lordSign === EXALTATION_SIGNS[lord]) years += 1;
  if (lordSign === DEBILITATION_SIGNS[lord]) years -= 1;

  return Math.max(1, Math.min(12, years));
}

export function calculateCharaDasha(planets: PlanetData[], ascendantSign: number, birthDate: Date): CharaDashaResult | null {
  const startSign = normalizeSign(ascendantSign);
  const signs = sequenceFrom(startSign);
  const entries: CharaDashaEntry[] = [];
  let cursor = birthDate;

  for (const sign of signs) {
    const durationYears = signDurationYears(sign, planets);
    if (!durationYears) return null;

    const endDate = addYears(cursor, durationYears);
    entries.push({
      sign,
      signName: charaSignName(sign),
      startDate: cursor,
      endDate,
      durationYears,
      level: 'md',
    });
    cursor = endDate;
  }

  return {
    entries,
    method: 'Jaimini Chara Dasha: Lagna start, odd signs forward, even signs reverse, sign-lord distance duration, own sign 12 years, exaltation/debilitation adjustment.',
  };
}

export function calculateCharaSubDashas(parent: CharaDashaEntry, level: CharaLevel): CharaDashaEntry[] {
  const signs = sequenceFrom(parent.sign);
  const durationYears = parent.durationYears / 12;
  const entries: CharaDashaEntry[] = [];
  let cursor = parent.startDate;

  for (const sign of signs) {
    const endDate = addYears(cursor, durationYears);
    entries.push({
      sign,
      signName: charaSignName(sign),
      startDate: cursor,
      endDate,
      durationYears,
      level,
    });
    cursor = endDate;
  }

  return entries;
}
