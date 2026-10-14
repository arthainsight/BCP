import assert from 'node:assert/strict';
import { getUtcOffsetHours, localToUtcOffsetHours, parseBirthDatetimeForTz } from './timezone';

// Offsets that the tz database gives for ordinary and historical dates.
const offset = (zone: string, text: string) => localToUtcOffsetHours(zone, parseBirthDatetimeForTz(text)!);

assert.equal(offset('Europe/Helsinki', '15.01.1990 12.00.00'), 2);
assert.equal(offset('Europe/Helsinki', '15.07.1990 12.00.00'), 3);
assert.equal(offset('Asia/Kolkata', '15.08.1947 09.15.00'), 5.5);
assert.equal(offset('Asia/Kolkata', '01.01.2000 00.00.00'), 5.5);
assert.equal(offset('Asia/Kathmandu', '01.01.2000 12.00.00'), 5.75);
assert.equal(offset('America/New_York', '04.07.2001 12.00.00'), -4);
assert.equal(offset('America/New_York', '04.01.2001 12.00.00'), -5);
assert.equal(offset('Australia/Lord_Howe', '15.01.2020 12.00.00'), 11);
assert.equal(offset('Australia/Lord_Howe', '15.07.2020 12.00.00'), 10.5);
assert.equal(offset('Asia/Kolkata', '01.06.1943 12.00.00'), 6.5); // wartime time in India (until 15 Oct 1945)

// The hour of a transition: Helsinki went from +2 to +3 on 25 March 2018 at 03.00 local time.
assert.equal(offset('Europe/Helsinki', '25.03.2018 02.30.00'), 2); // before the change (the clock reads 02.30 in winter time)
assert.equal(offset('Europe/Helsinki', '25.03.2018 04.30.00'), 3); // after it
// ... and back on 28 October 2018 at 04.00 local summer time (03.00 winter time).
assert.equal(offset('Europe/Helsinki', '28.10.2018 02.30.00'), 3);
assert.equal(offset('Europe/Helsinki', '28.10.2018 05.30.00'), 2);
// Reading the wall-clock time as if it were UTC (the old way) gets this wrong: 02.30 "UTC" is already after the change.
assert.equal(getUtcOffsetHours('Europe/Helsinki', parseBirthDatetimeForTz('25.03.2018 02.30.00')!), 3);
// A time that never happened gets the offset before the change; a repeated one the first offset.
assert.equal(offset('Europe/Helsinki', '25.03.2018 03.30.00'), 2);
assert.equal(offset('Europe/Helsinki', '28.10.2018 03.30.00'), 3);
assert.equal(getUtcOffsetHours('Nowhere/Land', new Date()), 0);

console.log('timezone tests passed');
