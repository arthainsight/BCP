import { PlanetData } from '@/types';

export type CharaLevel = 'md' | 'ad' | 'pd';
export type CharaDirectionMode = 'dasha-rasi-9h';
export type CharaAntardashaStart = 'next-dasha-rasi';
export type CharaStrongerLordRule = 'graha';
export type CharaMahadashaCycle = 'equal';

export interface CharaConfig {
  antardashaStart: CharaAntardashaStart;
  antardashaDirection: CharaDirectionMode;
  strongerLordRule: CharaStrongerLordRule;
  mahadashaCycle: CharaMahadashaCycle;
  scorpioStrongerLord: 'Ketu' | 'Mars';
  aquariusStrongerLord: 'Saturn' | 'Rahu';
}

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
  config: CharaConfig;
}

export const DEFAULT_CHARA_CONFIG: CharaConfig = {
  antardashaStart: 'next-dasha-rasi',
  antardashaDirection: 'dasha-rasi-9h',
  strongerLordRule: 'graha',
  mahadashaCycle: 'equal',
  scorpioStrongerLord: 'Ketu',
  aquariusStrongerLord: 'Saturn',
};

const SIGN_NAMES: Record<number, string> = { 1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer', 5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio', 9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces' };
const SIGN_ABBR: Record<number, string> = { 1: 'Ar', 2: 'Ta', 3: 'Ge', 4: 'Cn', 5: 'Le', 6: 'Vi', 7: 'Li', 8: 'Sc', 9: 'Sg', 10: 'Cp', 11: 'Aq', 12: 'Pi' };
const SIGN_LORDS: Record<number, string[]> = { 1: ['Mars'], 2: ['Venus'], 3: ['Mercury'], 4: ['Moon'], 5: ['Sun'], 6: ['Mercury'], 7: ['Venus'], 8: ['Ketu', 'Mars'], 9: ['Jupiter'], 10: ['Saturn'], 11: ['Saturn', 'Rahu'], 12: ['Jupiter'] };
const EXALT: Record<string, number> = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7, Rahu: 3, Ketu: 9 };
const DEBIL: Record<string, number> = { Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1, Rahu: 9, Ketu: 3 };

export function charaSignName(sign: number): string { return SIGN_NAMES[sign] ?? `Sign ${sign}`; }
export function charaSignAbbr(sign: number): string { return SIGN_ABBR[sign] ?? String(sign); }

function normalizeSign(sign: number): number { return ((sign - 1 + 240) % 12) + 1; }
function isOddSign(sign: number): boolean { return sign % 2 === 1; }
function directionFor(sign: number): 1 | -1 { return isOddSign(sign) ? 1 : -1; }
function nextSign(sign: number, direction: 1 | -1): number { return normalizeSign(sign + direction); }
function ninthFrom(sign: number): number { return normalizeSign(sign + 8); }
function addYears(date: Date, years: number): Date { return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000); }
function planetSign(planets: PlanetData[], planetName: string): number | null { return planets.find((p) => p.name === planetName)?.sign ?? null; }

function sequenceFrom(startSign: number): number[] {
  const direction = directionFor(startSign);
  const signs: number[] = [];
  let cursor = startSign;
  for (let i = 0; i < 12; i++) { signs.push(cursor); cursor = nextSign(cursor, direction); }
  return signs;
}

function subSequenceFrom(parentSign: number, config: CharaConfig): number[] {
  const directionSign = config.antardashaDirection === 'dasha-rasi-9h' ? ninthFrom(parentSign) : parentSign;
  const direction = directionFor(directionSign);
  const signs: number[] = [];
  let cursor = config.antardashaStart === 'next-dasha-rasi' ? nextSign(parentSign, direction) : parentSign;
  for (let i = 0; i < 12; i++) { signs.push(cursor); cursor = nextSign(cursor, direction); }
  return signs;
}

function countExclusive(fromSign: number, toSign: number, direction: 1 | -1): number {
  let count = 0;
  let cursor = fromSign;
  while (cursor !== toSign && count < 12) { cursor = nextSign(cursor, direction); count++; }
  return count;
}

function configuredLord(sign: number, config: CharaConfig): string | null {
  if (sign === 8) return config.scorpioStrongerLord;
  if (sign === 11) return config.aquariusStrongerLord;
  return SIGN_LORDS[sign]?.[0] ?? null;
}

function signDurationYears(sign: number, planets: PlanetData[], config: CharaConfig): number | null {
  const lord = configuredLord(sign, config);
  if (!lord) return null;
  const lordSign = planetSign(planets, lord);
  if (!lordSign) return null;
  const direction = directionFor(sign);
  let years = lordSign === sign ? 12 : countExclusive(sign, lordSign, direction);
  if (lordSign === EXALT[lord]) years += 1;
  if (lordSign === DEBIL[lord]) years -= 1;
  return Math.max(1, years);
}

export function calculateCharaDasha(planets: PlanetData[], ascendantSign: number, birthDate: Date, config: CharaConfig = DEFAULT_CHARA_CONFIG): CharaDashaResult | null {
  const startSign = normalizeSign(ascendantSign);
  const signs = sequenceFrom(startSign);
  const entries: CharaDashaEntry[] = [];
  let cursor = birthDate;
  for (const sign of signs) {
    const durationYears = signDurationYears(sign, planets, config);
    if (!durationYears) return null;
    const endDate = addYears(cursor, durationYears);
    entries.push({ sign, signName: charaSignName(sign), startDate: cursor, endDate, durationYears, level: 'md' });
    cursor = endDate;
  }
  return { entries, config, method: 'Chara alpha rules: Antardasha start Next Dasha Rasi; direction Dasha Rasi 9H; stronger lord Graha; Sc=Ketu; Aq=Saturn; Mahadasha cycle Equal.' };
}

export function calculateCharaSubDashas(parent: CharaDashaEntry, level: CharaLevel, config: CharaConfig = DEFAULT_CHARA_CONFIG): CharaDashaEntry[] {
  const signs = subSequenceFrom(parent.sign, config);
  const durationYears = parent.durationYears / 12;
  const entries: CharaDashaEntry[] = [];
  let cursor = parent.startDate;
  for (const sign of signs) {
    const endDate = addYears(cursor, durationYears);
    entries.push({ sign, signName: charaSignName(sign), startDate: cursor, endDate, durationYears, level });
    cursor = endDate;
  }
  return entries;
}
