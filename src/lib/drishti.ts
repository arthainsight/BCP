import type { PlanetData } from '@/types';

export type DrishtiMode = 'graha' | 'rashi' | 'both';

export type DrishtiChartPlanet = {
  name: string;
  sign: number;
  house?: number;
  longitude?: number;
};

export type DrishtiChartLike = {
  ascendant?: { sign?: number };
  planets?: DrishtiChartPlanet[];
};

export type GrahaDrishtiRow = {
  planet: string;
  fromHouse: number | null;
  fromSign: number | null;
  aspects: number[];
  labels: string[];
};

export type RashiDrishtiRow = {
  sign: number;
  signLabel: string;
  house: number | null;
  aspectsSigns: number[];
  aspectsHouses: number[];
  labels: string[];
};

export type DrishtiHouseSummary = {
  house: number;
  graha: string[];
  rashi: string[];
  total: number;
};

export type DrishtiResult = {
  graha: GrahaDrishtiRow[];
  rashi: RashiDrishtiRow[];
  houses: DrishtiHouseSummary[];
};

export interface GrahaDrishtiAspect {
  planet: string;
  fromHouse: number;
  toHouse: number;
  aspectedPlanets: string[];
}

export interface RashiDrishtiAspect {
  fromSign: number;
  fromPlanets: string[];
  toSign: number;
  toPlanets: string[];
}

const SIGN_ABBR = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const GRAHA_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];

const GRAHA_CODES: Record<string, string> = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

const SPECIAL_GRAHA_ASPECTS: Record<string, number[]> = {
  Mars: [4, 7, 8],
  Jupiter: [5, 7, 9],
  Saturn: [3, 7, 10],
  Rahu: [5, 7, 9],
  Ketu: [5, 7, 9],
};

function normalizeSign(sign: number): number {
  return ((sign - 1 + 12) % 12) + 1;
}

function getHouseFromSign(sign: number, ascendantSign: number | undefined): number | null {
  if (typeof ascendantSign !== 'number') return null;
  return ((sign - ascendantSign + 12) % 12) + 1;
}

function getHouseFromPlanet(chart: DrishtiChartLike, planet: DrishtiChartPlanet): number | null {
  if (typeof planet.house === 'number') return planet.house;
  if (typeof planet.sign === 'number') return getHouseFromSign(planet.sign, chart.ascendant?.sign);
  return null;
}

function relativeHouseToAbsolute(fromHouse: number, relativeHouse: number): number {
  return ((fromHouse + relativeHouse - 2) % 12) + 1;
}

function isMovable(sign: number): boolean {
  return [1, 4, 7, 10].includes(sign);
}

function isFixed(sign: number): boolean {
  return [2, 5, 8, 11].includes(sign);
}

function isDual(sign: number): boolean {
  return [3, 6, 9, 12].includes(sign);
}

function isAdjacentSign(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  return diff === 1 || diff === 11;
}

export function getRashiAspectSigns(sign: number): number[] {
  const signs = Array.from({ length: 12 }, (_, index) => index + 1);
  if (isMovable(sign)) return signs.filter((target) => isFixed(target) && !isAdjacentSign(sign, target));
  if (isFixed(sign)) return signs.filter((target) => isMovable(target) && !isAdjacentSign(sign, target));
  if (isDual(sign)) return signs.filter((target) => isDual(target) && target !== sign);
  return [];
}

function grahaAspectOffsets(planet: string): number[] {
  return SPECIAL_GRAHA_ASPECTS[planet] ?? [7];
}

function targetHouse(fromHouse: number, offset: number): number {
  return relativeHouseToAbsolute(fromHouse, offset);
}

export function buildGrahaDrishti(chart: DrishtiChartLike): GrahaDrishtiRow[] {
  return GRAHA_PLANETS
    .map((name) => chart.planets?.find((planet) => planet.name === name))
    .filter((planet): planet is DrishtiChartPlanet => Boolean(planet))
    .map((planet) => {
      const fromHouse = getHouseFromPlanet(chart, planet);
      const fromSign = typeof planet.sign === 'number' ? planet.sign : null;
      const relativeAspects = grahaAspectOffsets(planet.name);
      const aspects = typeof fromHouse === 'number'
        ? relativeAspects.map((relative) => relativeHouseToAbsolute(fromHouse, relative))
        : [];

      return {
        planet: planet.name,
        fromHouse,
        fromSign,
        aspects,
        labels: aspects.map((house, index) => `${relativeAspects[index]}th→H${house}`),
      };
    });
}

export function buildRashiDrishti(chart: DrishtiChartLike): RashiDrishtiRow[] {
  return Array.from({ length: 12 }, (_, index) => index + 1).map((sign) => {
    const house = getHouseFromSign(sign, chart.ascendant?.sign);
    const aspectsSigns = getRashiAspectSigns(sign);
    const aspectsHouses = aspectsSigns
      .map((targetSign) => getHouseFromSign(targetSign, chart.ascendant?.sign))
      .filter((houseNumber): houseNumber is number => typeof houseNumber === 'number');

    return {
      sign,
      signLabel: SIGN_ABBR[sign],
      house,
      aspectsSigns,
      aspectsHouses,
      labels: aspectsSigns.map((targetSign) => `${SIGN_ABBR[sign]}→${SIGN_ABBR[targetSign]}`),
    };
  });
}

export function buildDrishti(chart: DrishtiChartLike): DrishtiResult {
  const graha = buildGrahaDrishti(chart);
  const rashi = buildRashiDrishti(chart);
  const houses: DrishtiHouseSummary[] = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const grahaHits = graha
      .filter((row) => row.aspects.includes(house))
      .map((row) => GRAHA_CODES[row.planet] ?? row.planet.slice(0, 2));
    const rashiHits = rashi
      .filter((row) => row.aspectsHouses.includes(house))
      .map((row) => row.signLabel);

    return {
      house,
      graha: grahaHits,
      rashi: rashiHits,
      total: grahaHits.length + rashiHits.length,
    };
  });

  return { graha, rashi, houses };
}

export function calculateGrahaDrishti(planets: PlanetData[]): GrahaDrishtiAspect[] {
  const visible = planets.filter((planet) => !OUTER_PLANETS.includes(planet.name));
  const aspects: GrahaDrishtiAspect[] = [];

  for (const planet of visible) {
    if (typeof planet.house !== 'number') continue;

    for (const offset of grahaAspectOffsets(planet.name)) {
      const toHouse = targetHouse(planet.house, offset);
      const aspectedPlanets = visible
        .filter((target) => target.name !== planet.name && target.house === toHouse)
        .map((target) => target.name);

      aspects.push({
        planet: planet.name,
        fromHouse: planet.house,
        toHouse,
        aspectedPlanets,
      });
    }
  }

  return aspects;
}

export function calculateRashiDrishti(planets: PlanetData[], ascendantSign: number): RashiDrishtiAspect[] {
  const visible = planets.filter((planet) => !OUTER_PLANETS.includes(planet.name));
  const aspects: RashiDrishtiAspect[] = [];
  const occupiedSigns = new Set<number>([ascendantSign, ...visible.map((planet) => planet.sign)]);

  for (const fromSign of occupiedSigns) {
    const fromPlanets = visible.filter((planet) => planet.sign === fromSign).map((planet) => planet.name);
    if (fromSign === ascendantSign) fromPlanets.unshift('Asc');

    for (const toSign of getRashiAspectSigns(fromSign)) {
      const toPlanets = visible.filter((planet) => planet.sign === toSign).map((planet) => planet.name);
      if (toSign === ascendantSign) toPlanets.unshift('Asc');

      aspects.push({
        fromSign,
        fromPlanets,
        toSign,
        toPlanets,
      });
    }
  }

  return aspects;
}
