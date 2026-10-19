import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { longitudeAt, transitHitsOf, transitRowsAt } from './transitPositions';

const DAY = 86_400_000;
const series = (longitudes: number[], start = 0, step = 3 * DAY) => ({ start, step, longitudes });
const near = (a: number | null, b: number, tolerance = 1e-9) => a !== null && Math.abs(a - b) <= tolerance;
const planet = (name: string, sign: number, degree: number): PlanetData => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 1, isRetrograde: false });
const chart = {
  ascendant: { sign: 1, degree: 2, longitude: 2 },
  planets: [planet('Sun', 1, 15), planet('Moon', 9, 27), planet('Jupiter', 5, 5)],
} as unknown as ChartData;

// --- Between samples the longitude changes in a straight line ------------------------------------------------------------------------------------
{
  const s = series([10, 13, 16]);
  assert.ok(near(longitudeAt(s, 0), 10));
  assert.ok(near(longitudeAt(s, 1.5 * DAY), 11.5), 'half way to the next sample');
  assert.ok(near(longitudeAt(s, 3 * DAY), 13));
  assert.ok(near(longitudeAt(s, 6 * DAY), 16), 'the last sample');
  assert.equal(longitudeAt(s, -1), null, 'before the sampled time');
  assert.equal(longitudeAt(s, 6 * DAY + 1), null, 'after it');
  assert.equal(longitudeAt(series([]), 0), null);
}
// --- Round the end of the zodiac, forwards and backwards -------------------------------------------------------------------------------------------
{
  assert.ok(near(longitudeAt(series([359, 2]), 1.5 * DAY), 0.5), 'forwards over 0° Aries');
  assert.ok(near(longitudeAt(series([2, 359]), 1.5 * DAY), 0.5), 'backwards over it (a retrograde graha)');
  assert.ok(near(longitudeAt(series([359, 2]), 0.5 * DAY), 359.5));
}

// --- The transiting grahas as houses and aspects of a chart ----------------------------------------------------------------------------------------
{
  // Jupiter at 15° of Aries (longitude 15) is in house 1 and over the Sun at 15°: exact. Saturn at 100° is in Cancer, house 4.
  const rows = transitRowsAt(chart, { Jupiter: series([15, 15]), Saturn: series([100, 100]) }, ['Jupiter', 'Saturn'], 3 * DAY / 2)!;
  assert.deepEqual(rows.map(row => [row.body, row.signIndex, row.house]), [['Jupiter', 0, 1], ['Saturn', 3, 4]]);
  const sun = rows[0].aspects.find(aspect => aspect.natal === 'Sun')!;
  assert.ok(sun.exact && sun.relation === 1 && sun.orb < 1e-9);
  assert.equal(rows[0].aspects.find(aspect => aspect.natal === 'Moon')!.relation, 5, 'Aries is the 5th sign from Sagittarius');
  // Only the grahas asked for and sampled.
  assert.deepEqual(transitRowsAt(chart, { Jupiter: series([15, 15]), Saturn: series([100, 100]) }, ['Saturn'], 0)!.map(row => row.body), ['Saturn']);
  assert.deepEqual(transitRowsAt(chart, { Jupiter: series([15, 15]) }, ['Jupiter', 'Mars'], 0)!.map(row => row.body), ['Jupiter'], 'Mars has no samples');
  // Outside the sampled time of one of them: nothing to say.
  assert.equal(transitRowsAt(chart, { Jupiter: series([15, 15]) }, ['Jupiter'], 10 * DAY), null);
}

// --- The exact hits of the transits to the natal points --------------------------------------------------------------------------------------------
{
  // Jupiter goes 10° → 20° over thirty days: over the Sun (15° Aries) a third of the way through, and at 15° of Leo (the 5th sign from Aries) never.
  const hits = transitHitsOf(chart, { Jupiter: series([10, 12, 14, 16, 18, 20], 0, 3 * DAY * 2) }, ['Jupiter']);
  const sun = hits.filter(hit => hit.natal === 'Sun');
  assert.equal(sun.length, 1);
  assert.ok(Math.abs(sun[0].time / DAY - 15) < 1e-9, 'half way from 10° to 20° in thirty days is day 15');
  assert.equal(sun[0].body, 'Jupiter');
  assert.deepEqual(transitHitsOf(chart, { Jupiter: series([10, 20]) }, ['Saturn']), [], 'a graha that is not asked for has none');
}

console.log('Transit position tests passed');
