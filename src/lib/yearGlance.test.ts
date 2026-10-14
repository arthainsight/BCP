import assert from 'node:assert/strict';
import { glanceAxis, glanceFraction, localMs, startOffsetsDays, type GlanceSpan } from './yearGlance';

const day = (year: number, month: number, d: number, hour = 0) => localMs({ year, month, day: d, hour, minute: 0, second: 0 });
const DAY = 86400000;

assert.equal(glanceAxis([]), null);
assert.deepEqual(startOffsetsDays([]), {});

// Four spans a few weeks apart, as the four annual charts are.
const spans: GlanceSpan[] = [
  { id: 'tithi', startMs: day(2026, 9, 9, 22), endMs: day(2027, 8, 29, 17) },
  { id: 'nakshatra', startMs: day(2026, 9, 8, 5), endMs: day(2027, 8, 5, 12) },
  { id: 'yoga', startMs: day(2026, 8, 12, 2), endMs: day(2027, 8, 1, 9) },
  { id: 'varsha', startMs: day(2026, 8, 15, 9), endMs: day(2027, 8, 15, 15) },
];
const axis = glanceAxis(spans)!;
assert.equal(axis.startMs, day(2026, 8, 12, 2) - 12 * DAY, 'a margin before the earliest start');
assert.equal(axis.endMs, day(2027, 8, 29, 17) + 12 * DAY, 'a margin after the latest end');
assert.ok(axis.startMs < Math.min(...spans.map(s => s.startMs)) && axis.endMs > Math.max(...spans.map(s => s.endMs)));

// The month ticks: the 1st of each month inside the axis, in order, none outside.
assert.ok(axis.months.length >= 13 && axis.months.length <= 14, `${axis.months.length} month starts`);
assert.deepEqual(axis.months[0], { ms: day(2026, 8, 1), year: 2026, month: 8 }, 'the axis starts on 31 July, so the first tick is 1 August');
for (let index = 0; index < axis.months.length; index++) {
  const m = axis.months[index];
  assert.ok(m.ms > axis.startMs && m.ms <= axis.endMs, 'a tick inside the axis');
  assert.equal(new Date(m.ms).getUTCDate(), 1, 'the 1st of a month');
  if (index > 0) assert.ok(m.ms - axis.months[index - 1].ms >= 28 * DAY && m.ms - axis.months[index - 1].ms <= 31 * DAY, 'a month apart');
}
assert.deepEqual(axis.months.slice(0, 2).map(m => [m.year, m.month]), [[2026, 8], [2026, 9]], 'it starts with the first month start after the margin begins');
// A new year turns over inside the axis.
assert.ok(axis.months.some(m => m.year === 2027 && m.month === 1));

// Fractions: the start margin is 0, the end margin 1, and they grow with time.
assert.equal(glanceFraction(axis, axis.startMs), 0);
assert.equal(glanceFraction(axis, axis.endMs), 1);
assert.ok(Math.abs(glanceFraction(axis, (axis.startMs + axis.endMs) / 2) - 0.5) < 1e-12);
const fractions = spans.map(span => glanceFraction(axis, span.startMs));
assert.ok(fractions.every(f => f > 0 && f < 1), 'every start is inside the axis');
assert.ok(glanceFraction(axis, day(2026, 1, 1)) < 0, 'earlier than the axis is negative');

// Offsets from the earliest start.
assert.deepEqual(startOffsetsDays(spans), { tithi: 28.8, nakshatra: 27.1, yoga: 0, varsha: 3.3 });

// Local times: the same wall-clock numbers give the same milliseconds, a second apart is a second apart.
assert.equal(localMs({ year: 2026, month: 10, day: 14, hour: 12, minute: 0, second: 1 }) - localMs({ year: 2026, month: 10, day: 14, hour: 12, minute: 0, second: 0 }), 1000);

console.log('year glance tests passed');
