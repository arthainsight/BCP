import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { progressionsAt } from './eventProgressions';
import { calculateNadiParaya, PARAYA_BODIES } from './nadiParaya';
import { JULIAN_YEAR_MS } from '@/lib/time';

const planet = (name: string, sign: number, degree: number): PlanetData => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 1, isRetrograde: false });
// Jupiter 5° Aries, Saturn 10° Virgo, Rahu 20° Cancer (so Ketu in Capricorn); the Sun 15° Aries, the Moon 27° Sagittarius; the ascendant 2° Aries.
const chart = {
  ascendant: { sign: 1, degree: 2, longitude: 2 },
  planets: [planet('Jupiter', 1, 5), planet('Saturn', 6, 10), planet('Rahu', 4, 20), planet('Ketu', 10, 20), planet('Sun', 1, 15), planet('Moon', 9, 27)],
} as unknown as ChartData;
const birth = Date.UTC(2000, 0, 1);
const at = (years: number) => birth + years * JULIAN_YEAR_MS;

// --- Before birth there is nothing -------------------------------------------------------------------------------------------------------
assert.equal(progressionsAt({ chart, birthTime: birth, time: birth - 1, bodies: PARAYA_BODIES }), null);

// --- At birth every graha stands at its natal degree, and the houses are counted from the ascendant ------------------------------------------
{
  const rows = progressionsAt({ chart, birthTime: birth, time: birth, bodies: PARAYA_BODIES })!;
  assert.deepEqual(rows.map(row => row.body), ['Jupiter', 'Saturn', 'Rahu', 'Ketu']);
  assert.deepEqual(rows.map(row => [row.signIndex, Math.round(row.degree)]), [[0, 5], [5, 10], [3, 20], [9, 20]]);
  assert.deepEqual(rows.map(row => row.house), [1, 6, 4, 10], 'houses from the Aries ascendant');
  // Jupiter in Aries: over the Sun, itself and the ascendant (the 1st); Aries is the 5th sign from the Moon in Sagittarius.
  const jupiter = rows[0].aspects.map(aspect => [aspect.natal, aspect.relation]);
  assert.deepEqual(jupiter, [['Sun', 1], ['Moon', 5], ['Jupiter', 1], ['Asc', 1]], 'Jupiter in Aries: the 1st of the Sun, Jupiter and the ascendant, the 5th of the Moon');
}

// --- Exact within a degree of the natal degree: Jupiter at 15° Aries a third of a year on is over the Sun at 15° ------------------------------
{
  const row = progressionsAt({ chart, birthTime: birth, time: at(10 / 30), bodies: ['Jupiter'] })![0];
  const sun = row.aspects.find(aspect => aspect.natal === 'Sun')!;
  assert.ok(sun.orb < 0.1 && sun.exact, 'Jupiter at the Sun\'s degree');
  const jupiter = row.aspects.find(aspect => aspect.natal === 'Jupiter')!;
  assert.ok(Math.abs(jupiter.orb - 10) < 0.1 && !jupiter.exact, 'ten degrees past its own natal degree');
}

// --- It agrees with the Paraya calculation itself at any age, the grahas asked for only -------------------------------------------------------
for (const years of [0.7, 3.2, 14.9, 40.1]) {
  const paraya = calculateNadiParaya({ ageYears: years, natalJupiterSignIndex: 0, natalSaturnSignIndex: 5, natalRahuSignIndex: 3, natalJupiterDegree: 5, natalSaturnDegree: 10, natalRahuDegree: 20 });
  const rows = progressionsAt({ chart, birthTime: birth, time: at(years), bodies: ['Saturn', 'Ketu'] })!;
  assert.deepEqual(rows.map(row => [row.body, row.signIndex]), [['Saturn', paraya.saturn.signIndex], ['Ketu', paraya.ketu.signIndex]], `age ${years}`);
}

// --- Every kind of aspect, from the sign alone ------------------------------------------------------------------------------------------------
{
  // At 4⅓ years Jupiter has gone on to Leo (the 5th from Aries), at 6⅓ to Libra (the 7th).
  const fifth = progressionsAt({ chart, birthTime: birth, time: at(4.5), bodies: ['Jupiter'] })![0];
  assert.equal(fifth.signIndex, 4);
  assert.equal(fifth.aspects.find(aspect => aspect.natal === 'Sun')!.relation, 5);
  const seventh = progressionsAt({ chart, birthTime: birth, time: at(6.5), bodies: ['Jupiter'] })![0];
  assert.equal(seventh.signIndex, 6);
  assert.equal(seventh.aspects.find(aspect => aspect.natal === 'Sun')!.relation, 7);
}

// --- A chart without the slow grahas has no progressions ---------------------------------------------------------------------------------------
assert.deepEqual(progressionsAt({ chart: { ...chart, planets: [planet('Sun', 1, 15)] } as ChartData, birthTime: birth, time: birth, bodies: PARAYA_BODIES }), []);

console.log('Event progression tests passed');
