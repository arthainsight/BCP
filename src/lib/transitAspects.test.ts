import assert from 'node:assert/strict';
import { transitStays } from './transitAspects';
import { JULIAN_YEAR_MS } from './time';

const DAY = 86_400_000;
const series = (longitudes: number[], start = 0) => ({ start, step: DAY, longitudes });
const years = (days: number) => days * DAY / JULIAN_YEAR_MS;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// --- A graha that crosses into the next sign: two stays, cut where it crosses ------------------------------------------------------
// Aries 29° to Taurus 1°, crossing 0° Taurus half a day into the second day (29.5 → 30.5 is the second step).
{
  const stays = transitStays('Jupiter', series([29, 29.5, 30.5, 31]), 0);
  assert.deepEqual(stays.map(stay => [stay.body, stay.signIndex]), [['Jupiter', 0], ['Jupiter', 1]]);
  assert.ok(near(stays[0].startAge, 0) && near(stays[0].endAge, years(1.5)));
  assert.ok(near(stays[1].startAge, years(1.5)) && near(stays[1].endAge, years(3)), 'the stays follow each other and the last ends with the data');
}

// --- A retrograde loop over a sign boundary gives the sign two stays and the other one between them ----------------------------------
{
  const stays = transitStays('Saturn', series([29, 30.5, 30.2, 29.5, 29.8, 30.4]), 0);
  assert.deepEqual(stays.map(stay => stay.signIndex), [0, 1, 0, 1]);
  stays.forEach((stay, i) => i > 0 && assert.ok(near(stay.startAge, stays[i - 1].endAge)));
}

// --- Round the end of the zodiac, and a graha that stays in its sign -------------------------------------------------------------------
assert.deepEqual(transitStays('Sun', series([359, 359.5, 0.5, 1]), 0).map(stay => stay.signIndex), [11, 0]);
assert.deepEqual(transitStays('Moon', series([1, 5, 12, 28]), 0).map(stay => stay.signIndex), [0], 'one stay for the whole time');

// --- Ages count from birth, before it as negative ----------------------------------------------------------------------------------------
{
  const stays = transitStays('Mars', series([10, 11, 12]), 5 * DAY);
  assert.ok(near(stays[0].startAge, years(-5)) && near(stays[0].endAge, years(-3)));
}

// --- Too little data is no stay ----------------------------------------------------------------------------------------------------------
assert.deepEqual(transitStays('Mars', series([10]), 0), []);
assert.deepEqual(transitStays('Mars', series([]), 0), []);

console.log('Transit stay tests passed');
