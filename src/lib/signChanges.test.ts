import assert from 'node:assert/strict';
import { collectTimingEvents, findAllSignChanges, findCombustion, findSignChanges, findStations } from './signChanges';

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

// --- Stations: direct to retrograde and back -----------------------------------
const stations = findStations('Mercury', series([10, 11, 11.5, 11.5, 11, 10, 9.5, 9.6, 10]));
assert.deepEqual(stations.map(s => s.turnsTo), ['retrograde', 'direct']);
assert.ok(stations[0].time > 2 * DAY && stations[0].time < 3 * DAY, 'the turn lies between the samples that bracket it');
assert.equal(stations[0].sign, 1);
assert.deepEqual(findStations('Mars', series([10, 11, 12, 13])), [], 'steady motion has no station');
// A station across 0° Aries uses the shortest distance, not the raw difference.
assert.deepEqual(findStations('Venus', series([358, 359, 0.5, 1, 0.5, 0])).map(s => s.turnsTo), ['retrograde']);

// --- Combustion: entering and leaving the orb of the Sun --------------------------
const sun = series([100, 101, 102, 103, 104, 105]);
const mercury = series([120, 117, 113, 110, 120, 125]);
const combust = findCombustion('Mercury', mercury, sun);
assert.deepEqual(combust.map(c => c.combust), [true, false]);
assert.ok(combust[0].time > 0 && combust[0].time < 2 * DAY);
assert.deepEqual(findCombustion('Mars', mercury, sun), [], 'only Mercury and Venus have an orb here');
assert.deepEqual(findCombustion('Mercury', series([150, 151, 152]), series([100, 101, 102])), [], 'far from the Sun is never combust');

// --- All events of the chosen grahas, in time order --------------------------------
const events = collectTimingEvents(
  { Sun: sun, Mercury: mercury },
  ['Mercury'],
  true,
);
assert.deepEqual(events.map(e => e.kind).sort(), ['combust', 'combust', 'sign', 'sign', 'station'], 'sign changes at 120°, combustion in and out, and the turn to direct');
assert.ok(events.every((e, i) => i === 0 || events[i - 1].time <= e.time), 'in time order');
assert.deepEqual(collectTimingEvents({ Sun: sun, Mercury: mercury }, ['Mercury'], false).map(e => e.kind), ['sign', 'sign'], 'without stations only sign changes are listed');
assert.deepEqual(collectTimingEvents({ Mars: series([29, 31]) }, ['Mars', 'Venus'], false).map(e => e.kind), ['sign'], 'a body without a series is skipped');

console.log('Sign change tests passed');
