import assert from 'node:assert/strict';
import { analyzeIncomeYears, compareIncomeYearPatterns } from './incomeYearAnalysis';

const income = [
  { year: 2015, amount: 10000 },
  { year: 2016, amount: 11000 },
  { year: 2017, amount: 12000 },
  { year: 2018, amount: 24000 },
  { year: 2019, amount: 3000 },
  { year: 2020, amount: 6000 },
  { year: 2021, amount: 100000, isPartial: true },
];
const analysis = analyzeIncomeYears(income);
assert.equal(analysis[0].status, 'insufficient');
assert.equal(analysis[3].status, 'excellent');
assert.equal(analysis[4].status, 'very-weak');
assert.equal(analysis[6].status, 'partial');
assert.equal(analysis[6].ratio, null);
assert.equal(analysis[3].baselineSampleSize, 3);

const years = [
  { ...analysis[3] },
  { ...analysis[4] },
  { ...analysis[5] },
];
const patterns = compareIncomeYearPatterns(years, [
  { year: 2018, body: 'Jupiter', house: 11, houseFromNatal: 4, dictums: [23] },
  { year: 2019, body: 'Saturn', house: 8, houseFromNatal: 2, dictums: [7] },
  { year: 2020, body: 'Saturn', house: 8, houseFromNatal: 2, dictums: [7] },
]);
assert.ok(patterns.some(pattern => pattern.label === 'Jupiter in house 11 from Lagna' && pattern.goodCount === 1));
assert.ok(patterns.some(pattern => pattern.label === 'Nāḍī Praveśikā D7' && pattern.badCount === 2));
