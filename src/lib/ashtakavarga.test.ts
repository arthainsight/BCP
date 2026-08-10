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

// Cancer ascendant: Aries is H10, Cancer is H1 and Pisces is H9.
const houses = Array.from({ length: 12 }, (_, index) => index + 1);
assert.deepEqual(
  mapAshtakavargaHousesToSigns(houses, 4),
  [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9],
);

console.log('Aṣṭakavarga tests passed');
