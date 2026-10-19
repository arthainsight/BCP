import { normalizeDegrees as normalize } from './angles';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';

// The sensitive degrees of the signs, as Jagannatha Hora counts them: the junctions of signs (Sandhi) and of water and fire signs
// (Gandanta), the degrees of death (Mṛtyu Bhāga), and the Puṣkara navāṁśas and degrees.
//
// A point is a graha, the Lagna or Māndi, given by its longitude (the sign is the sidereal one). Nothing here knows about charts.

/** How close to the boundary of a sign a point is in Sandhi (JHora's `rasi_sandhi_duration`). */
export const SANDHI_ORB = 1;

/** The pada of a nakṣatra, 3°20', which is the Gandanta on each side of a water and fire junction. */
export const GANDANTA_ORB = NAKSHATRA_SIZE / 4;

/** Two ghaṭīs of a nakṣatra, 13°20' / 30 = 0°26'40": the closest part of the Gandanta, taken as its strongest. */
export const GANDANTA_CORE = NAKSHATRA_SIZE / 30;

export interface SandhiResult {
  /** Which boundary: the point is that close to the start of its sign or to the end of it. */
  edge: 'start' | 'end';
  /** Degrees from the boundary. */
  distance: number;
}

/** Within SANDHI_ORB of the boundary of its sign. */
export function sandhiOf(longitude: number): SandhiResult | null {
  const degree = normalize(longitude) % 30;
  if (degree < SANDHI_ORB) return { edge: 'start', distance: degree };
  if (degree > 30 - SANDHI_ORB) return { edge: 'end', distance: 30 - degree };
  return null;
}

export interface GandantaResult {
  /** The nakṣatra the point is in, and the one on the other side of the junction. */
  nakshatra: string;
  across: string;
  /** The point is in the last pada of the water sign's nakṣatra or in the first pada of the fire sign's. */
  side: 'before' | 'after';
  /** Degrees from the junction. */
  distance: number;
  /** Within two ghaṭīs of the junction. */
  core: boolean;
}

/** The junctions are the ends of Ashlesha, Jyeshtha and Revati, which are the beginnings of Magha, Mula and Ashwini. */
const JUNCTION_NAKSHATRAS = [8, 17, 26];

/**
 * The last 3°20' of Ashlesha, Jyeshtha and Revati and the first 3°20' of Magha, Mula and Ashwini: the junctions of Cancer and Leo, Scorpio and
 * Sagittarius, Pisces and Aries. The longitude is the one of the nakṣatra zodiac (it is the nakṣatras that these are the ends of).
 */
export function gandantaOf(nakshatraLongitude: number): GandantaResult | null {
  const lon = normalize(nakshatraLongitude);
  const index = Math.min(26, Math.floor(lon / NAKSHATRA_SIZE));
  const inside = lon - index * NAKSHATRA_SIZE;
  if (JUNCTION_NAKSHATRAS.includes(index) && inside >= NAKSHATRA_SIZE - GANDANTA_ORB) {
    const distance = NAKSHATRA_SIZE - inside;
    return { nakshatra: NAKSHATRA_NAMES[index], across: NAKSHATRA_NAMES[(index + 1) % 27], side: 'before', distance, core: distance <= GANDANTA_CORE };
  }
  if (JUNCTION_NAKSHATRAS.includes((index + 26) % 27) && inside < GANDANTA_ORB) {
    return { nakshatra: NAKSHATRA_NAMES[index], across: NAKSHATRA_NAMES[(index + 26) % 27], side: 'after', distance: inside, core: inside <= GANDANTA_CORE };
  }
  return null;
}

// ── Mṛtyu Bhāga ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const MRITYU_POINTS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Maandi', 'Lagna'] as const;
export type MrityuPoint = (typeof MRITYU_POINTS)[number];

/** For each sign from Aries (row), the degree of death of each point of MRITYU_POINTS (column): the table of Jagannatha Hora. */
export const MRITYU_BHAGA: readonly (readonly number[])[] = [
  [20, 26, 19, 15, 19, 28, 10, 14, 8, 23, 1],
  [9, 12, 28, 14, 29, 15, 4, 13, 18, 24, 9],
  [12, 13, 25, 13, 12, 11, 7, 12, 20, 11, 22],
  [6, 25, 23, 12, 27, 17, 9, 11, 10, 12, 22],
  [8, 24, 29, 8, 6, 10, 12, 24, 21, 13, 25],
  [24, 11, 28, 18, 4, 13, 16, 23, 22, 14, 2],
  [16, 26, 14, 20, 13, 4, 3, 22, 23, 8, 4],
  [17, 14, 21, 10, 10, 6, 18, 21, 24, 18, 23],
  [22, 13, 2, 21, 17, 27, 28, 10, 11, 20, 18],
  [2, 25, 15, 22, 11, 12, 14, 20, 12, 10, 20],
  [3, 5, 11, 7, 15, 29, 13, 18, 13, 21, 24],
  [23, 12, 6, 5, 28, 19, 15, 8, 14, 22, 10],
];

/** How far from its degree a point still is in the Mṛtyu Bhāga, in degrees, as Jagannatha Hora has it. */
export const MRITYU_ORB: Record<MrityuPoint, number> = {
  Sun: 1 / 3, Moon: 2 / 3, Mars: 0.25, Mercury: 2 / 3, Jupiter: 0.25, Venus: 0.25, Saturn: 0.25, Rahu: 0.25, Ketu: 0.25, Maandi: 0.25, Lagna: 2 / 3,
};

export interface MrityuResult {
  /** The degree of death of the point in its sign, and how far the point is from it. */
  degree: number;
  distance: number;
}

/** Within the orb of the degree of death of the point in its sign. */
export function mrityuBhagaOf(point: MrityuPoint, longitude: number): MrityuResult | null {
  const lon = normalize(longitude);
  const sign = Math.floor(lon / 30);
  const degree = MRITYU_BHAGA[sign][MRITYU_POINTS.indexOf(point)];
  const distance = Math.abs((lon % 30) - degree);
  return distance <= MRITYU_ORB[point] + 1e-9 ? { degree, distance } : null;
}

// ── Puṣkara ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Where the Puṣkara navāṁśas begin in each sign: 20° in the fire signs, 6°40' in the earth, 16°40' in the air and 0° in the water signs. */
export const PUSHKARA_NAVAMSA_START = [20, 6 + 40 / 60, 16 + 40 / 60, 0, 20, 6 + 40 / 60, 16 + 40 / 60, 0, 20, 6 + 40 / 60, 16 + 40 / 60, 0] as const;

/** The degree of the Puṣkara Bhāga of each sign: the 21st, 14th, 24th and 7th degree in turn (the degree is 1° wide, ending at this number). */
export const PUSHKARA_BHAGA = [21, 14, 24, 7, 21, 14, 24, 7, 21, 14, 24, 7] as const;

const NAVAMSA = 30 / 9;

export interface PushkaraNavamsaResult {
  /** 1 or 2: the first or the second of the sign's two Puṣkara navāṁśas. */
  which: 1 | 2;
  /** Which navāṁśa of the sign it is, 1–9. */
  navamsa: number;
  from: number;
  to: number;
}

/** The two navāṁśas of a sign (3°20' each) that are the Puṣkara ones: from the start of the sign's element, and 6°40' after it. */
export function pushkaraNavamsaRanges(sign: number): { from: number; to: number; navamsa: number }[] {
  const start = PUSHKARA_NAVAMSA_START[sign];
  return [
    { from: start, to: start + NAVAMSA, navamsa: Math.round(start / NAVAMSA) + 1 },
    { from: start + 2 * NAVAMSA, to: start + 3 * NAVAMSA, navamsa: Math.round(start / NAVAMSA) + 3 },
  ];
}

export function pushkaraNavamsaOf(longitude: number): PushkaraNavamsaResult | null {
  const lon = normalize(longitude);
  const sign = Math.floor(lon / 30);
  const degree = lon % 30;
  const ranges = pushkaraNavamsaRanges(sign);
  for (let i = 0; i < ranges.length; i += 1) {
    if (degree >= ranges[i].from - 1e-9 && degree < ranges[i].to - 1e-9) return { which: (i + 1) as 1 | 2, ...ranges[i] };
  }
  return null;
}

export interface PushkaraBhagaResult {
  /** The degree (the 21st, say): the point is between degree − 1 and degree. */
  degree: number;
}

export function pushkaraBhagaOf(longitude: number): PushkaraBhagaResult | null {
  const lon = normalize(longitude);
  const sign = Math.floor(lon / 30);
  const end = PUSHKARA_BHAGA[sign];
  const degree = lon % 30;
  return degree >= end - 1 && degree < end ? { degree: end } : null;
}

// ── All of them for a point ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface SensitiveDegrees {
  sandhi: SandhiResult | null;
  gandanta: GandantaResult | null;
  mrityu: MrityuResult | null;
  pushkaraNavamsa: PushkaraNavamsaResult | null;
  pushkaraBhaga: PushkaraBhagaResult | null;
}

/**
 * Every test for one point. The longitude is the sidereal one; the adjustment is the chart's nakṣatra offset (the Gandanta is a thing of the
 * nakṣatras, so it follows the nakṣatra zodiac, the rest follow the signs).
 */
export function sensitiveDegreesOf(point: MrityuPoint, longitude: number, nakshatraAdjust = 0): SensitiveDegrees {
  return {
    sandhi: sandhiOf(longitude),
    gandanta: gandantaOf(longitude + nakshatraAdjust),
    mrityu: mrityuBhagaOf(point, longitude),
    pushkaraNavamsa: pushkaraNavamsaOf(longitude),
    pushkaraBhaga: pushkaraBhagaOf(longitude),
  };
}
