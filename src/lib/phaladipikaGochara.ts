import { combustionOf } from './combustion';
import { DEBILITATION, EXALTATION, NATURAL_ENEMIES, OWN_SIGNS } from './dignity';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';
import { sbcNakshatra } from './sarvatobhadra';
import { SIGN_LORDS } from './signs';
import { normalizeDegrees } from './angles';

/**
 * The transit rules of the Phaladīpikā, chapter 26 (verses 25–47), by the Sanskrit and the Hindi commentary of the edition: where in a sign a graha gives its result (26.25), the vedha
 * of the seven-line wheel on the birth nakṣatras (26.26–28), the graha's limbs in the nakṣatras (26.35–40), what cancels a result (26.30–32), the places the text calls
 * dangerous (26.33–34) and the lattā, the "kick" of a graha (26.42–47). Counts of nakṣatras are inclusive and made from the birth nakṣatra (that of the Moon), 1–27.
 */
export type TransitGraha = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

export interface TransitBody { name: string; sign: number; degree: number; longitude: number; isRetrograde?: boolean }

const norm27 = (value: number) => ((value % 27) + 27) % 27;
const nakshatraOf = (longitude: number) => Math.min(26, Math.floor(normalizeDegrees(longitude) / NAKSHATRA_SIZE));
/** The count of a nakṣatra from the birth nakṣatra, 1–27. */
export const countFrom = (birth: number, target: number) => norm27(target - birth) + 1;

// ── 26.25: the part of the sign in which a graha gives its result ────────────────────────────────────────────
export type PraptaPortion = 'first' | 'middle' | 'last' | 'whole';
/** The Sun and Mars in the first ten degrees of a sign, Jupiter and Venus in the middle ten, the Moon and Saturn in the last ten, Mercury and Rāhu all through. Ketu is not named. */
export const PRAPTA_PORTION: Partial<Record<TransitGraha, PraptaPortion>> = {
  Sun: 'first', Mars: 'first', Jupiter: 'middle', Venus: 'middle', Moon: 'last', Saturn: 'last', Mercury: 'whole', Rahu: 'whole',
};
export function praptaKala(graha: TransitGraha, degree: number): { portion: PraptaPortion; active: boolean } | null {
  const portion = PRAPTA_PORTION[graha];
  if (!portion) return null;
  const part = degree < 10 ? 'first' : degree < 20 ? 'middle' : 'last';
  return { portion, active: portion === 'whole' || portion === part };
}

// ── 26.28: the nakṣatras that count from the birth nakṣatra ───────────────────────────────────────────────
/** Janma 1, vipat 3, pratyari 5, vadha 7, karma 10, ādhāna 19 and vainaśika 23 from the birth nakṣatra (the commentary of 26.28). */
export const SPECIAL_NAKSHATRAS = [
  { name: 'Janma', count: 1 }, { name: 'Vipat', count: 3 }, { name: 'Pratyari', count: 5 }, { name: 'Vadha', count: 7 },
  { name: 'Karma', count: 10 }, { name: 'Ādhāna', count: 19 }, { name: 'Vainaśika', count: 23 },
] as const;
export type SpecialName = (typeof SPECIAL_NAKSHATRAS)[number]['name'];

// ── 26.26–28: the vedha of the seven-line wheel ────────────────────────────────────────────────────────────
/** The pairs of nakṣatras that pierce one another (the verse of the Muhūrtacintāmaṇi quoted in the commentary), Abhijit included. */
export const SAPTASHALAKA_PAIRS: readonly (readonly [string, string])[] = [
  ['Jyeshtha', 'Pushya'], ['Shatabhisha', 'Swati'], ['Purva Ashadha', 'Ardra'], ['Revati', 'Uttara Phalguni'], ['Dhanishtha', 'Vishakha'],
  ['Uttara Ashadha', 'Mrigashira'], ['Ashwini', 'Purva Phalguni'], ['Ashlesha', 'Anuradha'], ['Hasta', 'Uttara Bhadrapada'],
  ['Rohini', 'Abhijit'], ['Mula', 'Punarvasu'], ['Chitra', 'Purva Bhadrapada'], ['Bharani', 'Magha'], ['Shravana', 'Krittika'],
];
export function vedhaPartner(nakshatra: string): string | null {
  for (const [a, b] of SAPTASHALAKA_PAIRS) { if (a === nakshatra) return b; if (b === nakshatra) return a; }
  return null;
}

const MALEFIC_VEDHA = new Set<TransitGraha>(['Mars', 'Saturn', 'Rahu', 'Ketu']);
const BENEFIC = new Set<TransitGraha>(['Mercury', 'Jupiter', 'Venus']);
const MALEFIC = new Set<TransitGraha>(['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']);

export interface VedhaHit {
  /** The special nakṣatra of the birth chart that the graha stands in the vedha of. */
  special: SpecialName;
  nakshatra: string;
  /** 26.27–28: a malefic (Mars, Saturn, Rāhu, Ketu) brings death or the like, a benefic only a loss in the work; 26.26: the Sun by the nakṣatra, and with a malefic in it, death. */
  effect: 'death' | 'life-danger' | 'fear' | 'wealth-loss' | 'work-loss' | 'unstated';
}

// ── 26.35–40: the limbs ──────────────────────────────────────────────────────────────────────────────────────────
export interface AngaPart { from: number; to: number; limb: string; result: string }
/** The Sun (26.35): 1 face, 2–5 head, 6–9 chest, 10–13 right arm, 14–19 feet, 20–23 left arm, 24–25 eyes, 26–27 the secret parts. */
const ANGA_SUN: AngaPart[] = [
  { from: 1, to: 1, limb: 'face', result: 'destruction' }, { from: 2, to: 5, limb: 'head', result: 'wealth and splendour' }, { from: 6, to: 9, limb: 'chest', result: 'victory' },
  { from: 10, to: 13, limb: 'right arm', result: 'wealth' }, { from: 14, to: 19, limb: 'feet', result: 'poverty' }, { from: 20, to: 23, limb: 'left arm', result: 'bodily pain' },
  { from: 24, to: 25, limb: 'eyes', result: 'gain' }, { from: 26, to: 27, limb: 'secret parts', result: 'death' },
];
/** The Moon (26.36). */
const ANGA_MOON: AngaPart[] = [
  { from: 1, to: 2, limb: 'face', result: 'great fear' }, { from: 3, to: 6, limb: 'head', result: 'well-being' }, { from: 7, to: 8, limb: 'back', result: 'victory over enemies' },
  { from: 9, to: 10, limb: 'eyes', result: 'wealth' }, { from: 11, to: 15, limb: 'chest', result: 'peace of mind' }, { from: 16, to: 18, limb: 'left hand', result: 'quarrel' },
  { from: 19, to: 24, limb: 'feet', result: 'travel abroad' }, { from: 25, to: 27, limb: 'right hand', result: 'gain of wealth' },
];
/** Mars (26.37). */
const ANGA_MARS: AngaPart[] = [
  { from: 1, to: 2, limb: 'face', result: 'death or fear of it' }, { from: 3, to: 8, limb: 'feet', result: 'quarrel' }, { from: 9, to: 11, limb: 'chest', result: 'victory' },
  { from: 12, to: 15, limb: 'left hand', result: 'poverty' }, { from: 16, to: 17, limb: 'head', result: 'gain' }, { from: 18, to: 21, limb: 'face', result: 'great fear' },
  { from: 22, to: 25, limb: 'right hand', result: 'well-being' }, { from: 26, to: 27, limb: 'eyes', result: 'travel abroad' },
];
/** Mercury, Jupiter and Venus (26.38). */
const ANGA_MERJUPVEN: AngaPart[] = [
  { from: 1, to: 3, limb: 'head', result: 'sorrow' }, { from: 4, to: 6, limb: 'face', result: 'gain' }, { from: 7, to: 12, limb: 'hands', result: 'misfortune' },
  { from: 13, to: 17, limb: 'belly', result: 'much wealth' }, { from: 18, to: 19, limb: 'secret parts', result: 'loss and ruin' }, { from: 20, to: 27, limb: 'feet', result: 'honour and standing' },
];
/** Saturn, Rāhu and Ketu (26.39–40). */
const ANGA_SATURN: AngaPart[] = [
  { from: 1, to: 1, limb: 'face', result: 'distress' }, { from: 2, to: 5, limb: 'right hand', result: 'happiness' }, { from: 6, to: 8, limb: 'right foot', result: 'travel' },
  { from: 9, to: 11, limb: 'left foot', result: 'loss' }, { from: 12, to: 15, limb: 'left hand', result: 'gain' }, { from: 16, to: 20, limb: 'belly', result: 'enjoyment' },
  { from: 21, to: 23, limb: 'head', result: 'happiness' }, { from: 24, to: 25, limb: 'eyes', result: 'joy' }, { from: 26, to: 27, limb: 'back', result: 'danger to life' },
];
export const ANGA_TABLES: Record<TransitGraha, AngaPart[]> = {
  Sun: ANGA_SUN, Moon: ANGA_MOON, Mars: ANGA_MARS, Mercury: ANGA_MERJUPVEN, Jupiter: ANGA_MERJUPVEN, Venus: ANGA_MERJUPVEN, Saturn: ANGA_SATURN, Rahu: ANGA_SATURN, Ketu: ANGA_SATURN,
};
export function angaOf(graha: TransitGraha, count: number): AngaPart | null {
  return ANGA_TABLES[graha].find(part => count >= part.from && count <= part.to) ?? null;
}

// ── 26.42–47: lattā ──────────────────────────────────────────────────────────────────────────────────────────────
/** Forward (pura) for the Sun +12, Mars +3, Jupiter +6, Saturn +8; backward (pṛṣṭha) for Venus 5, Mercury 7, Rāhu 9, the Moon 22; counted from the graha's own nakṣatra, inclusive. Ketu is not named. */
export const LATTA: Partial<Record<TransitGraha, { count: number; direction: 1 | -1 }>> = {
  Sun: { count: 12, direction: 1 }, Mars: { count: 3, direction: 1 }, Jupiter: { count: 6, direction: 1 }, Saturn: { count: 8, direction: 1 },
  Venus: { count: 5, direction: -1 }, Mercury: { count: 7, direction: -1 }, Rahu: { count: 9, direction: -1 }, Moon: { count: 22, direction: -1 },
};
/** The results of the lattā of a graha (26.45–46); the text gives none for Mars and Saturn but "the result of the lattā only". */
export const LATTA_RESULT: Partial<Record<TransitGraha, string>> = {
  Sun: 'loss of all', Rahu: 'sorrow', Ketu: 'sorrow', Jupiter: 'death, loss of kin, fear', Venus: 'quarrel and ruin', Mercury: 'misfortune', Moon: 'great loss',
};
export function lattaNakshatra(graha: TransitGraha, longitude: number): number | null {
  const rule = LATTA[graha];
  return rule ? norm27(nakshatraOf(longitude) + rule.direction * (rule.count - 1)) : null;
}

// ── 26.33–34: dangerous places from the Moon ───────────────────────────────────────────────────────────────────
/** 26.33: Saturn, the Sun, Mars and Jupiter in the birth sign, the 8th and the 12th. */
export const TRIKA_DANGER: readonly TransitGraha[] = ['Saturn', 'Sun', 'Mars', 'Jupiter'];
/** 26.34: the Moon in the 8th, Mars the 7th, Rāhu the 9th, Venus the 6th, Jupiter the 3rd, the Sun the 5th, Saturn the 1st, Mercury the 4th — loss of honour and wealth, and death. */
export const PLACE_DANGER: Partial<Record<TransitGraha, number>> = { Moon: 8, Mars: 7, Rahu: 9, Venus: 6, Jupiter: 3, Sun: 5, Saturn: 1, Mercury: 4 };

// ── 26.30–32: what takes a result away ─────────────────────────────────────────────────────────────────────────
export type Modifier = 'aspected-by-opposite' | 'aspected-by-enemy' | 'harmless-in-strength' | 'full-in-strength' | 'spoilt-good' | 'worse-bad';

const ASPECT_HOUSES: Record<string, number[]> = { Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10] };
const aspectsSign = (graha: string, from: number, to: number) => (ASPECT_HOUSES[graha] ?? [7]).includes(((to - from + 12) % 12) + 1);

export interface PhaladipikaRow {
  graha: TransitGraha;
  prapta: ReturnType<typeof praptaKala>;
  /** The count of the graha's nakṣatra from the birth nakṣatra, 1–27. */
  count: number;
  /** The special nakṣatra it is in (26.28), if any. */
  special: SpecialName | null;
  anga: AngaPart | null;
  latta: { nakshatra: string; onBirth: boolean; result: string | null } | null;
  /** The number of grahas whose lattā falls on the birth nakṣatra, for the graha when its own does (26.47). */
  lattaOnBirth: number;
  vedha: VedhaHit[];
  /** 26.33 */
  trikaDanger: boolean;
  /** 26.34 */
  placeDanger: boolean;
  modifiers: Modifier[];
}

export interface PhaladipikaTransit { birthNakshatra: string; rows: PhaladipikaRow[] }

/**
 * @param birthMoonLongitude the Moon of the birth chart
 * @param transit            the transiting grahas
 * @param good               for each graha, whether its house from the birth Moon is a good one for it (26.2); null when there is none
 */
export function phaladipikaTransit(birthMoonLongitude: number, transit: TransitBody[], good: Partial<Record<TransitGraha, boolean | null>> = {}): PhaladipikaTransit {
  const birth = nakshatraOf(birthMoonLongitude);
  const birthMoonSign = Math.floor(normalizeDegrees(birthMoonLongitude) / 30) + 1;
  const sun = transit.find(body => body.name === 'Sun');
  const bodies = transit.filter(body => body.name in ANGA_TABLES) as (TransitBody & { name: TransitGraha })[];
  const lattas = bodies.map(body => ({ graha: body.name, nakshatra: lattaNakshatra(body.name, body.longitude) }));
  const specialAt = SPECIAL_NAKSHATRAS.map(special => ({ ...special, index: norm27(birth + special.count - 1) }));
  const rows = bodies.map((body): PhaladipikaRow => {
    const graha = body.name;
    const index = nakshatraOf(body.longitude);
    const count = countFrom(birth, index);
    const special = SPECIAL_NAKSHATRAS.find(item => item.count === count)?.name ?? null;
    const lattaIndex = lattaNakshatra(graha, body.longitude);
    const onBirth = lattaIndex === birth;
    const lattaOnBirth = lattas.filter(item => item.nakshatra === birth).length;
    // 26.26–28: the nakṣatra of the graha pierces one of the special ones of the birth chart.
    const partner = vedhaPartner(sbcNakshatra(body.longitude));
    const vedha: VedhaHit[] = [];
    if (partner) {
      for (const item of specialAt) {
        if (NAKSHATRA_NAMES[item.index] !== partner) continue;
        let effect: VedhaHit['effect'] = 'unstated';
        if (MALEFIC_VEDHA.has(graha)) effect = 'death';
        else if (BENEFIC.has(graha)) effect = 'work-loss';
        else if (graha === 'Sun') {
          const withMalefic = bodies.some(other => other.name !== 'Sun' && MALEFIC.has(other.name) && nakshatraOf(other.longitude) === index);
          effect = item.name === 'Janma' ? (withMalefic ? 'death' : 'life-danger') : item.name === 'Ādhāna' ? (withMalefic ? 'death' : 'fear') : item.name === 'Karma' ? (withMalefic ? 'death' : 'wealth-loss') : 'unstated';
        }
        vedha.push({ special: item.name, nakshatra: NAKSHATRA_NAMES[item.index], effect });
      }
    }
    // 26.30–32.
    const modifiers: Modifier[] = [];
    const isGood = good[graha] ?? null;
    if (isGood !== null) {
      const others = transit.filter(other => other.name !== graha && other.name in ANGA_TABLES);
      const aspecting = others.filter(other => aspectsSign(other.name, other.sign, body.sign));
      if (aspecting.some(other => (isGood ? MALEFIC.has(other.name as TransitGraha) : BENEFIC.has(other.name as TransitGraha)))) modifiers.push('aspected-by-opposite');
      if (aspecting.some(other => NATURAL_ENEMIES[graha]?.includes(other.name))) modifiers.push('aspected-by-enemy');
      const strong = EXALTATION[graha] === body.sign || OWN_SIGNS[graha]?.includes(body.sign) === true;
      const lord = SIGN_LORDS[body.sign - 1];
      const weak = DEBILITATION[graha] === body.sign || NATURAL_ENEMIES[graha]?.includes(lord) === true
        || (sun !== undefined && graha !== 'Sun' && combustionOf(graha, body.longitude, sun.longitude, body.isRetrograde === true) !== null);
      if (strong) modifiers.push(isGood ? 'full-in-strength' : 'harmless-in-strength');
      if (weak) modifiers.push(isGood ? 'spoilt-good' : 'worse-bad');
    }
    return {
      graha, prapta: praptaKala(graha, body.degree), count, special, anga: angaOf(graha, count),
      latta: lattaIndex === null ? null : { nakshatra: NAKSHATRA_NAMES[lattaIndex], onBirth, result: LATTA_RESULT[graha] ?? null },
      lattaOnBirth: onBirth ? lattaOnBirth : 0, vedha, ...placeFlags(graha, ((body.sign - birthMoonSign + 12) % 12) + 1), modifiers,
    };
  });
  return { birthNakshatra: NAKSHATRA_NAMES[birth], rows };
}

/** 26.33–34 are by the house from the birth Moon, so they are added where that is known. */
export function placeFlags(graha: TransitGraha, houseFromMoon: number): { trikaDanger: boolean; placeDanger: boolean } {
  return {
    trikaDanger: TRIKA_DANGER.includes(graha) && [1, 8, 12].includes(houseFromMoon),
    placeDanger: PLACE_DANGER[graha] === houseFromMoon,
  };
}
