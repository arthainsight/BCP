import assert from 'node:assert/strict';
import { findAllSignChanges, findSignChanges } from './signChanges';

const DAY = 86_400_000;
const series = (longitudes: number[]) => ({ start: 0, step: DAY, longitudes });

// --- Direct motion: Aries to Taurus, interpolated within the day ---------------
const direct = findSignChanges('Mars', series([29, 29.5, 30.5, 31]));
assert.equal(direct.length, 1);
assert.deepEqual([direct[0].from, direct[0].to, direct[0].retrograde], [1, 2, false]);
assert.equal(direct[0].time, DAY * (1 + 0.5 / 1));

// --- Pisces to Aries wraps around ---------------------------------------------
const wrap = findSignChanges('Sun', series([359, 359.5, 0.5, 1]));
assert.deepEqual([wrap[0].from, wrap[0].to], [12, 1]);

// --- A retrograde pass leaves the sign backwards and returns --------------------
const loop = findSignChanges('Saturn', series([29, 30.5, 30.2, 29.5, 29.8, 30.4]));
assert.deepEqual(loop.map(c => [c.from, c.to, c.retrograde]), [[1, 2, false], [2, 1, true], [1, 2, false]]);

// --- Retrograde across 0° Aries goes from Aries back to Pisces ------------------
const back = findSignChanges('Rahu', series([1, 0.5, 359.5]));
assert.deepEqual([back[0].from, back[0].to, back[0].retrograde], [1, 12, true]);

// --- No change inside a sign, and gaps in the data are not changes -------------
assert.deepEqual(findSignChanges('Moon', series([1, 5, 12, 28])), []);
assert.deepEqual(findSignChanges('Moon', series([10, 100])), []);

// --- Several bodies come out in time order --------------------------------------
const all = findAllSignChanges({ Mars: series([29, 31]), Sun: series([59, 60.5]) });
assert.deepEqual(all.map(c => c.body), ['Mars', 'Sun']);
assert.ok(all[0].time < all[1].time || all[0].time === all[1].time);

console.log('Sign change tests passed');
