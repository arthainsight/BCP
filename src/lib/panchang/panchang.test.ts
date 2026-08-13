import assert from 'node:assert/strict';
import type { ChartData } from '@/types';
import { calculatePanchang } from './index';

// ---------------------------------------------------------------------------
// The five limbs are arithmetic on the Sun–Moon separation and the Moon's
// longitude, so they can be pinned exactly. Hora additionally needs sunrise,
// which is handled separately below.
// ---------------------------------------------------------------------------
function chartWith(sunLongitude: number, moonLongitude: number, latitude = 28.6, longitude = 77.2): ChartData {
  const body = (name: string, lon: number) => ({
    name,
    longitude: lon,
    sign: Math.floor(lon / 30) + 1,
    degree: lon % 30,
    house: 1,
  });
  return {
    ascendant: { sign: 1, degree: 0, longitude: 0 },
    planets: [body('Sun', sunLongitude), body('Moon', moonLongitude)],
    specialLagnas: [],
    debug: {
      julianDay: 0, ayanamsa: 24, utcOffset: 5.5, ascendantDegree: 0, ascendantSign: 1,
      ephemerisEngine: 'test', inputDateTime: '01.01.2000 12.00.00', latitude, longitude,
    },
  };
}

const run = (sun: number, moon: number, when = '01.01.2000 12.00.00') =>
  calculatePanchang(chartWith(sun, moon), when, 5.5, 'Lahiri');

// ---------------------------------------------------------------------------
// Tithi — one for every 12° the Moon gains on the Sun, thirty in all.
// ---------------------------------------------------------------------------
assert.equal(run(0, 0).tithiNumber, 1, 'conjunction opens the first tithi');
assert.equal(run(0, 0).paksha, 'Shukla', 'and the waxing fortnight');
assert.equal(run(0, 6).tithiNumber, 1, 'still the first tithi halfway through');
assert.equal(run(0, 12).tithiNumber, 2, 'twelve degrees on is the second');
assert.equal(run(0, 168).tithiNumber, 15, 'the fifteenth completes the waxing half');
assert.equal(run(0, 168).paksha, 'Shukla');

// Opposition begins the waning half.
assert.equal(run(0, 180).paksha, 'Krishna', 'opposition opens the waning fortnight');
assert.equal(run(0, 180).tithiNumber, 1, 'numbering restarts within the fortnight');
assert.equal(run(0, 348).tithiNumber, 15, 'the last tithi before conjunction');
assert.equal(run(0, 348).paksha, 'Krishna');

// The separation wraps, so a Moon behind the Sun is late in the waning half.
assert.equal(run(100, 90).paksha, 'Krishna', 'a Moon behind the Sun is waning');

// Sweeping the whole circle yields exactly thirty tithis, fifteen per fortnight.
const shukla = new Set<number>();
const krishna = new Set<number>();
for (let separation = 0; separation < 360; separation += 1) {
  const result = run(0, separation);
  assert.ok(result.tithiNumber >= 1 && result.tithiNumber <= 15, 'tithi numbers stay within 1–15');
  (result.paksha === 'Shukla' ? shukla : krishna).add(result.tithiNumber);
}
assert.equal(shukla.size, 15, 'fifteen waxing tithis');
assert.equal(krishna.size, 15, 'fifteen waning tithis');

// ---------------------------------------------------------------------------
// Nakshatra and pada — 13°20′ each, four padas of 3°20′.
// ---------------------------------------------------------------------------
const NAKSHATRA_SIZE = 360 / 27;
assert.equal(run(0, 0).nakshatra, 'Ashwini', 'the zodiac opens with Ashwini');
assert.equal(run(0, 0).nakshatraPada, 1, 'and its first pada');
assert.equal(run(0, NAKSHATRA_SIZE * 0.3).nakshatraPada, 2, 'a little further in is the second pada');
assert.equal(run(0, NAKSHATRA_SIZE * 0.8).nakshatraPada, 4, 'the last quarter is the fourth pada');
assert.equal(run(0, NAKSHATRA_SIZE).nakshatra, 'Bharani', 'the next nakṣatra follows');
assert.equal(run(0, 359.9).nakshatra, 'Revati', 'the zodiac closes with Revati');

for (let index = 0; index < 27; index += 1) {
  const result = run(0, (index + 0.6) * NAKSHATRA_SIZE);
  assert.ok(result.nakshatra !== '?', `nakṣatra ${index} is named`);
  // 0.6 sits inside the third quarter. The exact 0.5 midpoint is a genuine
  // floating-point knife edge — (index + 0.5) × 13.333… is not representable —
  // so it is deliberately not asserted either way.
  assert.equal(result.nakshatraPada, 3, 'six tenths into a nakṣatra is the third pada');
}

// Every pada lands in 1–4 across the whole circle.
for (let degree = 0; degree < 360; degree += 0.5) {
  const pada = run(0, degree).nakshatraPada;
  assert.ok(pada >= 1 && pada <= 4, `pada out of range at ${degree}°: ${pada}`);
}

// ---------------------------------------------------------------------------
// Yoga — the sum of the two longitudes, divided the same way.
// ---------------------------------------------------------------------------
assert.equal(run(0, 0).yoga, run(10, 350).yoga, 'the yoga depends on the sum, so these agree');
const yogas = new Set<string>();
for (let degree = 0; degree < 360; degree += 1) yogas.add(run(0, degree).yoga);
assert.equal(yogas.size, 27, 'all 27 yogas are reachable');

// ---------------------------------------------------------------------------
// Karana — half a tithi each. Sixty per lunation: four fixed, seven movable
// repeating eight times.
// ---------------------------------------------------------------------------
assert.equal(run(0, 0).karana, 'Kintughna', 'the first half-tithi is the fixed Kintughna');
assert.equal(run(0, 342).karana, 'Shakuni', 'the last three half-tithis are fixed');
assert.equal(run(0, 348).karana, 'Chatushpada');
assert.equal(run(0, 354).karana, 'Naga');

const karanas = new Set<string>();
for (let separation = 0; separation < 360; separation += 1) karanas.add(run(0, separation).karana);
assert.equal(karanas.size, 11, 'eleven distinct karanas — seven movable plus four fixed');

// The movable seven cycle in order between the fixed ends.
const movableRun = [6, 12, 18, 24, 30, 36, 42].map((separation) => run(0, separation).karana);
assert.equal(new Set(movableRun).size, 7, 'the seven movable karanas follow one another without repeating');

// ---------------------------------------------------------------------------
// Vara — the weekday of the local calendar date, with its classical lord.
// ---------------------------------------------------------------------------
const VARA_LORDS: Record<string, string> = {
  Sunday: 'Sun', Monday: 'Moon', Tuesday: 'Mars', Wednesday: 'Mercury',
  Thursday: 'Jupiter', Friday: 'Venus', Saturday: 'Saturn',
};
// 1 January 2000 was a Saturday.
assert.equal(run(0, 0, '01.01.2000 12.00.00').vara, 'Saturday');
assert.equal(run(0, 0, '02.01.2000 12.00.00').vara, 'Sunday');
assert.equal(run(0, 0, '03.01.2000 12.00.00').vara, 'Monday');

for (let day = 1; day <= 7; day += 1) {
  const result = run(0, 0, `0${day}.01.2000 12.00.00`);
  assert.equal(result.varaLord, VARA_LORDS[result.vara], `${result.vara} is ruled by ${VARA_LORDS[result.vara]}`);
}

// ---------------------------------------------------------------------------
// Hora — one of the seven lords, and the day's first hora is its own lord.
// ---------------------------------------------------------------------------
const LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
for (let day = 1; day <= 7; day += 1) {
  const result = run(0, 0, `0${day}.01.2000 12.00.00`);
  assert.ok(LORDS.includes(result.hora), `the hora lord is one of the seven, got ${result.hora}`);
}

// Just after sunrise the hora belongs to the lord of the weekday.
const atSunrise = run(0, 0, '01.01.2000 07.30.00');
assert.equal(atSunrise.vara, 'Saturday');
assert.equal(atSunrise.hora, 'Saturn', 'the first hora after sunrise is ruled by the weekday lord');

// ---------------------------------------------------------------------------
// Solar times and general shape
// ---------------------------------------------------------------------------
const full = run(0, 0);
for (const key of ['vara', 'varaLord', 'tithi', 'paksha', 'nakshatra', 'karana', 'yoga', 'hora', 'ayanamsa', 'masa'] as const) {
  assert.ok(typeof full[key] === 'string' && full[key].length > 0, `${key} must be a non-empty string`);
}
assert.ok(full.sunrise === null || /^\d{2}:\d{2}/.test(full.sunrise), 'sunrise is formatted or absent');
assert.ok(full.sunset === null || /^\d{2}:\d{2}/.test(full.sunset), 'sunset is formatted or absent');

// A polar latitude in midsummer has no horizon crossing; this must not throw.
const polar = calculatePanchang(chartWith(90, 100, 78.2, 15.6), '21.06.2000 12.00.00', 1, 'Lahiri');
assert.ok(polar.tithiNumber >= 1 && polar.tithiNumber <= 15, 'the tithi still computes above the Arctic circle');
assert.ok(LORDS.includes(polar.hora), 'and the hora falls back to a real lord');

// An unparseable birth string falls back rather than throwing.
const badInput = calculatePanchang(chartWith(0, 0), 'not a date', 5.5, 'Lahiri');
assert.ok(badInput.vara.length > 0, 'a malformed datetime still yields a result');

console.log('Panchang tests passed');
