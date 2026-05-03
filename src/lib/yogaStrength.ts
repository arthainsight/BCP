import type { PlanetData } from '@/types';
import type { YogaResult } from '@/lib/yogas';
import { getRashiAspectSigns } from '@/lib/drishti';

// ── Types ─────────────────────────────────────────────────────────────────────

export type StrengthClassification = 'Very Strong' | 'Strong' | 'Moderate' | 'Weak';

export interface YogaStrengthBreakdown {
  rasi: number;
  dignity: number;
  navamsa: number;
  vargottama: number;
  conjunctions: number;
  aspects: number;
  kartari: number;
}

export interface YogaStrengthResult extends YogaResult {
  strength: number | null;
  classification: StrengthClassification | null;
  breakdown: YogaStrengthBreakdown | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Signs ruled by benefic planets (Jupiter, Venus, Mercury, Moon)
const BENEFIC_RASI = new Set([2, 3, 4, 6, 7, 9, 12]);
// Signs ruled by malefic planets (Mars, Sun, Saturn)
const MALEFIC_RASI = new Set([1, 5, 8, 10, 11]);

const EXALTATION: Record<string, number> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7,
};

const DEBILITATION: Record<string, number> = {
  Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1,
};

const OWN_SIGNS: Record<string, number[]> = {
  Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6],
  Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11],
};

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
const NATURAL_BENEFICS = new Set(['Jupiter', 'Venus']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMoonPhase(moonLon: number, sunLon: number): 'benefic' | 'malefic' | 'neutral' {
  const diff = ((moonLon - sunLon) + 360) % 360;
  if (diff >= 120 && diff <= 240) return 'benefic';
  if (diff <= 60 || diff >= 300) return 'malefic';
  return 'neutral';
}

function getPlanetNature(name: string, planets: PlanetData[]): 'benefic' | 'malefic' | 'neutral' {
  if (NATURAL_BENEFICS.has(name)) return 'benefic';
  if (NATURAL_MALEFICS.has(name)) return 'malefic';

  if (name === 'Moon') {
    const sun  = planets.find(p => p.name === 'Sun');
    const moon = planets.find(p => p.name === 'Moon');
    if (sun && moon) return getMoonPhase(moon.longitude, sun.longitude);
    return 'neutral';
  }

  if (name === 'Mercury') {
    const mercury = planets.find(p => p.name === 'Mercury');
    if (!mercury) return 'benefic';
    const companions = planets.filter(p => p.name !== 'Mercury' && p.sign === mercury.sign);
    const hasNaturalMalefic = companions.some(p => NATURAL_MALEFICS.has(p.name));
    if (hasNaturalMalefic) return 'malefic';
    return 'benefic';
  }

  return 'neutral';
}

function getNavamsaSign(sign: number, degree: number): number {
  const navamsaIndex = Math.min(Math.floor(degree * 9 / 30), 8);
  let startSign: number;
  if ([1, 4, 7, 10].includes(sign))  startSign = 1;   // Movable → Aries
  else if ([2, 5, 8, 11].includes(sign)) startSign = 10; // Fixed → Capricorn
  else startSign = 7;                                     // Dual → Libra
  return ((startSign - 1 + navamsaIndex) % 12) + 1;
}

function getDignity(name: string, sign: number, degree: number): number {
  if (EXALTATION[name] === sign) return 60;

  const mt = MOOLATRIKONA[name];
  if (mt && mt.sign === sign && degree >= mt.minDeg && degree <= mt.maxDeg) return 45;

  if (OWN_SIGNS[name]?.includes(sign)) return 30;

  if (DEBILITATION[name] === sign) return -60;

  return 0;
}

function scoreRasi(sign: number): number {
  return BENEFIC_RASI.has(sign) ? 30 : MALEFIC_RASI.has(sign) ? -30 : 0;
}

// ── Per-planet scoring ────────────────────────────────────────────────────────

function scorePlanet(planet: PlanetData, allPlanets: PlanetData[]): YogaStrengthBreakdown {
  const navamsaSign = getNavamsaSign(planet.sign, planet.degree);
  const vargottama  = navamsaSign === planet.sign;

  // Base dignity (exaltation takes precedence over moolatrikona, own sign, debilitation)
  const dignityPts  = getDignity(planet.name, planet.sign, planet.degree);

  // Conjunctions
  const companions  = allPlanets.filter(p => p.name !== planet.name && p.sign === planet.sign);
  let conjunctions  = 0;
  for (const c of companions) {
    const nature = getPlanetNature(c.name, allPlanets);
    if (nature === 'benefic') {
      conjunctions += 60;
    } else if (nature === 'malefic') {
      const mtAdj = c.sign === EXALTATION[c.name] ? 30
        : (MOOLATRIKONA[c.name]?.sign === c.sign
            && c.degree >= MOOLATRIKONA[c.name].minDeg
            && c.degree <= MOOLATRIKONA[c.name].maxDeg) ? 15 : 0;
      conjunctions += (-60 + mtAdj);
    }
  }

  // Rasi aspects: signs that aspect this planet's sign
  const aspectingSigns = getRashiAspectSigns(planet.sign);
  let aspects = 0;
  for (const s of aspectingSigns) {
    for (const p of allPlanets.filter(x => x.sign === s)) {
      const nature = getPlanetNature(p.name, allPlanets);
      if (nature === 'benefic') aspects += 30;
      else if (nature === 'malefic') aspects -= 30;
    }
  }

  // Kartari (hemming by adjacent signs)
  const prevSign   = ((planet.sign - 2 + 12) % 12) + 1;
  const nextSign   = (planet.sign % 12) + 1;
  const prevPlanets = allPlanets.filter(p => p.sign === prevSign);
  const nextPlanets = allPlanets.filter(p => p.sign === nextSign);
  let kartari = 0;
  if (prevPlanets.length > 0 && nextPlanets.length > 0) {
    const beneficPrev  = prevPlanets.some(p => getPlanetNature(p.name, allPlanets) === 'benefic');
    const beneficNext  = nextPlanets.some(p => getPlanetNature(p.name, allPlanets) === 'benefic');
    const maleficPrev  = prevPlanets.some(p => getPlanetNature(p.name, allPlanets) === 'malefic');
    const maleficNext  = nextPlanets.some(p => getPlanetNature(p.name, allPlanets) === 'malefic');
    if (beneficPrev && beneficNext && !maleficPrev && !maleficNext) kartari = 60;
    else if (maleficPrev && maleficNext && !beneficPrev && !beneficNext) kartari = -60;
  }

  return {
    rasi: scoreRasi(planet.sign),
    dignity: dignityPts,
    navamsa: scoreRasi(navamsaSign),
    vargottama: vargottama ? 60 : 0,
    conjunctions,
    aspects,
    kartari,
  };
}

// ── Classification ────────────────────────────────────────────────────────────

export function classify(strength: number): StrengthClassification {
  if (strength > 150) return 'Very Strong';
  if (strength >= 75) return 'Strong';
  if (strength >= 0)  return 'Moderate';
  return 'Weak';
}

// ── Main engine ───────────────────────────────────────────────────────────────

export function qualifyYogas(yogas: YogaResult[], planets: PlanetData[]): YogaStrengthResult[] {
  return yogas.map(yoga => {
    if (yoga.status !== 'active') {
      return { ...yoga, strength: null, classification: null, breakdown: null };
    }

    if (yoga.planetsInvolved.length === 0) {
      const zeros: YogaStrengthBreakdown = {
        rasi: 0, dignity: 0, navamsa: 0, vargottama: 0,
        conjunctions: 0, aspects: 0, kartari: 0,
      };
      return { ...yoga, strength: 0, classification: 'Moderate', breakdown: zeros };
    }

    const totals: YogaStrengthBreakdown = {
      rasi: 0, dignity: 0, navamsa: 0, vargottama: 0,
      conjunctions: 0, aspects: 0, kartari: 0,
    };

    for (const name of yoga.planetsInvolved) {
      const p = planets.find(pl => pl.name === name);
      if (!p) continue;
      const s = scorePlanet(p, planets);
      totals.rasi         += s.rasi;
      totals.dignity      += s.dignity;
      totals.navamsa      += s.navamsa;
      totals.vargottama   += s.vargottama;
      totals.conjunctions += s.conjunctions;
      totals.aspects      += s.aspects;
      totals.kartari      += s.kartari;
    }

    const strength = Object.values(totals).reduce((a, b) => a + b, 0);
    return { ...yoga, strength, classification: classify(strength), breakdown: totals };
  });
}
