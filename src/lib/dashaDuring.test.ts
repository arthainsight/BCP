import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { GRAHA_DASHA_SYSTEMS, grahaDashaTable, runningGrahaDashaLords } from './dashaEvents';
import { dashaLordsDuring, hasLord } from './dashaDuring';

const planet = (name: string, longitude: number): PlanetData =>
  ({ name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, house: 0 });
const planets = [
  planet('Sun', 118.4), planet('Moon', 93.7), planet('Mars', 70.2), planet('Mercury', 105.1),
  planet('Jupiter', 186.9), planet('Venus', 112.6), planet('Saturn', 98.3), planet('Rahu', 35.4), planet('Ketu', 215.4),
];
const ascendant = { longitude: 162.3, sign: 6, degree: 12.3 };
const birthDate = new Date(1947, 7, 15, 9, 15);
const input = { birthDate, planets, ascendant };

// --- The lords through a stretch of time agree with the lords running at each moment of it, in every system --------------------------
const from = new Date(2026, 9, 19, 12).getTime();
const to = new Date(2029, 9, 19, 12).getTime();
for (const { key } of GRAHA_DASHA_SYSTEMS) {
  const table = grahaDashaTable(key, input);
  // Aṣṭottarī runs only for charts that meet its condition, which this one does not.
  if (key === 'ashtottari') { assert.equal(table, null); continue; }
  assert.ok(table, `${key} has a table for this chart`);
  const stretches = dashaLordsDuring(table, from, to);
  assert.ok(stretches.length >= 1, `${key}: at least one antardaśā in three years`);
  assert.equal(stretches[0].startTime, from, `${key}: the first is cut at the start`);
  assert.equal(stretches[stretches.length - 1].endTime, to, `${key}: and the last at the end`);
  stretches.forEach((stretch, i) => {
    assert.ok(stretch.endTime > stretch.startTime);
    if (i > 0) assert.equal(stretch.startTime, stretches[i - 1].endTime, `${key}: one follows the other without a gap`);
    const middle = new Date((stretch.startTime + stretch.endTime) / 2);
    assert.deepEqual({ md: stretch.md, ad: stretch.ad }, runningGrahaDashaLords(key, { ...input, eventDate: middle }), `${key} at ${middle.toISOString()}`);
  });
}

// --- Outside the cycle, or before birth, there is nothing ---------------------------------------------------------------------------
const vimshottari = grahaDashaTable('vimshottari', input)!;
assert.deepEqual(dashaLordsDuring(vimshottari, new Date(1900, 0, 1).getTime(), new Date(1910, 0, 1).getTime()), []);
assert.deepEqual(dashaLordsDuring(vimshottari, to, from), [], 'a backwards stretch');
// Without a Moon there is no table.
assert.equal(grahaDashaTable('vimshottari', { ...input, planets: planets.filter(p => p.name !== 'Moon') }), null);

// --- Whether a graha is a lord during the stretches ---------------------------------------------------------------------------------
const stretches = [
  { md: 'Jupiter', ad: 'Saturn', startTime: 0, endTime: 1 },
  { md: 'Jupiter', ad: 'Mercury', startTime: 1, endTime: 2 },
];
assert.equal(hasLord(stretches, ['Jupiter'], 'md'), true);
assert.equal(hasLord(stretches, ['Saturn'], 'md'), false, 'an antardaśā lord is not a mahādaśā lord');
assert.equal(hasLord(stretches, ['Saturn'], 'mdad'), true);
assert.equal(hasLord(stretches, ['Asc', 'Mercury'], 'mdad'), true, 'any of the points of the row');
assert.equal(hasLord(stretches, ['Asc'], 'mdad'), false, 'the ascendant is no lord');
assert.equal(hasLord([], ['Jupiter'], 'mdad'), false);

console.log('Dasha stretch tests passed');
