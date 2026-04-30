export type AshtakavargaPlanet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';

export type AshtakavargaChartPlanet = {
  name: string;
  house?: number;
  sign?: number;
  longitude?: number;
};

export type AshtakavargaChartLike = {
  ascendant?: { sign?: number; longitude?: number };
  planets?: AshtakavargaChartPlanet[];
};

export type BhinnaAshtakavargaRow = {
  planet: AshtakavargaPlanet;
  houses: number[];
  total: number;
};

export type SarvaAshtakavarga = {
  houses: number[];
  total: number;
  overlay: AshtakavargaOverlayCell[];
};

export type AshtakavargaOverlayCell = {
  house: number;
  sign: string;
  bindu: number;
  strength: 'low' | 'medium' | 'high' | 'very-high';
  label: string;
};

export type AshtakavargaResult = {
  bav: BhinnaAshtakavargaRow[];
  sav: SarvaAshtakavarga;
};

const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const PLANETS: AshtakavargaPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// Classical-style compact BAV rules: bindu-giving houses counted from each planet's own natal house.
// This is the correct architecture for BAV/SAV, but still marked beta because full Parashara AV
// also includes separate contributor-specific rules and reduction systems.
export const BAV_RULES: Record<AshtakavargaPlanet, number[]> = {
  Sun: [1, 2, 4, 7, 8, 9, 10, 11],
  Moon: [3, 6, 7, 10, 11],
  Mars: [3, 5, 6, 10, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [5, 6, 9, 11],
  Venus: [6, 7, 12],
  Saturn: [3, 5, 6, 10, 11],
};

function getPlanet(chart: AshtakavargaChartLike, name: string): AshtakavargaChartPlanet | undefined {
  return chart.planets?.find((planet) => planet.name === name);
}

function getPlanetHouse(chart: AshtakavargaChartLike, planet: AshtakavargaChartPlanet | undefined): number | null {
  if (typeof planet?.house === 'number') return planet.house;
  if (typeof planet?.sign === 'number' && typeof chart.ascendant?.sign === 'number') {
    return ((planet.sign - chart.ascendant.sign + 12) % 12) + 1;
  }
  return null;
}

function getHouseSignIndex(chart: AshtakavargaChartLike, house: number): number | null {
  if (typeof chart.ascendant?.sign !== 'number') return null;
  return (chart.ascendant.sign + house - 2 + 12) % 12;
}

function getRelativeHouse(fromHouse: number, toHouse: number): number {
  return ((toHouse - fromHouse + 12) % 12) + 1;
}

function getStrength(bindu: number): AshtakavargaOverlayCell['strength'] {
  if (bindu >= 5) return 'very-high';
  if (bindu >= 4) return 'high';
  if (bindu >= 3) return 'medium';
  return 'low';
}

export function buildBhinnaAshtakavarga(chart: AshtakavargaChartLike): BhinnaAshtakavargaRow[] {
  return PLANETS.map((planetName) => {
    const planet = getPlanet(chart, planetName);
    const planetHouse = getPlanetHouse(chart, planet);
    const rules = BAV_RULES[planetName];

    const houses = Array.from({ length: 12 }, (_, index) => {
      const house = index + 1;
      if (typeof planetHouse !== 'number') return 0;
      const relativeHouse = getRelativeHouse(planetHouse, house);
      return rules.includes(relativeHouse) ? 1 : 0;
    });

    return {
      planet: planetName,
      houses,
      total: houses.reduce((sum, value) => sum + value, 0),
    };
  });
}

export function buildSarvaAshtakavarga(chart: AshtakavargaChartLike, bav: BhinnaAshtakavargaRow[]): SarvaAshtakavarga {
  const houses = Array.from({ length: 12 }, (_, houseIndex) =>
    bav.reduce((sum, row) => sum + (row.houses[houseIndex] ?? 0), 0),
  );

  const overlay = houses.map((bindu, index) => {
    const house = index + 1;
    const signIndex = getHouseSignIndex(chart, house);
    const strength = getStrength(bindu);
    return {
      house,
      sign: typeof signIndex === 'number' ? SIGN_ABBR[signIndex] : '—',
      bindu,
      strength,
      label: `AV ${bindu}`,
    };
  });

  return {
    houses,
    total: houses.reduce((sum, value) => sum + value, 0),
    overlay,
  };
}

export function buildAshtakavarga(chart: AshtakavargaChartLike): AshtakavargaResult {
  const bav = buildBhinnaAshtakavarga(chart);
  const sav = buildSarvaAshtakavarga(chart, bav);
  return { bav, sav };
}

export function getAshtakavargaOverlay(chart: AshtakavargaChartLike): AshtakavargaOverlayCell[] {
  return buildAshtakavarga(chart).sav.overlay;
}
