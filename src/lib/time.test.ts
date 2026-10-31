// The year the daśās count in: a choice, the Julian year at the start, put back after a reference worked out in another.
import assert from 'node:assert/strict';
import { DASHA_YEAR_LENGTHS, DAY_MS, addDashaYears, dashaYearMs, getDashaYearLength, isDashaYearLength, setDashaYearLength, withDashaYear } from './time';
import { calculateVimshottari } from './vimshottari';
import { calculateKalachakra, calculateKalachakraSubDashas } from './kalachakra';
import { calculateRasiDasha } from './rasiDashas';
import { migrateDashaSettings } from './dashaSettings';
import { DEFAULT_DASHA_SETTINGS } from '@/types';

assert.deepEqual(DASHA_YEAR_LENGTHS, { julian: 365.25, sidereal: 365.256364, tropical: 365.2422, savana: 360 });
assert.equal(getDashaYearLength(), 'julian', 'the start');
assert.equal(dashaYearMs(), 365.25 * DAY_MS);
assert.ok(isDashaYearLength('savana') && !isDashaYearLength('lunar') && !isDashaYearLength(3));

const birth = new Date(Date.UTC(2000, 0, 1));
const years = (from: Date, to: Date) => (to.getTime() - from.getTime()) / DAY_MS;

// addDashaYears counts in the chosen year.
assert.equal(years(birth, addDashaYears(birth, 10)), 3652.5);
setDashaYearLength('savana');
assert.equal(years(birth, addDashaYears(birth, 10)), 3600);
assert.equal(years(birth, addDashaYears(birth, 0.5)), 180);
setDashaYearLength('julian');

// A whole Vimśottarī, from the start of Aśvinī (no balance taken off), is 120 years of the chosen year: 43,830 days of Julian years, 43,200 of sāvana.
const cycleDays = (length: keyof typeof DASHA_YEAR_LENGTHS) => withDashaYear(length, () => {
  const entries = calculateVimshottari(0, birth).entries;
  return years(entries[0].startDate, entries.at(-1)!.endDate);
});
for (const length of ['julian', 'sidereal', 'tropical', 'savana'] as const) {
  assert.ok(Math.abs(cycleDays(length) - 120 * DASHA_YEAR_LENGTHS[length]) < 1e-6, `${length}: 120 years of the chosen year`);
}
assert.ok(Math.abs(cycleDays('julian') - 43830) < 1e-6 && Math.abs(cycleDays('savana') - 43200) < 1e-6);
assert.equal(getDashaYearLength(), 'julian', 'withDashaYear puts the year back');

// A reference that throws still puts it back.
assert.throws(() => withDashaYear('savana', () => { throw new Error('x'); }));
assert.equal(getDashaYearLength(), 'julian');

// The Kālachakra's sub-periods are cut at the date of the birth balance, which is also counted in the chosen year.
withDashaYear('savana', () => {
  const result = calculateKalachakra(5 / 3, birth); // halfway through the first pada: 3.5 years of the 7 are left
  assert.ok(Math.abs(years(birth, result.entries[0].endDate) - 3.5 * 360) < 1e-6);
  const children = calculateKalachakraSubDashas(result.entries[0], result.cycle);
  assert.equal(children[0].startDate.getTime(), birth.getTime());
  assert.ok(Math.abs(children.reduce((sum, child) => sum + child.durationYears, 0) - 3.5) < 1e-9);
});

// The rāśi daśās use the same year (they had PyJHora's 365.256364 of their own).
const planets = [
  { name: 'Sun', sign: 6, house: 3, degree: 20, longitude: 170 }, { name: 'Moon', sign: 3, house: 12, degree: 6, longitude: 66 },
  { name: 'Mars', sign: 6, house: 3, degree: 10, longitude: 160 }, { name: 'Mercury', sign: 7, house: 4, degree: 20, longitude: 200 },
  { name: 'Jupiter', sign: 1, house: 10, degree: 3, longitude: 3 }, { name: 'Venus', sign: 7, house: 4, degree: 10, longitude: 190 },
  { name: 'Saturn', sign: 8, house: 5, degree: 24, longitude: 234 }, { name: 'Rahu', sign: 12, house: 9, degree: 8, longitude: 338 },
  { name: 'Ketu', sign: 6, house: 3, degree: 8, longitude: 158 },
];
const sthiraLength = (length: keyof typeof DASHA_YEAR_LENGTHS) => withDashaYear(length, () => {
  const first = calculateRasiDasha('sthira', planets, 4, birth).entries[0];
  return years(first.startDate, first.endDate) / first.durationYears;
});
assert.ok(Math.abs(sthiraLength('julian') - 365.25) < 1e-9);
assert.ok(Math.abs(sthiraLength('sidereal') - 365.256364) < 1e-9);
assert.ok(Math.abs(sthiraLength('savana') - 360) < 1e-9);

// The setting is kept: a stored one is read back, a stored one that is no year falls back to the Julian.
assert.equal(DEFAULT_DASHA_SETTINGS.yearLength, 'julian');
assert.equal(migrateDashaSettings({ dashas: { vimshottari: true }, yearLength: 'savana' }).yearLength, 'savana');
assert.equal(migrateDashaSettings({ dashas: { vimshottari: true }, yearLength: 'lunar' }).yearLength, 'julian');
assert.equal(migrateDashaSettings({ dashas: { vimshottari: true } }).yearLength, 'julian', 'settings stored before the choice existed');

console.log('Dasha year tests passed');
