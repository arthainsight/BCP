import { calculateRasiDasha, type RasiDashaSystem } from './rasiDashas';

export type RasiValidationStatus = {
  passed: boolean;
  checks: number;
  fixture: string;
  scope: 'pyjhora-rule-reference';
  reference: string;
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
  if (system === 'moola') {
    const ketuSeedPlanets = FIXTURE_PLANETS.map(planet => planet.name === 'Ketu' ? { ...planet, sign: 6, longitude: 150 } : planet);
    const ketuResult = calculateRasiDasha('moola', ketuSeedPlanets, 6, new Date('2000-01-01T10:00:00.000Z'), { narayanaSeed: 'stronger-lagna-seventh', moolaSeed: 'lagna', sthiraMethod: 'brahma-pvr' });
    checks.push(ketuResult.entries.slice(0, 12).map(entry => entry.abbr).join(',') === 'Vi,Ge,Pi,Sg,Le,Ta,Aq,Sc,Cn,Ar,Cp,Li');
  }
  return { passed: checks.every(Boolean), checks: checks.length, fixture: system === 'moola' ? 'BCP-RD-001 + PJH-MOOLA-KETU-001' : 'BCP-RD-001', scope: 'pyjhora-rule-reference', reference: 'PyJHora 48e57d2' };
}
