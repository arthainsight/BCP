// Editing a chart in the chart view: a graha, or the Lagna, moved to the next or the previous house (sign). The graha keeps its
// degree in the sign; the longitude, the sign and the house of everything that moved are made again from where it stands, and
// everything that is read from the longitudes (the panchāṅga, the nakṣatras, the divisional charts) follows. What the calculation
// itself made from the real sky (the special lagnas and the other sphuṭas, the times of the day) is not made again.

import type { ChartData, PlanetData } from '@/types';

/**
 * How many signs a body has been moved forward from where the calculation put it: `Asc` for the Lagna, a graha's name for a graha.
 * Ketu stays opposite Rāhu, so the two are one entry, under Rahu. A body that is where it was has no entry.
 */
export type ChartEdits = Record<string, number>;

const wrap12 = (value: number) => ((value % 12) + 12) % 12;
const wrap360 = (value: number) => ((value % 360) + 360) % 360;

/** The key a body's edit is kept under. */
export const editKey = (name: string) => (name === 'Ketu' ? 'Rahu' : name);

/** The signs a body has been moved, from -5 to 6 (a move of -1 is the previous house). */
export function movedSigns(edits: ChartEdits, name: string): number {
  const forward = wrap12(edits[editKey(name)] ?? 0);
  return forward > 6 ? forward - 12 : forward;
}

/** The edits with a body moved one house on (1) or back (-1); a body moved back to where it was has no entry. */
export function moveBody(edits: ChartEdits, name: string, step: 1 | -1): ChartEdits {
  const key = editKey(name);
  const forward = wrap12((edits[key] ?? 0) + step);
  const next = { ...edits };
  if (forward === 0) delete next[key];
  else next[key] = forward;
  return next;
}

/** The edits without one body's move (all of them when no body is named). */
export function resetBody(edits: ChartEdits, name?: string): ChartEdits {
  if (name === undefined) return {};
  const next = { ...edits };
  delete next[editKey(name)];
  return next;
}

/** How many bodies are not where the calculation put them. */
export const editCount = (edits: ChartEdits) => Object.keys(edits).length;

/** The chart with the moves made: the same chart where there are none. */
export function applyChartEdits(chart: ChartData, edits: ChartEdits): ChartData {
  if (editCount(edits) === 0) return chart;
  const ascMove = wrap12(edits.Asc ?? 0);
  // A body that has not moved keeps its numbers exactly as they were calculated.
  const ascLongitude = ascMove === 0 ? chart.ascendant.longitude : wrap360(chart.ascendant.longitude + 30 * ascMove);
  const ascSign = ascMove === 0 ? chart.ascendant.sign : Math.floor(ascLongitude / 30) + 1;
  const ascDegree = ascMove === 0 ? chart.ascendant.degree : ascLongitude - (ascSign - 1) * 30;
  const planets: PlanetData[] = chart.planets.map(planet => {
    const move = wrap12(edits[editKey(planet.name)] ?? 0);
    const longitude = move === 0 ? planet.longitude : wrap360(planet.longitude + 30 * move);
    const sign = move === 0 ? planet.sign : Math.floor(longitude / 30) + 1;
    const degree = move === 0 ? planet.degree : longitude - (sign - 1) * 30;
    return { ...planet, longitude, sign, degree, house: wrap12(sign - ascSign) + 1 };
  });
  return {
    ...chart,
    ascendant: { sign: ascSign, degree: ascDegree, longitude: ascLongitude },
    planets,
    // Worked out from the real sky and from the real Lagna: left out rather than shown for a sky that is not there.
    specialLagnas: undefined,
    specialSphutas: undefined,
    midheaven: chart.midheaven === undefined || ascMove === 0 ? chart.midheaven : wrap360(chart.midheaven + 30 * ascMove),
    debug: chart.debug ? { ...chart.debug, ascendantSign: ascSign, ascendantDegree: ascDegree } : chart.debug,
  };
}
