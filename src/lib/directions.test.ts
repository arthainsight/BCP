import assert from 'node:assert/strict';
import { DIG_BALA_DIRECTION, houseDirection, placeByDirection, signDirection } from './directions';

// --- Signs: fire east, earth south, air west, water north -----------------------
assert.deepEqual([1, 5, 9].map(signDirection), ['East', 'East', 'East']);
assert.deepEqual([2, 6, 10].map(signDirection), ['South', 'South', 'South']);
assert.deepEqual([3, 7, 11].map(signDirection), ['West', 'West', 'West']);
assert.deepEqual([4, 8, 12].map(signDirection), ['North', 'North', 'North']);

// --- Houses: 1st east, 4th north, 7th west, 10th south ---------------------------
assert.equal(houseDirection(1), 'East');
assert.equal(houseDirection(4), 'North');
assert.equal(houseDirection(7), 'West');
assert.equal(houseDirection(10), 'South');

// --- Dig Bala directions match the angular houses ---------------------------------
assert.equal(DIG_BALA_DIRECTION.Jupiter, houseDirection(1));
assert.equal(DIG_BALA_DIRECTION.Sun, houseDirection(10));
assert.equal(DIG_BALA_DIRECTION.Saturn, houseDirection(7));
assert.equal(DIG_BALA_DIRECTION.Moon, houseDirection(4));

// --- Placement by sign, with a Leo ascendant ---------------------------------------
const bodies = [
  { name: 'Asc', sign: 5 },      // Leo: east
  { name: 'Sun', sign: 5 },      // east
  { name: 'Moon', sign: 4 },     // Cancer: north, the 12th house
  { name: 'Saturn', sign: 11 },  // Aquarius: west, the 7th house
  { name: 'Rahu', sign: 2 },     // Taurus: south
];
const bySign = placeByDirection(5, bodies, [], 'sign');
assert.deepEqual(bySign.East.map(p => p.name), ['Asc', 'Sun']);
assert.deepEqual(bySign.North.map(p => p.name), ['Moon']);
assert.deepEqual(bySign.West.map(p => p.name), ['Saturn']);
assert.deepEqual(bySign.South.map(p => p.name), ['Rahu']);
assert.equal(bySign.North[0].house, 12);
assert.equal(bySign.North[0].digBala, true, 'the Moon in the north has Dig Bala');
assert.equal(bySign.West[0].digBala, true, 'Saturn in the west has Dig Bala');
assert.equal(bySign.East[1].digBala, false, 'the Sun in the east does not');
assert.equal(bySign.South[0].digBala, false, 'the nodes have no Dig Bala');

// --- Placement by house: the 1st house is east whatever the ascendant -------------
const byHouse = placeByDirection(5, bodies, [], 'house');
assert.deepEqual(byHouse.East.map(p => p.name), ['Asc', 'Sun'], 'the ascendant and the 1st house are east');
assert.deepEqual(byHouse.North.map(p => p.name), ['Moon'], 'the 12th house is north');
assert.deepEqual(byHouse.West.map(p => p.name), ['Saturn'], 'the 7th house is west');
assert.deepEqual(byHouse.South.map(p => p.name), ['Rahu'], 'the 10th house is south');

// --- Transits are kept apart --------------------------------------------------------
const withTransit = placeByDirection(1, [{ name: 'Sun', sign: 1 }], [{ name: 'Sun', sign: 4 }], 'house');
assert.deepEqual(withTransit.East.map(p => [p.name, p.transit]), [['Sun', false]]);
assert.deepEqual(withTransit.North.map(p => [p.name, p.transit]), [['Sun', true]]);

console.log('Direction tests passed');
