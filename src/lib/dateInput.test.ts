import assert from 'node:assert/strict';
import { getNowDateTimeString, getTodayString, parseTargetDateString, shiftTargetDate } from './dateInput';

assert.match(getTodayString(), /^\d{4}-\d{2}-\d{2}$/);
assert.match(getNowDateTimeString(), /^\d{2}\.\d{2}\.\d{4} \d{2}\.\d{2}\.\d{2}$/);
assert.deepEqual(parseTargetDateString('2026-10-06'), new Date(2026, 9, 6, 12, 0, 0), 'local noon');
assert.equal(parseTargetDateString('06.10.2026'), null);
assert.equal(parseTargetDateString('2026-xx-06'), null);


assert.equal(shiftTargetDate('2026-10-06', 'day', 1), '2026-10-07');
assert.equal(shiftTargetDate('2026-12-31', 'day', 1), '2027-01-01');
assert.equal(shiftTargetDate('2026-03-01', 'day', -1), '2026-02-28');
assert.equal(shiftTargetDate('2026-01-31', 'month', 1), '2026-02-28', 'stops at the end of a short month');
assert.equal(shiftTargetDate('2024-01-31', 'month', 1), '2024-02-29');
assert.equal(shiftTargetDate('2026-11-15', 'month', 3), '2027-02-15');
assert.equal(shiftTargetDate('2024-02-29', 'year', 1), '2025-02-28');
assert.equal(shiftTargetDate('2026-10-06', 'year', -10), '2016-10-06');
// Across the October daylight-saving change the date still moves by one day.
assert.equal(shiftTargetDate('2026-10-24', 'day', 2), '2026-10-26');
assert.equal(shiftTargetDate('not a date', 'day', 1), 'not a date');
