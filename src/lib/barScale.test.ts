import assert from 'node:assert/strict';
import { niceStep, niceTicks, scaleLinear, stackSegments } from './barScale';

// --- Round steps ---------------------------------------------------------------------------------------------------------------
assert.equal(niceStep(20, 4), 5);
assert.equal(niceStep(100, 5), 20);
assert.equal(niceStep(130, 5), 50, '26 rounds up to 50');
assert.equal(niceStep(7, 5), 2, '1.4 rounds up to 2');
assert.equal(niceStep(0), 1, 'no range: a step of 1');
assert.equal(niceStep(NaN), 1);

// --- Round ticks ---------------------------------------------------------------------------------------------------------------
assert.deepEqual(niceTicks(0, 20, 4), { ticks: [0, 5, 10, 15, 20], min: 0, max: 20 });
assert.deepEqual(niceTicks(0, 17.5, 4), { ticks: [0, 5, 10, 15, 20], min: 0, max: 20 }, 'the top is the next round tick');
const across = niceTicks(-120, 480, 6);
assert.ok(across.ticks.includes(0), 'zero is a tick when the range spans it');
assert.ok(across.min <= -120 && across.max >= 480, 'the ticks cover the data');
for (let index = 1; index < across.ticks.length; index++) assert.ok(Math.abs(across.ticks[index] - across.ticks[index - 1] - (across.ticks[1] - across.ticks[0])) < 1e-9, 'the ticks are evenly spaced');
assert.deepEqual(niceTicks(0, 0).ticks.length >= 2, true, 'no data still gives an axis');
assert.equal(niceTicks(30, 90, 3).min, 0, 'a bar axis starts at zero');

// --- Stacked bars with segments on both sides of zero ----------------------------------------------------------------------------
const stack = stackSegments([{ key: 'a', value: 100 }, { key: 'b', value: -40 }, { key: 'c', value: 60 }, { key: 'd', value: -10 }, { key: 'e', value: 0 }]);
assert.deepEqual(stack.segments.map(segment => [segment.key, segment.start, segment.end]), [['a', 0, 100], ['b', 0, -40], ['c', 100, 160], ['d', -40, -50], ['e', 0, 0]]);
assert.equal(stack.high, 160);
assert.equal(stack.low, -50);
assert.deepEqual(stackSegments([{ key: 'x', value: NaN }]).segments[0], { key: 'x', value: 0, start: 0, end: 0 }, 'a value that is not a number counts for nothing');

// --- The position of a value -----------------------------------------------------------------------------------------------------
assert.equal(scaleLinear(10, 0, 20, 100, 300), 200);
assert.equal(scaleLinear(-10, -20, 20, 0, 400), 100);
assert.equal(scaleLinear(5, 5, 5, 40, 90), 40, 'an empty domain maps to the start');

console.log('Bar scale tests passed');
