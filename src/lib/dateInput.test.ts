import assert from 'node:assert/strict';
import { getNowDateTimeString, getTodayString, parseTargetDateString } from './dateInput';

assert.match(getTodayString(), /^\d{4}-\d{2}-\d{2}$/);
assert.match(getNowDateTimeString(), /^\d{2}\.\d{2}\.\d{4} \d{2}\.\d{2}\.\d{2}$/);
assert.deepEqual(parseTargetDateString('2026-10-06'), new Date(2026, 9, 6, 12, 0, 0), 'local noon');
assert.equal(parseTargetDateString('06.10.2026'), null);
assert.equal(parseTargetDateString('2026-xx-06'), null);
