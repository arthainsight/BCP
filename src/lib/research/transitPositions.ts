import type { ChartData } from '@/types';
import { describePositions, type EventProgression } from '@/lib/bnn/eventProgressions';
import { normalizeDegrees } from '@/lib/angles';
import { findTransitHits, transitRelationsOf, type LongitudeSeries } from '@/lib/transitHits';
import { PROGRESSION_NATAL } from '@/lib/bnn/parayaProgression';

// The transiting grahas at any moment, from a table of sampled longitudes: between two samples the longitude is taken to change in a straight line (a few
// minutes of arc at most for the slow grahas sampled every few days), going the short way round the zodiac.

/** The longitude at a moment, or null outside the sampled time. */
export function longitudeAt(series: LongitudeSeries, time: number): number | null {
  const { longitudes, start, step } = series;
  if (longitudes.length === 0) return null;
  const position = (time - start) / step;
  if (position < 0 || position > longitudes.length - 1) return null;
  const index = Math.min(longitudes.length - 2, Math.floor(position));
  if (longitudes.length === 1) return normalizeDegrees(longitudes[0]);
  const fraction = position - index;
  const a = longitudes[index];
  const b = longitudes[index + 1];
  // The short way round: a jump over 0° Aries is 359 → 1 (two degrees on), not 358 back.
  const change = ((b - a + 540) % 360) - 180;
  return normalizeDegrees(a + fraction * change);
}

/** The transiting grahas at a moment as houses and aspects of a chart, or null when the moment is outside the sampled time of any of them. */
export function transitRowsAt(chart: ChartData, series: Record<string, LongitudeSeries>, bodies: readonly string[], time: number): EventProgression[] | null {
  const positions = [];
  for (const body of bodies) {
    const sampled = series[body];
    if (!sampled) continue;
    const longitude = longitudeAt(sampled, time);
    if (longitude === null) return null;
    positions.push({ body, signIndex: Math.floor(longitude / 30), degree: longitude % 30 });
  }
  return describePositions(chart, positions, transitRelationsOf);
}

/** The moments each transiting graha stands at the exact degree of a natal point of the chart (in its own sign or in a sign it aspects), in time order. */
export function transitHitsOf(chart: ChartData, series: Record<string, LongitudeSeries>, bodies: readonly string[]): { time: number; body: string; natal: string }[] {
  const chosen = Object.fromEntries(Object.entries(series).filter(([body]) => bodies.includes(body)));
  const natal = [
    ...chart.planets.filter(planet => (PROGRESSION_NATAL as readonly string[]).includes(planet.name)).map(planet => ({ name: planet.name, longitude: planet.longitude })),
    { name: 'Asc', longitude: chart.ascendant.longitude },
  ];
  return findTransitHits(chosen, natal, transitRelationsOf).map(hit => ({ time: hit.time, body: hit.transit, natal: hit.natal }));
}
