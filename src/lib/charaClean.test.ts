import assert from 'node:assert/strict';
import { DEFAULT_DASHA_SETTINGS, type PlanetData } from '@/types';
import { calculateCleanCharaMD, calculateCleanCharaSubDashas } from './charaClean';

const planets: PlanetData[] = [
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
const settings = DEFAULT_DASHA_SETTINGS.charaOptions;
const result = calculateCleanCharaMD(planets, 4, new Date(2000, 0, 1), settings);
assert.ok(result);
assert.equal(result.startSign, 4);
assert.equal(result.entries.length, 12);

const children = calculateCleanCharaSubDashas(result.entries[0], settings);
assert.equal(children.length, 12);
assert.ok(Math.abs(children.reduce((sum, entry) => sum + entry.durationYears, 0) - result.entries[0].durationYears) < 1e-10);
assert.equal(children[0].sign, 5); // Movable Cancer starts forward with the next sign, Leo.

console.log('Chara Daśā tests passed');
