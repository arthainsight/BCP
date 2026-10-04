// Tājika Varṣaphala — the rules applied to an annual chart that has already
// been cast for the Sun's return to its natal sidereal longitude.
//
// Sources: P.V.R. Narasimha Rao, "Vedic Astrology: An Integrated Approach",
// chapters 28–30, checked against the worked examples carried in PyJHora's
// test suite (Example 118, 120 / Chart 66, 122 / Chart 67).
//
// Pure functions on chart data; the ephemeris work happens in the API route.

import type { ChartData, PlanetData } from '@/types';
import { normalizeDegrees } from './angles';

export const SEVEN = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
export type SevenPlanet = typeof SEVEN[number];

const SIGN_LORDS: SevenPlanet[] = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

/** Lord of sign 1–12. */
export function signLord(sign: number): SevenPlanet {
  return SIGN_LORDS[(sign - 1 + 12) % 12];
}

// Naisargika (natural) relationships.
const FRIENDS: Record<SevenPlanet, SevenPlanet[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'],
  Moon: ['Sun', 'Mercury'],
  Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'],
};
const ENEMIES: Record<SevenPlanet, SevenPlanet[]> = {
  Sun: ['Venus', 'Saturn'],
  Moon: [],
  Mars: ['Mercury'],
  Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'],
  Venus: ['Sun', 'Moon'],
  Saturn: ['Sun', 'Moon', 'Mars'],
};

/** Deep exaltation longitudes (sidereal degrees). */
const EXALTATION: Record<SevenPlanet, number> = {
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200,
};

// ── Muntha ──────────────────────────────────────────────────────────────

/** Muntha advances one sign a year from the natal lagna. Returns sign 1–12. */
export function munthaSign(natalAscSign: number, completedYears: number): number {
  return ((natalAscSign - 1 + completedYears) % 12 + 12) % 12 + 1;
}

// ── Tājika aspects (sign to sign) ──────────────────────────────────────

export type TajikaAspect = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition' | null;

/**
 * Tājika aspect between two signs, counted from `from` to `to`. Sextile (3/11)
 * and trine (5/9) are friendly; conjunction, square (4/10) and opposition are
 * inimical; 2/12 and 6/8 form no aspect.
 */
export function tajikaAspect(fromSign: number, toSign: number): TajikaAspect {
  const house = ((toSign - fromSign + 12) % 12) + 1;
  if (house === 1) return 'conjunction';
  if (house === 3 || house === 11) return 'sextile';
  if (house === 4 || house === 10) return 'square';
  if (house === 5 || house === 9) return 'trine';
  if (house === 7) return 'opposition';
  return null;
}

export function isFriendlyAspect(aspect: TajikaAspect): boolean {
  return aspect === 'sextile' || aspect === 'trine';
}

// ── Pañcavargīya Bala ──────────────────────────────────────────────────

export type VargaDignity = 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated';

const DIGNITY_SHARE: Record<VargaDignity, number> = { own: 1, friend: 0.75, neutral: 0.5, enemy: 0.25, debilitated: 0 };

function dignityIn(planet: SevenPlanet, sign: number): VargaDignity {
  const lord = signLord(sign);
  if (lord === planet) return 'own';
  const exaltSign = Math.floor(EXALTATION[planet] / 30) + 1;
  if (sign === exaltSign) return 'own';
  if (sign === ((exaltSign + 5) % 12) + 1) return 'debilitated';
  if (FRIENDS[planet].includes(lord)) return 'friend';
  if (ENEMIES[planet].includes(lord)) return 'enemy';
  return 'neutral';
}

// Egyptian terms (Tājika hadda): [lord, end degree] per sign, Aries first.
const HADDA: [SevenPlanet, number][][] = [
  [['Jupiter', 6], ['Venus', 12], ['Mercury', 20], ['Mars', 25], ['Saturn', 30]],
  [['Venus', 8], ['Mercury', 14], ['Jupiter', 22], ['Saturn', 27], ['Mars', 30]],
  [['Mercury', 6], ['Jupiter', 12], ['Venus', 17], ['Mars', 24], ['Saturn', 30]],
  [['Mars', 7], ['Venus', 13], ['Mercury', 19], ['Jupiter', 26], ['Saturn', 30]],
  [['Jupiter', 6], ['Venus', 11], ['Saturn', 18], ['Mercury', 24], ['Mars', 30]],
  [['Mercury', 7], ['Venus', 17], ['Jupiter', 21], ['Mars', 28], ['Saturn', 30]],
  [['Saturn', 6], ['Mercury', 14], ['Jupiter', 21], ['Venus', 28], ['Mars', 30]],
  [['Mars', 7], ['Venus', 11], ['Mercury', 19], ['Jupiter', 24], ['Saturn', 30]],
  [['Jupiter', 12], ['Venus', 17], ['Mercury', 21], ['Saturn', 26], ['Mars', 30]],
  [['Mercury', 7], ['Jupiter', 14], ['Venus', 22], ['Saturn', 26], ['Mars', 30]],
  [['Mercury', 7], ['Venus', 13], ['Jupiter', 20], ['Mars', 25], ['Saturn', 30]],
  [['Venus', 12], ['Jupiter', 16], ['Mercury', 19], ['Mars', 28], ['Saturn', 30]],
];

/** Lord of the hadda (term) containing a sidereal longitude. */
export function haddaLord(longitude: number): SevenPlanet {
  const lon = normalizeDegrees(longitude);
  const terms = HADDA[Math.floor(lon / 30)];
  const degree = lon % 30;
  return (terms.find(([, end]) => degree < end) ?? terms[terms.length - 1])[0];
}

function haddaDignity(planet: SevenPlanet, longitude: number): Exclude<VargaDignity, 'debilitated'> {
  const lord = haddaLord(longitude);
  if (lord === planet) return 'own';
  if (FRIENDS[planet].includes(lord)) return 'friend';
  if (ENEMIES[planet].includes(lord)) return 'enemy';
  return 'neutral';
}

function drekkanaSign(longitude: number): number {
  const lon = normalizeDegrees(longitude);
  return ((Math.floor(lon / 30) + Math.min(Math.floor((lon % 30) / 10), 2) * 4) % 12) + 1;
}

function navamsaSign(longitude: number): number {
  return (Math.floor(normalizeDegrees(longitude) / (30 / 9)) % 12) + 1;
}

export interface PanchaVargiyaBala {
  planet: SevenPlanet;
  kshetra: number;
  uchcha: number;
  hadda: number;
  drekkana: number;
  navamsa: number;
  /** Sum of the five divided by four; at most 20. */
  total: number;
}

/**
 * Pañcavargīya Bala of one planet. Kṣetra 30, Hadda 15, Drekkāṇa 10 and
 * Navāṁśa 5 at most, scaled ¾ for a friend's sign, ½ neutral, ¼ enemy and
 * nothing in debilitation (own sign and exaltation take the full amount);
 * Uccha 20 at deep exaltation falling linearly to 0 at deep debilitation.
 */
export function panchaVargiyaBala(planet: SevenPlanet, longitude: number): PanchaVargiyaBala {
  const sign = Math.floor(normalizeDegrees(longitude) / 30) + 1;
  const kshetra = 30 * DIGNITY_SHARE[dignityIn(planet, sign)];
  const fromExaltation = Math.abs(normalizeDegrees(longitude - EXALTATION[planet] + 180) - 180);
  const uchcha = (20 * (180 - fromExaltation)) / 180;
  const hadda = 15 * DIGNITY_SHARE[haddaDignity(planet, longitude)];
  const drekkana = 10 * DIGNITY_SHARE[dignityIn(planet, drekkanaSign(longitude))];
  const navamsa = 5 * DIGNITY_SHARE[dignityIn(planet, navamsaSign(longitude))];
  return { planet, kshetra, uchcha, hadda, drekkana, navamsa, total: (kshetra + uchcha + hadda + drekkana + navamsa) / 4 };
}

// ── Pañcādhikārī and the lord of the year ─────────────────────────────

/** Tri-rāśi lords by the annual lagna sign (Aries first), for day and night years. */
const TRI_RASHI_DAY: SevenPlanet[] = ['Sun', 'Venus', 'Saturn', 'Venus', 'Jupiter', 'Moon', 'Mercury', 'Mars', 'Saturn', 'Mars', 'Jupiter', 'Moon'];
const TRI_RASHI_NIGHT: SevenPlanet[] = ['Jupiter', 'Moon', 'Mercury', 'Mars', 'Sun', 'Venus', 'Saturn', 'Venus', 'Saturn', 'Mars', 'Jupiter', 'Moon'];

export type OfficeRole = 'Muntheśa' | 'Janma lagneśa' | 'Varṣa lagneśa' | 'Tri-rāśi pati' | 'Dina-rātri pati';

export interface OfficeBearer {
  planet: SevenPlanet;
  roles: OfficeRole[];
  /** Aspect this planet casts on the annual lagna from its sign, if any. */
  aspectOnLagna: TajikaAspect;
  bala: number;
}

export interface YearLordResult {
  officeBearers: OfficeBearer[];
  yearLord: SevenPlanet;
  reason: string;
}

/**
 * The five office bearers, and the lord of the year: the strongest of them by
 * Pañcavargīya Bala among those that aspect the annual lagna. If none aspects
 * it, the strongest of all five is taken.
 */
export function yearLord(annual: ChartData, natalAscSign: number, completedYears: number, dayYear: boolean): YearLordResult {
  const muntha = munthaSign(natalAscSign, completedYears);
  const sun = annual.planets.find((p) => p.name === 'Sun')!;
  const moon = annual.planets.find((p) => p.name === 'Moon')!;
  const lagna = annual.ascendant.sign;

  const assignments: [SevenPlanet, OfficeRole][] = [
    [signLord(muntha), 'Muntheśa'],
    [signLord(natalAscSign), 'Janma lagneśa'],
    [signLord(lagna), 'Varṣa lagneśa'],
    [(dayYear ? TRI_RASHI_DAY : TRI_RASHI_NIGHT)[lagna - 1], 'Tri-rāśi pati'],
    [signLord(dayYear ? sun.sign : moon.sign), 'Dina-rātri pati'],
  ];

  const byPlanet = new Map<SevenPlanet, OfficeBearer>();
  for (const [planet, role] of assignments) {
    const existing = byPlanet.get(planet);
    if (existing) { existing.roles.push(role); continue; }
    const data = annual.planets.find((p) => p.name === planet) as PlanetData;
    byPlanet.set(planet, {
      planet,
      roles: [role],
      aspectOnLagna: tajikaAspect(data.sign, lagna),
      bala: panchaVargiyaBala(planet, data.longitude).total,
    });
  }
  const officeBearers = [...byPlanet.values()];
  const aspecting = officeBearers.filter((o) => o.aspectOnLagna !== null);
  const pool = aspecting.length > 0 ? aspecting : officeBearers;
  const strongest = pool.reduce((best, o) => (o.bala > best.bala ? o : best));
  const reason = aspecting.length === 0
    ? 'No office bearer aspects the annual lagna; the strongest of the five is taken.'
    : aspecting.length === 1
      ? 'The only office bearer aspecting the annual lagna.'
      : `Strongest by Pañcavargīya Bala of the ${aspecting.length} office bearers aspecting the annual lagna.`;
  return { officeBearers, yearLord: strongest.planet, reason };
}
