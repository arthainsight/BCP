// Ṣaḍbala engine (beta).
//
// Extracted from src/pages/VargaMatrix.jsx, where the calculation grew inside
// the card component as untyped JavaScript. The maths is unchanged; this module
// only gives it types and a home alongside the other calculation code so the
// fixtures in shadbala.test.ts can exercise it directly.
//
// Exactness follows the labels shown in the UI: Uccha, Ojhayugma, Kendradi,
// Drekkana, Paksha, Naisargika and Vara are table-exact; Saptavargaja, Dig,
// Natonnata, Tribhaga, Ayana, Cheshta and Drig are documented approximations.

import { getVargaSignIndex, getDegreesInSign } from './varga';
import { normalizeLongitude } from './varga/utils';

export type ShadbalaPlanet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
export type Dignity = 'exalted' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated' | 'none';

export type ShadbalaChartPlanet = {
  name: string;
  longitude?: number;
  sign?: number;
  house?: number;
  isRetrograde?: boolean;
};

export type ShadbalaChartLike = {
  ascendant?: { sign?: number; longitude?: number };
  planets?: ShadbalaChartPlanet[];
  debug?: { inputDateTime?: string; ayanamsa?: number };
};

export type SthanaBalaBreakdown = {
  uccha: number;
  saptavargaja: number;
  ojhayugma: number;
  kendradi: number;
  drekkana: number;
  total: number;
};

export type KalaBalaBreakdown = {
  sect: 'day' | 'night' | 'unknown';
  natonnata: number;
  paksha: number;
  tribhaaga: number;
  tribhagaLord: string | null;
  varsheshadi: number;
  ayana: number;
  total: number;
};

export type ShadbalaRow = {
  planet: ShadbalaPlanet;
  house: number | null;
  retrograde: boolean;
  sthana: number;
  sthanaBreakdown: SthanaBalaBreakdown;
  dig: number;
  digVirupa: number;
  kala: number;
  kalaBreakdown: KalaBalaBreakdown;
  cheshta: number;
  cheshtaVirupa: number;
  naisargika: number;
  naisargikaVirupa: number;
  drik: number;
  drikVirupa: number;
  total: number;
  totalVirupa: number;
  requiredVirupa: number;
  ratio: number;
};

export const SCORE_PLANETS: readonly ShadbalaPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const BENEFICS: readonly ShadbalaPlanet[] = ['Moon', 'Mercury', 'Jupiter', 'Venus'];

const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const OWN_SIGNS: Record<ShadbalaPlanet, number[]> = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };
const EXALTATION_SIGNS: Record<ShadbalaPlanet, number> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBILITATION_SIGNS: Record<ShadbalaPlanet, number> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
const EXALTATION_LONGITUDES: Record<ShadbalaPlanet, number> = { Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200 };

export const SHADBALA_REQUIRED_VIRUPA: Record<ShadbalaPlanet, number> = { Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300 };
export const NAISARGIKA_BALA_VIRUPA: Record<ShadbalaPlanet, number> = { Sun: 60, Moon: 51, Venus: 43, Jupiter: 34, Mercury: 26, Mars: 17, Saturn: 9 };
export const DIG_BALA_MAX_HOUSE: Record<ShadbalaPlanet, number> = { Sun: 10, Mars: 10, Moon: 4, Venus: 4, Jupiter: 1, Mercury: 1, Saturn: 7 };

const ODD_EVEN_STRENGTH: Record<ShadbalaPlanet, 'odd' | 'even' | 'both'> = { Sun: 'odd', Mars: 'odd', Jupiter: 'odd', Moon: 'even', Venus: 'even', Mercury: 'both', Saturn: 'both' };
const DREKKANA_STRENGTH: Record<ShadbalaPlanet, number> = { Sun: 1, Mars: 1, Jupiter: 1, Mercury: 2, Saturn: 2, Moon: 3, Venus: 3 };
const DAY_NIGHT_STRENGTH: Record<ShadbalaPlanet, 'day' | 'night' | 'both'> = { Sun: 'day', Jupiter: 'day', Venus: 'day', Moon: 'night', Mars: 'night', Saturn: 'night', Mercury: 'both' };

const NATURAL_RELATIONS: Record<ShadbalaPlanet, { friends: string[]; neutral: string[]; enemies: string[] }> = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], neutral: ['Mercury'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], neutral: ['Venus', 'Saturn'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], neutral: ['Mars', 'Jupiter', 'Saturn'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], neutral: ['Saturn'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], neutral: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], neutral: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
};

// Classical Saptavargaja Bala virupa per dignity (BPHS Ch.27). Used as per-varga weights;
// the sum across 7 vargas is divided by 7 so max = 45 (exalted in all 7).
// Exact (table-based). Moolatrikona treated as own since getDignity() doesn't distinguish it.
const SAPTAVARGAJA_VIRUPA: Record<Dignity, number> = { exalted: 45, own: 30, friend: 22.5, neutral: 7.5, enemy: 3.75, debilitated: 0, none: 0 };

function isShadbalaPlanet(name: string): name is ShadbalaPlanet {
  return (SCORE_PLANETS as readonly string[]).includes(name);
}

export function virupaToRupa(virupa: number): number {
  return virupa / 60;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getPlanet(chart: ShadbalaChartLike, name: string): ShadbalaChartPlanet | undefined {
  return (chart?.planets ?? []).find((planet) => planet.name === name);
}

function getPlanetHouse(planet: ShadbalaChartPlanet | undefined, ascendantSign: number | undefined): number | null {
  if (typeof planet?.house === 'number') return planet.house;
  if (typeof planet?.sign !== 'number' || typeof ascendantSign !== 'number') return null;
  return ((planet.sign - ascendantSign + 12) % 12) + 1;
}

function circularHouseDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 12;
  return Math.min(raw, 12 - raw);
}

function circularDegreeDistance(a: number, b: number): number {
  const raw = Math.abs(normalizeLongitude(a) - normalizeLongitude(b));
  return Math.min(raw, 360 - raw);
}

export function getDignity(planet: string, signIndex: number | null | undefined): Dignity {
  if (!isShadbalaPlanet(planet) || typeof signIndex !== 'number') return 'none';
  if (DEBILITATION_SIGNS[planet] === signIndex) return 'debilitated';
  if (EXALTATION_SIGNS[planet] === signIndex) return 'exalted';
  if (OWN_SIGNS[planet]?.includes(signIndex)) return 'own';
  const signLord = SIGN_LORDS[signIndex];
  const relation = NATURAL_RELATIONS[planet];
  if (relation?.friends.includes(signLord)) return 'friend';
  if (relation?.enemies.includes(signLord)) return 'enemy';
  return 'neutral';
}

export function calculateDigBalaVirupa(planetName: string, house: number | null | undefined): number {
  const maxHouse = isShadbalaPlanet(planetName) ? DIG_BALA_MAX_HOUSE[planetName] : undefined;
  if (!maxHouse || typeof house !== 'number') return 0;
  return clamp(60 * (1 - circularHouseDistance(house, maxHouse) / 6), 0, 60);
}

export function calculateUcchaBalaVirupa(planetName: string, longitude: number | undefined): number {
  const exaltLongitude = isShadbalaPlanet(planetName) ? EXALTATION_LONGITUDES[planetName] : undefined;
  if (typeof exaltLongitude !== 'number' || typeof longitude !== 'number') return 0;
  return clamp(60 * (1 - circularDegreeDistance(longitude, exaltLongitude) / 180), 0, 60);
}

export function calculateSaptavargajaBalaVirupa(planetName: string, longitude: number | undefined): number {
  if (typeof longitude !== 'number') return 0;
  return [1, 2, 3, 7, 9, 12, 30].reduce(
    (sum, division) => sum + (SAPTAVARGAJA_VIRUPA[getDignity(planetName, getVargaSignIndex(longitude, division))] ?? 0),
    0,
  ) / 7;
}

export function calculateOjhayugmaBalaVirupa(planetName: string, longitude: number | undefined): number {
  const preference = isShadbalaPlanet(planetName) ? ODD_EVEN_STRENGTH[planetName] : undefined;
  if (!preference || typeof longitude !== 'number') return 0;
  if (preference === 'both') return 15;
  const signMatches = (signIndex: number) => (preference === 'odd' ? signIndex % 2 === 0 : signIndex % 2 === 1);
  return (signMatches(getVargaSignIndex(longitude, 1)) ? 15 : 0) + (signMatches(getVargaSignIndex(longitude, 9)) ? 15 : 0);
}

export function calculateKendradiBalaVirupa(house: number | null | undefined): number {
  if (typeof house !== 'number') return 0;
  if ([1, 4, 7, 10].includes(house)) return 60;
  if ([2, 5, 8, 11].includes(house)) return 30;
  return 15;
}

export function calculateDrekkanaBalaVirupa(planetName: string, longitude: number | undefined): number {
  const preferred = isShadbalaPlanet(planetName) ? DREKKANA_STRENGTH[planetName] : undefined;
  if (!preferred || typeof longitude !== 'number') return 0;
  return Math.floor(getDegreesInSign(longitude) / 10) + 1 === preferred ? 15 : 0;
}

export function calculateSthanaBalaBreakdown(planetName: string, planet: ShadbalaChartPlanet | undefined, house: number | null): SthanaBalaBreakdown {
  const longitude = planet?.longitude;
  const uccha = calculateUcchaBalaVirupa(planetName, longitude);
  const saptavargaja = calculateSaptavargajaBalaVirupa(planetName, longitude);
  const ojhayugma = calculateOjhayugmaBalaVirupa(planetName, longitude);
  const kendradi = calculateKendradiBalaVirupa(house);
  const drekkana = calculateDrekkanaBalaVirupa(planetName, longitude);
  return { uccha, saptavargaja, ojhayugma, kendradi, drekkana, total: uccha + saptavargaja + ojhayugma + kendradi + drekkana };
}

function estimateSectFromSunHouse(chart: ShadbalaChartLike): 'day' | 'night' | 'unknown' {
  const sunHouse = getPlanetHouse(getPlanet(chart, 'Sun'), chart?.ascendant?.sign);
  if (typeof sunHouse !== 'number') return 'unknown';
  return [7, 8, 9, 10, 11, 12].includes(sunHouse) ? 'day' : 'night';
}

function calculateNatonnataBalaVirupa(planetName: ShadbalaPlanet, sect: 'day' | 'night' | 'unknown'): number {
  const pref = DAY_NIGHT_STRENGTH[planetName];
  if (pref === 'both') return 60;
  if (sect === 'unknown') return 0;
  return pref === sect ? 60 : 0;
}

function calculatePakshaBalaVirupa(chart: ShadbalaChartLike): Partial<Record<ShadbalaPlanet, number>> {
  const sun = getPlanet(chart, 'Sun');
  const moon = getPlanet(chart, 'Moon');
  if (typeof sun?.longitude !== 'number' || typeof moon?.longitude !== 'number') return {};
  const elongation = normalizeLongitude(moon.longitude - sun.longitude);
  const bright = elongation <= 180 ? (elongation / 180) * 60 : ((360 - elongation) / 180) * 60;
  const dark = 60 - bright;
  return { Moon: bright, Venus: bright, Jupiter: bright, Mercury: bright, Sun: dark, Mars: dark, Saturn: dark };
}

// Returns the Tribhaga lord for the given birth time.
// Day (6am–6pm) thirds: Mercury (6–10am), Sun (10am–2pm), Saturn (2–6pm).
// Night (6pm–6am) thirds: Moon (6–10pm), Venus (10pm–2am), Mars (2–6am).
// Jupiter is strong in all six thirds. Approximation: assumes 6am sunrise/sunset.
function getTribhagaLord(chart: ShadbalaChartLike): string | null {
  const input = chart?.debug?.inputDateTime;
  if (!input) return null;
  const timeParts = input.split(' ')[1]?.split(':');
  if (!timeParts) return null;
  const localHour = parseInt(timeParts[0] ?? '0') + parseInt(timeParts[1] ?? '0') / 60;
  const DAY_LORDS = ['Mercury', 'Sun', 'Saturn'];
  const NIGHT_LORDS = ['Moon', 'Venus', 'Mars'];
  if (localHour >= 6 && localHour < 18) return DAY_LORDS[Math.min(Math.floor((localHour - 6) / 4), 2)];
  const nightHour = localHour >= 18 ? localHour - 18 : localHour + 6;
  return NIGHT_LORDS[Math.min(Math.floor(nightHour / 4), 2)];
}

function calculateTribhaagaBalaVirupa(planetName: ShadbalaPlanet, chart: ShadbalaChartLike): number {
  if (planetName === 'Jupiter') return 60;
  return planetName === getTribhagaLord(chart) ? 60 : 0;
}

function calculateVarsheshadiBalaVirupa(planetName: ShadbalaPlanet, chart: ShadbalaChartLike): number {
  const input = chart?.debug?.inputDateTime;
  const date = input ? new Date(input) : null;
  const dayLords = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const lord = date && !Number.isNaN(date.getTime()) ? dayLords[date.getDay()] : null;
  if (!lord) return 0;
  if (planetName === lord) return 60;
  if (NATURAL_RELATIONS[planetName]?.friends.includes(lord)) return 30;
  if (NATURAL_RELATIONS[planetName]?.enemies.includes(lord)) return 0;
  return 15;
}

// Approximation of declination-based Ayana Bala. Uses sin(tropical longitude) as a proxy for
// declination; valid near the ecliptic. Ayanamsha comes from chart.debug.ayanamsa (exact for date).
function calculateAyanaBalaVirupa(planet: ShadbalaChartPlanet | undefined, ayanamsa: number | undefined): number {
  if (typeof planet?.longitude !== 'number') return 0;
  const ayan = typeof ayanamsa === 'number' ? ayanamsa : 24;
  const tropicalLongitude = normalizeLongitude(planet.longitude + ayan);
  return clamp(30 + 30 * Math.sin((tropicalLongitude * Math.PI) / 180), 0, 60);
}

export function calculateKalaBalaBreakdown(planetName: ShadbalaPlanet, chart: ShadbalaChartLike, planet: ShadbalaChartPlanet | undefined): KalaBalaBreakdown {
  const sect = estimateSectFromSunHouse(chart);
  const pakshaMap = calculatePakshaBalaVirupa(chart);
  const natonnata = calculateNatonnataBalaVirupa(planetName, sect);
  const paksha = pakshaMap[planetName] ?? 0;
  const tribhaaga = calculateTribhaagaBalaVirupa(planetName, chart);
  const tribhagaLord = getTribhagaLord(chart);
  const varsheshadi = calculateVarsheshadiBalaVirupa(planetName, chart);
  const ayana = calculateAyanaBalaVirupa(planet, chart?.debug?.ayanamsa);
  return { sect, natonnata, paksha, tribhaaga, tribhagaLord, varsheshadi, ayana, total: natonnata + paksha + tribhaaga + varsheshadi + ayana };
}

// Approximation. Classical Cheshta Bala requires planet speed categories (Vakra/Sama/etc.).
// Outer planets: retrograde (Vakra) = 60 virupa; direct = distance-from-Sun proxy.
// Inner planets: distance-from-Sun proxy (elongation). Sun=30 (fixed); Moon=60 (fixed).
export function calculateCheshtaBalaVirupa(planetName: ShadbalaPlanet, chart: ShadbalaChartLike, planet: ShadbalaChartPlanet | undefined): number {
  if (planetName === 'Sun') return 30;
  if (planetName === 'Moon') return 60;
  const sun = getPlanet(chart, 'Sun');
  if (typeof sun?.longitude !== 'number' || typeof planet?.longitude !== 'number') return 0;
  const distance = circularDegreeDistance(planet.longitude, sun.longitude);
  if (planetName === 'Mars' || planetName === 'Jupiter' || planetName === 'Saturn') {
    if (planet.isRetrograde) return 60;
    return clamp((distance / 180) * 60, 0, 60);
  }
  return clamp(60 * (1 - Math.abs(distance - 60) / 120), 0, 60);
}

function aspectOrbStrength(diff: number, exact: number, orb = 30): number {
  const delta = Math.abs(diff - exact);
  return delta <= orb ? 1 - delta / orb : 0;
}

function getAspectStrength(fromName: ShadbalaPlanet, fromLongitude: number, toLongitude: number): number {
  const diff = normalizeLongitude(toLongitude - fromLongitude);
  let strength = aspectOrbStrength(diff, 180, 45);
  if (fromName === 'Mars') strength = Math.max(strength, aspectOrbStrength(diff, 90, 35), aspectOrbStrength(diff, 210, 35));
  if (fromName === 'Jupiter') strength = Math.max(strength, aspectOrbStrength(diff, 120, 35), aspectOrbStrength(diff, 240, 35));
  if (fromName === 'Saturn') strength = Math.max(strength, aspectOrbStrength(diff, 60, 35), aspectOrbStrength(diff, 270, 35));
  return clamp(strength, 0, 1);
}

// Approximation. Classical Drig Bala uses drishti-pinda (aspect points) with fixed weights.
// Here: +45 virupa per benefic aspect, −30 per malefic aspect. No arbitrary base score.
// Aspect orbs are custom (not classical exact-aspect). Negative values allowed per classical convention.
export function calculateDrikBalaVirupa(targetName: ShadbalaPlanet, chart: ShadbalaChartLike): number {
  const target = getPlanet(chart, targetName);
  if (typeof target?.longitude !== 'number') return 0;
  const targetLongitude = target.longitude;
  let score = 0;
  SCORE_PLANETS.forEach((fromName) => {
    if (fromName === targetName) return;
    const from = getPlanet(chart, fromName);
    if (typeof from?.longitude !== 'number') return;
    const aspect = getAspectStrength(fromName, from.longitude, targetLongitude);
    if (!aspect) return;
    score += (BENEFICS.includes(fromName) ? 45 : -30) * aspect;
  });
  return score;
}

export function buildShadbalaRows(chart: ShadbalaChartLike): ShadbalaRow[] {
  const ascendantSign = chart?.ascendant?.sign;
  return SCORE_PLANETS
    .map((planetName): ShadbalaRow | null => {
      const planet = getPlanet(chart, planetName);
      if (!planet) return null;
      const house = getPlanetHouse(planet, ascendantSign);
      const sthanaBreakdown = calculateSthanaBalaBreakdown(planetName, planet, house);
      const kalaBreakdown = calculateKalaBalaBreakdown(planetName, chart, planet);
      const naisargikaVirupa = NAISARGIKA_BALA_VIRUPA[planetName] ?? 0;
      const digVirupa = calculateDigBalaVirupa(planetName, house);
      const cheshtaVirupa = calculateCheshtaBalaVirupa(planetName, chart, planet);
      const drikVirupa = calculateDrikBalaVirupa(planetName, chart);
      const totalVirupa = sthanaBreakdown.total + digVirupa + kalaBreakdown.total + cheshtaVirupa + naisargikaVirupa + drikVirupa;
      const requiredVirupa = SHADBALA_REQUIRED_VIRUPA[planetName] ?? 0;
      return {
        planet: planetName,
        house,
        retrograde: planet.isRetrograde ?? false,
        sthana: virupaToRupa(sthanaBreakdown.total),
        sthanaBreakdown,
        dig: virupaToRupa(digVirupa),
        digVirupa,
        kala: virupaToRupa(kalaBreakdown.total),
        kalaBreakdown,
        cheshta: virupaToRupa(cheshtaVirupa),
        cheshtaVirupa,
        naisargika: virupaToRupa(naisargikaVirupa),
        naisargikaVirupa,
        drik: virupaToRupa(drikVirupa),
        drikVirupa,
        total: virupaToRupa(totalVirupa),
        totalVirupa,
        requiredVirupa,
        ratio: requiredVirupa ? totalVirupa / requiredVirupa : 0,
      };
    })
    .filter((row): row is ShadbalaRow => row !== null);
}
