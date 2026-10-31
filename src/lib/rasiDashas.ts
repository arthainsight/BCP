import type { RasiDashaOptions } from '../types';
import { brahma, narayanaYears, signLord, strongerSign as strongerSignOf, toJaiminiChart, dignity, type Graha, type JaiminiChart } from './jaiminiStrength';
import { SIGN_ABBR, SIGN_NAMES } from './signs';
import { atmakarakaOf, brahmaByText } from './brahmaGraha';
import { jaiminiSubSigns } from './charaClean';
import {
  charaYears, drigOrder, kendradiOrder, kendradiStart, shulaOrder, SHULA_HOUSES, sthiraYears, trikonaOrder, yogardhaOrder, yogardhaYears,
} from './jaiminiRasiDashas';
import { addDashaYears } from './time';
type PlanetData = { name: string; sign: number; degree: number; longitude: number; house?: number };

// The year is the one the user chose (time.ts); PyJHora's own is the sidereal one, 365.256364 days.
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

export type RasiDashaSystem = 'narayana' | 'moola' | 'sthira' | 'yogardha' | 'drig' | 'trikona' | 'shula';
/** The systems the Jaimini Sūtras give (and BPHS 46); the Nārāyaṇa is PVR's and not in the edition read. */
export const JAIMINI_RASI_SYSTEMS: readonly RasiDashaSystem[] = ['sthira', 'yogardha', 'drig', 'trikona', 'shula'];

/** What the page knows that the planets do not say: the degree of the Lagna and how the Ātmakāraka is chosen. */
export interface RasiDashaContext { ascendantLongitude?: number; karaka?: { rankMode?: 'degree' | 'minute'; count?: 7 | 8 } }

/** The options of the PyJHora way throughout, for comparing with PyJHora. */
export const PYJHORA_RASI_OPTIONS: RasiDashaOptions = { narayanaSeed: 'stronger-lagna-seventh', moolaSeed: 'stronger-lagna-seventh', sthiraMethod: 'brahma-pvr', brahmaMethod: 'pyjhora', moolaMethod: 'pyjhora' };
export interface RasiDashaEntry {
  sign: number; signName: string; abbr: string; startDate: Date; endDate: Date;
  durationYears: number; childOrder: number[]; cycle?: number; calculation: string;
  /** The sub-periods follow the Jaimini Sūtras (set for the Sthira and Mūla by the settings, always for the other systems). */
  sthiraJaimini?: boolean;
  /** 1-based natal ascendant, carried so sub-periods can be derived from the entry alone. */
  ascSign: number;
}
export interface RasiDashaResult { system: RasiDashaSystem; seedSign: number; basis: string; method: string; audit: string[]; entries: RasiDashaEntry[]; }

const norm = (n: number) => ((n % 12) + 12) % 12;
const addYears = addDashaYears;
const signOf = (planets: PlanetData[], name: string) => planets.find(p => p.name === name)?.sign != null ? planets.find(p => p.name === name)!.sign - 1 : null;

function narayanaDuration(chart: JaiminiChart, sign: number): { years: number; explanation: string } {
  const lord = signLord(chart, sign);
  const lordSign = chart.positions[lord].sign;
  const years = narayanaYears(chart, sign);
  const d = dignity(lord, lordSign);
  const direction = [3, 4, 5, 9, 10, 11].includes(sign) ? 'reverse/even-footed' : 'forward/odd-footed';
  const coLord = sign === 7 || sign === 10 ? ' (stronger co-lord)' : '';
  return { years, explanation: `${lord}${coLord} in ${SIGN_NAMES[lordSign]} · ${direction} count${d === 4 ? ' + 1 exalted' : d === 0 ? ' − 1 debilitated' : ''} → ${years} y` };
}

function narayanaOrder(seed: number, planets: PlanetData[]): number[] {
  if (signOf(planets, 'Ketu') === seed) return [...NARAYANA_KETU[seed]];
  if (signOf(planets, 'Saturn') === seed) return Array.from({ length: 12 }, (_, i) => norm(seed + i));
  return [...NARAYANA_NORMAL[seed]];
}

function sequentialOrder(seed: number, direction: 1 | -1): number[] {
  return Array.from({ length: 12 }, (_, index) => norm(seed + direction * index));
}

function childOrder(system: RasiDashaSystem, sign: number, planets: PlanetData[], ascSign: number, sthiraJaimini = false): number[] {
  // Jaimini Sūtras 2.3.1–2: an odd sign runs through the twelve from itself in order, an even one from its 7th in reverse.
  const sthiraLike = () => sign % 2 === 1 ? sequentialOrder(norm(sign + 6), -1) : sequentialOrder(sign, 1);
  if (system === 'sthira') return sthiraJaimini ? sthiraLike() : sequentialOrder(sign, 1);
  // Dṛg, Trikoṇa and Śūla take the sub-periods as the Sthira does (2.3.1–2 and the verse quoted with 2.4.25); the Yogārdha as the Chara (2.4.7–10).
  if (system === 'drig' || system === 'trikona' || system === 'shula') return sthiraLike();
  if (system === 'yogardha') {
    const chart = toJaiminiChart(planets, ascSign);
    return jaiminiSubSigns(sign + 1, strongerSignOf(chart, sign, norm(sign + 6)) + 1).map(item => item - 1);
  }
  // The Kendrādi of the Sūtras (2.4.11–14): the sub-periods from the sign itself, the angles, then the 2nd/5th/8th/11th, then the rest, each group by strength.
  if (system === 'moola' && sthiraJaimini) return kendradiOrder(toJaiminiChart(planets, ascSign), sign);
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

function makeEntry(system: RasiDashaSystem, sign: number, startDate: Date, years: number, planets: PlanetData[], ascSign: number, cycle?: number, calculation?: string, sthiraJaimini = false): RasiDashaEntry {
  return { ascSign, sign, signName: SIGN_NAMES[sign], abbr: SIGN_ABBR[sign], startDate, endDate: addYears(startDate, years), durationYears: years, sthiraJaimini, childOrder: childOrder(system, sign, planets, ascSign, sthiraJaimini), cycle, calculation: calculation ?? `Equal split of parent · ${years.toFixed(6)} y` };
}

export function calculateRasiDasha(system: RasiDashaSystem, planets: PlanetData[], ascSignOneBased: number, birthDate: Date, options: RasiDashaOptions = { narayanaSeed: 'stronger-lagna-seventh', moolaSeed: 'stronger-lagna-seventh', sthiraMethod: 'jaimini' }, context: RasiDashaContext = {}): RasiDashaResult {
  const asc = norm(ascSignOneBased - 1);
  const chart = toJaiminiChart(planets, ascSignOneBased);
  const stronger = strongerSignOf(chart, asc, norm(asc + 6));
  let seed = stronger;
  const moolaByText = system === 'moola' && options.moolaMethod !== 'pyjhora';
  if (system === 'narayana' && options.narayanaSeed === 'lagna') seed = asc;
  if (system === 'moola' && !moolaByText && options.moolaSeed === 'lagna') seed = asc;
  let basis = `${system === 'narayana' && options.narayanaSeed === 'lagna' || system === 'moola' && options.moolaSeed === 'lagna' ? 'Lagna' : 'stronger of Lagna/7th'}: ${SIGN_NAMES[seed]}`;
  let method = 'PVR/JHora-compatible rāśi rules';
  const audit = [`Lagna: ${SIGN_NAMES[asc]}`, `7th: ${SIGN_NAMES[norm(asc + 6)]}`, `Stronger of the two: ${SIGN_NAMES[stronger]}`];
  let order: number[];
  /** Whether the sub-periods follow the Jaimini Sūtras. */
  let byText = true;
  /** The years of a sign when the daśā is a single round (the text's) and not the two rounds of PVR. */
  let singleRound: ((sign: number) => { years: number; explanation: string }) | null = null;

  if (system === 'narayana') {
    byText = false;
    order = narayanaOrder(seed, planets);
    method = options.narayanaSeed === 'lagna' ? 'Nārāyaṇa · Lagna-seed research variant' : 'Nārāyaṇa · PVR/JHora stronger Lagna/7th variant';
    audit.push(`Seed option: ${options.narayanaSeed === 'lagna' ? 'Lagna only' : 'stronger Lagna/7th'}`);
  } else if (system === 'moola' && !moolaByText) {
    byText = false;
    let direction: 1 | -1 = seed % 2 === 0 ? 1 : -1;
    if (signOf(planets, 'Saturn') === seed) direction = 1;
    else if (signOf(planets, 'Ketu') === seed) direction = -1;
    const offsets = [0,3,6,9,1,4,7,10,2,5,8,11];
    order = offsets.map(offset => norm(seed + direction * offset));
    basis = `Lagna Kendrādi · ${basis}`;
    method = options.moolaSeed === 'lagna' ? 'Lagna Kendrādi Rāśi (Mūla) · Lagna-seed research variant' : 'Lagna Kendrādi Rāśi (Mūla) · PVR/JHora stronger Lagna/7th variant';
    audit.push(`Seed option: ${options.moolaSeed === 'lagna' ? 'Lagna only' : 'stronger Lagna/7th'}`);
    audit.push(`Progression direction: ${direction === 1 ? 'forward' : 'reverse'}`, 'Order: kendras → pāṇapharas → apoklimas');
  } else if (system === 'moola') {
    // Kendrādi rāśi daśā, Jaimini Sūtras 2.4.11–14 with the commentary: from the stronger of the Ātmakāraka's sign and its 7th.
    const karaka = atmakarakaOf(planets, context.karaka);
    const karakaSign = karaka ? chart.positions[karaka].sign : asc;
    seed = karaka ? kendradiStart(chart, karakaSign) : stronger;
    order = kendradiOrder(chart, seed);
    basis = karaka ? `Ātmakāraka ${karaka} in ${SIGN_NAMES[karakaSign]} → ${SIGN_NAMES[seed]} (stronger of it and its 7th)` : `No Ātmakāraka found; ${SIGN_NAMES[seed]}`;
    method = 'Kendrādi rāśi daśā · Jaimini Sūtras 2.4.11–14';
    audit.push(karaka ? `Ātmakāraka: ${karaka} in ${SIGN_NAMES[karakaSign]}; its 7th: ${SIGN_NAMES[norm(karakaSign + 6)]}; start: ${SIGN_NAMES[seed]}` : 'No Ātmakāraka found: the stronger of Lagna/7th is the start',
      'Order: the start, the angles, the 2nd/5th/8th/11th, the 3rd/6th/9th/12th, each group by strength; equal strength: the sign with more years (the commentary)',
      'Years: as in the Chara daśā (the count to the lord, less one), one round of twelve signs');
    singleRound = sign => ({ years: charaYears(chart, sign), explanation: `Chara years of ${SIGN_NAMES[sign]} → ${charaYears(chart, sign)} y` });
  } else if (system === 'sthira') {
    const byTextBrahma = (options.brahmaMethod ?? 'jaimini') !== 'pyjhora';
    let graha: Graha;
    const found = byTextBrahma
      ? brahmaByText(planets.map(planet => ({ ...planet, longitude: planet.longitude })), ascSignOneBased, context.ascendantLongitude ?? (ascSignOneBased - 1) * 30 + 15, context.karaka)
      : null;
    if (found?.graha) {
      graha = found.graha;
      seed = chart.positions[found.graha].sign;
      audit.push(...found.steps.map(step => `Brahma · ${step}`));
      if (context.ascendantLongitude === undefined) audit.push('The degree of the Lagna was not given: the middle of the sign is taken for "behind"');
    } else {
      graha = brahma(chart);
      seed = chart.positions[graha].sign;
      if (byTextBrahma) audit.push(...(found?.steps ?? []).map(step => `Brahma · ${step}`), 'No graha meets the marks of the text: the scoring of PyJHora is used');
    }
    // Jaimini Sūtras 2.3.4 and the commentary: from the sign of Brahma, direct if it is odd, reverse if even.
    const jaimini = options.sthiraMethod !== 'brahma-pvr';
    byText = jaimini;
    order = sequentialOrder(seed, jaimini && seed % 2 === 1 ? -1 : 1);
    basis = `Brahma: ${graha} in ${SIGN_NAMES[seed]}${byTextBrahma && found?.graha ? ' (Jaimini 2.1.49–54)' : ' (scoring of PyJHora)'}`;
    method = jaimini ? 'Sthira · Jaimini Sūtras 2.3 (Brahma seed)' : 'Sthira · PVR/JHora Brahma-seed variant';
    audit.push(`Brahma candidate selected: ${graha}`, `Brahma sign: ${SIGN_NAMES[seed]}`, jaimini ? `MD order: ${seed % 2 === 1 ? 'reverse (even sign)' : 'forward (odd sign)'} from Brahma sign` : 'MD order: forward from Brahma sign');
    singleRound = sign => ({ years: sthiraYears(sign), explanation: `${MOVABLE.has(sign) ? 'movable' : FIXED.has(sign) ? 'fixed' : 'dual'} sign → ${sthiraYears(sign)} y` });
  } else if (system === 'yogardha') {
    seed = stronger;
    order = yogardhaOrder(chart, seed);
    basis = `stronger of Lagna/7th: ${SIGN_NAMES[seed]}`;
    method = 'Yogārdha · Jaimini Sūtras 2.4.19–20, BPHS 46.174';
    audit.push('Years: half the sum of the Chara and the Sthira years of the sign', 'The text does not give the direction: the signs are taken in order, as the commentary\'s example does');
    singleRound = sign => ({ years: yogardhaYears(chart, sign), explanation: `(Chara ${charaYears(chart, sign)} + Sthira ${sthiraYears(sign)}) / 2 = ${yogardhaYears(chart, sign)} y` });
  } else if (system === 'drig') {
    order = drigOrder(asc);
    seed = order[0];
    basis = `9th from the Lagna: ${SIGN_NAMES[seed]}`;
    method = 'Dṛg · Jaimini Sūtras 2.4.21–23, BPHS 46.185–187';
    audit.push('Order: the 9th with the signs it glances at, the 10th with its, the 11th with its (the nearer first); a sign already placed is not placed again', `${order.length} signs`, 'Years: as in the Sthira daśā');
    if (order.length < 12) audit.push(`The text names no more than these ${order.length} signs`);
    singleRound = sign => ({ years: sthiraYears(sign), explanation: `Sthira years → ${sthiraYears(sign)} y` });
  } else if (system === 'trikona') {
    const trikona = trikonaOrder(chart, asc);
    seed = trikona.start;
    order = trikona.order;
    basis = `strongest of Lagna, 5th and 9th: ${SIGN_NAMES[seed]}`;
    method = 'Trikoṇa · Jaimini Sūtras 2.4.24–25, BPHS 46.183–184';
    audit.push('Order: each sign with its 5th and 9th, four such groups in the order of the start (direct from an odd sign, reverse from an even one)', 'Years: as in the Chara daśā');
    singleRound = sign => ({ years: charaYears(chart, sign), explanation: `Chara years of ${SIGN_NAMES[sign]} → ${charaYears(chart, sign)} y` });
  } else {
    const house = SHULA_HOUSES[options.shulaFor ?? 'self'];
    const shula = shulaOrder(chart, asc, house);
    seed = shula.start;
    order = shula.order;
    basis = `stronger of the ${house}th from the Lagna and from the 7th: ${SIGN_NAMES[seed]}`;
    method = `Śūla · Jaimini Sūtras 2.3.18–25, BPHS 46.181–182 · ${options.shulaFor ?? 'self'}`;
    audit.push(`Read for: ${options.shulaFor ?? 'self'} (the ${house}th)`, 'Order: direct from an odd sign, reverse from an even one; years as in the Sthira daśā');
    singleRound = sign => ({ years: sthiraYears(sign), explanation: `Sthira years → ${sthiraYears(sign)} y` });
  }
  if (system === 'narayana') audit.push(`Progression: ${signOf(planets, 'Ketu') === seed ? 'Ketu exception' : signOf(planets, 'Saturn') === seed ? 'Saturn exception' : 'normal table'}`, 'Cycle 2 duration: 12 − cycle 1 duration');

  const entries: RasiDashaEntry[] = [];
  let cursor = birthDate;
  if (singleRound) {
    for (const sign of order) {
      const { years, explanation } = singleRound(sign);
      const item = makeEntry(system, sign, cursor, years, planets, ascSignOneBased, undefined, explanation, byText); entries.push(item); cursor = item.endDate;
    }
  } else {
    const firstDurations = order.map(sign => narayanaDuration(chart, sign));
    for (let cycle = 1; cycle <= 2; cycle++) {
      for (let index = 0; index < order.length; index++) {
        const years = cycle === 1 ? firstDurations[index].years : 12 - firstDurations[index].years;
        if (years <= 0) continue;
        const explanation = cycle === 1 ? firstDurations[index].explanation : `Cycle 2 complement: 12 − ${firstDurations[index].years} = ${years} y`;
        const item = makeEntry(system, order[index], cursor, years, planets, ascSignOneBased, cycle, explanation, false); entries.push(item); cursor = item.endDate;
      }
    }
  }
  audit.push(`MD order: ${order.map(sign => SIGN_ABBR[sign]).join(' → ')}`);
  return { system, seedSign: seed, basis, method, audit, entries };
}

export function calculateRasiSubDashas(parent: RasiDashaEntry, planets: PlanetData[], system: RasiDashaSystem): RasiDashaEntry[] {
  const years = parent.durationYears / 12;
  let cursor = parent.startDate;
  return parent.childOrder.map(sign => {
    const item = makeEntry(system, sign, cursor, years, planets, parent.ascSign, undefined, undefined, parent.sthiraJaimini); cursor = item.endDate; return item;
  });
}
