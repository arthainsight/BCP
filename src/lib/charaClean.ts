import { CharaOptions, PlanetData } from '@/types';
import { calculateCharaKarakas } from './karakas';
import { EVEN_FOOTED, narayanaYears, signLord as jaiminiSignLord, strongerSign, toJaiminiChart, type JaiminiChart } from './jaiminiStrength';
import { signAbbr, signLord, signName } from './signs';
import { addDashaYears } from './time';

export interface CleanCharaEntry {
  /** The chart the rules of the Jaimini Sūtras read the strength of the signs from (for the sub-periods); not set by the custom method. */
  chart?: JaiminiChart;
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

const EXALT: Record<string, number> = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7, Rahu: 3, Ketu: 9 };
const DEBIL: Record<string, number> = { Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1, Rahu: 9, Ketu: 3 };
const MOVABLE = new Set([1, 4, 7, 10]);
const FIXED = new Set([2, 5, 8, 11]);

function norm(sign: number): number { return ((sign - 1 + 240) % 12) + 1; }
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
  return signLord(sign);
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
  const ak = calculateCharaKarakas(planets, options.karaka?.rankMode, options.karaka?.count).find((k) => k.karaka === 'AK');
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

/**
 * The Chara daśā by the Jaimini Sūtras. The order of the signs (2.3.29, "pañcame padakramāt prāk-pratyaktvaṃ caradaśāyām"): direct if the 9th
 * from the start is in an odd pada (Aries to Gemini, Libra to Sagittarius), reverse if in an even one. The years (2.3.26–29, BPHS 46.155–165):
 * the count from the sign to its lord, in the direction of the pada of the sign, less one; 12 for a lord in the sign; one more for an exalted
 * lord and one less for a debilitated one; a sign with two lords by the rule of the Vṛddhakārikā (jaiminiStrength.ts).
 */
function calculateJaiminiChara(planets: PlanetData[], ascSign: number, birthDate: Date, options: CharaOptions, start: { sign: number; basis: string }): CleanCharaResult {
  const chart = toJaiminiChart(planets, ascSign);
  const direction = EVEN_FOOTED.includes(norm(start.sign + 8) - 1) ? -1 : 1;
  const entries: CleanCharaEntry[] = [];
  let cursorDate = birthDate;
  let sign = start.sign;
  for (let i = 0; i < 12; i++) {
    const years = Math.max(1, narayanaYears(chart, sign - 1));
    const lord = jaiminiSignLord(chart, sign - 1);
    const endDate = addDashaYears(cursorDate, years);
    entries.push({
      chart,
      sign,
      signName: signName(sign),
      abbr: signAbbr(sign),
      startDate: cursorDate,
      endDate,
      durationYears: years,
      debug: { lord, lordSign: chart.positions[lord].sign + 1, direction: EVEN_FOOTED.includes(sign - 1) ? 'reverse' : 'forward', countMode: 'exclusive', baseCount: years, exaltDebilAdjustment: 0 },
    });
    cursorDate = endDate;
    sign = nextSign(sign, direction);
  }
  void options;
  return { startSign: start.sign, startBasis: start.basis, entries };
}

export function calculateCleanCharaMD(planets: PlanetData[], ascSign: number, birthDate: Date, options: CharaOptions): CleanCharaResult | null {
  const start = startSignFor(planets, ascSign, options);
  if (!start) return null;
  if (options.method !== 'custom') return calculateJaiminiChara(planets, ascSign, birthDate, options, start);
  const direction = directionFor(start.sign, options);
  const signs: number[] = [];
  let cursorSign = start.sign;
  for (let i = 0; i < 12; i++) { signs.push(cursorSign); cursorSign = nextSign(cursorSign, direction); }

  const entries: CleanCharaEntry[] = [];
  let cursorDate = birthDate;
  for (const sign of signs) {
    const d = durationFor(sign, planets, options);
    const endDate = addDashaYears(cursorDate, d.years);
    entries.push({
      sign,
      signName: signName(sign),
      abbr: signAbbr(sign),
      startDate: cursorDate,
      endDate,
      durationYears: d.years,
      debug: { lord: d.lord, lordSign: d.lordSign, direction: d.direction, countMode: d.countMode, baseCount: d.baseCount, exaltDebilAdjustment: d.exaltDebilAdjustment },
    });
    cursorDate = endDate;
  }

  return { startSign: start.sign, startBasis: start.basis, entries };
}

/**
 * The sub-periods by the Jaimini Sūtras (2.4.7–10 and the Vṛddhakārikā): one twelfth of the daśā each, from the stronger of the sign and its 7th.
 * A movable sign runs through the signs in order, direct for Aries and Libra, reverse for Cancer and Capricorn; a fixed sign by every sixth sign,
 * direct for Leo and Aquarius, reverse for Taurus and Scorpio; a dual sign by the angles, then the trines, then the rest (4th, 7th, 10th and 1st
 * from the start; 8th, 11th, 2nd and 5th), direct for Gemini and Sagittarius, reverse for Virgo and Pisces.
 */
export function jaiminiSubSigns(parentSign: number, strongSign: number): number[] {
  const parent = norm(parentSign) - 1;
  const start = norm(strongSign) - 1;
  const odd = [0, 2, 4, 6, 8, 10].includes(parent); // Aries, Gemini, Leo, Libra, Sagittarius, Aquarius
  const step = odd ? 1 : -1;
  const at = (offset: number) => ((start + step * offset) % 12 + 12) % 12 + 1;
  if ([0, 3, 6, 9].includes(parent)) return Array.from({ length: 12 }, (_, index) => at(index));
  if ([1, 4, 7, 10].includes(parent)) return Array.from({ length: 12 }, (_, index) => at(index * 5));
  return [0, 3, 6, 9, 4, 7, 10, 1, 8, 11, 2, 5].map(at);
}

function jaiminiSubDashas(parent: CleanCharaEntry, chart: JaiminiChart): CleanCharaEntry[] {
  const strong = strongerSign(chart, parent.sign - 1, (parent.sign + 5) % 12) + 1;
  const durationYears = parent.durationYears / 12;
  let cursorDate = parent.startDate;
  return jaiminiSubSigns(parent.sign, strong).map(sign => {
    const endDate = addDashaYears(cursorDate, durationYears);
    const lord = jaiminiSignLord(chart, sign - 1);
    const entry: CleanCharaEntry = {
      chart, sign, signName: signName(sign), abbr: signAbbr(sign), startDate: cursorDate, endDate, durationYears,
      debug: { lord, lordSign: null, direction: 'forward', countMode: 'exclusive', baseCount: 0, exaltDebilAdjustment: 0 },
    };
    cursorDate = endDate;
    return entry;
  });
}

export function calculateCleanCharaSubDashas(parent: CleanCharaEntry, options: CharaOptions): CleanCharaEntry[] {
  if (options.method !== 'custom' && parent.chart) return jaiminiSubDashas(parent, parent.chart);
  const direction = directionFor(parent.sign, options);
  const durationYears = parent.durationYears / 12;
  const entries: CleanCharaEntry[] = [];
  let sign = options.antardashaStart === 'same-dasha-rasi' ? parent.sign : nextSign(parent.sign, direction);
  let cursorDate = parent.startDate;

  for (let i = 0; i < 12; i++) {
    const endDate = addDashaYears(cursorDate, durationYears);
    entries.push({
      sign,
      signName: signName(sign),
      abbr: signAbbr(sign),
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
