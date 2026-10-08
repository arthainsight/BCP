import assert from 'node:assert/strict';
import { HIT_RELATIONS, findCrossings, findTransitHits, type LongitudeSeries } from './transitHits';

const DAY = 86_400_000;
const series = (longitudes: number[]): LongitudeSeries => ({ start: 0, step: DAY, longitudes });

// --- Direct motion: one crossing, interpolated within the day -----------------
const direct = findCrossings(series([9, 9.5, 10.25, 11]), 10);
assert.equal(direct.length, 1);
assert.equal(direct[0].retrograde, false);
assert.equal(direct[0].time, DAY * (1 + 0.5 / 0.75));

// --- Across 0° Aries ---------------------------------------------------------
const wrap = findCrossings(series([359, 359.6, 0.2, 0.8]), 0);
assert.equal(wrap.length, 1);
assert.ok(Math.abs(wrap[0].time - DAY * (1 + 0.4 / 0.6)) < 1, '0.4° of a 0.6° step after the second sample');

// --- A retrograde loop passes three times -------------------------------------
const loop = findCrossings(series([9, 10.5, 11, 10.2, 9.5, 9.8, 10.6]), 10);
assert.deepEqual(loop.map(c => c.retrograde), [false, true, false]);

// --- The opposite point is not a crossing -------------------------------------
assert.deepEqual(findCrossings(series([189, 190, 191]), 10), []);

// --- Exactly on the point counts once ------------------------------------------
assert.equal(findCrossings(series([9, 10, 11]), 10).length, 1);

// --- Every body over every point, in time order --------------------------------
const hits = findTransitHits(
  { Saturn: series([9, 10.5, 11]), Jupiter: series([99, 100, 100.5]) },
  [{ name: 'Moon', longitude: 10 }, { name: 'Asc', longitude: 99.5 }],
);
assert.deepEqual(hits.map(h => `${h.transit}-${h.natal}`), ['Jupiter-Asc', 'Saturn-Moon']);

// --- The same degree in the 5th and 9th signs from a natal point -----------------
const natalSun = [{ name: 'Sun', longitude: 10 }];
assert.deepEqual(findTransitHits({ Jupiter: series([129, 130, 131]) }, natalSun).map(h => h.relation), [], 'by default only the point itself');
const fifth = findTransitHits({ Jupiter: series([129, 130, 131]) }, natalSun, HIT_RELATIONS);
assert.deepEqual(fifth.map(h => h.relation), [5], '130° is 120° on from 10°: the 5th');
const ninth = findTransitHits({ Saturn: series([249, 250, 251]) }, natalSun, HIT_RELATIONS);
assert.deepEqual(ninth.map(h => h.relation), [9], '250° is 240° on from 10°: the 9th');
assert.equal(ninth[0].time, DAY, 'the crossing moment is the same as for any other target');
// A natal point near the end of the zodiac puts its trines past 0° Aries.
const wrapTrine = findTransitHits({ Rahu: series([89, 90, 91]) }, [{ name: 'Moon', longitude: 330 }], HIT_RELATIONS);
assert.deepEqual(wrapTrine.map(h => h.relation), [5], '330° + 120° wraps to 90°');
// Each relation is found independently, and the hits come out in time order.
const all = findTransitHits(
  { Jupiter: series([9, 10, 11, 129, 130, 131, 249, 250, 251]) },
  natalSun,
  HIT_RELATIONS,
);
assert.deepEqual(all.map(h => h.relation), [1, 5, 9]);
assert.ok(all.every((h, i) => i === 0 || all[i - 1].time <= h.time));

console.log('Transit hit relation tests passed');
