import assert from 'node:assert/strict';
import type { ShadbalaRow } from './shadbala';
import type { BhavaBalaRow } from './bhavaBala';
import type { VimsopakaRow } from './vargaMatrix';
import { BHAVA_PARTS, SHADBALA_PARTS, STATUS_ICON, bhavaComposition, shadbalaComposition, shadbalaStatus, vimsopakaBy } from './balaView';

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
const house = { house: 7, bhavesha: 300, drig1: 90, drig2: 20, drig3: -45, drig4: -10, occupantTotal: 30, kendra: 15, total: 400 } as unknown as BhavaBalaRow;
const houseParts = bhavaComposition(house);
assert.deepEqual(Object.keys(houseParts), [...BHAVA_PARTS]);
assert.equal(houseParts.drigBenefic, 110);
assert.equal(houseParts.drigMalefic, -55);
assert.equal(Object.values(houseParts).reduce((sum, value) => sum + value, 0), house.total);

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
