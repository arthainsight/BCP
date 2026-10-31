import { buildDashaSubPeriods, buildDashaTimeline, type NakshatraDashaEntry } from './nakshatraDasha';
import { normalizeDegrees } from './angles';
import { SIGN_LORDS } from './signs';
import { birthHalves } from './birthConditions';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';

type EligibilityPlanet = { name: string; sign: number; longitude?: number };

export interface AshtottariEligibility {
  /** True when either condition of the text holds: the Rāhu rule of 46.17 or the rule of the day and the half of the month of 46.23. */
  eligible: boolean;
  /** 46.17: Rāhu in an angle or a trine from the lord of the Lagna and not in the Lagna. */
  rahuRule: boolean;
  /** 46.23: born by day in the dark half or by night in the bright half; null when the Sun, the Moon or the Lagna degree is not known. */
  birthRule: boolean | null;
  method: 'BPHS/PVR Rahu condition';
  ascendantSign: number;
  lagnaLord: string;
  lagnaLordSign: number | null;
  rahuSign: number | null;
  relativeHouse: number | null;
  reasons: string[];
}

/** The two conditions of the text (BPHS 46.17 and 46.23); either is enough. */
export const ASHTOTTARI_CONDITION = 'Rāhu in an angle or a trine from the lord of the Lagna and not in the Lagna (46.17), or a birth by day in the dark half of the month or by night in the bright half (46.23). Counted from Ārdrā in groups of 4, 3, 4, 3 (28 with Abhijit).';

export function evaluateAshtottariEligibility(planets: EligibilityPlanet[], ascendantSign: number, ascendantLongitude?: number): AshtottariEligibility {
  const ascIndex = ((ascendantSign - 1) % 12 + 12) % 12;
  const lagnaLord = SIGN_LORDS[ascIndex];
  const lagnaLordSign = planets.find(planet => planet.name === lagnaLord)?.sign ?? null;
  const rahuSign = planets.find(planet => planet.name === 'Rahu')?.sign ?? null;
  const relativeHouse = lagnaLordSign && rahuSign ? ((rahuSign - lagnaLordSign + 12) % 12) + 1 : null;
  const rahuOutsideLagna = rahuSign != null && rahuSign !== ascendantSign;
  const kendraOrTrikona = relativeHouse != null && [1, 4, 5, 7, 9, 10].includes(relativeHouse);
  const rahuRule = rahuOutsideLagna && kendraOrTrikona;
  const sun = planets.find(planet => planet.name === 'Sun')?.longitude;
  const moon = planets.find(planet => planet.name === 'Moon')?.longitude;
  const birth = sun != null && moon != null && ascendantLongitude != null ? birthHalves(sun, moon, ascendantLongitude) : null;
  const birthRule = birth ? birth.day === !birth.bright : null;
  const reasons = [
    rahuSign == null ? 'Rahu position unavailable' : rahuOutsideLagna ? `Rahu is outside Lagna (sign ${rahuSign})` : 'Rahu occupies Lagna',
    lagnaLordSign == null ? `${lagnaLord} position unavailable` : relativeHouse == null ? 'Relative house unavailable' : `Rahu is ${relativeHouse}H from Lagna lord ${lagnaLord}`,
    kendraOrTrikona ? 'Kendra/trikona condition is met' : 'Kendra/trikona condition is not met',
    ...(birth ? [`Born by ${birth.day ? 'day' : 'night'} in the ${birth.bright ? 'bright' : 'dark'} half of the month`, birthRule ? 'Day with the dark half or night with the bright half: the condition of 46.23 is met' : 'Day with the dark half or night with the bright half: the condition of 46.23 is not met'] : []),
  ];
  return { eligible: rahuRule || birthRule === true, rahuRule, birthRule, method: 'BPHS/PVR Rahu condition', ascendantSign, lagnaLord, lagnaLordSign, rahuSign, relativeHouse, reasons };
}

export const ASHTOTTARI_DEFINITIONS = [
  { key: 'sun', name: 'Sun', lord: 'Sun', years: 6 },
  { key: 'moon', name: 'Moon', lord: 'Moon', years: 15 },
  { key: 'mars', name: 'Mars', lord: 'Mars', years: 8 },
  { key: 'mercury', name: 'Mercury', lord: 'Mercury', years: 17 },
  { key: 'saturn', name: 'Saturn', lord: 'Saturn', years: 10 },
  { key: 'jupiter', name: 'Jupiter', lord: 'Jupiter', years: 19 },
  { key: 'rahu', name: 'Rahu', lord: 'Rahu', years: 12 },
  { key: 'venus', name: 'Venus', lord: 'Venus', years: 21 },
] as const;

export type Segment = { name: string; start: number; end: number; lordIndex: number };
// BPHS uses 28 divisions here. Uttara Ashadha contributes its first three padas,
// Abhijit spans its fourth pada plus the first 1/15 of Shravana, and the remaining
// Shravana arc forms the following segment.
const ABHIJIT_START = 276 + 2 / 3; // 276°40′
const ABHIJIT_END = 280 + 8 / 9;   // 280°53′20″

const ASHTOTTARI_GROUPS = [4, 3, 4, 3, 4, 3, 4, 3];

function lordIndexForSequencePosition(position: number, groupSizes: readonly number[]) {
  let cursor = 0;
  for (let lordIndex = 0; lordIndex < groupSizes.length; lordIndex++) {
    cursor += groupSizes[lordIndex];
    if (position < cursor) return lordIndex;
  }
  return 0;
}

/**
 * The 28 divisions of the sky with Abhijit, counted from the nakṣatra `startName` and given to the lords in groups of the sizes
 * `groupSizes` (4, 3, 4, 3… for the Aṣṭottarī, 3, 4, 3, 4… for the Ṣaṣṭihāyanī).
 */
export function groupedSegments(startName: string, groupSizes: readonly number[]): Segment[] {
  const chronological: Omit<Segment, 'lordIndex'>[] = [];
  for (let index = 0; index < NAKSHATRA_NAMES.length; index++) {
    const start = index * NAKSHATRA_SIZE;
    const end = (index + 1) * NAKSHATRA_SIZE;
    if (index === 20) chronological.push({ name: NAKSHATRA_NAMES[index], start, end: ABHIJIT_START });
    else if (index === 21) {
      chronological.push({ name: 'Abhijit', start: ABHIJIT_START, end: ABHIJIT_END });
      chronological.push({ name: NAKSHATRA_NAMES[index], start: ABHIJIT_END, end });
    } else chronological.push({ name: NAKSHATRA_NAMES[index], start, end });
  }

  // The allocation begins at the named nakshatra (Ardra for the Aṣṭottarī); rotate the 28 segments before
  // applying the alternating nakshatra group sizes.
  const startIndex = chronological.findIndex(segment => segment.name === startName);
  const rotated = [...chronological.slice(startIndex), ...chronological.slice(0, startIndex)];
  return rotated.map((segment, position) => ({ ...segment, lordIndex: lordIndexForSequencePosition(position, groupSizes) }));
}

/** The division a longitude is in, and the part of it still to pass (0 to 1). */
export function segmentOf(segments: readonly Segment[], longitude: number) {
  const normalized = normalizeDegrees(longitude);
  const segment = segments.find(item => normalized >= item.start && normalized < item.end) ?? segments.at(-1)!;
  return { segment, fractionRemaining: (segment.end - normalized) / (segment.end - segment.start) };
}

const SEGMENTS = groupedSegments('Ardra', ASHTOTTARI_GROUPS);

export function calculateAshtottari(moonLongitude: number, birthDate: Date) {
  const { segment, fractionRemaining } = segmentOf(SEGMENTS, moonLongitude);
  const definition = ASHTOTTARI_DEFINITIONS[segment.lordIndex];
  return {
    nakshatra: segment.name,
    startLord: definition.lord,
    entries: buildDashaTimeline(ASHTOTTARI_DEFINITIONS, segment.lordIndex, definition.years * fractionRemaining, birthDate),
  };
}

export function calculateAshtottariSubDashas(parent: NakshatraDashaEntry) {
  return buildDashaSubPeriods(parent, ASHTOTTARI_DEFINITIONS);
}
