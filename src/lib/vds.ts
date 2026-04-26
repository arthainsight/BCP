// VDS — Vimshottari Dasha (Original / Old Method)
// Separate calculation engine. Does NOT modify vimshottari.ts.
// Sub-dashas reuse the proportional formula from vimshottari.ts.

import { MahadashaEntry } from './vimshottari';

const NAKSHATRA_SIZE = 360 / 27;

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// Standard Vimshottari sequence and durations — same for VDS
const LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
] as const;
type Lord = (typeof LORDS)[number];

const YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

// ANC — nakshatra index (0–26) → ruling planet for each cycle.
//
// Krittikadi: Sun starts ruling at Krittika (idx 2).
// Sequence per set of 3: Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury, Ketu, Venus.
const KRITTIKADI_ANC: Record<number, Lord> = {
   2: 'Sun',     11: 'Sun',     20: 'Sun',
   3: 'Moon',    12: 'Moon',    21: 'Moon',
   4: 'Mars',    13: 'Mars',    22: 'Mars',
   5: 'Rahu',    14: 'Rahu',    23: 'Rahu',
   6: 'Jupiter', 15: 'Jupiter', 24: 'Jupiter',
   7: 'Saturn',  16: 'Saturn',  25: 'Saturn',
   8: 'Mercury', 17: 'Mercury', 26: 'Mercury',
   9: 'Ketu',    18: 'Ketu',     0: 'Ketu',
  10: 'Venus',   19: 'Venus',    1: 'Venus',
};

// Ardradi: Sun starts ruling at Ardra (idx 5).
// Same sequence per set of 3.
// Mercury → Uttara Phalguni (11), Uttara Ashadha (20), Krittika (2) — completes the 27.
const ARDRADI_ANC: Record<number, Lord> = {
   5: 'Sun',     14: 'Sun',     23: 'Sun',
   6: 'Moon',    15: 'Moon',    24: 'Moon',
   7: 'Mars',    16: 'Mars',    25: 'Mars',
   8: 'Rahu',    17: 'Rahu',    26: 'Rahu',
   9: 'Jupiter', 18: 'Jupiter',  0: 'Jupiter',
  10: 'Saturn',  19: 'Saturn',   1: 'Saturn',
  11: 'Mercury', 20: 'Mercury',  2: 'Mercury',
  12: 'Ketu',    21: 'Ketu',     3: 'Ketu',
  13: 'Venus',   22: 'Venus',    4: 'Venus',
};

function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
}

function nakIndex(longitude: number): number {
  return Math.floor(longitude / NAKSHATRA_SIZE) % 27;
}

export type VdsCycle = 'krittikadi' | 'ardradi';

export interface VdsResult {
  cycle: VdsCycle;
  dtp: string;
  dtpNakshatra: string;
  dop: string;
  dopNakshatra: string;
  entries: MahadashaEntry[];
}

export interface VdsInput {
  moonLongitude: number;
  sunLongitude: number;
  lagnaLongitude: number;
  lagnaSign: number;    // 1–12
  lagnaDegree: number;  // 0–30 within sign
  birthDate: Date;
  planetLongitudes: Record<string, number>;
}

export function calculateVds(input: VdsInput): VdsResult | null {
  const {
    moonLongitude, sunLongitude, lagnaLongitude,
    lagnaSign, lagnaDegree, birthDate, planetLongitudes,
  } = input;

  // Step 1: Paksha — Shukla (waxing) if Moon is 0–180° ahead of Sun
  const moonSunDiff = (moonLongitude - sunLongitude + 360) % 360;
  const isShukla = moonSunDiff < 180;

  // Step 2: Hora of Lagna
  // Odd signs (1,3,5,7,9,11): first 15° = Sun Hora, last 15° = Moon Hora
  // Even signs (2,4,6,8,10,12): first 15° = Moon Hora, last 15° = Sun Hora
  const lagnaIsOdd = lagnaSign % 2 === 1;
  const inFirstHora = lagnaDegree < 15;
  const horaOfLagna: 'sun' | 'moon' = lagnaIsOdd
    ? (inFirstHora ? 'sun' : 'moon')
    : (inFirstHora ? 'moon' : 'sun');

  // Step 3: Determine applicable cycle
  // Krittikadi: Shukla + Chandra Hora  OR  Krishna + Surya Hora
  // Ardradi:    Shukla + Surya Hora    OR  Krishna + Chandra Hora
  const cycle: VdsCycle =
    (isShukla && horaOfLagna === 'moon') || (!isShukla && horaOfLagna === 'sun')
      ? 'krittikadi'
      : 'ardradi';

  const ANC = cycle === 'krittikadi' ? KRITTIKADI_ANC : ARDRADI_ANC;

  // Step 4: DTP — count from Lagna nak to Moon nak (inclusive),
  // then count that same distance forward from Moon nak (inclusive start).
  const lagnaNak = nakIndex(lagnaLongitude);
  const moonNak  = nakIndex(moonLongitude);
  const count    = (moonNak - lagnaNak + 27) % 27 + 1;  // ≥ 1
  const dtpNak   = (moonNak + count - 1) % 27;
  const dtp      = ANC[dtpNak];
  if (!dtp) return null;

  // Step 5: DOP — get DTP's nakshatra in the natal chart, look up in ANC
  const dtpLng = planetLongitudes[dtp];
  if (dtpLng == null) return null;
  const dtpPlanetNak = nakIndex(dtpLng);
  const dop = ANC[dtpPlanetNak];
  if (!dop) return null;

  // Step 6: Balance at birth — based on DOP's degree within its nakshatra
  const dopLng = planetLongitudes[dop];
  if (dopLng == null) return null;
  const dopNak       = nakIndex(dopLng);
  const dopPosInNak  = dopLng - dopNak * NAKSHATRA_SIZE;
  const elapsed      = (dopPosInNak / NAKSHATRA_SIZE) * YEARS[dop];
  const balance      = YEARS[dop] - elapsed;

  // Step 7: Build 9-MD sequence starting from DOP
  const startIdx = LORDS.indexOf(dop as Lord);
  if (startIdx === -1) return null;

  const entries: MahadashaEntry[] = [];
  let cursor = birthDate;
  for (let i = 0; i < 9; i++) {
    const lord     = LORDS[(startIdx + i) % 9];
    const duration = i === 0 ? balance : YEARS[lord];
    const endDate  = addYears(cursor, duration);
    entries.push({ lord, startDate: cursor, endDate, durationYears: duration });
    cursor = endDate;
  }

  return {
    cycle,
    dtp,
    dtpNakshatra: NAKSHATRA_NAMES[dtpNak]     ?? `Nak ${dtpNak}`,
    dop,
    dopNakshatra: NAKSHATRA_NAMES[dopNak] ?? `Nak ${dopNak}`,
    entries,
  };
}
