import assert from 'node:assert/strict';
import { ASHTOTTARI_DEFINITIONS, calculateAshtottari, calculateAshtottariSubDashas, evaluateAshtottariEligibility } from './ashtottari';

const birth = new Date(2000, 0, 1);
const cases: Array<[number, string, string]> = [
  [70, 'Ardra', 'Sun'],
  [120, 'Magha', 'Moon'],
  [160, 'Hasta', 'Mars'],
  [220, 'Anuradha', 'Mercury'],
  [260, 'Purva Ashadha', 'Saturn'],
  [300, 'Dhanishtha', 'Jupiter'],
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
// Ardra holds the balance of a period, so its sub-periods are those of the whole period less the ones over before birth.
const whole = ardra.entries[0].fullDurationYears;
assert.ok(whole !== undefined && whole > ardra.entries[0].durationYears, 'the balance at birth is cut short');
assert.ok(children.length >= 1 && children.length <= 8);
assert.equal(children[0].startDate.getTime(), ardra.entries[0].startDate.getTime());
assert.ok(Math.abs(children.reduce((sum, entry) => sum + entry.durationYears, 0) - ardra.entries[0].durationYears) < 1e-10);
assert.ok(Math.abs(children.at(-1)!.endDate.getTime() - ardra.entries[0].endDate.getTime()) < 2);
for (const entry of children.slice(1)) {
  const years = ASHTOTTARI_DEFINITIONS.find(definition => definition.key === entry.key)!.years;
  assert.ok(Math.abs(entry.durationYears - (whole * years) / 108) < 1e-10, `${entry.name} runs its whole share of the whole period`);
}
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
