import assert from 'node:assert/strict';
import { calculateAshtottari, calculateAshtottariSubDashas, evaluateAshtottariEligibility } from './ashtottari';

const birth = new Date(2000, 0, 1);
const cases: Array<[number, string, string]> = [
  [70, 'Ardra', 'Sun'],
  [120, 'Magha', 'Moon'],
  [160, 'Hasta', 'Mars'],
  [220, 'Anuradha', 'Mercury'],
  [260, 'Purva Ashadha', 'Saturn'],
  [300, 'Dhanishta', 'Jupiter'],
  [340, 'Uttara Bhadrapada', 'Rahu'],
  [30, 'Krittika', 'Venus'],
  [278, 'Abhijit', 'Saturn'],
];

for (const [longitude, nakshatra, lord] of cases) {
  const result = calculateAshtottari(longitude, birth);
  assert.equal(result.nakshatra, nakshatra);
  assert.equal(result.startLord, lord);
}

const ardra = calculateAshtottari(70, birth);
const children = calculateAshtottariSubDashas(ardra.entries[0]);
assert.equal(children.length, 8);
assert.equal(children[0].lord, 'Sun');
assert.ok(Math.abs(children.reduce((sum, entry) => sum + entry.durationYears, 0) - ardra.entries[0].durationYears) < 1e-10);
assert.ok(ardra.entries.at(-1)!.endDate.getFullYear() >= 2120);

const eligible = evaluateAshtottariEligibility([
  { name: 'Moon', sign: 3 }, { name: 'Rahu', sign: 12 },
], 4);
assert.equal(eligible.lagnaLord, 'Moon');
assert.equal(eligible.relativeHouse, 10);
assert.equal(eligible.eligible, true);

const rahuInLagna = evaluateAshtottariEligibility([
  { name: 'Moon', sign: 3 }, { name: 'Rahu', sign: 4 },
], 4);
assert.equal(rahuInLagna.eligible, false);

const outsideKendraTrikona = evaluateAshtottariEligibility([
  { name: 'Mercury', sign: 3 }, { name: 'Rahu', sign: 4 },
], 3);
assert.equal(outsideKendraTrikona.relativeHouse, 2);
assert.equal(outsideKendraTrikona.eligible, false);

console.log('Aṣṭottarī Daśā tests passed');
