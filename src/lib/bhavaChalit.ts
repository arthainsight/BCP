import type { ChartData } from '@/types';

// Bhāva Chalit: the chart cast by bhāvas instead of by whole signs.
//
// Each bhāva has a madhya (its middle point) and runs from the sandhi (border)
// halfway to the madhya before it to the sandhi halfway to the madhya after it.
// A graha belongs to the bhāva whose span it stands in, which may be the house
// before or after the sign-house it is drawn in at the rāśi.
//
//   Śrīpati: the madhyas are the Porphyry cusps. The Lagna, the 4th (IC), the
//            7th (Descendant) and the 10th (Midheaven) are fixed, and each
//            quadrant between them is divided into three equal arcs.
//   Equal:   the Lagna is the madhya of the 1st bhāva and each next one follows
//            thirty degrees on.

export type ChalitSystem = 'sripati' | 'equal';

const normalize = (value: number) => ((value % 360) + 360) % 360;
/** The distance from a forward to b, 0 to 360. */
const forward = (from: number, to: number) => normalize(to - from);

/** The middle points of the twelve bhāvas, the 1st first; null for Śrīpati without a Midheaven. */
export function bhavaMadhyas(ascendant: number, midheaven: number | undefined, system: ChalitSystem): number[] | null {
  if (system === 'equal') return Array.from({ length: 12 }, (_, index) => normalize(ascendant + index * 30));
  if (midheaven === undefined) return null;
  const imumCoeli = normalize(midheaven + 180);
  const descendant = normalize(ascendant + 180);
  // Cusps 1, 4, 7 and 10 are the angles; the arcs between them are divided in three.
  const quadrants = [
    [ascendant, imumCoeli], // 1 → 4
    [imumCoeli, descendant], // 4 → 7
    [descendant, midheaven], // 7 → 10
    [midheaven, ascendant], // 10 → 1
  ];
  const madhyas: number[] = [];
  for (const [from, to] of quadrants) {
    const arc = forward(from, to);
    madhyas.push(from, normalize(from + arc / 3), normalize(from + (2 * arc) / 3));
  }
  // The list starts at the 1st (index 0), the 4th is index 3, the 7th index 6 and the 10th index 9.
  return madhyas;
}

export interface Bhava {
  house: number;
  madhya: number;
  /** Sandhi at the start of the bhāva and at its end (the start of the next one). */
  start: number;
  end: number;
}

/** The twelve bhāvas with their sandhis. */
export function bhavas(madhyas: number[]): Bhava[] {
  return madhyas.map((madhya, index) => {
    const before = madhyas[(index + 11) % 12];
    const after = madhyas[(index + 1) % 12];
    return {
      house: index + 1,
      madhya,
      start: normalize(before + forward(before, madhya) / 2),
      end: normalize(madhya + forward(madhya, after) / 2),
    };
  });
}

/** The bhāva a longitude stands in. */
export function bhavaOf(longitude: number, list: Bhava[]): number {
  const found = list.find(bhava => forward(bhava.start, longitude) < forward(bhava.start, bhava.end));
  return found ? found.house : 1;
}

export interface ChalitPlanet {
  name: string;
  longitude: number;
  /** The house of the rāśi chart (whole signs from the Lagna) and the bhāva. */
  rasiHouse: number;
  bhavaHouse: number;
  moved: boolean;
}

export interface ChalitResult {
  system: ChalitSystem;
  bhavas: Bhava[];
  planets: ChalitPlanet[];
}

/** The planets of a chart placed by bhāva, or null when the system needs a Midheaven the chart lacks. */
export function buildChalit(
  chart: Pick<ChartData, 'ascendant' | 'planets' | 'midheaven'>,
  system: ChalitSystem,
): ChalitResult | null {
  const madhyas = bhavaMadhyas(chart.ascendant.longitude, chart.midheaven, system);
  if (!madhyas) return null;
  const list = bhavas(madhyas);
  const planets = chart.planets.map(planet => {
    const rasiHouse = ((planet.sign - chart.ascendant.sign + 12) % 12) + 1;
    const bhavaHouse = bhavaOf(planet.longitude, list);
    return { name: planet.name, longitude: planet.longitude, rasiHouse, bhavaHouse, moved: rasiHouse !== bhavaHouse };
  });
  return { system, bhavas: list, planets };
}
