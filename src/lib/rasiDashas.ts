import type { RasiDashaOptions } from '../types';
import { brahma, narayanaYears, signLord, strongerSign as strongerSignOf, toJaiminiChart, dignity, type JaiminiChart } from './jaiminiStrength';
type PlanetData = { name: string; sign: number; degree: number; longitude: number; house?: number };

// JHora/PyJHora sidereal-year basis. Keeping this centralized prevents period dates drifting by days over long cycles.
export const RASI_DASHA_YEAR_DAYS = 365.256364;
const YEAR_MS = RASI_DASHA_YEAR_DAYS * 24 * 60 * 60 * 1000;
export const RASI_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] as const;
export const RASI_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'] as const;
const MOVABLE = new Set([0, 3, 6, 9]);
const FIXED = new Set([1, 4, 7, 10]);

const NARAYANA_NORMAL = [
  [0,1,2,3,4,5,6,7,8,9,10,11], [1,8,3,10,5,0,7,2,9,4,11,6],
  [2,10,6,5,1,9,8,4,0,11,7,3], [3,2,1,0,11,10,9,8,7,6,5,4],
  [4,9,2,7,0,5,10,3,8,1,6,11], [5,9,1,2,6,10,11,3,7,8,0,4],
  [6,7,8,9,10,11,0,1,2,3,4,5], [7,2,9,4,11,6,1,8,3,10,5,0],
  [8,4,0,11,7,3,2,10,6,5,1,9], [9,8,7,6,5,4,3,2,1,0,11,10],
  [10,3,8,1,6,11,4,9,2,7,0,5], [11,3,7,8,0,4,5,9,1,2,6,10],
] as const;
const NARAYANA_KETU = [
  [0,11,10,9,8,7,6,5,4,3,2,1], [1,6,11,4,9,2,7,0,5,10,3,8],
  [2,6,10,11,3,7,8,0,4,5,9,1], [3,4,5,6,7,8,9,10,11,0,1,2],
  [4,11,6,1,8,3,10,5,0,7,2,9], [5,1,9,8,4,0,11,7,3,2,10,6],
  [6,5,4,3,2,1,0,11,10,9,8,7], [7,0,5,10,3,8,1,6,11,4,9,2],
  [8,0,4,5,9,1,2,6,10,11,3,7], [9,10,11,0,1,2,3,4,5,6,7,8],
  [10,5,0,7,2,9,4,11,6,1,8,3], [11,7,3,2,10,6,5,1,9,8,4,0],
] as const;

export type RasiDashaSystem = 'narayana' | 'moola' | 'sthira';
export interface RasiDashaEntry {
  sign: number; signName: string; abbr: string; startDate: Date; endDate: Date;
  durationYears: number; childOrder: number[]; cycle?: number; calculation: string;
  /** 1-based natal ascendant, carried so sub-periods can be derived from the entry alone. */
  ascSign: number;
}
export interface RasiDashaResult { system: RasiDashaSystem; seedSign: number; basis: string; method: string; audit: string[]; entries: RasiDashaEntry[]; }

const norm = (n: number) => ((n % 12) + 12) % 12;
const addYears = (date: Date, years: number) => new Date(date.getTime() + years * YEAR_MS);
const signOf = (planets: PlanetData[], name: string) => planets.find(p => p.name === name)?.sign != null ? planets.find(p => p.name === name)!.sign - 1 : null;

function narayanaDuration(chart: JaiminiChart, sign: number): { years: number; explanation: string } {
  const lord = signLord(chart, sign);
  const lordSign = chart.positions[lord].sign;
  const years = narayanaYears(chart, sign);
  const d = dignity(lord, lordSign);
  const direction = [3, 4, 5, 9, 10, 11].includes(sign) ? 'reverse/even-footed' : 'forward/odd-footed';
  const coLord = sign === 7 || sign === 10 ? ' (stronger co-lord)' : '';
  return { years, explanation: `${lord}${coLord} in ${RASI_NAMES[lordSign]} · ${direction} count${d === 4 ? ' + 1 exalted' : d === 0 ? ' − 1 debilitated' : ''} → ${years} y` };
}

function narayanaOrder(seed: number, planets: PlanetData[]): number[] {
  if (signOf(planets, 'Ketu') === seed) return [...NARAYANA_KETU[seed]];
  if (signOf(planets, 'Saturn') === seed) return Array.from({ length: 12 }, (_, i) => norm(seed + i));
  return [...NARAYANA_NORMAL[seed]];
}

function sequentialOrder(seed: number, direction: 1 | -1): number[] {
  return Array.from({ length: 12 }, (_, index) => norm(seed + direction * index));
}

function childOrder(system: RasiDashaSystem, sign: number, planets: PlanetData[], ascSign: number): number[] {
  if (system === 'sthira') return sequentialOrder(sign, 1);
  if (system === 'moola') {
    let direction: 1 | -1 = sign % 2 === 0 ? 1 : -1;
    if (signOf(planets, 'Saturn') === sign) direction = 1;
    if (signOf(planets, 'Ketu') === sign) direction = direction === 1 ? -1 : 1;
    return sequentialOrder(sign, direction);
  }
  // Antardaśās start from the stronger of the signs holding the daśā sign's
  // lord and its 7th lord; co-lords are weighed as during a daśā.
  const chart = toJaiminiChart(planets, ascSign);
  const lordSign = chart.positions[signLord(chart, sign, true)].sign;
  const seventhLordSign = chart.positions[signLord(chart, norm(sign + 6), true)].sign;
  const seed = strongerSignOf(chart, lordSign, seventhLordSign);
  let direction: 1 | -1 = seed % 2 === 0 ? 1 : -1;
  if (signOf(planets, 'Saturn') === seed) direction = 1;
  if (signOf(planets, 'Ketu') === sign) direction = direction === 1 ? -1 : 1;
  return sequentialOrder(seed, direction);
}

function makeEntry(system: RasiDashaSystem, sign: number, startDate: Date, years: number, planets: PlanetData[], ascSign: number, cycle?: number, calculation?: string): RasiDashaEntry {
  return { ascSign, sign, signName: RASI_NAMES[sign], abbr: RASI_ABBR[sign], startDate, endDate: addYears(startDate, years), durationYears: years, childOrder: childOrder(system, sign, planets, ascSign), cycle, calculation: calculation ?? `Equal split of parent · ${years.toFixed(6)} y` };
}

export function calculateRasiDasha(system: RasiDashaSystem, planets: PlanetData[], ascSignOneBased: number, birthDate: Date, options: RasiDashaOptions = { narayanaSeed: 'stronger-lagna-seventh', moolaSeed: 'stronger-lagna-seventh', sthiraMethod: 'brahma-pvr' }): RasiDashaResult {
  const asc = norm(ascSignOneBased - 1);
  const chart = toJaiminiChart(planets, ascSignOneBased);
  let seed = strongerSignOf(chart, asc, norm(asc + 6));
  if (system === 'narayana' && options.narayanaSeed === 'lagna') seed = asc;
  if (system === 'moola' && options.moolaSeed === 'lagna') seed = asc;
  let basis = `${system === 'sthira' || options[system === 'narayana' ? 'narayanaSeed' : 'moolaSeed'] === 'stronger-lagna-seventh' ? 'stronger of Lagna/7th' : 'Lagna'}: ${RASI_NAMES[seed]}`;
  let method = 'PVR/JHora-compatible rāśi rules';
  const audit = [`Lagna: ${RASI_NAMES[asc]}`, `7th: ${RASI_NAMES[norm(asc + 6)]}`, `Selected seed: ${RASI_NAMES[seed]}`];
  let order: number[];
  if (system === 'narayana') {
    order = narayanaOrder(seed, planets);
    method = options.narayanaSeed === 'lagna' ? 'Nārāyaṇa · Lagna-seed research variant' : 'Nārāyaṇa · PVR/JHora stronger Lagna/7th variant';
    audit.push(`Seed option: ${options.narayanaSeed === 'lagna' ? 'Lagna only' : 'stronger Lagna/7th'}`);
  }
  else if (system === 'moola') {
    let direction: 1 | -1 = seed % 2 === 0 ? 1 : -1;
    if (signOf(planets, 'Saturn') === seed) direction = 1;
    else if (signOf(planets, 'Ketu') === seed) direction = -1;
    const offsets = [0,3,6,9,1,4,7,10,2,5,8,11];
    order = offsets.map(offset => norm(seed + direction * offset));
    basis = `Lagna Kendrādi · ${basis}`;
    method = options.moolaSeed === 'lagna' ? 'Lagna Kendrādi Rāśi (Mūla) · Lagna-seed research variant' : 'Lagna Kendrādi Rāśi (Mūla) · PVR/JHora stronger Lagna/7th variant';
    audit.push(`Seed option: ${options.moolaSeed === 'lagna' ? 'Lagna only' : 'stronger Lagna/7th'}`);
    audit.push(`Progression direction: ${direction === 1 ? 'forward' : 'reverse'}`, 'Order: kendras → pāṇapharas → apoklimas');
  } else {
    const brahmaGraha = brahma(chart);
    seed = chart.positions[brahmaGraha].sign; order = sequentialOrder(seed, 1);
    basis = `Brahma: ${brahmaGraha} in ${RASI_NAMES[seed]}`;
    method = 'Sthira · PVR/JHora Brahma-seed variant';
    audit.push(`Brahma candidate selected: ${brahmaGraha}`, `Brahma sign: ${RASI_NAMES[seed]}`, 'MD order: forward from Brahma sign');
  }
  if (system === 'narayana') audit.push(`Progression: ${signOf(planets, 'Ketu') === seed ? 'Ketu exception' : signOf(planets, 'Saturn') === seed ? 'Saturn exception' : 'normal table'}`, 'Cycle 2 duration: 12 − cycle 1 duration');

  const entries: RasiDashaEntry[] = [];
  let cursor = birthDate;
  if (system === 'sthira') {
    for (const sign of order) {
      const years = MOVABLE.has(sign) ? 7 : FIXED.has(sign) ? 8 : 9;
      const modality = MOVABLE.has(sign) ? 'movable' : FIXED.has(sign) ? 'fixed' : 'dual';
      const item = makeEntry(system, sign, cursor, years, planets, ascSignOneBased, undefined, `${modality} sign → ${years} y`); entries.push(item); cursor = item.endDate;
    }
  } else {
    const firstDurations = order.map(sign => narayanaDuration(chart, sign));
    for (let cycle = 1; cycle <= 2; cycle++) {
      for (let index = 0; index < order.length; index++) {
        const years = cycle === 1 ? firstDurations[index].years : 12 - firstDurations[index].years;
        if (years <= 0) continue;
        const explanation = cycle === 1 ? firstDurations[index].explanation : `Cycle 2 complement: 12 − ${firstDurations[index].years} = ${years} y`;
        const item = makeEntry(system, order[index], cursor, years, planets, ascSignOneBased, cycle, explanation); entries.push(item); cursor = item.endDate;
      }
    }
  }
  audit.push(`MD order: ${order.map(sign => RASI_ABBR[sign]).join(' → ')}`);
  return { system, seedSign: seed, basis, method, audit, entries };
}

export function calculateRasiSubDashas(parent: RasiDashaEntry, planets: PlanetData[], system: RasiDashaSystem): RasiDashaEntry[] {
  const years = parent.durationYears / 12;
  let cursor = parent.startDate;
  return parent.childOrder.map(sign => {
    const item = makeEntry(system, sign, cursor, years, planets, parent.ascSign); cursor = item.endDate; return item;
  });
}
