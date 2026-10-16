import type { PlanetData } from '@/types';
import type { YogaResult } from '@/lib/yogas';
import { normalizeDegrees } from '@/lib/angles';
import { DEBILITATION, EXALTATION, OWN_SIGNS } from '@/lib/dignity';
import { nakshatraIndex, taraNumber } from '@/lib/navatara';

// ── How a yoga is qualified ───────────────────────────────────────────────────
//
// After the method of "Qualifying Yogas" (Ernst Wilhelm, the yoga book): the planets that form a yoga are measured by what
// stands round them, and the more Subha (auspicious) their condition, the more of the good of the yoga matures and the less of
// its harm. Each planet scores, in the points of the table of the Subha / Asubha yoga:
//
//   rāśi ±30                 the sign is ruled by a benefic (+30) or a malefic (-30)
//   dignity in the rāśi      exaltation +60, moolatrikona +45, own sign +30, debilitation -60
//   navamsa ±30              the same for the Navamsa sign
//   dignity in the Navamsa   the same points for the dignity in the Navamsa
//   vargottama +60
//   Tara ±60                 the planet's nakṣatra from the Janma (Moon) nakṣatra; the Moon has none
//   conjunctions             +60 a benefic, -60 a malefic, by the dignity of the planet that joins (below)
//   aspects                  the same by virupas: the aspect (rāśi, the whole sign) of a benefic +, of a malefic -
//   hemmed (kartari) ±60     between benefics +60, between malefics -60
//
// The nature of a planet is its natural one, not the temporal: the Sun, Mars, Saturn, Rahu and Ketu are malefic, Jupiter, Venus
// and Mercury benefic (Mercury stays so with a malefic), the Moon benefic from 120° to 240° from the Sun, malefic within 60° of it
// and neutral between. A planet that joins or aspects counts by its dignity in the rāśi or the Navamsa: a benefic that is
// debilitated gives nothing; a malefic gives +30 when exalted, +15 in its moolatrikona, nothing in its own sign or vargottama,
// and -60 otherwise (the aspects in the same proportion of their virupas). A benefic sign in which the planet is debilitated, and
// a malefic sign that is the planet's own or its exaltation, or that the planet is vargottama in, give no ±30.
//
// What is not applied: the book's note that a planet joined with the lord of the 6th, 8th or 12th in one of those houses is harmed
// (it gives no number), and the book's wish for degree-exact aspects (the aspects here are those of the whole sign, in the
// virupas of Parāśara: the full aspect 60, the 7th 60, the 4th and 8th 45, the 5th and 9th 30, the 3rd and 10th 15).

// ── Types ─────────────────────────────────────────────────────────────────────

export type StrengthClassification = 'Very Strong' | 'Strong' | 'Moderate' | 'Weak';
/** Subha (auspicious), Asubha (inauspicious) or Misra (mixed), by which kind of influence the yoga's planets have more of. */
export type YogaInfluence = 'Subha' | 'Asubha' | 'Misra';

export interface YogaStrengthBreakdown {
  rasi: number;
  dignity: number;
  navamsa: number;
  navamsaDignity: number;
  vargottama: number;
  tara: number;
  conjunctions: number;
  aspects: number;
  kartari: number;
}

export interface YogaStrengthResult extends YogaResult {
  /** Summed score across every participating planet. */
  strength: number | null;
  /** The same score divided by the participating planets. Drives classification. */
  strengthPerPlanet: number | null;
  classification: StrengthClassification | null;
  breakdown: YogaStrengthBreakdown | null;
  /** How many auspicious and inauspicious influences the planets have, and which there are more of. */
  subhaCount: number;
  asubhaCount: number;
  influence: YogaInfluence | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Signs ruled by benefic planets (Jupiter, Venus, Mercury, Moon)
const BENEFIC_RASI = new Set([2, 3, 4, 6, 7, 9, 12]);
// Signs ruled by malefic planets (Mars, Sun, Saturn)
const MALEFIC_RASI = new Set([1, 5, 8, 10, 11]);

const MOOLATRIKONA: Record<string, { sign: number; minDeg: number; maxDeg: number }> = {
  Sun:     { sign: 5,  minDeg: 0,  maxDeg: 20 },
  Moon:    { sign: 2,  minDeg: 4,  maxDeg: 30 },
  Mars:    { sign: 1,  minDeg: 0,  maxDeg: 12 },
  Mercury: { sign: 6,  minDeg: 15, maxDeg: 20 },
  Jupiter: { sign: 9,  minDeg: 0,  maxDeg: 10 },
  Venus:   { sign: 7,  minDeg: 0,  maxDeg: 15 },
  Saturn:  { sign: 11, minDeg: 0,  maxDeg: 20 },
};

const NATURAL_MALEFICS = new Set(['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']);
const NATURAL_BENEFICS = new Set(['Jupiter', 'Venus', 'Mercury']);

/** The 3rd, 5th and 7th nakṣatras from the Janma nakṣatra (in each round of nine) are inauspicious; the rest are auspicious. */
const INAUSPICIOUS_TARAS = new Set([3, 5, 7]);

/** The virupas of the partial aspects of every planet, by the house counted from the planet; Mars, Jupiter and Saturn (and the nodes) are full on theirs. */
const PARTIAL_ASPECT_VIRUPAS: Record<number, number> = { 3: 15, 4: 45, 5: 30, 7: 60, 8: 45, 9: 30, 10: 15 };
const FULL_ASPECT_HOUSES: Record<string, number[]> = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10], Rahu: [5, 9], Ketu: [5, 9] };

// ── Helpers ───────────────────────────────────────────────────────────────────

type Nature = 'benefic' | 'malefic' | 'neutral';
type Dignity = 'exalted' | 'moolatrikona' | 'own' | 'debilitated' | null;
const DIGNITY_POINTS: Record<Exclude<Dignity, null>, number> = { exalted: 60, moolatrikona: 45, own: 30, debilitated: -60 };

function getMoonPhase(moonLon: number, sunLon: number): Nature {
  const diff = normalizeDegrees(moonLon - sunLon);
  if (diff >= 120 && diff <= 240) return 'benefic';
  if (diff <= 60 || diff >= 300) return 'malefic';
  return 'neutral';
}

/** The natural nature of a planet. */
function getPlanetNature(name: string, planets: PlanetData[]): Nature {
  if (NATURAL_BENEFICS.has(name)) return 'benefic';
  if (NATURAL_MALEFICS.has(name)) return 'malefic';
  if (name === 'Moon') {
    const sun  = planets.find(p => p.name === 'Sun');
    const moon = planets.find(p => p.name === 'Moon');
    return sun && moon ? getMoonPhase(moon.longitude, sun.longitude) : 'neutral';
  }
  return 'neutral';
}

/** The sign and the degree in it of the Navamsa of a position: the longitude nine times round (movable signs count from themselves, fixed from the 9th, dual from the 5th). */
function navamsaPosition(sign: number, degree: number): { sign: number; degree: number } {
  const longitude = normalizeDegrees(((sign - 1) * 30 + degree) * 9);
  return { sign: Math.floor(longitude / 30) + 1, degree: longitude % 30 };
}

/** The dignity of a planet in a sign at a degree of it (exaltation first, then moolatrikona, own sign, debilitation). */
function dignityOf(name: string, sign: number, degree: number): Dignity {
  if (EXALTATION[name] === sign) return 'exalted';
  const mt = MOOLATRIKONA[name];
  if (mt && mt.sign === sign && degree >= mt.minDeg && degree <= mt.maxDeg) return 'moolatrikona';
  if (OWN_SIGNS[name]?.includes(sign)) return 'own';
  if (DEBILITATION[name] === sign) return 'debilitated';
  return null;
}

interface Placement {
  name: string;
  sign: number;
  nav: { sign: number; degree: number };
  rasiDignity: Dignity;
  navDignity: Dignity;
  vargottama: boolean;
}

function placementOf(planet: PlanetData): Placement {
  const nav = navamsaPosition(planet.sign, planet.degree);
  return {
    name: planet.name, sign: planet.sign, nav,
    rasiDignity: dignityOf(planet.name, planet.sign, planet.degree),
    navDignity: dignityOf(planet.name, nav.sign, nav.degree),
    vargottama: nav.sign === planet.sign,
  };
}

/** ±30 for a sign: of a benefic's or a malefic's, but not a benefic sign the planet is debilitated in, nor a malefic one it is at home or exalted in or vargottama in. */
function scoreSign(sign: number, dignity: Dignity, vargottama: boolean): number {
  if (BENEFIC_RASI.has(sign)) return dignity === 'debilitated' ? 0 : 30;
  if (MALEFIC_RASI.has(sign)) return dignity === 'exalted' || dignity === 'moolatrikona' || dignity === 'own' || vargottama ? 0 : -30;
  return 0;
}

/**
 * What a planet that joins or aspects gives, as a multiple of the full value (60 for a conjunction, the virupas for an aspect): a
 * benefic gives +1 unless it is debilitated in the rāśi or the Navamsa (then 0); a malefic gives -1, or +0.5 when exalted and +0.25
 * in its moolatrikona (in the rāśi or the Navamsa), and 0 when in its own sign (rāśi or Navamsa) or vargottama.
 */
function influenceFactor(other: Placement, nature: Nature): number {
  if (nature === 'benefic') return other.rasiDignity === 'debilitated' || other.navDignity === 'debilitated' ? 0 : 1;
  if (nature === 'malefic') {
    if (other.rasiDignity === 'exalted' || other.navDignity === 'exalted') return 0.5;
    if (other.rasiDignity === 'moolatrikona' || other.navDignity === 'moolatrikona') return 0.25;
    if (other.rasiDignity === 'own' || other.navDignity === 'own' || other.vargottama) return 0;
    return -1;
  }
  return 0;
}

/** The virupas of the aspect of a planet in one sign on another sign (0 within a sign). */
function aspectVirupas(name: string, fromSign: number, toSign: number): number {
  const house = ((toSign - fromSign + 12) % 12) + 1;
  if (house === 1) return 0;
  if (FULL_ASPECT_HOUSES[name]?.includes(house)) return 60;
  return PARTIAL_ASPECT_VIRUPAS[house] ?? 0;
}

// ── Per-planet scoring ────────────────────────────────────────────────────────

interface PlanetScore { breakdown: YogaStrengthBreakdown; subha: number; asubha: number }

function scorePlanet(planet: PlanetData, allPlanets: PlanetData[], placements: Map<string, Placement>, nakshatraAdjust: number): PlanetScore {
  const own = placements.get(planet.name)!;
  let subha = 0;
  let asubha = 0;
  const count = (points: number) => { if (points > 0) subha += 1; else if (points < 0) asubha += 1; };

  const rasi = scoreSign(own.sign, own.rasiDignity, own.vargottama);
  const navamsa = scoreSign(own.nav.sign, own.navDignity, own.vargottama);
  const dignity = own.rasiDignity ? DIGNITY_POINTS[own.rasiDignity] : 0;
  const navamsaDignity = own.navDignity ? DIGNITY_POINTS[own.navDignity] : 0;
  count(rasi); count(navamsa);

  // Tara from the Janma nakṣatra (the Moon's); the Moon itself has none.
  let tara = 0;
  const moon = allPlanets.find(p => p.name === 'Moon');
  if (moon && planet.name !== 'Moon') {
    const number = taraNumber(nakshatraIndex(moon.longitude, nakshatraAdjust), nakshatraIndex(planet.longitude, nakshatraAdjust));
    tara = INAUSPICIOUS_TARAS.has(number) ? -60 : 60;
    count(tara);
  }

  // Conjunctions: the planets in the same sign.
  let conjunctions = 0;
  for (const other of allPlanets) {
    if (other.name === planet.name || other.sign !== planet.sign) continue;
    const points = 60 * influenceFactor(placements.get(other.name)!, getPlanetNature(other.name, allPlanets));
    conjunctions += points;
    count(points);
  }

  // Aspects of the whole sign, in virupas, from the planets of the other signs.
  let aspects = 0;
  for (const other of allPlanets) {
    if (other.name === planet.name || other.sign === planet.sign) continue;
    const virupas = aspectVirupas(other.name, other.sign, planet.sign);
    if (virupas === 0) continue;
    const points = virupas * influenceFactor(placements.get(other.name)!, getPlanetNature(other.name, allPlanets));
    aspects += points;
    count(points);
  }

  // Hemmed between the planets of the signs on either side.
  const prevSign   = ((planet.sign - 2 + 12) % 12) + 1;
  const nextSign   = (planet.sign % 12) + 1;
  const prevPlanets = allPlanets.filter(p => p.sign === prevSign);
  const nextPlanets = allPlanets.filter(p => p.sign === nextSign);
  let kartari = 0;
  if (prevPlanets.length > 0 && nextPlanets.length > 0) {
    const natureOf = (list: PlanetData[], nature: Nature) => list.some(p => getPlanetNature(p.name, allPlanets) === nature);
    const beneficPrev = natureOf(prevPlanets, 'benefic');
    const beneficNext = natureOf(nextPlanets, 'benefic');
    const maleficPrev = natureOf(prevPlanets, 'malefic');
    const maleficNext = natureOf(nextPlanets, 'malefic');
    if (beneficPrev && beneficNext && !maleficPrev && !maleficNext) kartari = 60;
    else if (maleficPrev && maleficNext && !beneficPrev && !beneficNext) kartari = -60;
    count(kartari);
  }

  return {
    breakdown: { rasi, dignity, navamsa, navamsaDignity, vargottama: own.vargottama ? 60 : 0, tara, conjunctions, aspects, kartari },
    subha, asubha,
  };
}

/** The table of a planet's points, for tests and for anyone who wants the figures of one planet. */
export function scoreGraha(name: string, planets: PlanetData[], nakshatraAdjust = 0): YogaStrengthBreakdown | null {
  const planet = planets.find(p => p.name === name);
  if (!planet) return null;
  const placements = new Map(planets.map(p => [p.name, placementOf(p)]));
  return scorePlanet(planet, planets, placements, nakshatraAdjust).breakdown;
}

// ── Classification ────────────────────────────────────────────────────────────

export function classify(strength: number): StrengthClassification {
  if (strength > 150) return 'Very Strong';
  if (strength >= 75) return 'Strong';
  if (strength >= 0)  return 'Moderate';
  return 'Weak';
}

// ── Main engine ───────────────────────────────────────────────────────────────

export function qualifyYogas(yogas: YogaResult[], planets: PlanetData[], nakshatraAdjust = 0): YogaStrengthResult[] {
  const placements = new Map(planets.map(planet => [planet.name, placementOf(planet)]));
  const zeros = (): YogaStrengthBreakdown => ({ rasi: 0, dignity: 0, navamsa: 0, navamsaDignity: 0, vargottama: 0, tara: 0, conjunctions: 0, aspects: 0, kartari: 0 });
  return yogas.map(yoga => {
    if (yoga.status !== 'active') {
      return { ...yoga, strength: null, strengthPerPlanet: null, classification: null, breakdown: null, subhaCount: 0, asubhaCount: 0, influence: null };
    }

    if (yoga.planetsInvolved.length === 0) {
      return { ...yoga, strength: 0, strengthPerPlanet: 0, classification: 'Moderate', breakdown: zeros(), subhaCount: 0, asubhaCount: 0, influence: 'Misra' };
    }

    const totals = zeros();
    let subhaCount = 0;
    let asubhaCount = 0;

    for (const name of yoga.planetsInvolved) {
      const p = planets.find(pl => pl.name === name);
      if (!p) continue;
      const score = scorePlanet(p, planets, placements, nakshatraAdjust);
      for (const key of Object.keys(totals) as (keyof YogaStrengthBreakdown)[]) totals[key] += score.breakdown[key];
      subhaCount += score.subha;
      asubhaCount += score.asubha;
    }

    const strength = Object.values(totals).reduce((a, b) => a + b, 0);

    // Classify on the average per participating planet, not on the sum.
    //
    // The sum legitimately scales with how many planets a yoga names, but the
    // classify() thresholds are absolute, so before this the same per-planet
    // quality read very differently depending on the yoga's size: a
    // three-planet Raja yoga of ordinary planets landed at -540 and read
    // "Weak" while a two-planet Vosi at +60 read "Moderate". Averaging makes
    // the label mean "these planets are individually strong", which is
    // comparable across yogas. The displayed strength stays the sum.
    const scored = yoga.planetsInvolved.filter((name) => planets.some((planet) => planet.name === name)).length;
    const strengthPerPlanet = scored > 0 ? strength / scored : 0;

    return {
      ...yoga,
      strength,
      strengthPerPlanet,
      classification: classify(strengthPerPlanet),
      breakdown: totals,
      subhaCount,
      asubhaCount,
      influence: subhaCount > asubhaCount ? 'Subha' : asubhaCount > subhaCount ? 'Asubha' : 'Misra',
    };
  });
}
