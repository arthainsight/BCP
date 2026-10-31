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
for (const system of ['narayana', 'moola', 'sthira'] as const) assert.equal(validateRasiDashaRegression(system)?.passed, true);
assert.ok((validateRasiDashaRegression('moola')?.checks ?? 0) >= 18);
for (const system of ['yogardha', 'drig', 'trikona', 'shula', 'mandooka'] as const) assert.equal(validateRasiDashaRegression(system), null, `${system} is the text's only: nothing of PyJHora to compare`);
console.log('Rasi Dasha tests passed');

// --- The Mūla by the Kendrādi rāśi daśā of the Jaimini Sūtras (2.4.11–14), the default; the PyJHora way is the other choice ---------------------
{
  const text = calculateRasiDasha('moola', planets, 4, birth);
  assert.match(text.method, /Jaimini Sūtras 2\.4\.11–14/);
  assert.equal(text.entries.length, 12, 'one round of twelve signs');
  assert.equal(new Set(text.entries.map(entry => entry.sign)).size, 12);
  assert.ok(text.basis.startsWith('Ātmakāraka'), 'from the Ātmakāraka');
  assert.equal(text.entries[0].sign, text.seedSign);
  assert.ok(text.entries.every(entry => Number.isInteger(entry.durationYears) && entry.durationYears >= 1 && entry.durationYears <= 13), 'the Chara years');
  // The sub-periods begin with the sign itself and take the angles next.
  const children = calculateRasiSubDashas(text.entries[0], planets, 'moola').map(child => child.sign);
  assert.equal(children[0], text.entries[0].sign);
  assert.deepEqual([...children.slice(1, 4)].sort((a, b) => a - b), [3, 6, 9].map(step => (text.entries[0].sign + (text.entries[0].sign % 2 === 0 ? step : 12 - step)) % 12).sort((a, b) => a - b));
  const pyjhora = calculateRasiDasha('moola', planets, 4, birth, { narayanaSeed: 'stronger-lagna-seventh', moolaSeed: 'stronger-lagna-seventh', sthiraMethod: 'jaimini', moolaMethod: 'pyjhora' });
  assert.match(pyjhora.method, /PVR\/JHora/);
  assert.ok(pyjhora.entries.length > 12, 'the two rounds of PVR');
}

// --- The other Jaimini rāśi daśās (2.4.19–25, 2.3.18–25) -------------------------------------------------------------------------------------------
for (const system of ['yogardha', 'drig', 'trikona', 'shula', 'mandooka'] as const) {
  const result = calculateRasiDasha(system, planets, 4, birth);
  assert.ok(result.entries.length >= 10 && result.entries.length <= 12, system);
  assert.equal(result.entries[0].startDate.getTime(), birth.getTime());
  for (let i = 1; i < result.entries.length; i++) assert.equal(result.entries[i - 1].endDate.getTime(), result.entries[i].startDate.getTime());
  const children = calculateRasiSubDashas(result.entries[0], planets, system);
  assert.equal(children.length, 12, system);
  assert.equal(children[0].startDate.getTime(), result.entries[0].startDate.getTime());
  assert.ok(Math.abs(children.reduce((sum, child) => sum + child.durationYears, 0) - result.entries[0].durationYears) < 1e-9, system);
}
{
  const yogardha = calculateRasiDasha('yogardha', planets, 4, birth);
  assert.ok(yogardha.entries.every(entry => entry.durationYears * 2 === Math.round(entry.durationYears * 2)), 'half years');
  const drig = calculateRasiDasha('drig', planets, 4, birth);
  assert.ok(drig.entries.every(entry => [7, 8, 9].includes(entry.durationYears)), 'Sthira years');
  assert.equal(drig.entries[0].sign, 11, 'Cancer rising: the 9th is Pisces');
  const shula = calculateRasiDasha('shula', planets, 4, birth, { narayanaSeed: 'stronger-lagna-seventh', moolaSeed: 'stronger-lagna-seventh', sthiraMethod: 'jaimini', shulaFor: 'father' });
  assert.match(shula.method, /father/);
  assert.ok(shula.audit.some(line => line.startsWith('Read for: father (the 9th)')));
}

// --- Śūla: the Chara years of the commentary and the Maṇḍūka sub-periods (2.4.15–16); the Sthira years of BPHS 46.182 are the other choice ---------------
{
  const shula = calculateRasiDasha('shula', planets, 4, birth);
  assert.ok(shula.audit.some(line => line.startsWith('Years: as in the Chara daśā')));
  const sthira = calculateRasiDasha('shula', planets, 4, birth, { narayanaSeed: 'stronger-lagna-seventh', moolaSeed: 'stronger-lagna-seventh', sthiraMethod: 'jaimini', shulaYears: 'sthira' });
  assert.ok(sthira.entries.every(entry => [7, 8, 9].includes(entry.durationYears)), 'the Sthira years');
  assert.deepEqual(sthira.entries.map(entry => entry.sign), shula.entries.map(entry => entry.sign), 'the order is the same');
  // The sub-periods run through the angles first, in jumps of three signs, from the stronger of the sign and its 7th.
  const first = shula.entries[0];
  const children = calculateRasiSubDashas(first, planets, 'shula').map(child => child.sign);
  assert.equal(new Set(children).size, 12);
  const step = (children[1] - children[0] + 12) % 12;
  assert.ok(step === 3 || step === 9, 'a jump of three signs');
  assert.equal((children[2] - children[1] + 12) % 12, step);
}
// --- Maṇḍūka (Trikūṭa, BPHS 46.179–180): the Sthira years, the angles first -------------------------------------------------------------------------------
{
  const mandooka = calculateRasiDasha('mandooka', planets, 4, birth);
  assert.match(mandooka.method, /BPHS 46\.179–180/);
  assert.ok(mandooka.entries.every(entry => [7, 8, 9].includes(entry.durationYears)), 'the Sthira years');
  assert.equal(mandooka.entries.length, 12);
  const jump = (mandooka.entries[1].sign - mandooka.entries[0].sign + 12) % 12;
  assert.ok(jump === 3 || jump === 9, 'the frog jumps three signs');
  assert.equal(mandooka.entries[0].sign, mandooka.seedSign);
}
