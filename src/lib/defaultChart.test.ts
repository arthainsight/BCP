import assert from 'node:assert/strict';
import { DEFAULT_PLACE, OPEN_WITH_CHART_KEY, openWithChartEnabled, wallClockIn } from './defaultChart';
import { parseBirthDatetimeForTz, localToUtcOffsetHours } from './timezone';

// The clock of a place, in the form the birth data takes: dd.mm.yyyy hh.mm.ss.
// Porvoo keeps EET (UTC+2) in the winter and EEST (UTC+3) in the summer.
assert.equal(wallClockIn('Europe/Helsinki', new Date(Date.UTC(2026, 10, 6, 8, 30, 15))), '06.11.2026 10.30.15', 'winter time: UTC+2');
assert.equal(wallClockIn('Europe/Helsinki', new Date(Date.UTC(2026, 6, 6, 8, 30, 15))), '06.07.2026 11.30.15', 'summer time: UTC+3');
// The date rolls over with the clock of the place, not the clock of the browser or of Greenwich.
assert.equal(wallClockIn('Europe/Helsinki', new Date(Date.UTC(2026, 10, 6, 22, 5, 0))), '07.11.2026 00.05.00', 'midnight is 00, not 24');
assert.equal(wallClockIn('Europe/Helsinki', new Date(Date.UTC(2026, 11, 31, 22, 59, 59))), '01.01.2027 00.59.59', 'the year rolls over');
assert.equal(wallClockIn('Asia/Kolkata', new Date(Date.UTC(2026, 10, 6, 8, 30, 15))), '06.11.2026 14.00.15', 'a half-hour zone');
// The moments of the changes of the clock.
assert.equal(wallClockIn('Europe/Helsinki', new Date(Date.UTC(2026, 2, 29, 0, 59, 59))), '29.03.2026 02.59.59', 'the last second before the clock goes forward');
assert.equal(wallClockIn('Europe/Helsinki', new Date(Date.UTC(2026, 2, 29, 1, 0, 0))), '29.03.2026 04.00.00', 'the hour skipped');
// A zone the browser does not know falls back to the clock of the browser, still in the form the birth data takes.
assert.match(wallClockIn('Nowhere/Nothing', new Date(Date.UTC(2026, 10, 6, 8, 30, 15))), /^\d{2}\.\d{2}\.\d{4} \d{2}\.\d{2}\.\d{2}$/);

// The form the page fills in is the form the page reads: the string parses, and gives Porvoo's offset at that moment.
const winter = wallClockIn(DEFAULT_PLACE.ianaTimezone, new Date(Date.UTC(2026, 10, 6, 8, 30, 15)));
assert.ok(/^\d{2}\.\d{2}\.\d{4} \d{2}\.\d{2}\.\d{2}$/.test(winter));
assert.equal(localToUtcOffsetHours(DEFAULT_PLACE.ianaTimezone, parseBirthDatetimeForTz(winter)!), 2);
const summer = wallClockIn(DEFAULT_PLACE.ianaTimezone, new Date(Date.UTC(2026, 6, 6, 8, 30, 15)));
assert.equal(localToUtcOffsetHours(DEFAULT_PLACE.ianaTimezone, parseBirthDatetimeForTz(summer)!), 3);

// The place: Porvoo, and numbers the chart route takes.
assert.equal(DEFAULT_PLACE.city, 'Porvoo');
assert.ok(Math.abs(Number(DEFAULT_PLACE.latitude) - 60.39) < 0.05 && Math.abs(Number(DEFAULT_PLACE.longitude) - 25.66) < 0.05);

// The choice to open blank: on unless it is stored as 'false'; without storage (the server, a closed store) it is on.
assert.equal(openWithChartEnabled(), true, 'no storage: on');
const store = new Map<string, string>();
Object.assign(globalThis, { localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value) } });
assert.equal(openWithChartEnabled(), true, 'nothing stored: on');
store.set(OPEN_WITH_CHART_KEY, 'false');
assert.equal(openWithChartEnabled(), false, 'off when stored as false');
store.set(OPEN_WITH_CHART_KEY, 'true');
assert.equal(openWithChartEnabled(), true);
store.set(OPEN_WITH_CHART_KEY, 'nonsense');
assert.equal(openWithChartEnabled(), true, 'anything else is on');

console.log('Default chart tests passed');
