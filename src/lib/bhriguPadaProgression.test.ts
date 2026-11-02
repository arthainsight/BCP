import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import {
  BHRIGU_PADA_BODIES,
  BHRIGU_PADA_CYCLES,
  calculateBhriguPadaActivations,
  calculateBhriguPadaAntardashas,
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

// The 2019 version does not apply any Arudha kendra exceptions.
// The seven-graha Vaani/Sundaram rule shifts every raw pada in a kendra
// (1st, 4th, 7th or 10th from the house) to the 10th from that pada.
{
  const oldPadas = calculateBhriguPadas(chart, 'sundaram-7');
  const newPadas = calculateBhriguPadas(chart, 'nadi-praveshika-8');
  assert.equal(oldPadas.find(pada => pada.house === 1)?.sign, 10);
  assert.equal(newPadas.find(pada => pada.house === 1)?.sign, 1);
  assert.equal(oldPadas.length, 12);
  assert.equal(newPadas.length, 12);

  for (const [marsSign, expectedOldPada, expected2019Pada] of [
    [1, 10, 1], [4, 4, 7], [7, 10, 1], [10, 4, 7],
  ] as const) {
    const varied = {
      ...chart,
      planets: chart.planets.map(item => item.name === 'Mars' ? { ...item, sign: marsSign } : item),
    } as ChartData;
    assert.equal(
      calculateBhriguPadas(varied, 'sundaram-7').find(pada => pada.house === 1)?.sign,
      expectedOldPada,
      'Kendra exception when the Lagna lord Mars is in sign ' + marsSign,
    );
    assert.equal(
      calculateBhriguPadas(varied, 'nadi-praveshika-8').find(pada => pada.house === 1)?.sign,
      expected2019Pada,
      'No kendra correction in the 2019 version when Mars is in sign ' + marsSign,
    );
  }
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

// Antardashas split each major sign-period into twelve equal sign-based sub-periods.
{
  const age = 57 + 10 / 12;
  const jupiter = progressBhriguGraha({
    body: 'Jupiter',
    natalSign: 1,
    ageYears: age,
    version: 'nadi-praveshika-8',
  });
  assert.ok(jupiter);
  const current = calculateBhriguPadaAntardashas([jupiter], age)[0];
  assert.ok(current);
  assert.equal(current.mahaDashaNumber, 9);
  assert.equal(current.mahaDashaSign, 9);
  assert.equal(current.antardashaNumber, 5);
  assert.equal(current.antardashaSign, 1);
  assert.equal(current.antardashaDurationYears, 83 / 144);
  assert.ok(Math.abs(current.startAgeYears - (100 * 83) / 144) < 1e-9);
  assert.ok(Math.abs(current.endAgeYears - (101 * 83) / 144) < 1e-9);

  const subPeriod = 83 / 144;
  const beforeBoundary = progressBhriguGraha({ body: 'Jupiter', natalSign: 1, ageYears: subPeriod - 1e-8, version: 'nadi-praveshika-8' });
  const atBoundary = progressBhriguGraha({ body: 'Jupiter', natalSign: 1, ageYears: subPeriod, version: 'nadi-praveshika-8' });
  assert.ok(beforeBoundary && atBoundary);
  assert.equal(calculateBhriguPadaAntardashas([beforeBoundary], subPeriod - 1e-8)[0].antardashaNumber, 1);
  assert.equal(calculateBhriguPadaAntardashas([atBoundary], subPeriod)[0].antardashaNumber, 2);

  // At a new major sign-period, antardasha numbering resets to 1 and starts
  // from the new major-period sign.
  const nextMahaAge = 83 / 12;
  const nextMaha = progressBhriguGraha({ body: 'Jupiter', natalSign: 1, ageYears: nextMahaAge, version: 'nadi-praveshika-8' });
  assert.ok(nextMaha);
  const nextMahaAntardasha = calculateBhriguPadaAntardashas([nextMaha], nextMahaAge)[0];
  assert.equal(nextMahaAntardasha.mahaDashaNumber, 2);
  assert.equal(nextMahaAntardasha.antardashaNumber, 1);
  assert.equal(nextMahaAntardasha.mahaDashaSign, 2);
  assert.equal(nextMahaAntardasha.antardashaSign, 2);

  const atBirth = progressBhriguGraha({ body: 'Rahu', natalSign: 8, ageYears: 0, version: 'nadi-praveshika-8' });
  assert.ok(atBirth);
  const firstRahuAntardasha = calculateBhriguPadaAntardashas([atBirth], 0)[0];
  assert.equal(firstRahuAntardasha.antardashaNumber, 1);
  assert.equal(firstRahuAntardasha.antardashaSign, 8);
}

// Invalid ages and signs do not yield positions.
assert.equal(progressBhriguGraha({ body: 'Sun', natalSign: 1, ageYears: -1, version: 'sundaram-7' }), null);
assert.equal(progressBhriguGraha({ body: 'Sun', natalSign: 13, ageYears: 10, version: 'sundaram-7' }), null);
assert.equal(calculateBhriguProgressions(chart, Number.NaN, 'sundaram-7').length, 0);

console.log('Bhrigu Pada progression tests passed');
