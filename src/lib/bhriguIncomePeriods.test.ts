import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { calculateBhriguIncomePeriods } from './bhriguIncomePeriods';

const planet = (name: string, sign: number): PlanetData => ({
  name, sign, degree: 10, longitude: (sign - 1) * 30 + 10, house: 1, isRetrograde: false,
});

// Aries Lagna: 2L Venus (Taurus), 11L Saturn (Aquarius).
const chart = {
  ascendant: { sign: 1, degree: 0, longitude: 0 },
  planets: [
    planet('Sun', 1), planet('Moon', 2), planet('Mars', 3), planet('Mercury', 4),
    planet('Jupiter', 5), planet('Venus', 6), planet('Saturn', 7), planet('Rahu', 8),
    planet('Ketu', 9),
  ],
} as unknown as ChartData;

const birth = new Date(1987, 9, 13, 0, 15);
const periods = calculateBhriguIncomePeriods(chart, birth, 80);
assert.ok(periods.length > 0);
assert.ok(periods.every(period => period.roles.length > 0));
assert.ok(periods.every(period => period.startDate >= birth));
assert.ok(periods.every(period => period.endDate > period.startDate));
assert.ok(periods.every(period => period.endAge <= 80 + 1e-8));
assert.ok(periods.every(period => period.adTargets.length > 0 || period.pdTargets.length > 0));
assert.ok(periods.every(period => period.priority === (period.adIn11th ? 4 : period.pdIn11th ? 3 : period.adTargets.length ? 2 : 1)));

// MD stays at Venus's natal sign; the first AD and PD also begin there.
const venusFirst = periods.find(period => period.body === 'Venus' && period.startAge === 0);
assert.ok(venusFirst);
assert.equal(venusFirst.mdSign, 6);
assert.equal(venusFirst.adSign, 6);
assert.equal(venusFirst.pdSign, 6);

console.log('Bhṛgu Pada income AD–PD tests passed');
