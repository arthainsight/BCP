import assert from 'node:assert/strict';
import { aprakashaUpagrahas, saturnPortion, saturnPortionHour } from './upagrahas';

const near = (actual: number, expected: number, message: string, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${message}: ${actual} vs ${expected}`);

// Sun-based upagrahas: Upaketu is the Sun − 30°, Dhūma is the Sun + 133°20', Vyatīpāta and Parivesha follow.
const sun = 118.4;
const [dhuma, vyatipata, parivesha, indrachapa, upaketu] = aprakashaUpagrahas(sun).map(u => u.longitude);
near(dhuma, sun + 133 + 20 / 60, 'Dhuma');
near(vyatipata, 360 - dhuma, 'Vyatipata');
near((parivesha - vyatipata + 360) % 360, 180, 'Parivesha is Vyatipata + 180');
near((indrachapa + parivesha) % 360, 0, 'Indrachapa is 360 − Parivesha');
near(upaketu, sun - 30, 'Upaketu is the Sun − 30°');
for (const longitude of [dhuma, vyatipata, parivesha, indrachapa, upaketu]) assert.ok(longitude >= 0 && longitude < 360);

// A course example: Sunday 11 May 2014, sunrise 06:20, sunset 19:16 — Saturn's part begins at about 16:02.
const sunday = saturnPortion({ birthHours: 12, weekday: 0, sunrise: 6 + 20 / 60, sunset: 19 + 16 / 60, nextSunrise: 30.3, previousSunset: -4.8 })!;
assert.equal(sunday.night, false);
assert.equal(sunday.portion, 6, 'the 7th part of a Sunday day');
near(saturnPortionHour(sunday, 'begin'), 6 + 20 / 60 + 6 * (12 + 56 / 60) / 8, 'start of Saturn part', 1e-9);
assert.ok(Math.abs(saturnPortionHour(sunday, 'begin') - (16 + 2 / 60)) < 0.01);
near(saturnPortionHour(sunday, 'end') - saturnPortionHour(sunday, 'begin'), (12 + 56 / 60) / 8, 'length of a part');
near(saturnPortionHour(sunday, 'middle'), (saturnPortionHour(sunday, 'begin') + saturnPortionHour(sunday, 'end')) / 2, 'middle');

// Saturn's part of the day by weekday: 7th on Sunday down to 1st on Saturday.
const dayParts = [0, 1, 2, 3, 4, 5, 6].map(weekday => saturnPortion({ birthHours: 12, weekday, sunrise: 6, sunset: 18, nextSunrise: 30, previousSunset: -6 })!.portion + 1);
assert.deepEqual(dayParts, [7, 6, 5, 4, 3, 2, 1]);
// …and of the night: 3rd on Sunday, 2nd on Monday, 1st on Tuesday, then 7th, 6th, 5th, 4th.
const nightParts = [0, 1, 2, 3, 4, 5, 6].map(weekday => saturnPortion({ birthHours: 22, weekday, sunrise: 6, sunset: 18, nextSunrise: 30, previousSunset: -6 })!.portion + 1);
assert.deepEqual(nightParts, [3, 2, 1, 7, 6, 5, 4]);

// After sunset the night runs to the next sunrise.
const night = saturnPortion({ birthHours: 22, weekday: 0, sunrise: 6 + 20 / 60, sunset: 19 + 16 / 60, nextSunrise: 30 + 20 / 60, previousSunset: -4.7 })!;
assert.equal(night.night, true);
near(saturnPortionHour(night, 'begin'), 19 + 16 / 60 + 2 * ((30 + 20 / 60) - (19 + 16 / 60)) / 8, 'night part');

// Before sunrise the birth belongs to the night of the day before, with that day's weekday (Monday 03:00 → Sunday night).
const dawn = saturnPortion({ birthHours: 3, weekday: 1, sunrise: 6 + 20 / 60, sunset: 19 + 16 / 60, nextSunrise: 30 + 20 / 60, previousSunset: 19 + 16 / 60 - 24 })!;
assert.equal(dawn.night, true);
assert.equal(dawn.weekday, 0);
assert.equal(dawn.portion, 2);
assert.equal(dawn.startHours, 19 + 16 / 60 - 24);
assert.equal(dawn.endHours, 6 + 20 / 60);

// No sunrise or sunset (polar): nothing to give.
assert.equal(saturnPortion({ birthHours: 12, weekday: 0 }), null);

console.log('Upagraha tests passed');
