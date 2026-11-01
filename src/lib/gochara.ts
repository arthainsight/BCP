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

/**
 * Vedha, the obstruction of a good house (Phaladīpikā 26.3–8, with the verses of Nārada quoted in the commentary): a graha in a good house from the Moon gives the
 * good result only if no other graha stands in the house that goes with it. The good house → its vedha house, house numbers from the natal Moon.
 */
export const VEDHA_FROM_MOON: Record<AshtakavargaPlanet, Record<number, number>> = {
  Sun: { 3: 9, 6: 12, 10: 4, 11: 5 },
  Moon: { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 },
  Mars: { 3: 12, 6: 9, 11: 5 },
  Mercury: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
  Jupiter: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  Venus: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 3, 12: 6 },
  Saturn: { 3: 12, 6: 9, 11: 5 },
};
/** The grahas that do not obstruct a graha: Saturn and the Sun do not obstruct each other (26.3, 26.5) nor do the Moon and Mercury (26.4, 26.6). */
export const VEDHA_EXEMPT: Partial<Record<AshtakavargaPlanet, AshtakavargaPlanet[]>> = {
  Sun: ['Saturn'], Saturn: ['Sun'], Moon: ['Mercury'], Mercury: ['Moon'],
};
/** The grahas that obstruct. The verses say "any graha"; Rāhu and Ketu are not named anywhere in them, so they are left out (change here to count them). */
export const VEDHA_OBSTRUCTORS: readonly GocharaPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

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
  /** The vedha house from the Moon that goes with the house the graha is in, when that is a favourable one; else null. */
  vedhaHouse: number | null;
  /** The other transiting grahas standing in that vedha house (they take the good result away); empty when none or when the others are not known. */
  blockedBy: GocharaPlanet[];
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

/** One graha in a sign (1–12), read against the tables of a chart. `others` are the other transiting grahas (their signs), for the vedha. */
export function gocharaRowOf(tables: GocharaTables, planet: GocharaPlanet, sign: number, others: { planet: GocharaPlanet; sign: number }[] = []): GocharaRow {
  const houseFromMoon = ((sign - tables.moonSign + 12) % 12) + 1;
  const own = planet in FAVOURABLE_FROM_MOON ? (planet as AshtakavargaPlanet) : null;
  const bindus = own ? tables.bavBySign[own][sign - 1] : null;
  const vedhaHouse = own ? VEDHA_FROM_MOON[own][houseFromMoon] ?? null : null;
  const blockedBy = vedhaHouse === null ? [] : others
    .filter(other => other.planet !== planet && VEDHA_OBSTRUCTORS.includes(other.planet) && !(VEDHA_EXEMPT[own!] ?? []).includes(other.planet as AshtakavargaPlanet))
    .filter(other => ((other.sign - tables.moonSign + 12) % 12) + 1 === vedhaHouse)
    .map(other => other.planet);
  return {
    planet,
    sign,
    houseFromLagna: ((sign - tables.ascendantSign + 12) % 12) + 1,
    houseFromMoon,
    bindus,
    strength: bindus === null ? null : bavStrength(bindus),
    sav: tables.savBySign[sign - 1],
    favourable: own ? FAVOURABLE_FROM_MOON[own].includes(houseFromMoon) : null,
    vedhaHouse,
    blockedBy,
  };
}

/** The transiting grahas against the natal Moon and Aṣṭakavarga; the rows follow the order of GOCHARA_PLANETS. */
export function buildGochara(chart: Pick<ChartData, 'ascendant' | 'planets'>, transit: PlanetData[]): GocharaResult | null {
  const tables = gocharaTables(chart);
  if (!tables) return null;
  const rows: GocharaRow[] = [];
  const all = GOCHARA_PLANETS.flatMap(name => {
    const moving = transit.find(planet => planet.name === name);
    return moving ? [{ planet: name, sign: moving.sign }] : [];
  });
  for (const { planet, sign } of all) rows.push(gocharaRowOf(tables, planet, sign, all));
  return { rows, bavBySign: tables.bavBySign, savBySign: tables.savBySign };
}
