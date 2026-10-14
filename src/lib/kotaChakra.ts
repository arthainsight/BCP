import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';
import { ABHIJIT_END, ABHIJIT_START, sbcNakshatra } from './sarvatobhadra';
import { normalizeDegrees } from './angles';
import { signLord } from './signs';

// The Kota Chakra, the "fort" chakra: the 28 nakṣatras (Abhijit included) in four squares inside one another, the
// Bāhya (outside), the Prākāra (wall), the Durgāntara (inside the wall) and the Stambha (the pillar in the middle).
// The nakṣatras are counted from the Moon's nakṣatra at birth, which is the first, and the grahas are put in the
// squares of the nakṣatras they stand in.

/** The 28 nakṣatras of the chakra, from Aśvinī, with Abhijit after Uttara Ashadha. */
export const KOTA_STARS: readonly string[] = [...NAKSHATRA_NAMES.slice(0, 21), 'Abhijit', ...NAKSHATRA_NAMES.slice(21)];

export type KotaRingId = 'bahya' | 'prakara' | 'durgantara' | 'stambha';

/** The four squares from the outside in, and how many nakṣatras each holds. */
export const KOTA_RINGS: readonly { id: KotaRingId; size: number }[] = [
  { id: 'bahya', size: 8 },
  { id: 'prakara', size: 8 },
  { id: 'durgantara', size: 8 },
  { id: 'stambha', size: 4 },
];

/**
 * The place in the count from the birth nakṣatra (1 is the birth nakṣatra itself) of each square, ring by ring from
 * the outside in. In the three outer squares the eight squares go round clockwise from the top left (corner, middle of
 * the side, corner, middle, … ); in the pillar the four go top, right, bottom, left.
 */
export const KOTA_PLACES: readonly (readonly number[])[] = [
  [1, 7, 8, 14, 15, 21, 22, 28],
  [2, 6, 9, 13, 16, 20, 23, 27],
  [3, 5, 10, 12, 17, 19, 24, 26],
  [4, 11, 18, 25],
];

export interface KotaSquare {
  /** 0 outside (Bāhya) … 3 the pillar (Stambha). */
  ring: number;
  /** The place in the ring, clockwise from the top left (0 to 7); the pillar from the top (0 to 3). */
  slot: number;
  /** The nakṣatra's place in the count from the birth nakṣatra, 1 to 28. */
  place: number;
  /** One of KOTA_STARS. */
  nakshatra: string;
}

/** The squares of the chakra for a birth nakṣatra (one of KOTA_STARS), ring by ring from the outside in. */
export function kotaLayout(birthStar: string): KotaSquare[][] {
  const start = KOTA_STARS.indexOf(birthStar);
  if (start < 0) throw new Error(`Unknown nakshatra: ${birthStar}`);
  return KOTA_PLACES.map((places, ring) => places.map((place, slot) => ({ ring, slot, place, nakshatra: KOTA_STARS[(start + place - 1) % 28] })));
}

/** The square of a nakṣatra in a layout. */
export function kotaSquareOf(layout: readonly (readonly KotaSquare[])[], nakshatra: string): KotaSquare | undefined {
  return layout.flat().find(square => square.nakshatra === nakshatra);
}

/** The nakṣatra of a longitude among the 28; `adjust` is the nakṣatra zodiac's offset from the grahas' own. */
export function kotaNakshatra(longitude: number, adjust = 0): string {
  return sbcNakshatra(longitude + adjust);
}

/** The pada (1 to 4) of a longitude in its nakṣatra; the span of Abhijit is cut into four equal parts. */
export function kotaPada(longitude: number, adjust = 0): number {
  const lon = normalizeDegrees(longitude + adjust);
  if (lon >= ABHIJIT_START && lon < ABHIJIT_END) return Math.min(4, Math.floor(((lon - ABHIJIT_START) / (ABHIJIT_END - ABHIJIT_START)) * 4) + 1);
  return Math.min(4, Math.floor(((lon % NAKSHATRA_SIZE) / NAKSHATRA_SIZE) * 4) + 1);
}

/** The Kota Swāmī, the lord of the fort: the lord of the sign the Moon is in (1 is Aries). */
export function kotaSwami(moonSign: number): string {
  return signLord(moonSign);
}

const PALA = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'] as const;

/**
 * The Kota Pāla, the guard of the fort, for each of the 27 nakṣatras (Aśvinī to Revatī; Abhijit has no row) and pada.
 * It is the graha of the first letter of the traditional name syllable of the Moon's pada (vowels the Sun, ka-varga Mars,
 * ca-varga Venus, retroflex ta-varga Mercury, dental ta-varga Jupiter, pa-varga Saturn, ya ra la va the Moon, śa ṣa sa ha
 * Rahu), and the values are those of JHora as PyJHora has them, so that the two agree: JHora has Mercury for the
 * syllables of Shravana (kha), Dhanishtha (ga) and Shatabhisha's first pada (go), where the letter rule would give
 * Mars. No classical text for the table was found; it is a modern one.
 */
export const KOTA_PALA: readonly (readonly (typeof PALA)[number][])[] = ([
  [5, 5, 5, 1], [1, 1, 1, 1], [0, 0, 0, 0], [0, 1, 1, 1], [1, 1, 2, 2], [2, 2, 2, 5], [2, 2, 7, 7],
  [7, 7, 7, 3], [3, 3, 3, 3], [6, 6, 6, 6], [6, 3, 3, 3], [3, 3, 6, 6], [6, 7, 3, 3], [6, 6, 1, 1],
  [1, 1, 1, 4], [4, 4, 4, 4], [4, 4, 4, 4], [4, 1, 1, 1], [1, 1, 6, 6], [6, 4, 6, 3], [6, 6, 5, 5],
  [3, 3, 3, 3], [3, 3, 3, 3], [3, 7, 7, 7], [7, 7, 4, 4], [4, 4, 5, 5], [4, 4, 5, 5],
] as const).map(row => row.map(id => PALA[id]));

/** The Kota Pāla of a nakṣatra (one of the 27, NAKSHATRA_NAMES) and a pada (1 to 4). */
export function kotaPala(nakshatra: string, pada: number): string {
  const row = KOTA_PALA[(NAKSHATRA_NAMES as readonly string[]).indexOf(nakshatra)];
  if (!row) throw new Error(`Unknown nakshatra: ${nakshatra}`);
  return row[Math.min(4, Math.max(1, pada)) - 1];
}

/**
 * The Kota Pāla for a Moon at a longitude: the table is read by the 27 nakṣatras and the quarters of 3°20′ of each, so
 * a Moon in the Abhijit span is in the last pada of Uttara Ashadha or the first of Shravana.
 */
export function kotaPalaAt(longitude: number, adjust = 0): string {
  const lon = normalizeDegrees(longitude + adjust);
  const index = Math.min(Math.floor(lon / NAKSHATRA_SIZE), 26);
  const pada = Math.min(4, Math.floor(((lon - index * NAKSHATRA_SIZE) / NAKSHATRA_SIZE) * 4) + 1);
  return kotaPala(NAKSHATRA_NAMES[index], pada);
}

/** Where the squares stand for the reading: the Stambha and the Durgāntara are the heart of the fort, the Prākāra and the Bāhya its surroundings. */
export type KotaZone = 'heart' | 'outer';
export const kotaZone = (ring: number): KotaZone => (ring >= 2 ? 'heart' : 'outer');
