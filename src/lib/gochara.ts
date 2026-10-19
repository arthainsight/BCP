import type { ChartData, PlanetData } from '@/types';
import { buildAshtakavarga, mapAshtakavargaHousesToSigns, type AshtakavargaPlanet } from './ashtakavarga';

// Gochara: how the transiting grahas stand against the natal chart.
//
// Each transiting graha is read in two classical ways. From the natal Moon, the
// houses it is favourable in (Phaladeepika): Sun 3, 6, 10, 11 · Moon 1, 3, 6, 7,
// 10, 11 · Mars 3, 6, 11 · Mercury 2, 4, 6, 8, 10, 11 · Jupiter 2, 5, 7, 9, 11 ·
// Venus 1, 2, 3, 4, 5, 8, 9, 11, 12 · Saturn 3, 6, 11. And by the Aṣṭakavarga:
// the bindus the graha's own Bhinnāṣṭakavarga gives the sign it moves through
// (5 or more strong, 4 average, 3 or fewer weak), and the Sarvāṣṭakavarga of the
// sign (the average is 28). Rāhu and Ketu have no Aṣṭakavarga of their own.

export const FAVOURABLE_FROM_MOON: Record<AshtakavargaPlanet, number[]> = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
};

export const GOCHARA_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
export type GocharaPlanet = (typeof GOCHARA_PLANETS)[number];
export type BavStrength = 'strong' | 'average' | 'weak';

export interface GocharaRow {
  planet: GocharaPlanet;
  /** Sign the graha transits, 1–12. */
  sign: number;
  houseFromLagna: number;
  houseFromMoon: number;
  /** Bindus of its own Bhinnāṣṭakavarga in that sign; null for Rāhu and Ketu. */
  bindus: number | null;
  strength: BavStrength | null;
  /** Bindus of the Sarvāṣṭakavarga in that sign. */
  sav: number;
  /** Whether the house from the natal Moon is a favourable one for the graha; null for Rāhu and Ketu. */
  favourable: boolean | null;
}

export function bavStrength(bindus: number): BavStrength {
  return bindus >= 5 ? 'strong' : bindus === 4 ? 'average' : 'weak';
}

export interface GocharaResult {
  rows: GocharaRow[];
  /** Each graha's own Bhinnāṣṭakavarga by sign (Aries first), for the grid. */
  bavBySign: Record<AshtakavargaPlanet, number[]>;
  /** The Sarvāṣṭakavarga by sign (Aries first). */
  savBySign: number[];
}

/** What a chart gives the gochara: its natal Moon's sign and the Aṣṭakavarga of each sign (Aries first). Worked out once for a chart, then any number of moments are read. */
export interface GocharaTables {
  moonSign: number;
  ascendantSign: number;
  bavBySign: Record<AshtakavargaPlanet, number[]>;
  savBySign: number[];
}

export function gocharaTables(chart: Pick<ChartData, 'ascendant' | 'planets'>): GocharaTables | null {
  const natalMoon = chart.planets.find(planet => planet.name === 'Moon');
  if (!natalMoon) return null;
  const { bav, sav } = buildAshtakavarga(chart);
  const ascendantSign = chart.ascendant.sign;
  const bavBySign = Object.fromEntries(
    bav.map(row => [row.planet, mapAshtakavargaHousesToSigns(row.houses, ascendantSign)]),
  ) as Record<AshtakavargaPlanet, number[]>;
  return { moonSign: natalMoon.sign, ascendantSign, bavBySign, savBySign: mapAshtakavargaHousesToSigns(sav.houses, ascendantSign) };
}

/** One graha in a sign (1–12), read against the tables of a chart. */
export function gocharaRowOf(tables: GocharaTables, planet: GocharaPlanet, sign: number): GocharaRow {
  const houseFromMoon = ((sign - tables.moonSign + 12) % 12) + 1;
  const own = planet in FAVOURABLE_FROM_MOON ? (planet as AshtakavargaPlanet) : null;
  const bindus = own ? tables.bavBySign[own][sign - 1] : null;
  return {
    planet,
    sign,
    houseFromLagna: ((sign - tables.ascendantSign + 12) % 12) + 1,
    houseFromMoon,
    bindus,
    strength: bindus === null ? null : bavStrength(bindus),
    sav: tables.savBySign[sign - 1],
    favourable: own ? FAVOURABLE_FROM_MOON[own].includes(houseFromMoon) : null,
  };
}

/** The transiting grahas against the natal Moon and Aṣṭakavarga; the rows follow the order of GOCHARA_PLANETS. */
export function buildGochara(chart: Pick<ChartData, 'ascendant' | 'planets'>, transit: PlanetData[]): GocharaResult | null {
  const tables = gocharaTables(chart);
  if (!tables) return null;
  const rows: GocharaRow[] = [];
  for (const name of GOCHARA_PLANETS) {
    const moving = transit.find(planet => planet.name === name);
    if (moving) rows.push(gocharaRowOf(tables, name, moving.sign));
  }
  return { rows, bavBySign: tables.bavBySign, savBySign: tables.savBySign };
}
