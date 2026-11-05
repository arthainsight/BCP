import assert from 'node:assert/strict';
import { NADI_PRAVESIKA_FINANCIAL_DICTUMS, applicableFinancialDictums } from './nadiPraveshikaDictums';
import type { BhriguGrahaProgression, BhriguPada } from './bhriguPadaProgression';

assert.equal(NADI_PRAVESIKA_FINANCIAL_DICTUMS.length, 23);
assert.deepEqual(NADI_PRAVESIKA_FINANCIAL_DICTUMS.map(rule => rule.number), Array.from({ length: 23 }, (_, i) => i + 1));
assert.equal(NADI_PRAVESIKA_FINANCIAL_DICTUMS.find(rule => rule.number === 23)?.page, 221);

const padas: BhriguPada[] = [
  { house: 1, name: 'AL', houseSign: 1, sign: 4, lord: 'Mars' },
  { house: 2, name: 'A2', houseSign: 2, sign: 5, lord: 'Venus' },
  { house: 8, name: 'A8', houseSign: 8, sign: 9, lord: 'Saturn' },
  ...Array.from({ length: 9 }, (_, i) => ({ house: i + 3, name: 'A' + (i + 3), houseSign: i + 3, sign: i + 3, lord: 'Mars' })).filter(p => p.house !== 8),
];
const progression = { body: 'Saturn', cycleYears: 29, totalSteps: 3, houseFromNatal: 4, natalSign: 2, sign: 5, houseFromLagna: 11 } satisfies BhriguGrahaProgression;
const flags = applicableFinancialDictums(progression, 40, padas);
assert.ok(flags.includes(1));
assert.ok(flags.includes(23));
assert.ok(flags.includes(6));
const saturn58 = { ...progression, houseFromNatal: 7, houseFromLagna: 8 };
assert.ok(applicableFinancialDictums(saturn58, 58.5, padas).includes(2));
assert.ok(applicableFinancialDictums(saturn58, 58.5, padas).includes(15));