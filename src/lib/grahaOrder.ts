// The order of the bodies in a chart: the seven grahas, Rahu and Ketu, then the outer planets. The ephemeris
// returns the outer planets right after Saturn; every list and table follows the order of `chart.planets`,
// so the order is set once, where the chart is made.

export const OUTER_PLANET_NAMES: readonly string[] = ['Uranus', 'Neptune', 'Pluto'];

/** The bodies with the outer planets last; everything else, the nodes included, keeps its place. */
export function orderGrahas<T extends { name: string }>(planets: readonly T[]): T[] {
  return [
    ...planets.filter(planet => !OUTER_PLANET_NAMES.includes(planet.name)),
    ...planets.filter(planet => OUTER_PLANET_NAMES.includes(planet.name)),
  ];
}
