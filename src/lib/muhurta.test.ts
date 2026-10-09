import assert from 'node:assert/strict';
import {
  abhijit, choghadiya, clockTime, gulikaKala, rahuKala, yamaganda, WEEKDAY_LORDS,
} from './muhurta';

// A plain day: sunrise 06:00, sunset 18:00, next sunrise 06:00 — every part is 1.5 h (day) or 1.5 h (night).
const day = { sunrise: 6, sunset: 18, nextSunrise: 30 };
const range = (span: { start: number; end: number }) => `${clockTime(span.start, false)}–${clockTime(span.end, false)}`;

// Rāhu Kāla, Yamaganḍa and Gulika Kāla by weekday, as in the printed tables (Sunday first).
assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(d => range(rahuKala(day, d))), [
  '16:30–18:00', '07:30–09:00', '15:00–16:30', '12:00–13:30', '13:30–15:00', '10:30–12:00', '09:00–10:30',
]);
assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(d => range(yamaganda(day, d))), [
  '12:00–13:30', '10:30–12:00', '09:00–10:30', '07:30–09:00', '06:00–07:30', '15:00–16:30', '13:30–15:00',
]);
assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(d => range(gulikaKala(day, d))), [
  '15:00–16:30', '13:30–15:00', '12:00–13:30', '10:30–12:00', '09:00–10:30', '07:30–09:00', '06:00–07:30',
]);

// Gulika Kāla is Saturn's part, the same one the Gulika upagraha is taken in.
assert.equal(range(gulikaKala(day, 6)), '06:00–07:30', 'Saturday day: the 1st part');

// Abhijit: the 8th of fifteen muhūrtas, around midday (48 minutes in a 12-hour day).
assert.equal(range(abhijit(day)), '11:36–12:24');

// Choghaḍiyā of the day by weekday (printed tables).
const names = (parts: { name: string }[]) => parts.map(part => part.name).join(' ');
assert.equal(names(choghadiya(day, 0).day), 'Udveg Chal Labh Amrit Kaal Shubh Rog Udveg');
assert.equal(names(choghadiya(day, 1).day), 'Amrit Kaal Shubh Rog Udveg Chal Labh Amrit');
assert.equal(names(choghadiya(day, 2).day), 'Rog Udveg Chal Labh Amrit Kaal Shubh Rog');
assert.equal(names(choghadiya(day, 3).day), 'Labh Amrit Kaal Shubh Rog Udveg Chal Labh');
assert.equal(names(choghadiya(day, 4).day), 'Shubh Rog Udveg Chal Labh Amrit Kaal Shubh');
assert.equal(names(choghadiya(day, 5).day), 'Chal Labh Amrit Kaal Shubh Rog Udveg Chal');
assert.equal(names(choghadiya(day, 6).day), 'Kaal Shubh Rog Udveg Chal Labh Amrit Kaal');
// …and of the night.
assert.equal(names(choghadiya(day, 0).night), 'Shubh Amrit Chal Rog Kaal Labh Udveg Shubh');
assert.equal(names(choghadiya(day, 1).night), 'Chal Rog Kaal Labh Udveg Shubh Amrit Chal');
assert.equal(names(choghadiya(day, 2).night), 'Kaal Labh Udveg Shubh Amrit Chal Rog Kaal');
assert.equal(names(choghadiya(day, 3).night), 'Udveg Shubh Amrit Chal Rog Kaal Labh Udveg');
assert.equal(names(choghadiya(day, 4).night), 'Amrit Chal Rog Kaal Labh Udveg Shubh Amrit');
assert.equal(names(choghadiya(day, 5).night), 'Rog Kaal Labh Udveg Shubh Amrit Chal Rog');
assert.equal(names(choghadiya(day, 6).night), 'Labh Udveg Shubh Amrit Chal Rog Kaal Labh');

// The day parts run from sunrise to sunset, the night parts from sunset to the next sunrise; they fill them without a gap.
const sunday = choghadiya(day, 0);
assert.equal(sunday.day[0].start, 6);
assert.equal(sunday.day[7].end, 18);
assert.equal(sunday.night[0].start, 18);
assert.equal(sunday.night[7].end, 30);
assert.ok(sunday.day.every((part, index) => index === 0 || part.start === sunday.day[index - 1].end));
assert.equal(sunday.day[3].lord, 'Moon');
assert.equal(sunday.day[0].quality, 'bad');
assert.equal(sunday.day[3].quality, 'good');
assert.equal(sunday.day[1].quality, 'neutral');
assert.deepEqual(WEEKDAY_LORDS.length, 7);

// A day whose length is not 12 hours still divides evenly (Porvoo, 8 October 2026: 07:39:51 to 18:28:43, eighths of 1 h 21 min 6.5 s).
const porvoo = { sunrise: 7 + 39 / 60 + 51 / 3600, sunset: 18 + 28 / 60 + 43 / 3600, nextSunrise: 31 + 42 / 60 + 19 / 3600 };
const thursday = rahuKala(porvoo, 4); // the 6th part
assert.equal(clockTime(thursday.start), '14:25:24');
assert.equal(clockTime(thursday.end), '15:46:30');
assert.equal(clockTime(31.6), '07:36:00', 'past 24 hours wraps to the next day');


console.log('Muhurta tests passed');
