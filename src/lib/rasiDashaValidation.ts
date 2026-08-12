import { calculateRasiDasha, type RasiDashaSystem } from './rasiDashas';

export type RasiValidationStatus = {
  passed: boolean;
  checks: number;
  fixture: string;
  scope: 'pyjhora-rule-reference';
  reference: string;
  goldenCharts: number;
  dateParity: boolean;
};

const FIXTURE_PLANETS = [
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

const EXPECTED: Record<RasiDashaSystem, { seed: number; order: string; durations?: string }> = {
  narayana: { seed: 9, order: 'Cp,Sg,Sc,Li,Vi,Le,Cn,Ge,Ta,Ar,Pi,Aq' },
  moola: { seed: 9, order: 'Cp,Li,Cn,Ar,Sg,Vi,Ge,Pi,Sc,Le,Ta,Aq' },
  sthira: { seed: 6, order: 'Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi', durations: '7,8,9,7,8,9,7,8,9,7,8,9' },
};

const VARIANT_PLANETS = [
  FIXTURE_PLANETS,
  FIXTURE_PLANETS.map((planet, index) => { const sign = (planet.sign + index * 2 - 1) % 12 + 1; return { ...planet, sign, longitude: (sign - 1) * 30 + planet.degree }; }),
  FIXTURE_PLANETS.map((planet, index) => { const sign = (planet.sign + index * 3 + 4) % 12 + 1; return { ...planet, sign, longitude: (sign - 1) * 30 + planet.degree }; }),
];
const ASCENDANTS = [4, 1, 9];
const GOLDEN: Record<RasiDashaSystem, { seed: number; order: string; durations: string; ends: string }[]> = {
  narayana: [
    { seed: 9, order: 'Cp,Sg,Sc,Li,Vi,Le,Cn,Ge,Ta,Ar,Pi,Aq', durations: '2,4,10,12,11,11,1,4,5,5,11,3', ends: '2001-12-31T22:18:19.699Z,2005-12-31T22:54:59.097Z,2016-01-01T12:26:37.593Z' },
    { seed: 0, order: 'Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg,Cp,Aq,Pi', durations: '10,3,10,11,11,5,10,3,12,2,3,3', ends: '2009-12-31T23:31:38.496Z,2012-12-31T17:59:08.044Z,2023-01-01T07:30:46.540Z' },
    { seed: 2, order: 'Ge,Aq,Li,Vi,Ta,Cp,Sg,Le,Ar,Pi,Sc,Cn', durations: '6,5,8,9,1,4,9,6,4,6,9,5', ends: '2005-12-31T22:54:59.097Z,2011-01-01T05:40:48.345Z,2019-01-01T06:54:07.141Z' },
  ],
  moola: [
    { seed: 9, order: 'Cp,Li,Cn,Ar,Sg,Vi,Ge,Pi,Sc,Le,Ta,Aq', durations: '2,12,1,5,4,11,4,11,10,11,5,3', ends: '2001-12-31T22:18:19.699Z,2014-01-01T00:08:17.894Z,2015-01-01T06:17:27.743Z' },
    { seed: 0, order: 'Ar,Cn,Li,Cp,Ta,Le,Sc,Aq,Ge,Vi,Sg,Pi', durations: '10,11,10,2,3,11,3,3,10,5,12,3', ends: '2009-12-31T23:31:38.496Z,2020-12-31T19:12:26.841Z,2031-01-01T08:44:05.337Z' },
    { seed: 2, order: 'Ge,Vi,Sg,Pi,Cn,Li,Cp,Ar,Le,Sc,Aq,Ta', durations: '6,9,9,6,5,8,4,4,6,9,5,1', ends: '2005-12-31T22:54:59.097Z,2015-01-01T06:17:27.743Z,2024-01-01T13:39:56.389Z' },
  ],
  sthira: [
    { seed: 6, order: 'Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi', durations: '7,8,9,7,8,9,7,8,9,7,8,9', ends: '2007-01-01T05:04:08.947Z,2015-01-01T06:17:27.743Z,2024-01-01T13:39:56.389Z' },
    { seed: 9, order: 'Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi,Li,Sc,Sg', durations: '7,8,9,7,8,9,7,8,9,7,8,9', ends: '2007-01-01T05:04:08.947Z,2015-01-01T06:17:27.743Z,2024-01-01T13:39:56.389Z' },
    { seed: 6, order: 'Li,Sc,Sg,Cp,Aq,Pi,Ar,Ta,Ge,Cn,Le,Vi', durations: '7,8,9,7,8,9,7,8,9,7,8,9', ends: '2007-01-01T05:04:08.947Z,2015-01-01T06:17:27.743Z,2024-01-01T13:39:56.389Z' },
  ],
};

export function validateRasiDashaRegression(system: RasiDashaSystem): RasiValidationStatus {
  const result = calculateRasiDasha(system, FIXTURE_PLANETS, 4, new Date('2000-01-01T10:00:00.000Z'));
  const expected = EXPECTED[system];
  const firstCycle = result.entries.slice(0, 12);
  const checks = [
    result.seedSign === expected.seed,
    firstCycle.map(entry => entry.abbr).join(',') === expected.order,
    firstCycle.length === 12,
    firstCycle.every((entry, index) => index === 0 || firstCycle[index - 1].endDate.getTime() === entry.startDate.getTime()),
    expected.durations == null || firstCycle.map(entry => entry.durationYears).join(',') === expected.durations,
  ];
  for (let index = 0; index < VARIANT_PLANETS.length; index++) {
    const goldenResult = calculateRasiDasha(system, VARIANT_PLANETS[index], ASCENDANTS[index], new Date('2000-01-01T10:00:00.000Z'));
    const golden = GOLDEN[system][index]; const cycle = goldenResult.entries.slice(0, 12);
    checks.push(goldenResult.seedSign === golden.seed, cycle.map(entry => entry.abbr).join(',') === golden.order, cycle.map(entry => entry.durationYears).join(',') === golden.durations, cycle.slice(0, 3).map(entry => entry.endDate.toISOString()).join(',') === golden.ends);
  }
  if (system === 'moola') {
    const ketuSeedPlanets = FIXTURE_PLANETS.map(planet => planet.name === 'Ketu' ? { ...planet, sign: 6, longitude: 150 } : planet);
    const ketuResult = calculateRasiDasha('moola', ketuSeedPlanets, 6, new Date('2000-01-01T10:00:00.000Z'), { narayanaSeed: 'stronger-lagna-seventh', moolaSeed: 'lagna', sthiraMethod: 'brahma-pvr' });
    checks.push(ketuResult.entries.slice(0, 12).map(entry => entry.abbr).join(',') === 'Vi,Ge,Pi,Sg,Le,Ta,Aq,Sc,Cn,Ar,Cp,Li');
  }
  return { passed: checks.every(Boolean), checks: checks.length, fixture: 'PJH-GOLDEN-001…003', scope: 'pyjhora-rule-reference', reference: 'PyJHora 48e57d2 · sidereal year 365.256364 d', goldenCharts: 3, dateParity: checks.every(Boolean) };
}
