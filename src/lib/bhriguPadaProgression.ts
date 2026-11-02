import type { ChartData } from '@/types';
import { SIGN_LORDS, SIGN_NAMES } from '@/lib/signs';

/**
 * Documented Bhrigu Pada progression variants.
 *
 * sundaram-7: the seven-graha form in Dr. K. P. Vaani's Bhrigu Pada Dasa
 * article, presented under the guidance of A. V. Sundaram.
 *
 * nadi-praveshika-8: the eight-graha form in Nadi Pravesika (2019), which
 * includes Rahu, uses 29 years for Saturn, and constructs Arudhas without
 * the usual same-sign / seventh-sign exceptions.
 *
 * These are modern Nadi teaching sources, not verified Sanskrit-classical
 * rules. Progressions are sign-only; the method does not calculate degrees.
 */
export type BhriguPadaVersion = 'sundaram-7' | 'nadi-praveshika-8';

export const BHRIGU_PADA_VERSIONS: readonly BhriguPadaVersion[] = [
  'nadi-praveshika-8',
  'sundaram-7',
];

export const BHRIGU_PADA_CYCLES: Record<BhriguPadaVersion, Readonly<Record<string, number>>> = {
  'sundaram-7': {
    Sun: 19,
    Moon: 45,
    Mars: 14,
    Mercury: 46,
    Jupiter: 83,
    Venus: 27,
    Saturn: 30,
  },
  'nadi-praveshika-8': {
    Sun: 19,
    Moon: 45,
    Mars: 14,
    Mercury: 46,
    Jupiter: 83,
    Venus: 27,
    Saturn: 29,
    Rahu: 93,
  },
};

export const BHRIGU_PADA_BODIES: Record<BhriguPadaVersion, readonly string[]> = {
  'sundaram-7': ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'],
  'nadi-praveshika-8': ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'],
};

export interface BhriguGrahaProgression {
  body: string;
  cycleYears: number;
  /** Number of complete sign-steps since birth, before reducing to a 12-sign round. */
  totalSteps: number;
  /** The current position counted from the natal sign: 1 is the natal sign, 2 its next sign, etc. */
  houseFromNatal: number;
  /** Current sign, 1 = Aries … 12 = Pisces. */
  sign: number;
  /** Current house counted from the natal ascendant, 1–12. */
  houseFromLagna: number;
}

export interface BhriguPadaAntardasha {
  body: string;
  /** The current major period's sign. */
  mahaDashaSign: number;
  /** The ordinal of the major sign-period since birth, starting at 1. */
  mahaDashaNumber: number;
  /** The current antardasha within the major sign-period, 1–12. */
  antardashaNumber: number;
  /** The antardasha sign, starting from the current major-period sign. */
  antardashaSign: number;
  antardashaDurationYears: number;
  startAgeYears: number;
  endAgeYears: number;
}

export interface BhriguPada {
  /** The natal house whose lord determines this Arudha. */
  house: number;
  name: string;
  houseSign: number;
  sign: number;
  lord: string;
}

export interface BhriguPadaActivation {
  pada: BhriguPada;
  progressedSign: number;
  /** Counted from the Arudha's sign: 1, 4, 5, 7, 9 or 10 are notable relationships. */
  relationFromPada: number;
  kind: 'same' | 'kendra' | 'trikona' | 'other';
}

function wrapSign(sign: number): number {
  return ((sign - 1) % 12 + 12) % 12 + 1;
}

function signDistance(from: number, to: number): number {
  return ((to - from) % 12 + 12) % 12;
}

/**
 * One complete 12-sign round is divided equally across the graha's cycle.
 * The number of completed sign-steps is floor(age × 12 / cycle years).
 * At birth the graha is in its natal sign (houseFromNatal = 1).
 */
export function progressBhriguGraha(params: {
  body: string;
  natalSign: number;
  ageYears: number;
  version: BhriguPadaVersion;
}): BhriguGrahaProgression | null {
  const { body, natalSign, ageYears, version } = params;
  const cycleYears = BHRIGU_PADA_CYCLES[version][body];
  if (!cycleYears || !Number.isFinite(ageYears) || ageYears < 0 || !Number.isInteger(natalSign) || natalSign < 1 || natalSign > 12) {
    return null;
  }

  // The tiny epsilon prevents a mathematically exact month/sign boundary from
  // being lost to floating-point representation.
  const totalSteps = Math.floor((ageYears * 12) / cycleYears + 1e-10);
  const sign = wrapSign(natalSign + totalSteps);
  return {
    body,
    cycleYears,
    totalSteps,
    houseFromNatal: (totalSteps % 12) + 1,
    sign,
    houseFromLagna: 1, // Filled by calculateBhriguProgressions below.
  };
}

export function calculateBhriguProgressions(
  chart: ChartData,
  ageYears: number,
  version: BhriguPadaVersion,
): BhriguGrahaProgression[] {
  if (!Number.isFinite(ageYears) || ageYears < 0) return [];
  return BHRIGU_PADA_BODIES[version].flatMap(body => {
    const natal = chart.planets.find(planet => planet.name === body);
    if (!natal) return [];
    const progression = progressBhriguGraha({ body, natalSign: natal.sign, ageYears, version });
    if (!progression) return [];
    return [{
      ...progression,
      houseFromLagna: signDistance(chart.ascendant.sign, progression.sign) + 1,
    }];
  });
}

/**
 * Calculates the current Bhrigu Pada antardasha for each running graha progression.
 * Each major sign-period (cycleYears / 12) is divided into 12 equal sub-periods.
 * The antardasha signs proceed from the sign currently occupied by the major period.
 * This subdivision is explicitly described in Nadi Praveshika (2019), especially
 * for long sign-periods such as Jupiter and Rahu.
 */
export function calculateBhriguPadaAntardashas(
  progressions: readonly BhriguGrahaProgression[],
  ageYears: number,
): BhriguPadaAntardasha[] {
  if (!Number.isFinite(ageYears) || ageYears < 0) return [];

  return progressions.map(progression => {
    const totalAntardashaSteps = Math.floor((ageYears * 144) / progression.cycleYears + 1e-10);
    const mahaDashaNumber = Math.floor(totalAntardashaSteps / 12) + 1;
    const antardashaNumber = (totalAntardashaSteps % 12) + 1;
    const antardashaDurationYears = progression.cycleYears / 144;

    return {
      body: progression.body,
      mahaDashaSign: progression.sign,
      mahaDashaNumber,
      antardashaNumber,
      antardashaSign: wrapSign(progression.sign + antardashaNumber - 1),
      antardashaDurationYears,
      startAgeYears: totalAntardashaSteps * antardashaDurationYears,
      endAgeYears: (totalAntardashaSteps + 1) * antardashaDurationYears,
    };
  });
}

function rawArudhaSign(houseSign: number, lordSign: number): number {
  // Count from the house sign to its lord, then the same distance from the lord.
  return wrapSign(lordSign + signDistance(houseSign, lordSign));
}

/**
 * The 2008 K. P. Vaani / A. V. Sundaram presentation shifts a pada to the
 * tenth from itself whenever the uncorrected pada falls in any kendra
 * (1st, 4th, 7th or 10th) from the house being considered. This is broader
 * than the common Jaimini same-sign / seventh-sign correction.
 *
 * The 2019 Nadi Pravesika presentation explicitly says not to apply any
 * such exception.
 */
function sundaramKendraArudhaSign(houseSign: number, lordSign: number): number {
  const pada = rawArudhaSign(houseSign, lordSign);
  const relation = signRelation(houseSign, pada);
  return [1, 4, 7, 10].includes(relation) ? wrapSign(pada + 9) : pada;
}

/**
 * Calculates all available Arudhas for the chosen source variant.
 */
export function calculateBhriguPadas(chart: ChartData, version: BhriguPadaVersion): BhriguPada[] {
  const result: BhriguPada[] = [];
  for (let index = 0; index < 12; index += 1) {
    const house = index + 1;
    const houseSign = wrapSign(chart.ascendant.sign + index);
    const lord = SIGN_LORDS[houseSign - 1];
    const natalLord = chart.planets.find(planet => planet.name === lord);
    if (!natalLord) continue;

    const sign = version === 'nadi-praveshika-8'
      ? rawArudhaSign(houseSign, natalLord.sign)
      : sundaramKendraArudhaSign(houseSign, natalLord.sign);

    result.push({
      house,
      name: house === 1 ? 'AL' : 'AL' + house,
      houseSign,
      sign,
      lord,
    });
  }
  return result;
}

/** The sign counted from fromSign to toSign, inclusive (same sign = 1). */
export function signRelation(fromSign: number, toSign: number): number {
  return signDistance(fromSign, toSign) + 1;
}

export function relationKind(relation: number): BhriguPadaActivation['kind'] {
  if (relation === 1) return 'same';
  if ([4, 7, 10].includes(relation)) return 'kendra';
  if ([5, 9].includes(relation)) return 'trikona';
  return 'other';
}

export function calculateBhriguPadaActivations(
  padas: readonly BhriguPada[],
  progressions: readonly BhriguGrahaProgression[],
): BhriguPadaActivation[] {
  const byLord = new Map<string, BhriguGrahaProgression>(progressions.map(progression => [progression.body, progression] as const));
  return padas.flatMap(pada => {
    const progression = byLord.get(pada.lord);
    if (!progression) return [];
    const relationFromPada = signRelation(pada.sign, progression.sign);
    return [{
      pada,
      progressedSign: progression.sign,
      relationFromPada,
      kind: relationKind(relationFromPada),
    }];
  });
}

export function signLabel(sign: number): string {
  return SIGN_NAMES[sign - 1] ?? '—';
}
