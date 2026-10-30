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
};

export type AshtakavargaResult = {
  bav: BhinnaAshtakavargaRow[];
  sav: SarvaAshtakavarga;
};

const PLANETS: AshtakavargaPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

type Contributor = AshtakavargaPlanet | 'Ascendant';
const CONTRIBUTORS: Contributor[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Ascendant'];

// Full Parashara Ashtakavarga bindu tables (BPHS 66.16-68).
// For each planet P, for each contributing body C, the house positions
// (counted from C's natal sign) that grant one bindu to P's BAV.
//
// These are the places the verses call sthana (the rekha, the auspicious ones); the karana (the bindu of the
// verses, the inauspicious ones) are the rest. Read from the Sanskrit: the Sun's, the Moon's, Mars's and
// Mercury's sthana verse by verse, the others from the karana verses and their numbers (docs/ashtakavarga-sources.md).
// Until v3.43 the Moon's table was another printed one, which differs from the verses in three places
// (see the Moon block).
export const PARASHARA_AV: Record<AshtakavargaPlanet, Record<Contributor, number[]>> = {
  Sun: {
    Sun:        [1, 2, 4, 7, 8, 9, 10, 11],
    Moon:       [3, 6, 10, 11],
    Mars:       [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury:    [3, 5, 6, 9, 10, 11, 12],
    Jupiter:    [5, 6, 9, 11],
    Venus:      [6, 7, 12],
    Saturn:     [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant:  [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    // BPHS 66.20-23 and 66.46-48: the Moon at the 9th and Mars not, Jupiter at the 2nd and not at the 12th.
    Sun:        [3, 6, 7, 8, 10, 11],
    Moon:       [1, 3, 6, 7, 9, 10, 11],
    Mars:       [2, 3, 5, 6, 10, 11],
    Mercury:    [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter:    [1, 2, 4, 7, 8, 10, 11],
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
    Ascendant:  [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun:        [5, 6, 9, 11, 12],
    Moon:       [2, 4, 6, 8, 10, 11],
    Mars:       [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury:    [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter:    [6, 8, 11, 12],
    Venus:      [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn:     [1, 2, 4, 7, 8, 9, 10, 11],
    Ascendant:  [1, 2, 4, 6, 8, 10, 11],
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

// A "Varahamihira" system variant was removed in v2.15. After the v2.14
// Parashara fix its table differed from PARASHARA_AV by a single row — Venus
// from Mars as [3,5,6,9,11,12] instead of [3,4,6,9,11,12] — which made the UI
// selector suggest a fully independent Brihat Jataka table that did not exist.
// Re-add the system only once the complete Brihat Jataka IX table has been
// verified against a primary source; the one-row delta above is preserved here
// so that work does not start from zero.

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

function getRelativeHouse(fromHouse: number, toHouse: number): number {
  return ((toHouse - fromHouse + 12) % 12) + 1;
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

export function buildSarvaAshtakavarga(bav: BhinnaAshtakavargaRow[]): SarvaAshtakavarga {
  const houses = Array.from({ length: 12 }, (_, houseIndex) =>
    bav.reduce((sum, row) => sum + (row.houses[houseIndex] ?? 0), 0),
  );

  return {
    houses,
    total: houses.reduce((sum, value) => sum + value, 0),
  };
}

export function buildAshtakavarga(chart: AshtakavargaChartLike): AshtakavargaResult {
  const bav = buildBhinnaAshtakavarga(chart);
  const sav = buildSarvaAshtakavarga(bav);
  return { bav, sav };
}

/** Convert a house-indexed AV row (H1..H12) to fixed zodiac order (Aries..Pisces). */
export function mapAshtakavargaHousesToSigns(houses: number[], ascendantSign: number): number[] {
  return Array.from({ length: 12 }, (_, signIndex) => {
    const sign = signIndex + 1;
    const house = ((sign - ascendantSign + 12) % 12) + 1;
    return houses[house - 1] ?? 0;
  });
}
