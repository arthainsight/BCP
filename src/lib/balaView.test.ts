import assert from 'node:assert/strict';
import type { ShadbalaRow } from './shadbala';
import type { BhavaBalaRow } from './bhavaBala';
import type { VimsopakaRow } from './vargaMatrix';
import { BHAVA_PARTS, BHAVA_OK_FROM, BHAVA_STRONG_FROM, SHADBALA_PARTS, STATUS_ICON, bhavaStrength, bhavaComposition, shadbalaComposition, shadbalaStatus, vimsopakaBy } from './balaView';

// --- The status of a planet against its required Ṣaḍbala ----------------------------------------------------------------------
assert.equal(shadbalaStatus(0.99), 'weak');
assert.equal(shadbalaStatus(1), 'ok', 'exactly the required is ok');
assert.equal(shadbalaStatus(1.19), 'ok');
assert.equal(shadbalaStatus(1.2), 'strong');
assert.deepEqual(Object.values(STATUS_ICON), ['✕', '!', '✓'], 'every status has an icon');

// --- The six balas add up to the total ------------------------------------------------------------------------------------------
const shadbala = {
  planet: 'Sun', sthanaBreakdown: { uccha: 50, saptavargaja: 80, ojhayugma: 15, kendradi: 30, drekkana: 15, total: 190 }, digVirupa: 40,
  kalaBreakdown: { natonnata: 20, paksha: 30, tribhaaga: 0, varsheshadi: 0, ayana: 40, total: 90, sect: 'day', tribhagaLord: null },
  cheshtaVirupa: 25, naisargikaVirupa: 60, drikVirupa: -12.5, totalVirupa: 392.5, requiredVirupa: 390, ratio: 392.5 / 390,
} as unknown as ShadbalaRow;
const parts = shadbalaComposition(shadbala);
assert.deepEqual(Object.keys(parts), [...SHADBALA_PARTS]);
assert.equal(Object.values(parts).reduce((sum, value) => sum + value, 0), shadbala.totalVirupa, 'the parts add up to the total, a negative Dṛg included');

// --- The parts of a house add up to its total -----------------------------------------------------------------------------------
const house = { house: 7, bhavesha: 300, dig: 20, drigBenefic: 110, drigMalefic: -55, occupantTotal: 60, kala: 15, total: 450 } as unknown as BhavaBalaRow;
const houseParts = bhavaComposition(house);
assert.deepEqual(Object.keys(houseParts), [...BHAVA_PARTS]);
assert.equal(houseParts.drigBenefic, 110);
assert.equal(houseParts.drigMalefic, -55);
assert.equal(houseParts.occupants, 60);
assert.equal(Object.values(houseParts).reduce((sum, value) => sum + value, 0), house.total);

// --- The houses against 420 and 480 virupa ---------------------------------------------------------------------------------------
assert.equal(BHAVA_OK_FROM, 420);
assert.equal(BHAVA_STRONG_FROM, 480);
{
  const totals = [380, 419.4, 419.6, 420, 479.4, 479.6, 480, 600];
  const houses = totals.map((total, index) => ({ house: index + 1, total }) as unknown as BhavaBalaRow);
  const result = bhavaStrength(houses);
  assert.deepEqual(result.map(entry => entry.status), ['weak', 'weak', 'ok', 'ok', 'ok', 'strong', 'strong', 'strong'], 'under 420 weak, from 420 ok, from 480 strong, by the whole virupa shown');
  assert.deepEqual(result.map(entry => entry.house), [1, 2, 3, 4, 5, 6, 7, 8], 'in the order of the houses');
  assert.deepEqual(bhavaStrength([]), []);
}

// --- Vimsopaka by a scheme ------------------------------------------------------------------------------------------------------------
const rows = [
  { planet: 'Sun', shadvarga: 10, saptavarga: 12, dasavarga: 8, shodasavarga: 9 },
  { planet: 'Moon', shadvarga: 14, saptavarga: 11, dasavarga: 15, shodasavarga: 9 },
  { planet: 'Mars', shadvarga: 12, saptavarga: 13, dasavarga: 9, shodasavarga: 16 },
] as VimsopakaRow[];
assert.deepEqual(vimsopakaBy(rows, 'shadvarga').map(row => row.planet), ['Moon', 'Mars', 'Sun']);
assert.deepEqual(vimsopakaBy(rows, 'shodasavarga').map(row => row.planet), ['Mars', 'Sun', 'Moon'], 'a tie keeps the order');
assert.deepEqual(rows.map(row => row.planet), ['Sun', 'Moon', 'Mars'], 'the rows given are not changed');

console.log('Bala view tests passed');
