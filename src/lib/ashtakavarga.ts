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

// Varahamihira's Bṛhajjātaka, chapter 9 (verses 9.1–9.7).
// The source gives the same eight contributors, but differs from BPHS in four
// contributor rows: Moon from Moon, Mars from Moon, Jupiter from Moon, and
// Venus from Mars. All other rows match the currently verified Parāśara table.
// Keep this as a separate named system so the provenance is explicit.
export const VARAHAMIHIRA_AV: Record<AshtakavargaPlanet, Record<Contributor, number[]>> = {
  ...PARASHARA_AV,
  Moon: {
    ...PARASHARA_AV.Moon,
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
  },
  Venus: {
    ...PARASHARA_AV.Venus,
    Mars: [3, 5, 6, 9, 11, 12],
  },
};

export type AshtakavargaSystem = 'Parashara' | 'Varahamihira';

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

export function buildBhinnaAshtakavarga(chart: AshtakavargaChartLike, system: AshtakavargaSystem = 'Parashara'): BhinnaAshtakavargaRow[] {
  return PLANETS.map((planetName) => {
    const rules = (system === 'Varahamihira' ? VARAHAMIHIRA_AV : PARASHARA_AV)[planetName];

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

export function buildAshtakavarga(chart: AshtakavargaChartLike, system: AshtakavargaSystem = 'Parashara'): AshtakavargaResult {
  const bav = buildBhinnaAshtakavarga(chart, system);
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


/** The two published Rasimana multiplier tables used for Rāśi Piṇḍa. */
export type RasimanaOption = 'pvr' | 'alternate';
export const RASIMANA_MULTIPLIERS: Record<RasimānaOption, readonly number[]> = {
  pvr:       [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12],
  alternate: [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12],
};
export const GRAHAMANA_MULTIPLIERS: Record<AshtakavargaPlanet, number> = {
  Sun: 5, Moon: 5, Mars: 8, Mercury: 5, Jupiter: 10, Venus: 7, Saturn: 5,
};

export interface AshtakavargaSignRow {
  planet: AshtakavargaPlanet;
  /** BAV values in fixed zodiac order: Aries through Pisces. */
  signs: number[];
}
export interface AshtakavargaPindaRow {
  planet: AshtakavargaPlanet;
  rasiPinda: number;
  grahaPinda: number;
  shodhyaPinda: number;
}
export interface AshtakavargaShodhanaResult {
  raw: AshtakavargaSignRow[];
  afterTrikona: AshtakavargaSignRow[];
  afterEkadhipatya: AshtakavargaSignRow[];
  pindas: AshtakavargaPindaRow[];
  rasimana: RasimanaOption;
}

const EKADHIPATYA_PAIRS: readonly (readonly [number, number])[] = [
  [0, 7], // Aries–Scorpio, Mars
  [1, 6], // Taurus–Libra, Venus
  [2, 5], // Gemini–Virgo, Mercury
  [8, 11], // Sagittarius–Pisces, Jupiter
  [9, 10], // Capricorn–Aquarius, Saturn
];

/** Trikoṇa Śodhana (BPHS 67): reduce each fire/earth/air/water trine together. */
export function trikonaShodhana(signValues: readonly number[]): number[] {
  if (signValues.length !== 12) throw new RangeError('Trikoṇa Śodhana requires twelve sign values');
  const result = [...signValues];
  for (let start = 0; start < 4; start += 1) {
    const indices = [start, start + 4, start + 8];
    const values = indices.map(index => result[index]);
    if (values.some(value => value === 0)) continue;
    if (values[0] === values[1] && values[1] === values[2]) {
      for (const index of indices) result[index] = 0;
      continue;
    }
    const minimum = Math.min(...values);
    for (const index of indices) result[index] -= minimum;
  }
  return result;
}

/**
 * Ekādhipatya Śodhana (BPHS 68), after Trikoṇa Śodhana.
 * occupiedSigns is indexed Aries..Pisces. Where the printed rule leaves the
 * equal-value case unstated, an empty sign with the same value as its occupied
 * counterpart is reduced to zero (the explicit PyJHora / secondary-reference
 * convention). The UI labels this choice so it is not mistaken for an explicit
 * Sanskrit instruction.
 */
export function ekadhipatyaShodhana(signValues: readonly number[], occupiedSigns: readonly boolean[]): number[] {
  if (signValues.length !== 12 || occupiedSigns.length !== 12) {
    throw new RangeError('Ekādhipatya Śodhana requires twelve bindu and occupancy values');
  }
  const result = [...signValues];
  for (const [first, second] of EKADHIPATYA_PAIRS) {
    const a = result[first];
    const b = result[second];
    if (a === 0 || b === 0 || (occupiedSigns[first] && occupiedSigns[second])) continue;

    if (!occupiedSigns[first] && !occupiedSigns[second]) {
      if (a === b) {
        result[first] = 0;
        result[second] = 0;
      } else {
        const minimum = Math.min(a, b);
        result[first] = minimum;
        result[second] = minimum;
      }
    } else if (occupiedSigns[first]) {
      result[second] = b <= a ? 0 : a;
    } else {
      result[first] = a <= b ? 0 : b;
    }
  }
  return result;
}

/** Rāśi Piṇḍa, Graha Piṇḍa and Śodhya Piṇḍa for one planet's reduced BAV. */
export function calculateShodhyaPinda(
  reducedSigns: readonly number[],
  grahaSigns: Partial<Record<AshtakavargaPlanet, number>>,
  rasimana: RasimanaOption = 'pvr',
): Omit<AshtakavargaPindaRow, 'planet'> {
  if (reducedSigns.length !== 12) throw new RangeError('Piṇḍa calculation requires twelve reduced sign values');
  const rasiPinda = reducedSigns.reduce((sum, bindus, signIndex) =>
    sum + bindus * RASIMANA_MULTIPLIERS[rasimana][signIndex], 0);
  const grahaPinda = PLANETS.reduce((sum, graha) => {
    const sign = grahaSigns[graha];
    return typeof sign === 'number' && sign >= 0 && sign < 12
      ? sum + GRAHAMANA_MULTIPLIERS[graha] * reducedSigns[sign]
      : sum;
  }, 0);
  return { rasiPinda, grahaPinda, shodhyaPinda: rasiPinda + grahaPinda };
}

/** Full reduction and Piṇḍa workflow, keeping every intermediate BAV visible. */
export function buildAshtakavargaShodhana(
  chart: AshtakavargaChartLike,
  system: AshtakavargaSystem = 'Parashara',
  rasimana: RasimanaOption = 'pvr',
): AshtakavargaShodhanaResult | null {
  const ascendantSign = chart.ascendant?.sign;
  if (typeof ascendantSign !== 'number' || ascendantSign < 1 || ascendantSign > 12) return null;

  const { bav } = buildAshtakavarga(chart, system);
  const raw = bav.map(row => ({
    planet: row.planet,
    signs: mapAshtakavargaHousesToSigns(row.houses, ascendantSign),
  }));
  const afterTrikona = raw.map(row => ({ ...row, signs: trikonaShodhana(row.signs) }));

  const occupiedSigns = Array.from({ length: 12 }, () => false);
  const grahaSigns: Partial<Record<AshtakavargaPlanet, number>> = {};
  for (const body of chart.planets ?? []) {
    if (!Number.isInteger(body.sign) || body.sign! < 1 || body.sign! > 12) continue;
    if (body.name in GRAHAMANA_MULTIPLIERS) {
      grahaSigns[body.name as AshtakavargaPlanet] = body.sign! - 1;
      occupiedSigns[body.sign! - 1] = true;
    } else if (body.name === 'Rahu' || body.name === 'Ketu') {
      occupiedSigns[body.sign! - 1] = true;
    }
  }
  const afterEkadhipatya = afterTrikona.map(row => ({
    ...row,
    signs: ekadhipatyaShodhana(row.signs, occupiedSigns),
  }));
  const pindas = afterEkadhipatya.map(row => ({
    planet: row.planet,
    ...calculateShodhyaPinda(row.signs, grahaSigns, rasimana),
  }));
  return { raw, afterTrikona, afterEkadhipatya, pindas, rasimana };
}
