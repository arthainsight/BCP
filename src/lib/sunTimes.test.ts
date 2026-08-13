import assert from 'node:assert/strict';
import { sweJulday } from './ephemerisAdapter';
import { calculateSunTimes } from './sunTimes';

// Reference values are published sunrise/sunset times for the given place and
// date. A two-minute tolerance covers the difference between the standard
// −0.833° horizon used here and whatever refraction model a given almanac used.
const TOLERANCE_MINUTES = 2;

function assertClose(actual: number | undefined, expectedHours: number, label: string) {
  assert.ok(actual !== undefined, `${label} must be defined`);
  const deltaMinutes = Math.abs(actual - expectedHours) * 60;
  assert.ok(
    deltaMinutes <= TOLERANCE_MINUTES,
    `${label}: expected ~${expectedHours.toFixed(4)} h, got ${actual.toFixed(4)} h (${deltaMinutes.toFixed(1)} min off)`,
  );
}

const hm = (hours: number, minutes: number) => hours + minutes / 60;

async function jdAtLocalMidnight(year: number, month: number, day: number, timezoneOffset: number) {
  // Local midnight expressed in UT.
  return sweJulday(year, month, day, -timezoneOffset);
}

async function main() {
  // --- New Delhi, 15 August 1947 (IST = UTC+5:30) -------------------------
  // Published: sunrise 05:50, sunset 19:01 IST.
  const delhi = await calculateSunTimes(await jdAtLocalMidnight(1947, 8, 15, 5.5), 28.62137, 77.2148);
  assertClose(delhi.sunrise, hm(5, 50), 'Delhi sunrise');
  assertClose(delhi.sunset, hm(19, 1), 'Delhi sunset');
  assert.ok(delhi.nextSunrise !== undefined && delhi.nextSunrise > 24, 'next sunrise falls on the following day');

  // --- Helsinki, 21 June 2000 (EEST = UTC+3) -------------------------------
  // Near the solstice at 60°N: a very long day, sunrise just before 04:00.
  const helsinki = await calculateSunTimes(await jdAtLocalMidnight(2000, 6, 21, 3), 60.1699, 24.9384);
  assert.ok(helsinki.sunrise !== undefined && helsinki.sunset !== undefined, 'Helsinki midsummer still has both');
  const helsinkiDayLength = helsinki.sunset - helsinki.sunrise;
  assert.ok(
    helsinkiDayLength > 18 && helsinkiDayLength < 20,
    `Helsinki midsummer day should run 18–20 h, got ${helsinkiDayLength.toFixed(2)}`,
  );

  // --- Quito, 20 March 2000 (UTC−5) ---------------------------------------
  // On the equator at equinox the day is within minutes of twelve hours.
  const quito = await calculateSunTimes(await jdAtLocalMidnight(2000, 3, 20, -5), -0.1807, -78.4678);
  assert.ok(quito.sunrise !== undefined && quito.sunset !== undefined, 'Quito has both');
  const quitoDayLength = quito.sunset - quito.sunrise;
  assert.ok(
    Math.abs(quitoDayLength - 12) < 0.25,
    `equatorial equinox day should be ~12 h, got ${quitoDayLength.toFixed(3)}`,
  );

  // --- Tromsø, 21 June 2000 (UTC+2) ---------------------------------------
  // Above the Arctic circle in midsummer the Sun never sets, so the crossings
  // are absent rather than wrong. This must not throw.
  const tromso = await calculateSunTimes(await jdAtLocalMidnight(2000, 6, 21, 2), 69.6492, 18.9553);
  assert.equal(tromso.sunrise, undefined, 'polar day reports no sunrise');
  assert.equal(tromso.sunset, undefined, 'polar day reports no sunset');

  // --- Ordering ------------------------------------------------------------
  assert.ok(delhi.sunrise! < delhi.sunset!, 'sunrise precedes sunset');
  assert.ok(delhi.sunset! < delhi.nextSunrise!, 'sunset precedes the next sunrise');

  console.log('Sun times tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
