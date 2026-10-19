import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import { calculateBnnHouses, calculateParayaHouses } from './bnnHouses';
import { calculateJupiterianRounds } from './jupiterianRounds';
import { calculateMinorProgression } from './jupiterMinorProgression';
import { calculateBetaParaya, calculateNadiParaya } from './nadiParaya';

const planet = (name: string, sign: number, degree = 10, isRetrograde = false): PlanetData =>
  ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 0, isRetrograde });

function chart(ascendantSign: number): ChartData {
  return {
    ascendant: { sign: ascendantSign, degree: 12, longitude: (ascendantSign - 1) * 30 + 12 },
    planets: [planet('Sun', 1), planet('Moon', 4), planet('Jupiter', 2, 4.3), planet('Saturn', 8), planet('Rahu', 12), planet('Ketu', 6)],
  };
}

assert.deepEqual(calculateBnnHouses(null, 30), { major: 0, minor: 0 });
assert.deepEqual(calculateParayaHouses(null, 30), []);
assert.deepEqual(calculateBnnHouses({ ...chart(1), planets: [] }, 30), { major: 0, minor: 0 });

// Houses agree with the underlying progressions, counted from the ascendant.
for (const age of [0, 5.5, 23, 47.9]) {
  for (const asc of [1, 6, 12]) {
    const c = chart(asc);
    const rounds = calculateJupiterianRounds({ natalJupiterSignIndex: 1, natalJupiterDegree: 4.3, ageYears: age });
    const minor = calculateMinorProgression({ natalJupiterSignIndex: 1, ageYears: age, planets: c.planets.map(p => ({ name: p.name, signIndex: p.sign - 1 })) });
    const house = (signIndex: number) => ((signIndex - (asc - 1) + 12) % 12) + 1;
    assert.deepEqual(calculateBnnHouses(c, age), {
      major: rounds.currentRound ? house(rounds.currentRound.activeSignIndex) : 0,
      minor: house(minor.minorSignIndex),
    });

    const paraya = calculateNadiParaya({ ageYears: age, natalJupiterSignIndex: 1, natalSaturnSignIndex: 7, natalRahuSignIndex: 11 });
    assert.deepEqual(
      calculateParayaHouses(c, age),
      [paraya.jupiter, paraya.saturn, paraya.rahu, paraya.ketu].map(p => ({ body: p.body, house: house(p.signIndex), degree: p.degree })),
    );
  }
}

// Turning the chart by one sign moves every house back by one.
const a = calculateBnnHouses(chart(1), 23);
const b = calculateBnnHouses(chart(2), 23);
assert.equal(b.minor, ((a.minor - 2 + 12) % 12) + 1);

// The Paraya houses follow the speed options: at 3 years alternating Saturn has moved to its 2nd sign,
// while at 2.5 years per sign it is already in its 2nd sign at 2.5 and its 3rd at 5.
const saturnHouse = (age: number, saturn: 'alternating' | 'even') =>
  calculateParayaHouses(chart(1), age, { saturn, rahu: 'alternating' }).find(h => h.body === 'Saturn')?.house;
assert.equal(saturnHouse(2.6, 'alternating'), 8, 'alternating: still in the natal sign (3 years) at 2.6');
assert.equal(saturnHouse(2.6, 'even'), 9, 'even: already in the next sign (2.5 years) at 2.6');
assert.equal(saturnHouse(2.6, 'alternating'), calculateParayaHouses(chart(1), 2.6).find(h => h.body === 'Saturn')?.house, 'alternating is the default');
const rahuHouse = (age: number, rahu: 'alternating' | 'even') =>
  calculateParayaHouses(chart(1), age, { saturn: 'alternating', rahu }).find(h => h.body === 'Rahu')?.house;
assert.equal(rahuHouse(1.6, 'alternating'), 12, 'alternating: still in the natal sign (2 years) at 1.6');
assert.equal(rahuHouse(1.6, 'even'), 11, 'even: has gone back a sign (1.5 years) at 1.6');

// The beta grahas follow the four when they are asked for, in the houses of their own signs.
{
  const c = { ...chart(1), planets: [...chart(1).planets, planet('Mars', 3, 8), planet('Mercury', 1, 2, true), planet('Venus', 12, 25)] };
  assert.equal(calculateParayaHouses(c, 5).length, 4, 'four to begin with');
  const withBeta = calculateParayaHouses(c, 1.3, undefined, true);
  assert.deepEqual(withBeta.map(activation => activation.body), ['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Mars', 'Mercury', 'Venus']);
  const expected = calculateBetaParaya({ ageYears: 1.3, natal: { Mars: { signIndex: 2 }, Mercury: { signIndex: 0, retrograde: true }, Venus: { signIndex: 11 } } });
  assert.deepEqual(withBeta.slice(4), expected.map(period => ({ body: period.body, house: ((period.signIndex - 0 + 12) % 12) + 1, degree: period.degree })));
  // A chart without the three has just the four, whatever is asked.
  assert.equal(calculateParayaHouses(chart(1), 5, undefined, true).length, 4);
}
