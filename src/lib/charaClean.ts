import { CharaOptions, PlanetData } from '@/types';
import { calculateCharaKarakas } from './karakas';

export interface CleanCharaEntry {
  sign: number;
  signName: string;
  abbr: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  debug: {
    lord: string;
    lordSign: number | null;
    direction: 'forward' | 'reverse';
    countMode: 'inclusive' | 'exclusive';
    baseCount: number;
    exaltDebilAdjustment: number;
  };
}

export interface CleanCharaResult {
  startSign: number;
  startBasis: string;
  entries: CleanCharaEntry[];
}

const SIGN_NAMES: Record<number, string> = { 1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer', 5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio', 9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces' };
const SIGN_ABBR: Record<number, string> = { 1: 'Ar', 2: 'Ta', 3: 'Ge', 4: 'Cn', 5: 'Le', 6: 'Vi', 7: 'Li', 8: 'Sc', 9: 'Sg', 10: 'Cp', 11: 'Aq', 12: 'Pi' };
const LORDS: Record<number, string> = { 1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury', 7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter' };
const EXALT: Record<string, number> = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7, Rahu: 3, Ketu: 9 };
const DEBIL: Record<string, number> = { Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1, Rahu: 9, Ketu: 3 };
const MOVABLE = new Set([1, 4, 7, 10]);
const FIXED = new Set([2, 5, 8, 11]);

function norm(sign: number): number { return ((sign - 1 + 240) % 12) + 1; }
function addYears(date: Date, years: number): Date { return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000); }
function nextSign(sign: number, direction: 1 | -1): number { return norm(sign + direction); }
function planetSign(planets: PlanetData[], name: string): number | null { return planets.find((p) => p.name === name)?.sign ?? null; }

function directionFor(sign: number, options: CharaOptions): 1 | -1 {
  if (options.mahadashaDirection === 'odd-even') return sign % 2 === 1 ? 1 : -1;
  if (MOVABLE.has(sign)) return 1;
  if (FIXED.has(sign)) return -1;
  return -1;
}

function lordFor(sign: number, options: CharaOptions): string {
  if (sign === 8) return options.scorpioLord;
  if (sign === 11) return options.aquariusLord;
  return LORDS[sign];
}

function countSigns(from: number, to: number, direction: 1 | -1, mode: 'inclusive' | 'exclusive'): number {
  if (from === to) return mode === 'inclusive' ? 1 : 0;
  let cursor = from;
  let exclusive = 0;
  while (cursor !== to && exclusive < 12) {
    cursor = nextSign(cursor, direction);
    exclusive++;
  }
  return mode === 'inclusive' ? exclusive + 1 : exclusive;
}

function startSignFor(planets: PlanetData[], ascSign: number, options: CharaOptions): { sign: number; basis: string } | null {
  if (options.start === 'lagna') return { sign: ascSign, basis: 'Lagna' };
  const ak = calculateCharaKarakas(planets).find((k) => k.karaka === 'AK');
  const p = ak ? planets.find((planet) => planet.name === ak.planet) : null;
  return p ? { sign: p.sign, basis: `AK ${p.name}` } : null;
}

function durationFor(sign: number, planets: PlanetData[], options: CharaOptions): CleanCharaEntry['debug'] & { years: number } {
  const lord = lordFor(sign, options);
  const lordSign = planetSign(planets, lord);
  const direction = directionFor(sign, options);
  if (!lordSign) {
    return { lord, lordSign, direction: direction === 1 ? 'forward' : 'reverse', countMode: options.durationCount, baseCount: 12, exaltDebilAdjustment: 0, years: 12 };
  }
  const baseCount = sign === lordSign ? 12 : countSigns(sign, lordSign, direction, options.durationCount);
  let exaltDebilAdjustment = 0;
  if (options.exaltDebilAdjust) {
    if (lordSign === EXALT[lord]) exaltDebilAdjustment = 1;
    if (lordSign === DEBIL[lord]) exaltDebilAdjustment = -1;
  }
  const years = Math.max(1, baseCount + exaltDebilAdjustment);
  return { lord, lordSign, direction: direction === 1 ? 'forward' : 'reverse', countMode: options.durationCount, baseCount, exaltDebilAdjustment, years };
}

export function calculateCleanCharaMD(planets: PlanetData[], ascSign: number, birthDate: Date, options: CharaOptions): CleanCharaResult | null {
  const start = startSignFor(planets, ascSign, options);
  if (!start) return null;
  const direction = directionFor(start.sign, options);
  const signs: number[] = [];
  let cursorSign = start.sign;
  for (let i = 0; i < 12; i++) { signs.push(cursorSign); cursorSign = nextSign(cursorSign, direction); }

  const entries: CleanCharaEntry[] = [];
  let cursorDate = birthDate;
  for (const sign of signs) {
    const d = durationFor(sign, planets, options);
    const endDate = addYears(cursorDate, d.years);
    entries.push({
      sign,
      signName: SIGN_NAMES[sign],
      abbr: SIGN_ABBR[sign],
      startDate: cursorDate,
      endDate,
      durationYears: d.years,
      debug: { lord: d.lord, lordSign: d.lordSign, direction: d.direction, countMode: d.countMode, baseCount: d.baseCount, exaltDebilAdjustment: d.exaltDebilAdjustment },
    });
    cursorDate = endDate;
  }

  return { startSign: start.sign, startBasis: start.basis, entries };
}

export function calculateCleanCharaSubDashas(parent: CleanCharaEntry, options: CharaOptions): CleanCharaEntry[] {
  const direction = directionFor(parent.sign, options);
  const durationYears = parent.durationYears / 12;
  const entries: CleanCharaEntry[] = [];
  let sign = options.antardashaStart === 'same-dasha-rasi' ? parent.sign : nextSign(parent.sign, direction);
  let cursorDate = parent.startDate;

  for (let i = 0; i < 12; i++) {
    const endDate = addYears(cursorDate, durationYears);
    entries.push({
      sign,
      signName: SIGN_NAMES[sign],
      abbr: SIGN_ABBR[sign],
      startDate: cursorDate,
      endDate,
      durationYears,
      debug: { lord: lordFor(sign, options), lordSign: null, direction: direction === 1 ? 'forward' : 'reverse', countMode: options.durationCount, baseCount: 0, exaltDebilAdjustment: 0 },
    });
    cursorDate = endDate;
    sign = nextSign(sign, direction);
  }
  return entries;
}
