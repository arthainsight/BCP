import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import {
  BHRIGU_PADA_BODIES,
  BHRIGU_PADA_CYCLES,
  calculateBhriguPadaActivations,
  calculateBhriguPadas,
  calculateBhriguProgressions,
  progressBhriguGraha,
  relationKind,
  signRelation,
} from './bhriguPadaProgression';

const planet = (name: string, sign: number): PlanetData => ({
  name,
  sign,
  degree: 12,
  longitude: (sign - 1) * 30 + 12,
  house: 1,
  isRetrograde: false,
});

const chart = {
  ascendant: { sign: 1, degree: 5, longitude: 5 },
  planets: [
    planet('Sun', 2),
    planet('Moon', 3),
    planet('Mars', 1),
    planet('Mercury', 4),
    planet('Jupiter', 5),
    planet('Venus', 6),
    planet('Saturn', 7),
    planet('Rahu', 8),
    planet('Ketu', 9),
  ],
} as unknown as ChartData;

// The Nadi Pravesika Appendix 3 example for Nehru at age 57 years 10 months.
// The listed position is counted from each graha's own natal sign.
{
  const age = 57 + 10 / 12;
  const expected: [string, number][] = [
    ['Sun', 1],
    ['Moon', 4],
    ['Mars', 2],
    ['Mercury', 4],
    ['Jupiter', 9],
    ['Venus', 2],
    ['Saturn', 12],
    ['Rahu', 8],
  ];
  for (const [body, house] of expected) {
    const cycle = BHRIGU_PADA_CYCLES['nadi-praveshika-8'][body];
    const result = progressBhriguGraha({
      body,
      natalSign: 1,
      ageYears: age,
      version: 'nadi-praveshika-8',
    });
    assert.ok(result);
    assert.equal(result.houseFromNatal, house, String(body) + ' position from natal sign');
    assert.equal(result.cycleYears, cycle);
  }
}

// At birth every available graha remains in its natal sign.
for (const version of ['sundaram-7', 'nadi-praveshika-8'] as const) {
  const rows = calculateBhriguProgressions(chart, 0, version);
  assert.deepEqual(rows.map(row => row.body), BHRIGU_PADA_BODIES[version]);
  assert.ok(rows.every(row => row.houseFromNatal === 1));
  assert.equal(rows.find(row => row.body === 'Sun')?.sign, 2);
}

// The first Sun sign change is after 19/12 years; the next sign starts at that boundary.
{
  const before = progressBhriguGraha({ body: 'Sun', natalSign: 2, ageYears: 19 / 12 - 0.0001, version: 'sundaram-7' });
  const after = progressBhriguGraha({ body: 'Sun', natalSign: 2, ageYears: 19 / 12, version: 'sundaram-7' });
  assert.equal(before?.sign, 2);
  assert.equal(after?.sign, 3);
}

// The versions remain different: Saturn's complete round and Rahu's inclusion.
assert.equal(BHRIGU_PADA_CYCLES['sundaram-7'].Saturn, 30);
assert.equal(BHRIGU_PADA_CYCLES['nadi-praveshika-8'].Saturn, 29);
assert.equal(BHRIGU_PADA_CYCLES['nadi-praveshika-8'].Rahu, 93);
assert.equal(BHRIGU_PADA_CYCLES['sundaram-7'].Rahu, undefined);

// The 2019 version does not apply the standard same-sign Arudha exception.
// In the 7-graha version, Mars in Aries gives Aries AL the 10th (Capricorn).
{
  const oldPadas = calculateBhriguPadas(chart, 'sundaram-7');
  const newPadas = calculateBhriguPadas(chart, 'nadi-praveshika-8');
  assert.equal(oldPadas.find(pada => pada.house === 1)?.sign, 10);
  assert.equal(newPadas.find(pada => pada.house === 1)?.sign, 1);
  assert.equal(oldPadas.length, 12);
  assert.equal(newPadas.length, 12);
}

// A pada's lord progression is related to its own Arudha sign by inclusive sign count.
{
  assert.equal(signRelation(1, 1), 1);
  assert.equal(signRelation(1, 4), 4);
  assert.equal(relationKind(1), 'same');
  assert.equal(relationKind(4), 'kendra');
  assert.equal(relationKind(7), 'kendra');
  assert.equal(relationKind(10), 'kendra');
  assert.equal(relationKind(5), 'trikona');
  assert.equal(relationKind(9), 'trikona');
  assert.equal(relationKind(2), 'other');

  const padas = calculateBhriguPadas(chart, 'nadi-praveshika-8');
  const progressions = calculateBhriguProgressions(chart, 57 + 10 / 12, 'nadi-praveshika-8');
  const activations = calculateBhriguPadaActivations(padas, progressions);
  assert.equal(activations.length, 12);
  assert.ok(activations.every(item => item.pada.lord === progressions.find(row => row.body === item.pada.lord)?.body));
}

// Invalid ages and signs do not yield positions.
assert.equal(progressBhriguGraha({ body: 'Sun', natalSign: 1, ageYears: -1, version: 'sundaram-7' }), null);
assert.equal(progressBhriguGraha({ body: 'Sun', natalSign: 13, ageYears: 10, version: 'sundaram-7' }), null);
assert.equal(calculateBhriguProgressions(chart, Number.NaN, 'sundaram-7').length, 0);

console.log('Bhrigu Pada progression tests passed');
