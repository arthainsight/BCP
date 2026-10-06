import assert from 'node:assert/strict';
import { findCrossings, findTransitHits, type LongitudeSeries } from './transitHits';

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
