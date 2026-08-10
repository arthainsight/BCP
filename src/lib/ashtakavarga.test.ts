import assert from 'node:assert/strict';
import { buildAshtakavarga, mapAshtakavargaHousesToSigns } from './ashtakavarga';

const chart = {
  ascendant: { sign: 4 }, // Cancer
  planets: [
    { name: 'Sun', sign: 1 },
    { name: 'Moon', sign: 2 },
    { name: 'Mars', sign: 3 },
    { name: 'Mercury', sign: 4 },
    { name: 'Jupiter', sign: 5 },
    { name: 'Venus', sign: 6 },
    { name: 'Saturn', sign: 7 },
  ],
};

// SAV must remain the exact sum of all displayed BAV cells.
const result = buildAshtakavarga(chart);
assert.equal(result.sav.total, result.bav.reduce((sum, row) => sum + row.total, 0));

const parashara = buildAshtakavarga(chart, 'parashara');
const varahamihira = buildAshtakavarga(chart, 'varahamihira');
assert.deepEqual(parashara.bav.map((row) => row.total), [50, 49, 42, 55, 56, 52, 39]);
assert.deepEqual(varahamihira.bav.map((row) => row.total), [48, 49, 39, 54, 56, 52, 39]);
assert.equal(parashara.sav.total, 343);
assert.equal(varahamihira.sav.total, 337);
assert.notDeepEqual(parashara.sav.houses, varahamihira.sav.houses);

// Cancer ascendant: Aries is H10, Cancer is H1 and Pisces is H9.
const houses = Array.from({ length: 12 }, (_, index) => index + 1);
assert.deepEqual(
  mapAshtakavargaHousesToSigns(houses, 4),
  [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9],
);

console.log('Aṣṭakavarga tests passed');
