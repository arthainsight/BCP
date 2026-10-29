// Bhāva Bala: the strength of the twelve houses, by BPHS 27.26–31.
//
// The verses give five parts, all in virūpa (60 virūpa make a rūpa):
//
//   1. Bhāvādhipati Bala  the Ṣaḍbala of the lord of the house (27.29)
//   2. Bhāva Dig Bala     the distance of the house from the point where it is powerless, divided by three
//                         (27.26–28); the point is an angle of the chart that depends on the sign
//   3. Bhāva Dṛṣṭi Bala   a quarter of the benefic aspects less a quarter of the malefic ones on the house,
//                         and the aspects of Mercury and Jupiter in full (27.28–29)
//   4. Occupants          +60 for Mercury or Jupiter in the house, -60 for Saturn, Mars or the Sun (27.30)
//   5. Bhāva Kāla Bala    +15 for a house in a śīrṣodaya sign by day, an ubhayodaya sign in the twilight or a
//                         pṛṣṭhodaya sign by night (27.31)
//
// What the verses leave open, and what the app took (see docs/shadbala-manual.md):
//   * The house is a whole sign counted from the Lagna sign (the first house begins at 0° of the Lagna sign,
//     as in LagnaOne's equal houses); its middle point, which the aspects and the sign halves go by, is
//     the 15° of the sign. A sign half therefore cannot tell Sagittarius or Capricorn apart: 15° is read
//     as the second half.
//   * Cancer takes the Lagna as its powerless point (27.27 and the translations of Santhanam and
//     Sharma). B. V. Raman, following Śrīpati, pairs Cancer with Pisces and the 10th.
//   * Mercury's and Jupiter's aspects count in full instead of a quarter (B. V. Raman, article 132);
//     read literally the verse would add them to the quarter.
//   * The twilight is five ghaṭī (two hours) either side of the sunrise and the sunset (46.44–47, where
//     the word is defined for the day's divisions).
//   * The waning Moon is a malefic and Mercury a malefic in the sign of a malefic, as in Dṛg Bala.
//
// Raman's *Graha and Bhava Balas* leaves out the occupants and the Kāla Bala, and counts the Dig Bala in
// whole signs; the app follows the verses.

import { normalizeDegrees } from './angles';
import { SIGN_ABBR, SIGN_LORDS } from './signs';
import { aspectVirupa } from './shadbalaAspects';
import {
  SHADBALA_REQUIRED_VIRUPA,
  SCORE_PLANETS,
  classifyBenefics,
  getBirthHour,
  type ShadbalaChartLike,
  type ShadbalaPlanet,
} from './shadbala';

export type OccupantDetail = {
  name: string;
  /** +60, -60 or 0 (the Moon and Venus neither add nor take away). */
  contribution: number;
  note: string;
};

export type DrigDetail = {
  planet: string;
  nature: 'benefic' | 'malefic';
  /** The aspect the graha casts on the middle of the house, in virūpa, before it is weighed. */
  aspectVirupa: number;
  /** The weight: 1 for Mercury and Jupiter, a quarter for the others. */
  weight: number;
  contribution: number;
};

export type BhavaBalaRow = {
  house: number;
  sign: string;
  lord: string;
  // 1. Bhāvādhipati Bala: the lord's Ṣaḍbala
  bhavesha: number;
  bhaveshaRequired: number;
  bhaveshaRatio: number;
  bhaveshaSource: string;
  // 2. Bhāva Dig Bala
  dig: number;
  /** Which angle the house is measured from: the Ascendant, the Descendant, the Midheaven or the Nadir. */
  digPoint: BhavaDigPoint | null;
  // 3. Bhāva Dṛṣṭi Bala
  drig: number;
  drigBenefic: number;
  drigMalefic: number;
  drigDetails: DrigDetail[];
  // 4. Occupants
  occupants: OccupantDetail[];
  occupantTotal: number;
  // 5. Bhāva Kāla Bala
  kala: number;
  kalaNote: string;
  /** The total in virūpa. */
  total: number;
};

export type BhavaDigPoint = 'asc' | 'desc' | 'mc' | 'ic';

export type BirthSect = 'day' | 'twilight' | 'night' | 'unknown';

type ShadbalaLike = {
  planet: string;
  total?: number;
  totalVirupa?: number;
  requiredVirupa?: number;
};

type ShadbalaEntry = {
  virupa: number;
  required: number;
  ratio: number;
};

/** The strength an occupant adds to or takes from its house (27.30). */
const OCCUPANT_VIRUPA: Partial<Record<ShadbalaPlanet, number>> = { Mercury: 60, Jupiter: 60, Saturn: -60, Mars: -60, Sun: -60 };

/** What each aspecting graha's value is multiplied by: Mercury and Jupiter count in full, the others by a quarter. */
const FULL_ASPECT_GRAHAS: readonly ShadbalaPlanet[] = ['Mercury', 'Jupiter'];

/** Five ghaṭī, in hours, either side of sunrise and sunset (BPHS 46.44–47). */
export const TWILIGHT_HOURS = 2;

/** Bhāva Kāla Bala (27.31): a quarter of a rūpa. */
export const BHAVA_KALA_VIRUPA = 15;

// The way the signs rise, from BPHS 4: Gemini, Leo, Virgo, Libra and Aquarius are said to rise head first (śīrṣodaya),
// Aries, Taurus, Cancer, Sagittarius and Capricorn back first (pṛṣṭhodaya) and Pisces both ways (ubhayodaya).
// The text does not say it of Scorpio; it is counted with the head-risers, as everywhere else.
const SIRSODAYA_SIGNS = [2, 4, 5, 6, 7, 10];
const PRSTHODAYA_SIGNS = [0, 1, 3, 8, 9];
const UBHAYODAYA_SIGNS = [11];

function getPlanet(chart: ShadbalaChartLike, name: string) {
  return chart.planets?.find((planet) => planet.name === name);
}

function distance(a: number, b: number): number {
  const raw = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(raw, 360 - raw);
}

/**
 * The angle a house in the given sign is measured from (27.26–27): the descendant for Gemini, Virgo, Libra,
 * Aquarius and the first half of Sagittarius; the nadir for Aries, Taurus, Leo, the first half of Capricorn and
 * the second half of Sagittarius; the ascendant for Cancer and Scorpio; the midheaven for the second half of
 * Capricorn and Pisces. `degreeInSign` is the position of the middle point of the house in its sign.
 */
export function bhavaDigPoint(signIndex: number, degreeInSign: number): BhavaDigPoint {
  const firstHalf = degreeInSign < 15;
  if ([2, 5, 6, 10].includes(signIndex) || (signIndex === 8 && firstHalf)) return 'desc';
  if ([0, 1, 4].includes(signIndex) || (signIndex === 9 && firstHalf) || (signIndex === 8 && !firstHalf)) return 'ic';
  if (signIndex === 3 || signIndex === 7) return 'asc';
  return 'mc'; // the second half of Capricorn and Pisces
}

/** Bhāva Dig Bala (27.28): the distance, in degrees, from the powerless angle, divided by three. */
export function calculateBhavaDigBalaVirupa(
  signIndex: number,
  degreeInSign: number,
  angles: { ascendant?: number; midheaven?: number },
): { virupa: number; point: BhavaDigPoint | null } {
  if (typeof angles.ascendant !== 'number') return { virupa: 0, point: null };
  const midheaven = angles.midheaven ?? angles.ascendant + 270;
  const point = bhavaDigPoint(signIndex, degreeInSign);
  const longitude = { asc: angles.ascendant, desc: angles.ascendant + 180, mc: midheaven, ic: midheaven + 180 }[point];
  return { virupa: distance(signIndex * 30 + degreeInSign, longitude) / 3, point };
}

/**
 * Whether the birth is by day, in the twilight or by night (27.31). The twilight is the two hours either side of
 * the sunrise and the sunset, so the day is the rest of the time between them. 'unknown' when the chart has no
 * birth moment or no sunrise.
 */
export function birthSect(chart: ShadbalaChartLike): BirthSect {
  const hour = getBirthHour(chart);
  const { sunriseLocalHours: sunrise, sunsetLocalHours: sunset } = chart.debug ?? {};
  if (hour === null || typeof sunrise !== 'number' || typeof sunset !== 'number') return 'unknown';
  const apart = (a: number, b: number) => {
    const raw = Math.abs(a - b) % 24;
    return Math.min(raw, 24 - raw);
  };
  if (apart(hour, sunrise) <= TWILIGHT_HOURS || apart(hour, sunset) <= TWILIGHT_HOURS) return 'twilight';
  return hour >= sunrise && hour < sunset ? 'day' : 'night';
}

/** Bhāva Kāla Bala (27.31): 15 virūpa for a house in the kind of sign that suits the time of birth. */
export function calculateBhavaKalaBalaVirupa(signIndex: number, sect: BirthSect): number {
  if (sect === 'day' && SIRSODAYA_SIGNS.includes(signIndex)) return BHAVA_KALA_VIRUPA;
  if (sect === 'twilight' && UBHAYODAYA_SIGNS.includes(signIndex)) return BHAVA_KALA_VIRUPA;
  if (sect === 'night' && PRSTHODAYA_SIGNS.includes(signIndex)) return BHAVA_KALA_VIRUPA;
  return 0;
}

/** Bhāva Dṛṣṭi Bala (27.28–29) of the point `longitude`: the aspects of the seven grahas, by the sphuṭa dṛṣṭi table. */
export function calculateBhavaDrigBala(
  chart: ShadbalaChartLike,
  longitude: number,
  benefics: Set<ShadbalaPlanet> = classifyBenefics(chart),
): { total: number; benefic: number; malefic: number; details: DrigDetail[] } {
  const result = { total: 0, benefic: 0, malefic: 0, details: [] as DrigDetail[] };
  SCORE_PLANETS.forEach((name) => {
    const planet = getPlanet(chart, name);
    if (typeof planet?.longitude !== 'number') return;
    const aspect = aspectVirupa(name, normalizeDegrees(longitude - planet.longitude));
    if (!aspect) return;
    const isBenefic = benefics.has(name);
    const weight = FULL_ASPECT_GRAHAS.includes(name) ? 1 : 0.25;
    const contribution = (isBenefic ? 1 : -1) * aspect * weight;
    result.total += contribution;
    if (contribution > 0) result.benefic += contribution;
    else result.malefic += contribution;
    result.details.push({ planet: name, nature: isBenefic ? 'benefic' : 'malefic', aspectVirupa: aspect, weight, contribution });
  });
  return result;
}

function createShadbalaMap(shadbala: ShadbalaLike[]): Record<string, ShadbalaEntry> {
  return Object.fromEntries(
    shadbala.map((row) => {
      const virupa = typeof row.totalVirupa === 'number'
        ? row.totalVirupa
        : typeof row.total === 'number'
          ? row.total * 60
          : 0;
      const required = row.requiredVirupa ?? SHADBALA_REQUIRED_VIRUPA[row.planet as ShadbalaPlanet] ?? 0;
      const ratio = required > 0 ? virupa / required : 0;
      return [row.planet, { virupa, required, ratio }];
    }),
  );
}

const KALA_NOTE: Record<BirthSect, string> = {
  day: 'day birth',
  twilight: 'twilight birth',
  night: 'night birth',
  unknown: 'no birth time or sunrise',
};

/** The Bhāva Bala of the twelve houses, whole signs from the Lagna sign, given the Ṣaḍbala rows of the grahas. */
export function buildClassicalBhavaBala(chart: ShadbalaChartLike, shadbala: ShadbalaLike[]): BhavaBalaRow[] {
  const ascendantSign = chart.ascendant?.sign;
  const shadbalaMap = createShadbalaMap(shadbala);
  const benefics = classifyBenefics(chart);
  const sect = birthSect(chart);
  const angles = { ascendant: chart.ascendant?.longitude, midheaven: chart.midheaven };

  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const signIndex = typeof ascendantSign === 'number' ? (ascendantSign - 1 + index) % 12 : null;
    const lord = signIndex === null ? '—' : SIGN_LORDS[signIndex];
    const middle = signIndex === null ? null : signIndex * 30 + 15;

    const lordEntry = shadbalaMap[lord];
    const bhavesha = lordEntry?.virupa ?? 0;
    const bhaveshaRequired = lordEntry?.required ?? SHADBALA_REQUIRED_VIRUPA[lord as ShadbalaPlanet] ?? 0;
    const bhaveshaRatio = lordEntry?.ratio ?? 0;
    const bhaveshaSource = lordEntry
      ? `Ṣaḍbala ${Math.round(bhavesha)} vp / ${bhaveshaRequired} req = ${bhaveshaRatio.toFixed(2)}×`
      : 'fallback: 0 vp (Ṣaḍbala not computed)';

    const dig = signIndex === null ? { virupa: 0, point: null } : calculateBhavaDigBalaVirupa(signIndex, 15, angles);
    const drig = middle === null ? { total: 0, benefic: 0, malefic: 0, details: [] as DrigDetail[] } : calculateBhavaDrigBala(chart, middle, benefics);

    const occupants: OccupantDetail[] = [];
    let occupantTotal = 0;
    if (signIndex !== null) {
      SCORE_PLANETS.forEach((name) => {
        const planet = getPlanet(chart, name);
        const planetSign = typeof planet?.longitude === 'number' ? Math.floor(normalizeDegrees(planet.longitude) / 30) : typeof planet?.sign === 'number' ? planet.sign - 1 : null;
        if (planetSign !== signIndex) return;
        const contribution = OCCUPANT_VIRUPA[name] ?? 0;
        occupantTotal += contribution;
        occupants.push({ name, contribution, note: contribution > 0 ? '+1 rūpa' : contribution < 0 ? '−1 rūpa' : 'no rule' });
      });
    }

    const kala = signIndex === null ? 0 : calculateBhavaKalaBalaVirupa(signIndex, sect);
    const total = bhavesha + dig.virupa + drig.total + occupantTotal + kala;

    return {
      house,
      sign: signIndex === null ? '—' : SIGN_ABBR[signIndex],
      lord,
      bhavesha,
      bhaveshaRequired,
      bhaveshaRatio,
      bhaveshaSource,
      dig: dig.virupa,
      digPoint: dig.point,
      drig: drig.total,
      drigBenefic: drig.benefic,
      drigMalefic: drig.malefic,
      drigDetails: drig.details,
      occupants,
      occupantTotal,
      kala,
      kalaNote: KALA_NOTE[sect],
      total,
    };
  });
}
