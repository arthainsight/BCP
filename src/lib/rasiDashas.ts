type PlanetData = { name: string; sign: number; degree: number; longitude: number; house?: number };

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;
export const RASI_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] as const;
export const RASI_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'] as const;
const LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'] as const;
const EXALT: Record<string, number> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBIL: Record<string, number> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
const MOVABLE = new Set([0, 3, 6, 9]);
const FIXED = new Set([1, 4, 7, 10]);
const EVEN_FOOTED = new Set([3, 4, 5, 9, 10, 11]);

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
  durationYears: number; childOrder: number[]; cycle?: number;
}
export interface RasiDashaResult { system: RasiDashaSystem; seedSign: number; basis: string; entries: RasiDashaEntry[]; }

const norm = (n: number) => ((n % 12) + 12) % 12;
const addYears = (date: Date, years: number) => new Date(date.getTime() + years * YEAR_MS);
const signOf = (planets: PlanetData[], name: string) => planets.find(p => p.name === name)?.sign != null ? planets.find(p => p.name === name)!.sign - 1 : null;
const degreeOf = (planets: PlanetData[], name: string) => planets.find(p => p.name === name)?.degree ?? 0;
const occupants = (planets: PlanetData[], sign: number) => planets.filter(p => p.sign - 1 === sign && p.name !== 'Rahu' && p.name !== 'Ketu');

function strongerSign(planets: PlanetData[], first: number, second: number): number {
  const a = occupants(planets, first); const b = occupants(planets, second);
  if (a.length !== b.length) return a.length > b.length ? first : second;
  const ax = a.some(p => EXALT[p.name] === first); const bx = b.some(p => EXALT[p.name] === second);
  if (ax !== bx) return ax ? first : second;
  const rank = (s: number) => MOVABLE.has(s) ? 1 : FIXED.has(s) ? 2 : 3;
  if (rank(first) !== rank(second)) return rank(first) > rank(second) ? first : second;
  return degreeOf(planets, LORDS[first]) > degreeOf(planets, LORDS[second]) ? first : second;
}

function narayanaDuration(planets: PlanetData[], sign: number): number {
  const lord = LORDS[sign]; const lordSign = signOf(planets, lord);
  if (lordSign == null) return 12;
  let count = EVEN_FOOTED.has(sign) ? norm(sign - lordSign) + 1 : norm(lordSign - sign) + 1;
  count -= 1;
  if (count <= 0) count = 12;
  if (EXALT[lord] === lordSign) count += 1;
  else if (DEBIL[lord] === lordSign) count -= 1;
  return Math.max(1, count);
}

function narayanaOrder(seed: number, planets: PlanetData[]): number[] {
  if (signOf(planets, 'Ketu') === seed) return [...NARAYANA_KETU[seed]];
  if (signOf(planets, 'Saturn') === seed) return Array.from({ length: 12 }, (_, i) => norm(seed + i));
  return [...NARAYANA_NORMAL[seed]];
}

function sequentialOrder(seed: number, direction: 1 | -1): number[] {
  return Array.from({ length: 12 }, (_, index) => norm(seed + direction * index));
}

function childOrder(system: RasiDashaSystem, sign: number, planets: PlanetData[]): number[] {
  if (system === 'sthira') return sequentialOrder(sign, 1);
  if (system === 'moola') {
    let direction: 1 | -1 = sign % 2 === 0 ? 1 : -1;
    if (signOf(planets, 'Saturn') === sign) direction = 1;
    if (signOf(planets, 'Ketu') === sign) direction = direction === 1 ? -1 : 1;
    return sequentialOrder(sign, direction);
  }
  const lordSign = signOf(planets, LORDS[sign]) ?? sign;
  const seventhLordSign = signOf(planets, LORDS[norm(sign + 6)]) ?? norm(sign + 6);
  const seed = strongerSign(planets, lordSign, seventhLordSign);
  let direction: 1 | -1 = seed % 2 === 0 ? 1 : -1;
  if (signOf(planets, 'Saturn') === seed) direction = 1;
  if (signOf(planets, 'Ketu') === sign) direction = direction === 1 ? -1 : 1;
  return sequentialOrder(seed, direction);
}

function makeEntry(system: RasiDashaSystem, sign: number, startDate: Date, years: number, planets: PlanetData[], cycle?: number): RasiDashaEntry {
  return { sign, signName: RASI_NAMES[sign], abbr: RASI_ABBR[sign], startDate, endDate: addYears(startDate, years), durationYears: years, childOrder: childOrder(system, sign, planets), cycle };
}

function brahmaSeed(planets: PlanetData[], ascSign: number): { sign: number; planet: string } {
  const strong = strongerSign(planets, ascSign, norm(ascSign + 6));
  const candidates = [5, 7, 11].map(offset => LORDS[norm(strong + offset)]).filter((name, index, all) => all.indexOf(name) === index);
  const score = (name: string) => {
    const sign = signOf(planets, name) ?? 0;
    return (EXALT[name] === sign ? 4 : DEBIL[name] === sign ? -2 : 0) + (sign % 2 === 0 ? 1 : 0) + degreeOf(planets, name) / 30;
  };
  const planet = [...candidates].sort((a, b) => score(b) - score(a))[0] ?? LORDS[strong];
  return { sign: signOf(planets, planet) ?? strong, planet };
}

export function calculateRasiDasha(system: RasiDashaSystem, planets: PlanetData[], ascSignOneBased: number, birthDate: Date): RasiDashaResult {
  const asc = norm(ascSignOneBased - 1);
  let seed = strongerSign(planets, asc, norm(asc + 6));
  let basis = `stronger of Lagna/7th: ${RASI_NAMES[seed]}`;
  let order: number[];
  if (system === 'narayana') order = narayanaOrder(seed, planets);
  else if (system === 'moola') {
    let direction: 1 | -1 = seed % 2 === 0 ? 1 : -1;
    if (signOf(planets, 'Saturn') === seed) direction = 1;
    if (signOf(planets, 'Ketu') === seed) direction = direction === 1 ? -1 : 1;
    const offsets = [0,3,6,9,1,4,7,10,2,5,8,11];
    order = offsets.map(offset => norm(seed + direction * offset));
    basis = `Lagna Kendrādi · ${basis}`;
  } else {
    const brahma = brahmaSeed(planets, asc);
    seed = brahma.sign; order = sequentialOrder(seed, 1);
    basis = `Brahma: ${brahma.planet} in ${RASI_NAMES[seed]}`;
  }

  const entries: RasiDashaEntry[] = [];
  let cursor = birthDate;
  if (system === 'sthira') {
    for (const sign of order) {
      const years = MOVABLE.has(sign) ? 7 : FIXED.has(sign) ? 8 : 9;
      const item = makeEntry(system, sign, cursor, years, planets); entries.push(item); cursor = item.endDate;
    }
  } else {
    const firstDurations = order.map(sign => narayanaDuration(planets, sign));
    for (let cycle = 1; cycle <= 2; cycle++) {
      for (let index = 0; index < order.length; index++) {
        const years = cycle === 1 ? firstDurations[index] : 12 - firstDurations[index];
        if (years <= 0) continue;
        const item = makeEntry(system, order[index], cursor, years, planets, cycle); entries.push(item); cursor = item.endDate;
      }
    }
  }
  return { system, seedSign: seed, basis, entries };
}

export function calculateRasiSubDashas(parent: RasiDashaEntry, planets: PlanetData[], system: RasiDashaSystem): RasiDashaEntry[] {
  const years = parent.durationYears / 12;
  let cursor = parent.startDate;
  return parent.childOrder.map(sign => {
    const item = makeEntry(system, sign, cursor, years, planets); cursor = item.endDate; return item;
  });
}
