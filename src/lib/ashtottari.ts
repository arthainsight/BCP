import { buildDashaSubPeriods, buildDashaTimeline, type NakshatraDashaEntry } from './nakshatraDasha';
import { normalizeDegrees } from './angles';

type EligibilityPlanet = { name: string; sign: number };
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'] as const;

export interface AshtottariEligibility {
  eligible: boolean;
  method: 'BPHS/PVR Rahu condition';
  ascendantSign: number;
  lagnaLord: string;
  lagnaLordSign: number | null;
  rahuSign: number | null;
  relativeHouse: number | null;
  reasons: string[];
}

export function evaluateAshtottariEligibility(planets: EligibilityPlanet[], ascendantSign: number): AshtottariEligibility {
  const ascIndex = ((ascendantSign - 1) % 12 + 12) % 12;
  const lagnaLord = SIGN_LORDS[ascIndex];
  const lagnaLordSign = planets.find(planet => planet.name === lagnaLord)?.sign ?? null;
  const rahuSign = planets.find(planet => planet.name === 'Rahu')?.sign ?? null;
  const relativeHouse = lagnaLordSign && rahuSign ? ((rahuSign - lagnaLordSign + 12) % 12) + 1 : null;
  const rahuOutsideLagna = rahuSign != null && rahuSign !== ascendantSign;
  const kendraOrTrikona = relativeHouse != null && [1, 4, 5, 7, 9, 10].includes(relativeHouse);
  const reasons = [
    rahuSign == null ? 'Rahu position unavailable' : rahuOutsideLagna ? `Rahu is outside Lagna (sign ${rahuSign})` : 'Rahu occupies Lagna',
    lagnaLordSign == null ? `${lagnaLord} position unavailable` : relativeHouse == null ? 'Relative house unavailable' : `Rahu is ${relativeHouse}H from Lagna lord ${lagnaLord}`,
    kendraOrTrikona ? 'Kendra/trikona condition is met' : 'Kendra/trikona condition is not met',
  ];
  return { eligible: rahuOutsideLagna && kendraOrTrikona, method: 'BPHS/PVR Rahu condition', ascendantSign, lagnaLord, lagnaLordSign, rahuSign, relativeHouse, reasons };
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

type Segment = { name: string; start: number; end: number; lordIndex: number };
const NAKSHATRA_SPAN = 360 / 27;
const regularNames = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha',
  'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// BPHS uses 28 divisions here. Uttara Ashadha contributes its first three padas,
// Abhijit spans its fourth pada plus the first 1/15 of Shravana, and the remaining
// Shravana arc forms the following segment.
const ABHIJIT_START = 276 + 2 / 3; // 276°40′
const ABHIJIT_END = 280 + 8 / 9;   // 280°53′20″

function lordIndexForSequencePosition(position: number) {
  const groupSizes = [4, 3, 4, 3, 4, 3, 4, 3];
  let cursor = 0;
  for (let lordIndex = 0; lordIndex < groupSizes.length; lordIndex++) {
    cursor += groupSizes[lordIndex];
    if (position < cursor) return lordIndex;
  }
  return 0;
}

function buildSegments(): Segment[] {
  const chronological: Omit<Segment, 'lordIndex'>[] = [];
  for (let index = 0; index < regularNames.length; index++) {
    const start = index * NAKSHATRA_SPAN;
    const end = (index + 1) * NAKSHATRA_SPAN;
    if (index === 20) chronological.push({ name: regularNames[index], start, end: ABHIJIT_START });
    else if (index === 21) {
      chronological.push({ name: 'Abhijit', start: ABHIJIT_START, end: ABHIJIT_END });
      chronological.push({ name: regularNames[index], start: ABHIJIT_END, end });
    } else chronological.push({ name: regularNames[index], start, end });
  }

  // The classical allocation begins at Ardra; rotate the 28 segments before
  // applying the alternating 4/3 nakshatra group sizes.
  const ardraIndex = chronological.findIndex(segment => segment.name === 'Ardra');
  const rotated = [...chronological.slice(ardraIndex), ...chronological.slice(0, ardraIndex)];
  return rotated.map((segment, position) => ({ ...segment, lordIndex: lordIndexForSequencePosition(position) }));
}

const SEGMENTS = buildSegments();

export function calculateAshtottari(moonLongitude: number, birthDate: Date) {
  const longitude = normalizeDegrees(moonLongitude);
  const segment = SEGMENTS.find(item => longitude >= item.start && longitude < item.end) ?? SEGMENTS.at(-1)!;
  const fractionRemaining = (segment.end - longitude) / (segment.end - segment.start);
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
