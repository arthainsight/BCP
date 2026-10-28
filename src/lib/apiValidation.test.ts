import assert from 'node:assert/strict';
import { AYANAMSA_OFFSET_RANGE, MOMENT_RANGES, PLACE_RANGES, readBodies, readClampedInt, readNumbers } from './apiValidation';

const query = (text: string) => new URLSearchParams(text);
/** A good request with one parameter set to a value (replacing the one that was there). */
const GOOD = 'year=1947&month=8&day=15';
const with_ = (key: string, value: string) => { const params = query(GOOD); params.set(key, value); return params; };
const chartRanges = { ...MOMENT_RANGES, ...PLACE_RANGES, ayanamsaOffset: AYANAMSA_OFFSET_RANGE };

// A well-formed request gives its numbers, and what is left out takes its fallback.
assert.deepEqual(readNumbers(query('year=1947&month=8&day=15'), chartRanges), {
  values: { year: 1947, month: 8, day: 15, hour: 0, minute: 0, second: 0, lat: 0, lng: 0, tz: 0, ayanamsaOffset: 0 },
});
const full = readNumbers(query('year=1947&month=08&day=15&hour=09&minute=15&second=00&lat=-33.86&lng=151.2&tz=5.5&ayanamsaOffset=-0.25'), chartRanges);
assert.ok('values' in full);
assert.equal(full.values.month, 8, 'a leading zero is fine');
assert.equal(full.values.lat, -33.86);
assert.equal(full.values.ayanamsaOffset, -0.25);
assert.equal(readNumbers(query('hour='), { hour: MOMENT_RANGES.hour }).hasOwnProperty('values'), true, 'an empty value is an absent one');

// Year, month and day cannot be left out.
assert.deepEqual(readNumbers(query('month=8&day=15'), chartRanges), { error: 'Missing required parameter: year' });
assert.deepEqual(readNumbers(query('year=1947&month=8&day='), chartRanges), { error: 'Missing required parameter: day' });

// What is not a number, or is not a finite one, is refused and named.
for (const bad of ['abc', '12abc', 'NaN', 'Infinity', '-Infinity', '1e999', '1e3', '0x10', '1,5', '--1', '1.2.3']) {
  assert.deepEqual(readNumbers(query(`${GOOD}&lat=${bad}`), chartRanges), { error: 'lat is not a number' }, bad);
}

// What lies outside the range is refused, and the edges are in.
for (const [key, value] of [['year', '0'], ['year', '10000'], ['year', '99999999'], ['month', '13'], ['day', '32'], ['hour', '24'], ['minute', '60'], ['second', '60'],
  ['lat', '90.1'], ['lat', '-91'], ['lng', '181'], ['tz', '14.5'], ['tz', '-15'], ['ayanamsaOffset', '361']]) {
  const result = readNumbers(with_(key, value), chartRanges);
  assert.ok('error' in result && result.error.startsWith(`${key} must be between`), `${key}=${value}`);
}
for (const edge of ['lat=90', 'lat=-90', 'lng=180', 'lng=-180', 'tz=14', 'tz=-14', 'hour=23', 'minute=59', 'second=59', 'ayanamsaOffset=360']) {
  assert.ok('values' in readNumbers(query(`${GOOD}&${edge}`), chartRanges), edge);
}

// A length of time is quietly kept inside what the route allows; what is not a number is the usual length.
const days = { min: 1, max: 1098, fallback: 90 };
assert.equal(readClampedInt(query('days=30'), 'days', days), 30);
assert.equal(readClampedInt(query(''), 'days', days), 90);
assert.equal(readClampedInt(query('days=abc'), 'days', days), 90);
assert.equal(readClampedInt(query('days=NaN'), 'days', days), 90);
assert.equal(readClampedInt(query('days=Infinity'), 'days', days), 90);
assert.equal(readClampedInt(query('days=0'), 'days', days), 1);
assert.equal(readClampedInt(query('days=-5'), 'days', days), 1);
assert.equal(readClampedInt(query('days=999999999'), 'days', days), 1098);
assert.equal(readClampedInt(query('days=12.9'), 'days', days), 12);
assert.equal(readClampedInt(query('days=0x10'), 'days', days), 90, 'hex is not a number here');

// Each graha is named once, however often the list repeats it, and in the order of the allowed list.
const allowed = ['Sun', 'Moon', 'Mars'] as const;
assert.deepEqual(readBodies(null, allowed), ['Sun', 'Moon', 'Mars'], 'no list means all');
assert.deepEqual(readBodies('Mars,Sun', allowed), ['Sun', 'Mars']);
assert.deepEqual(readBodies(Array(5000).fill('Moon').join(','), allowed), ['Moon'], 'a repeated name counts once');
assert.deepEqual(readBodies(' Sun , Moon ,Sun', allowed), ['Sun', 'Moon']);
assert.deepEqual(readBodies('', allowed), [], 'an empty list names nothing');
assert.deepEqual(readBodies('Pluto,Earth', allowed), [], 'not a graha of the list');
for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
  assert.deepEqual(readBodies(`${name},Sun`, allowed), ['Sun'], `${name} is not a graha`);
}

console.log('API validation tests passed');
