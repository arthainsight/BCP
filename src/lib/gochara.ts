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

/** The transiting grahas against the natal Moon and Aṣṭakavarga; the rows follow the order of GOCHARA_PLANETS. */
export function buildGochara(chart: Pick<ChartData, 'ascendant' | 'planets'>, transit: PlanetData[]): GocharaResult | null {
  const natalMoon = chart.planets.find(planet => planet.name === 'Moon');
  if (!natalMoon) return null;
  const { bav, sav } = buildAshtakavarga(chart);
  const ascendantSign = chart.ascendant.sign;
  const bavBySign = Object.fromEntries(
    bav.map(row => [row.planet, mapAshtakavargaHousesToSigns(row.houses, ascendantSign)]),
  ) as Record<AshtakavargaPlanet, number[]>;
  const savBySign = mapAshtakavargaHousesToSigns(sav.houses, ascendantSign);

  const rows: GocharaRow[] = [];
  for (const name of GOCHARA_PLANETS) {
    const moving = transit.find(planet => planet.name === name);
    if (!moving) continue;
    const houseFromMoon = ((moving.sign - natalMoon.sign + 12) % 12) + 1;
    const own = name in FAVOURABLE_FROM_MOON ? (name as AshtakavargaPlanet) : null;
    const bindus = own ? bavBySign[own][moving.sign - 1] : null;
    rows.push({
      planet: name,
      sign: moving.sign,
      houseFromLagna: ((moving.sign - ascendantSign + 12) % 12) + 1,
      houseFromMoon,
      bindus,
      strength: bindus === null ? null : bavStrength(bindus),
      sav: savBySign[moving.sign - 1],
      favourable: own ? FAVOURABLE_FROM_MOON[own].includes(houseFromMoon) : null,
    });
  }
  return { rows, bavBySign, savBySign };
}
