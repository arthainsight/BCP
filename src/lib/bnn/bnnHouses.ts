import type { ChartData } from '@/types';
import { SIGN_NAMES } from '@/lib/signs';
import { calculateJupiterianRounds } from './jupiterianRounds';
import { calculateMinorProgression } from './jupiterMinorProgression';
import { buildParayaTimeline, calculateBetaParaya, calculateNadiParaya, PARAYA_BETA_BODIES, type NadiParayaHouseActivation, type ParayaBetaNatal, type ParayaBody, type ParayaOptions, type ParayaPeriod } from './nadiParaya';

// Where the BNN progressions and the Nāḍī Paraya points fall in a natal chart,
// as houses counted from the ascendant. The chart highlights and the legend
// both read these, so they are worked out here once.

export interface BnnHouses {
  /** House of the Jupiterian round (BNN Major), or 0 when there is none. */
  major: number;
  /** House of the minor progression (BNN Minor). */
  minor: number;
}

const NO_HOUSES: BnnHouses = { major: 0, minor: 0 };

function houseOf(signIndex: number, ascendantSign: number): number {
  return ((signIndex + 1 - ascendantSign + 12) % 12) + 1;
}

export function calculateBnnHouses(chart: ChartData | null, ageYears: number): BnnHouses {
  if (!chart) return NO_HOUSES;
  const jupiter = chart.planets.find(p => p.name === 'Jupiter');
  if (!jupiter) return NO_HOUSES;
  const natalJupiterSignIndex = jupiter.sign - 1;
  const rounds = calculateJupiterianRounds({ natalJupiterSignIndex, natalJupiterDegree: jupiter.degree, ageYears });
  const minor = calculateMinorProgression({
    natalJupiterSignIndex,
    ageYears,
    planets: chart.planets.map(p => ({ name: p.name, signIndex: p.sign - 1 })),
  });
  const asc = chart.ascendant.sign;
  return {
    major: rounds.currentRound ? houseOf(rounds.currentRound.activeSignIndex, asc) : 0,
    minor: houseOf(minor.minorSignIndex, asc),
  };
}

/** The Paraya graha periods at an age (the four, and Mars, Mercury and Venus with `beta`), in the order Jupiter, Saturn, Rahu, Ketu, Mars, Mercury, Venus. */
export function parayaPeriodsOf(chart: ChartData | null, ageYears: number, options?: ParayaOptions, beta = false): ParayaPeriod[] {
  if (!chart) return [];
  const jupiter = chart.planets.find(p => p.name === 'Jupiter');
  const saturn = chart.planets.find(p => p.name === 'Saturn');
  const rahu = chart.planets.find(p => p.name === 'Rahu');
  if (!jupiter || !saturn || !rahu) return [];
  const paraya = calculateNadiParaya({
    ageYears,
    natalJupiterSignIndex: jupiter.sign - 1,
    natalSaturnSignIndex: saturn.sign - 1,
    natalRahuSignIndex: rahu.sign - 1,
    natalJupiterDegree: jupiter.degree,
    natalSaturnDegree: saturn.degree,
    natalRahuDegree: rahu.degree,
    jupiterRetrograde: Boolean(jupiter.isRetrograde),
    saturnRetrograde: Boolean(saturn.isRetrograde),
    options,
  });
  const periods = [paraya.jupiter, paraya.saturn, paraya.rahu, paraya.ketu];
  if (beta) {
    const natal: ParayaBetaNatal = {};
    for (const body of PARAYA_BETA_BODIES) {
      const planet = chart.planets.find(p => p.name === body);
      if (planet) natal[body] = { signIndex: planet.sign - 1, degree: planet.degree, retrograde: Boolean(planet.isRetrograde) };
    }
    periods.push(...calculateBetaParaya({ ageYears, natal, options }));
  }
  return periods;
}

/** The houses of the Paraya grahas at an age; with `beta` Mars, Mercury and Venus follow the four. */
export function calculateParayaHouses(chart: ChartData | null, ageYears: number, options?: ParayaOptions, beta = false): NadiParayaHouseActivation[] {
  if (!chart) return [];
  const asc = chart.ascendant.sign;
  return parayaPeriodsOf(chart, ageYears, options, beta).map(period => ({
    body: period.body,
    house: houseOf(period.signIndex, asc),
    degree: period.degree,
  }));
}

/**
 * Every stay of a Paraya graha in a sign up to an age, in order: the natal sign it begins in at its natal degree (the first stay begins before birth),
 * and so on. Ketu is Rahu six signs on. Empty when the chart has not the graha.
 */
export function parayaTimelineOf(chart: ChartData | null, body: ParayaBody, maxAge: number, options?: ParayaOptions): ParayaPeriod[] {
  if (!chart) return [];
  const source = body === 'Ketu' ? 'Rahu' : body;
  const planet = chart.planets.find(p => p.name === source);
  if (!planet) return [];
  const periods = buildParayaTimeline({
    body: source,
    natalSignIndex: planet.sign - 1,
    startDegree: planet.degree,
    maxAge,
    retrograde: Boolean(planet.isRetrograde),
    options,
  });
  return body === 'Ketu' ? periods.map(period => ({ ...period, body: 'Ketu' as const, signIndex: (period.signIndex + 6) % 12, signName: SIGN_NAMES[(period.signIndex + 6) % 12] })) : periods;
}
