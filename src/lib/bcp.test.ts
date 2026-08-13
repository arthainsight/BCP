import assert from 'node:assert/strict';
import { calculateBcp, parseDateTime } from './bcp';

// ---------------------------------------------------------------------------
// Bhṛgu Chakra Paddhati progression.
//
// The rule is purely arithmetic, so these are exact rather than approximate:
// the running year of life advances one house per year around the twelve, and
// within a running year the month advances one house from the year's house.
// ---------------------------------------------------------------------------
const birth = new Date(2000, 0, 1, 12, 0, 0);
const at = (year: number, month: number, day: number, hour = 12, minute = 0, second = 0) =>
  calculateBcp(birth, new Date(year, month - 1, day, hour, minute, second));

// --- The birth moment itself -----------------------------------------------
const atBirth = at(2000, 1, 1);
assert.equal(atBirth.completedAge, 0, 'nobody has completed a year at birth');
assert.equal(atBirth.runningYear, 1, 'the first year of life is running');
assert.equal(atBirth.activeYearHouse, 1, 'the first running year activates the first house');
assert.equal(atBirth.bcpCycle, 1, 'the first cycle');
assert.equal(atBirth.monthInRunningYear, 1);
assert.equal(atBirth.activeMonthHouse, 1, 'month one shares the year house');

// --- One house per year of life ---------------------------------------------
for (let completed = 0; completed < 12; completed += 1) {
  const result = at(2000 + completed, 1, 1);
  assert.equal(result.completedAge, completed, `completed age at ${completed}`);
  assert.equal(result.runningYear, completed + 1, 'running year is completed age plus one');
  assert.equal(result.activeYearHouse, completed + 1, `year ${completed + 1} activates house ${completed + 1}`);
  assert.equal(result.bcpCycle, 1, 'still inside the first twelve-year cycle');
}

// --- The cycle wraps every twelve years -------------------------------------
const year13 = at(2012, 1, 1);
assert.equal(year13.runningYear, 13);
assert.equal(year13.activeYearHouse, 1, 'the thirteenth running year returns to house one');
assert.equal(year13.bcpCycle, 2, 'and opens the second cycle');

const year24 = at(2023, 1, 1);
assert.equal(year24.runningYear, 24);
assert.equal(year24.activeYearHouse, 12, 'the twenty-fourth year closes on house twelve');
assert.equal(year24.bcpCycle, 2);

const year25 = at(2024, 1, 1);
assert.equal(year25.runningYear, 25);
assert.equal(year25.activeYearHouse, 1);
assert.equal(year25.bcpCycle, 3, 'the third cycle opens at running year 25');

// The house is always a valid 1–12 and tracks the running year exactly.
for (let completed = 0; completed <= 60; completed += 1) {
  const result = at(2000 + completed, 6, 1);
  assert.ok(result.activeYearHouse >= 1 && result.activeYearHouse <= 12, 'year house stays within 1–12');
  assert.ok(result.activeMonthHouse >= 1 && result.activeMonthHouse <= 12, 'month house stays within 1–12');
  assert.equal(result.activeYearHouse, ((result.runningYear - 1) % 12) + 1, 'year house follows the running year');
  assert.equal(result.bcpCycle, Math.floor((result.runningYear - 1) / 12) + 1, 'cycle follows the running year');
}

// --- The birthday is the boundary, not New Year ------------------------------
// A day before the first birthday the first year is still running.
const dayBefore = at(2000, 12, 31);
assert.equal(dayBefore.completedAge, 0, 'the year is not complete until the birthday');
assert.equal(dayBefore.runningYear, 1);
assert.equal(dayBefore.activeYearHouse, 1);

// An hour before the birthday still counts as the previous year.
const hourBefore = at(2001, 1, 1, 11, 59, 59);
assert.equal(hourBefore.completedAge, 0, 'the age turns at the birth time, not at midnight');
assert.equal(hourBefore.runningYear, 1);

// And at the exact birth time it turns over.
const onTheHour = at(2001, 1, 1, 12, 0, 0);
assert.equal(onTheHour.completedAge, 1);
assert.equal(onTheHour.runningYear, 2);
assert.equal(onTheHour.activeYearHouse, 2);

// --- Months inside a running year -------------------------------------------
// Month one always shares the year house, and each month steps one house on.
for (let completed = 0; completed < 14; completed += 1) {
  const result = at(2000 + completed, 1, 1);
  assert.equal(result.monthInRunningYear, 1, 'the birthday opens month one');
  assert.equal(result.activeMonthHouse, result.activeYearHouse, 'month one shares the year house');
}

// Across the first year of life the month house walks 1 → 12.
let previousMonth = 0;
for (let monthStep = 0; monthStep < 12; monthStep += 1) {
  const result = at(2000, 1 + monthStep, 2);
  assert.ok(result.monthInRunningYear >= previousMonth, 'the month index never goes backwards');
  previousMonth = result.monthInRunningYear;
  assert.ok(result.monthInRunningYear >= 1 && result.monthInRunningYear <= 12, 'the month index stays within 1–12');
  const expectedHouse = ((result.activeYearHouse + result.monthInRunningYear - 2) % 12) + 1;
  assert.equal(result.activeMonthHouse, expectedHouse, 'the month house steps on from the year house');
}

// The month house wraps past twelve. In running year 2 the year house is 2, so
// month 11 lands on house 12 and month 12 wraps to house 1.
const lateInYearTwo = at(2001, 12, 20);
assert.equal(lateInYearTwo.activeYearHouse, 2);
assert.equal(lateInYearTwo.monthInRunningYear, 12);
assert.equal(lateInYearTwo.activeMonthHouse, 1, 'the twelfth month of year two wraps to house one');

// --- Dates before birth ------------------------------------------------------
const beforeBirth = at(1999, 6, 1);
assert.ok(beforeBirth.monthInRunningYear >= 1, 'a pre-birth date still returns a usable month');
assert.ok(beforeBirth.completedAge < 0, 'and a negative completed age rather than a crash');

// ---------------------------------------------------------------------------
// parseDateTime — the dd.mm.yyyy hh.mm.ss input format
// ---------------------------------------------------------------------------
const parsed = parseDateTime('15.08.1947 09.15.00');
assert.ok(parsed, 'a well-formed input parses');
assert.equal(parsed.getFullYear(), 1947);
assert.equal(parsed.getMonth(), 7, 'August is month index 7');
assert.equal(parsed.getDate(), 15);
assert.equal(parsed.getHours(), 9);
assert.equal(parsed.getMinutes(), 15);
assert.equal(parsed.getSeconds(), 0);

assert.equal(parseDateTime('15.8.1947 09.15.00'), null, 'a single-digit month is rejected');
assert.equal(parseDateTime('1947-08-15 09:15:00'), null, 'ISO format is rejected');
assert.equal(parseDateTime('15.08.1947'), null, 'a missing time is rejected');
assert.equal(parseDateTime(''), null, 'empty input is rejected');
assert.ok(parseDateTime('  15.08.1947 09.15.00  '), 'surrounding whitespace is tolerated');

console.log('BCP tests passed');
