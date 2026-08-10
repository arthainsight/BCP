import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { calculateSahams } from './sahams';

const positions: Record<string, number> = { Sun: 10, Moon: 40, Mars: 80, Mercury: 110, Jupiter: 140, Venus: 170, Saturn: 200, Rahu: 230, Ketu: 50 };
const planets: PlanetData[] = Object.entries(positions).map(([name, longitude]) => ({ name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, house: Math.floor(longitude / 30) + 1 }));
const chart: ChartData = {
  ascendant: { longitude: 0, sign: 1, degree: 0 }, planets,
  debug: { julianDay: 2451545, ayanamsa: 24, utcOffset: 0, ascendantDegree: 0, ascendantSign: 1, ephemerisEngine: 'test', inputDateTime: '2000-03-20T12:00', latitude: 0, longitude: 0 },
};

const day = calculateSahams(chart, '2000-03-20T12:00');
assert.equal(day.night, false);
assert.equal(day.rows.length, 36);
assert.equal(day.rows.find((row) => row.key === 'punya')?.longitude, 60);
assert.equal(day.rows.find((row) => row.key === 'vidya')?.longitude, 330);
assert.equal(day.rows.find((row) => row.key === 'rajya')?.longitude, day.rows.find((row) => row.key === 'pitri')?.longitude);
assert.equal(day.rows.find((row) => row.key === 'vyapara')?.longitude, 240);

const night = calculateSahams(chart, '2000-03-20T00:00');
assert.equal(night.night, true);
assert.equal(night.rows.find((row) => row.key === 'punya')?.longitude, 330);
assert.notEqual(night.rows.find((row) => row.key === 'satru')?.longitude, day.rows.find((row) => row.key === 'satru')?.longitude);
assert.equal(night.rows.find((row) => row.key === 'vyapara')?.longitude, day.rows.find((row) => row.key === 'vyapara')?.longitude);

console.log('Saham tests passed');