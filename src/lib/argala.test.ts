import assert from 'node:assert/strict';
import { argalaOnGrahas, argalaOnHouses, argalaOnSign, ARGALA_HOUSES } from './argala';

const planets = [
  { name: 'Sun', sign: 1 }, { name: 'Moon', sign: 3 }, { name: 'Mars', sign: 1 }, { name: 'Mercury', sign: 5 },
  { name: 'Jupiter', sign: 2 }, { name: 'Venus', sign: 12 }, { name: 'Saturn', sign: 11 }, { name: 'Rahu', sign: 7 }, { name: 'Ketu', sign: 1 },
];

// The argala houses and their virodha houses.
assert.deepEqual(ARGALA_HOUSES.map(item => [item.house, item.virodha]), [[2, 12], [4, 10], [11, 3], [5, 9]]);

// Argala on Aries (sign 1): the 2nd is Taurus, the 4th Cancer, the 11th Aquarius, the 5th Leo.
const onAries = argalaOnSign(1, planets);
assert.deepEqual(onAries.map(cell => cell.sign), [2, 4, 11, 5]);
assert.deepEqual(onAries.map(cell => cell.virodhaSign), [12, 10, 3, 9]);
// 2nd (Taurus): Jupiter; its virodha, the 12th (Pisces), has Venus: one against one, so it is obstructed.
assert.deepEqual(onAries[0].planets, ['Jupiter']);
assert.deepEqual(onAries[0].virodhaPlanets, ['Venus']);
assert.equal(onAries[0].status, 'obstructed');
// 4th (Cancer): nothing there, so there is no argala, whatever stands in the 10th.
assert.equal(onAries[1].status, 'none');
// 11th (Aquarius): Saturn, opposed by the Moon in the 3rd (Gemini): obstructed. With the Moon elsewhere it stands.
assert.deepEqual(onAries[2].planets, ['Saturn']);
assert.deepEqual(onAries[2].virodhaPlanets, ['Moon']);
assert.equal(onAries[2].status, 'obstructed');
assert.equal(argalaOnSign(1, planets.map(item => (item.name === 'Moon' ? { ...item, sign: 6 } : item)))[2].status, 'effective');
// 5th (Leo): Mercury; the 9th (Sagittarius) is empty, so this secondary argala stands.
assert.deepEqual(onAries[3].planets, ['Mercury']);
assert.equal(onAries[3].kind, 'secondary');
assert.equal(onAries[3].status, 'effective');

// More grahas causing the argala than opposing it: it stands. Two on Taurus (2nd from Aries) against one on Pisces.
const crowded = argalaOnSign(1, [...planets.filter(item => item.name !== 'Jupiter'), { name: 'Jupiter', sign: 2 }, { name: 'Moon', sign: 2 }]);
assert.deepEqual(crowded[0].planets.sort(), ['Jupiter', 'Moon']);
assert.equal(crowded[0].status, 'effective');
// As many opposing as causing: obstructed; more opposing: obstructed.
const evenly = argalaOnSign(1, [{ name: 'Jupiter', sign: 2 }, { name: 'Moon', sign: 2 }, { name: 'Venus', sign: 12 }, { name: 'Saturn', sign: 12 }]);
assert.equal(evenly[0].status, 'obstructed');

// The signs wrap round the zodiac: argala on Pisces (12) has the 2nd in Aries and the 11th in Capricorn.
assert.deepEqual(argalaOnSign(12, planets).map(cell => cell.sign), [1, 3, 10, 4]);

// The twelve houses from the Lagna, and one row for each graha.
const houses = argalaOnHouses(4, planets);
assert.equal(houses.length, 12);
assert.deepEqual(houses.map(row => row.sign), [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]);
assert.equal(houses[0].label, '1');
assert.deepEqual(houses[0].cells.map(cell => cell.sign), [5, 7, 2, 8], 'the 2nd, 4th, 11th and 5th from Cancer');
const grahas = argalaOnGrahas(planets);
assert.equal(grahas.length, 9);
assert.equal(grahas[0].label, 'Sun');
assert.deepEqual(grahas[0].cells, onAries, 'the Sun stands in Aries, so its argalas are those on Aries');

console.log('Argala tests passed');
