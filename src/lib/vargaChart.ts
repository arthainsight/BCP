// Project a rāśi chart into a divisional chart.
//
// The chart components only need an ascendant sign and a list of planets, so a
// varga chart is just the same chart with every longitude mapped into the
// chosen division. Nothing about the drawing changes.
//
// Degrees inside a varga sign: a planet sitting a third of the way through its
// D9 part is shown at 10° of the navāṁśa sign. That is the usual convention for
// displaying divisional positions, and it keeps the degree readout meaningful
// instead of repeating the rāśi degree.

import type { ChartData, PlanetData, SpecialLagna } from '@/types';
import { getVargaSignIndex, getDegreesInSign } from './varga';

export const VARGA_DIVISIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60, 110] as const;

/** Display code for a chart; 110 is the internal id of the separate D10 Parivṛtti method. */
export function vargaCode(division: number): string {
  return division === 110 ? 'D10P' : `D${division}`;
}
/** Traditional names, shown next to the Dn label. */
export const VARGA_NAMES: Record<number, string> = {
  1: 'Rāśi', 2: 'Horā', 3: 'Drekkāṇa', 4: 'Chaturthāṁśa', 5: 'Pañchāṁśa',
  6: 'Ṣaṣṭhāṁśa', 7: 'Saptāṁśa', 8: 'Aṣṭāṁśa', 9: 'Navāṁśa', 10: 'Daśāṁśa', 11: 'Ekādaśāṁśa · Rudrāṁśa', 12: 'Dvādaśāṁśa', 16: 'Ṣoḍaśāṁśa',
  20: 'Viṁśāṁśa', 24: 'Chaturviṁśāṁśa', 27: 'Bhāṁśa', 30: 'Triṁśāṁśa',
  40: 'Khavedāṁśa', 45: 'Akṣavedāṁśa', 60: 'Ṣaṣṭyāṁśa',
  110: 'Parivṛtta Daśāṁśa',
};

/** What each divisional chart is traditionally read for. */
export const VARGA_SIGNIFICATIONS: Record<number, string> = {
  1: 'The body and life as a whole',
  2: 'Wealth and resources',
  3: 'Siblings, courage and initiative',
  4: 'Property, home and fortune',
  5: 'Fame, authority and merit',
  6: 'Health, illness and adversity',
  7: 'Children and progeny',
  8: 'Longevity and obstacles',
  9: 'Marriage, dharma and inner strength',
  10: 'Career and action in the world',
  11: 'Rudrāṁśa; interpretation varies by lineage',
  12: 'Parents and ancestry',
  16: 'Vehicles, comforts and pleasures',
  20: 'Spiritual practice and worship',
  24: 'Learning and education',
  27: 'Strengths and weaknesses of the body',
  30: 'Misfortune and hidden harm',
  40: 'Matrilineal inheritance',
  45: 'Patrilineal inheritance',
  60: 'The sum of past deeds; a fine sieve',
  110: 'Career and action in the world · cyclic Parivṛtti method',
};

export type VargaChart = {
  division: number;
  ascendantSign: number;
  planets: PlanetData[];
  specialLagnas: SpecialLagna[];
};

/**
 * Longitude a body occupies inside its divisional sign, on the usual 0–30
 * scale. The position within the part is stretched across the whole sign.
 */
function vargaDegree(longitude: number, division: number): number {
  if (division <= 1) return getDegreesInSign(longitude);
  const factor = division === 110 ? 10 : division;
  const partSize = 30 / factor;
  const withinPart = getDegreesInSign(longitude) % partSize;
  return (withinPart / partSize) * 30;
}

/** A longitude in the given division: its sign, its degree inside that sign and the longitude that follows. */
export function project(longitude: number, division: number): { sign: number; degree: number; longitude: number } {
  const signIndex = getVargaSignIndex(longitude, division);
  const degree = vargaDegree(longitude, division);
  return { sign: signIndex + 1, degree, longitude: signIndex * 30 + degree };
}

/**
 * Recompute a chart into the given division. Division 1 returns the rāśi
 * positions unchanged. Houses are recomputed from the divisional ascendant, so
 * the whole-sign house numbering stays consistent with the drawn chart.
 */
export function buildVargaChart(chart: ChartData, division: number): VargaChart {
  const ascendant = project(chart.ascendant.longitude, division);
  const ascendantSignIndex = ascendant.sign - 1;

  const planets: PlanetData[] = chart.planets.map((planet) => {
    const projected = project(planet.longitude, division);
    return {
      ...planet,
      sign: projected.sign,
      degree: projected.degree,
      longitude: projected.longitude,
      house: ((projected.sign - 1 - ascendantSignIndex + 12) % 12) + 1,
    };
  });

  const specialLagnas: SpecialLagna[] = (chart.specialLagnas ?? []).map((lagna) => {
    const projected = project(lagna.longitude, division);
    return { ...lagna, sign: projected.sign, degree: projected.degree, longitude: projected.longitude };
  });

  return { division, ascendantSign: ascendant.sign, planets, specialLagnas };
}
