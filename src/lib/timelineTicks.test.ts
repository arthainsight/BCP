import assert from 'node:assert/strict';
import { timelineTicks } from './timelineTicks';

const at = (year: number, month: number, day = 1) => new Date(year, month - 1, day, 12).getTime();

// A year: the first of a month, every second month (January, March, …) to keep to six marks at most.
{
  const ticks = timelineTicks(at(2026, 10, 19), at(2027, 10, 19));
  assert.deepEqual(ticks.map(tick => tick.label), ['11.2026', '01.2027', '03.2027', '05.2027', '07.2027', '09.2027']);
  assert.ok(ticks.every(tick => new Date(tick.time).getDate() === 1));
}
// Three years: every year; ten: every second year; thirty: every fifth.
assert.deepEqual(timelineTicks(at(2026, 10, 19), at(2029, 10, 19)).map(tick => tick.label), ['2027', '2028', '2029']);
assert.deepEqual(timelineTicks(at(2026, 10, 19), at(2036, 10, 19)).map(tick => tick.label), ['2028', '2030', '2032', '2034', '2036']);
assert.deepEqual(timelineTicks(at(2026, 10, 19), at(2056, 10, 19)).map(tick => tick.label), ['2030', '2035', '2040', '2045', '2050', '2055']);
// Nothing to mark in an empty or backwards stretch.
assert.deepEqual(timelineTicks(at(2026, 1), at(2026, 1)), []);
assert.deepEqual(timelineTicks(at(2027, 1), at(2026, 1)), []);

console.log('Timeline tick tests passed');
