import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { calculateCharaKarakas } from './karakas';

function planet(name: string, degree: number): PlanetData {
  return { name, degree, longitude: degree, sign: 1, house: 1 };
}

const planets = [
  planet('Sun', 26 + 12 / 60),
  planet('Moon', 6 + 54 / 60),
  planet('Mars', 10 + 42 / 60),
  planet('Mercury', 20 + 30 / 60),
  planet('Jupiter', 3 + 48 / 60),
  planet('Venus', 10 + 36 / 60),
  planet('Saturn', 24 + 24 / 60),
  planet('Rahu', 8 + 18 / 60), // reversed: 21°42′
];

const degreeRanking = calculateCharaKarakas(planets, 'degree');
assert.equal(degreeRanking[0].planet, 'Sun');
assert.equal(degreeRanking[0].karaka, 'AK');
assert.equal(degreeRanking.at(-1)?.planet, 'Jupiter');

const minuteRanking = calculateCharaKarakas(planets, 'minute');
assert.equal(minuteRanking[0].planet, 'Moon');
assert.equal(minuteRanking[0].karaka, 'AK');
assert.equal(minuteRanking[1].planet, 'Jupiter');
assert.equal(minuteRanking[2].planet, 'Rahu'); // Mars also has 42′; full effective degree breaks the tie.
assert.equal(minuteRanking[3].planet, 'Mars');

assert.deepEqual(
  calculateCharaKarakas(planets).map((entry) => entry.planet),
  degreeRanking.map((entry) => entry.planet),
);

console.log('Chara Karaka ranking tests passed');
