import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { calculateAvasthas, calculateBaladi, calculateJagratadi } from './avasthas';

function planet(sign: number, degree: number): PlanetData {
  return { name: 'Mars', sign, degree, longitude: (sign - 1) * 30 + degree, house: 1 };
}

assert.equal(calculateBaladi(planet(1, 2)).value, 'Bāla');
assert.equal(calculateBaladi(planet(2, 2)).value, 'Mṛta');
assert.equal(calculateBaladi(planet(1, 28)).value, 'Mṛta');
assert.equal(calculateBaladi(planet(2, 28)).value, 'Bāla');
assert.equal(calculateJagratadi(planet(1, 5)).value, 'Jāgrat');
assert.equal(calculateJagratadi(planet(2, 5)).value, 'Suṣupta');

const planets: PlanetData[] = [
  { name: 'Sun', sign: 1, degree: 10, longitude: 10, house: 1 },
  { name: 'Moon', sign: 2, degree: 10, longitude: 40, house: 2 },
  { name: 'Mars', sign: 10, degree: 10, longitude: 280, house: 10 },
  { name: 'Mercury', sign: 1, degree: 12, longitude: 12, house: 1 },
  { name: 'Jupiter', sign: 9, degree: 10, longitude: 250, house: 9 },
  { name: 'Venus', sign: 12, degree: 10, longitude: 340, house: 12 },
  { name: 'Saturn', sign: 1, degree: 20, longitude: 20, house: 1 },
  { name: 'Rahu', sign: 5, degree: 5, longitude: 125, house: 5 },
  { name: 'Ketu', sign: 11, degree: 5, longitude: 305, house: 11 },
];
const chart: ChartData = {
  ascendant: { sign: 1, degree: 0, longitude: 0 }, planets,
  debug: { julianDay: 2451545, ayanamsa: 24, utcOffset: 2, ascendantDegree: 0, ascendantSign: 1, ephemerisEngine: 'test', inputDateTime: '2000-01-01T12:00', latitude: 60, longitude: 25 },
};
const results = calculateAvasthas(chart, '2000-01-01T12:00');
assert.equal(results.find((row) => row.planet === 'Sun')?.deeptadi, 'Dīpta');
assert.equal(results.find((row) => row.planet === 'Mars')?.deeptadi, 'Dīpta');
assert.equal(results.find((row) => row.planet === 'Mercury')?.deeptadi, 'Vikala');
assert.notEqual(results.find((row) => row.planet === 'Jupiter')?.sayanadi, '—');

console.log('Planetary Avastha tests passed');