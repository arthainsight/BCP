import type { PlanetData } from '@/types';
import { combustionOf, type Combustion } from './combustion';
import { MRITYU_POINTS, sensitiveDegreesOf, type MrityuPoint, type SensitiveDegrees } from './sensitiveDegrees';

// What a point of a chart is marked with: the sensitive degrees (weakening ⚠ and Puṣkara ✦) and, in the rāśi chart, combustion (☼).

export interface PlanetMarks {
  sensitive: SensitiveDegrees;
  /** Combustion is a thing of the rāśi chart: the Sun and the graha have to be where they are in the sky. */
  combust: Combustion | null;
}

const GRAHAS = MRITYU_POINTS.filter(point => point !== 'Lagna' && point !== 'Maandi');

export interface MarksOptions {
  /** The chart's nakṣatra offset, which the Gandanta follows (the rāśi chart only). */
  nakshatraAdjust?: number;
  sunLongitude?: number;
  retrograde?: boolean;
}

/** The marks of one point at a longitude (the longitude of the chart it is in). */
export function marksOf(point: MrityuPoint, longitude: number, { nakshatraAdjust = 0, sunLongitude, retrograde = false }: MarksOptions = {}): PlanetMarks {
  return {
    sensitive: sensitiveDegreesOf(point, longitude, nakshatraAdjust),
    combust: sunLongitude === undefined ? null : combustionOf(point, longitude, sunLongitude, retrograde),
  };
}

/**
 * The planets of a chart with their marks, for the hover text of the chart. The longitudes are those of the chart (the projected ones in a
 * varga), so the tests are made where the planet stands there; combustion and the nakṣatra offset only count in the rāśi chart.
 */
export function annotatePlanets(planets: PlanetData[], division: number, nakshatraAdjust = 0): PlanetData[] {
  const sun = division === 1 ? planets.find(planet => planet.name === 'Sun') : undefined;
  return planets.map(planet => {
    if (!(GRAHAS as readonly string[]).includes(planet.name)) return planet;
    return {
      ...planet,
      marks: marksOf(planet.name as MrityuPoint, planet.longitude, {
        nakshatraAdjust: division === 1 ? nakshatraAdjust : 0,
        sunLongitude: sun && planet.name !== 'Sun' ? sun.longitude : undefined,
        retrograde: planet.isRetrograde === true,
      }),
    };
  });
}

export const weakeningCount = (marks: PlanetMarks | undefined | null) =>
  marks ? [marks.sensitive.sandhi, marks.sensitive.gandanta, marks.sensitive.mrityu].filter(Boolean).length : 0;
export const favourableCount = (marks: PlanetMarks | undefined | null) =>
  marks ? [marks.sensitive.pushkaraNavamsa, marks.sensitive.pushkaraBhaga].filter(Boolean).length : 0;

/** The small signs for a row of a table: ⚠ a weakening degree, ✦ a Puṣkara degree, ☼ combust. Empty when there is nothing to mark. */
export function markIcons(marks: PlanetMarks | undefined | null): string {
  if (!marks) return '';
  return [weakeningCount(marks) > 0 ? '⚠' : '', favourableCount(marks) > 0 ? '✦' : '', marks.combust ? '☼' : ''].filter(Boolean).join(' ');
}
