export type AshtakavargaPlanet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
export type AvMode = 'off' | 'sav' | AshtakavargaPlanet;

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

type Contributor = AshtakavargaPlanet | 'Ascendant';
const CONTRIBUTORS: Contributor[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Ascendant'];

// Full Parashara Ashtakavarga bindu tables (BPHS).
// For each planet P, for each contributing body C, the house positions
// (counted from C's natal sign) that grant one bindu to P's BAV.
const PARASHARA_AV: Record<AshtakavargaPlanet, Record<Contributor, number[]>> = {
  Sun: {
    Sun:        [1, 2, 4, 7, 8, 9, 10, 11],
    Moon:       [3, 6, 10, 11],
    Mars:       [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury:    [3, 5, 6, 9, 10, 11, 12],
    Jupiter:    [5, 6, 9, 11],
    Venus:      [6, 7, 12],
    Saturn:     [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant:  [1, 2, 4, 7, 8, 9, 10, 11],
  },
  Moon: {
    Sun:        [3, 6, 7, 8, 10, 11],
    Moon:       [1, 3, 6, 7, 10, 11],
    Mars:       [2, 3, 5, 6, 9, 10, 11],
    Mercury:    [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter:    [1, 4, 7, 8, 10, 11, 12],
    Venus:      [3, 4, 5, 7, 9, 10, 11],
    Saturn:     [3, 5, 6, 11],
    Ascendant:  [3, 6, 10, 11],
  },
  Mars: {
    Sun:        [3, 5, 6, 10, 11],
    Moon:       [3, 6, 11],
    Mars:       [1, 2, 4, 7, 8, 10, 11],
    Mercury:    [3, 5, 6, 11],
    Jupiter:    [6, 10, 11, 12],
    Venus:      [6, 8, 11, 12],
    Saturn:     [1, 4, 7, 8, 9, 10, 11],
    Ascendant:  [1, 2, 4, 7, 8, 9, 10, 11],
  },
  Mercury: {
    Sun:        [5, 6, 9, 11, 12],
    Moon:       [2, 4, 6, 8, 10, 11],
    Mars:       [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury:    [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter:    [6, 8, 11, 12],
    Venus:      [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn:     [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant:  [1, 2, 4, 7, 8, 9, 10, 11],
  },
  Jupiter: {
    Sun:        [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon:       [2, 5, 7, 9, 11],
    Mars:       [1, 2, 4, 7, 8, 10, 11],
    Mercury:    [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter:    [1, 2, 3, 4, 7, 8, 10, 11],
    Venus:      [2, 5, 6, 9, 10, 11],
    Saturn:     [3, 5, 6, 12],
    Ascendant:  [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun:        [8, 11, 12],
    Moon:       [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars:       [3, 4, 6, 9, 11, 12],
    Mercury:    [3, 5, 6, 9, 11],
    Jupiter:    [5, 8, 9, 10, 11],
    Venus:      [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn:     [3, 4, 5, 8, 9, 10, 11],
    Ascendant:  [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun:        [1, 2, 4, 7, 8, 10, 11],
    Moon:       [3, 6, 11],
    Mars:       [3, 5, 6, 10, 11, 12],
    Mercury:    [6, 8, 9, 10, 11, 12],
    Jupiter:    [5, 6, 11, 12],
    Venus:      [6, 11, 12],
    Saturn:     [3, 5, 6, 11],
    Ascendant:  [1, 3, 4, 6, 10, 11],
  },
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

function getBavStrength(bindu: number): AshtakavargaOverlayCell['strength'] {
  if (bindu >= 6) return 'very-high';
  if (bindu >= 5) return 'high';
  if (bindu >= 4) return 'medium';
  return 'low';
}

function getSavStrength(bindu: number): AshtakavargaOverlayCell['strength'] {
  if (bindu >= 30) return 'very-high';
  if (bindu >= 25) return 'high';
  if (bindu >= 20) return 'medium';
  return 'low';
}

export function buildBhinnaAshtakavarga(chart: AshtakavargaChartLike): BhinnaAshtakavargaRow[] {
  return PLANETS.map((planetName) => {
    const rules = PARASHARA_AV[planetName];

    const houses = Array.from({ length: 12 }, (_, index) => {
      const house = index + 1;
      let bindu = 0;

      for (const contributor of CONTRIBUTORS) {
        let contributorHouse: number | null;
        if (contributor === 'Ascendant') {
          contributorHouse = 1;
        } else {
          const contributorPlanet = getPlanet(chart, contributor);
          contributorHouse = getPlanetHouse(chart, contributorPlanet);
        }
        if (typeof contributorHouse !== 'number') continue;

        const relativeHouse = getRelativeHouse(contributorHouse, house);
        if (rules[contributor].includes(relativeHouse)) {
          bindu += 1;
        }
      }

      return bindu;
    });

    return {
      planet: planetName,
      houses,
      total: houses.reduce<number>((sum, value) => sum + value, 0),
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
    const strength = getSavStrength(bindu);
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

function bavRowToOverlayCells(chart: AshtakavargaChartLike, row: BhinnaAshtakavargaRow): AshtakavargaOverlayCell[] {
  return row.houses.map((bindu, index) => {
    const house = index + 1;
    const signIndex = getHouseSignIndex(chart, house);
    const strength = getBavStrength(bindu);
    return {
      house,
      sign: typeof signIndex === 'number' ? SIGN_ABBR[signIndex] : '—',
      bindu,
      strength,
      label: `${bindu}`,
    };
  });
}

export function getAshtakavargaOverlay(chart: AshtakavargaChartLike, mode: AvMode): AshtakavargaOverlayCell[] {
  if (mode === 'off') return [];
  const { bav, sav } = buildAshtakavarga(chart);
  if (mode === 'sav') return sav.overlay;
  const row = bav.find(r => r.planet === mode);
  if (!row) return [];
  return bavRowToOverlayCells(chart, row);
}
