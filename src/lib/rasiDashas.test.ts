import assert from 'node:assert/strict';
import { calculateRasiDasha, calculateRasiSubDashas } from './rasiDashas';

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
console.log('Rasi Dasha tests passed');
