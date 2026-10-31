import assert from 'node:assert/strict';
import { calculateRasiDasha, calculateRasiSubDashas } from './rasiDashas';
import { validateRasiDashaRegression } from './rasiDashaValidation';

const planets = [
  { name: 'Sun', sign: 6, house: 3, degree: 20, longitude: 170 },
  { name: 'Moon', sign: 3, house: 12, degree: 6, longitude: 66 },
  { name: 'Mars', sign: 6, house: 3, degree: 10, longitude: 160 },
  { name: 'Mercury', sign: 7, house: 4, degree: 20, longitude: 200 },
  { name: 'Jupiter', sign: 1, house: 10, degree: 3, longitude: 3 },
  { name: 'Venus', sign: 7, house: 4, degree: 10, longitude: 190 },
  { name: 'Saturn', sign: 8, house: 5, degree: 24, longitude: 234 },
  { name: 'Rahu', sign: 12, house: 9, degree: 8, longitude: 338 },
  { name: 'Ketu', sign: 6, house: 3, degree: 8, longitude: 158 },
];
const birth = new Date(2000, 0, 1, 10);

for (const system of ['narayana', 'moola', 'sthira'] as const) {
  const result = calculateRasiDasha(system, planets, 4, birth);
  assert.ok(result.entries.length >= 12);
  assert.equal(result.entries[0].startDate.getTime(), birth.getTime());
  for (let i = 1; i < result.entries.length; i++) assert.equal(result.entries[i - 1].endDate.getTime(), result.entries[i].startDate.getTime());
  const children = calculateRasiSubDashas(result.entries[0], planets, system);
  assert.equal(children.length, 12);
  assert.equal(children[0].startDate.getTime(), result.entries[0].startDate.getTime());
  assert.ok(Math.abs(children.reduce((sum, child) => sum + child.durationYears, 0) - result.entries[0].durationYears) < 1e-9);
}
const sthira = calculateRasiDasha('sthira', planets, 4, birth);
assert.deepEqual(sthira.entries.map(entry => entry.durationYears).sort(), [7,7,7,7,8,8,8,8,9,9,9,9]);
const lagnaSeed = calculateRasiDasha('narayana', planets, 4, birth, { narayanaSeed: 'lagna', moolaSeed: 'stronger-lagna-seventh', sthiraMethod: 'brahma-pvr' });
assert.equal(lagnaSeed.seedSign, 3);
assert.match(lagnaSeed.method, /research variant/);
assert.match(lagnaSeed.basis, /^Lagna:/);
// Sthira by the Jaimini Sūtras (2.3.1–4): from the sign of Brahma, direct if the sign is odd, reverse if even; the sub-periods of an odd sign from the
// sign itself, of an even sign from its 7th in reverse.
const jaiminiSthira = calculateRasiDasha('sthira', planets, 4, birth);
const pvrSthira = calculateRasiDasha('sthira', planets, 4, birth, { narayanaSeed: 'stronger-lagna-seventh', moolaSeed: 'stronger-lagna-seventh', sthiraMethod: 'brahma-pvr' });
assert.equal(jaiminiSthira.seedSign, pvrSthira.seedSign, 'both start from the sign of Brahma');
const seedSign = jaiminiSthira.seedSign;
const direction = seedSign % 2 === 1 ? -1 : 1;
assert.deepEqual(jaiminiSthira.entries.map(entry => entry.sign), Array.from({ length: 12 }, (_, index) => (((seedSign + direction * index) % 12) + 12) % 12));
assert.deepEqual(pvrSthira.entries.map(entry => entry.sign), Array.from({ length: 12 }, (_, index) => (seedSign + index) % 12), 'the other convention always runs forward');
for (const entry of jaiminiSthira.entries.slice(0, 3)) {
  const children = calculateRasiSubDashas(entry, planets, 'sthira').map(child => child.sign);
  const expected = entry.sign % 2 === 1
    ? Array.from({ length: 12 }, (_, index) => (((entry.sign + 6 - index) % 12) + 12) % 12)
    : Array.from({ length: 12 }, (_, index) => (entry.sign + index) % 12);
  assert.deepEqual(children, expected, `sub-periods of ${entry.signName}`);
}
for (const system of ['narayana', 'moola', 'sthira'] as const) assert.equal(validateRasiDashaRegression(system).passed, true);
assert.ok(validateRasiDashaRegression('moola').checks >= 18);
console.log('Rasi Dasha tests passed');
