import { buildDashaSubPeriods, buildDashaTimeline, type NakshatraDashaDefinition, type NakshatraDashaEntry } from './nakshatraDasha';
import { groupedSegments, segmentOf } from './ashtottari';
import { birthHalves, horaLord, navamshaSign } from './birthConditions';
import { normalizeDegrees } from './angles';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';
import { SIGN_LORDS, signName } from './signs';

/**
 * The eight conditional nakṣatra daśās of BPHS 46.24–43. Each is a daśā of fixed years for a birth that meets a condition of its own:
 * the nakṣatra of the Moon, counted from a starting nakṣatra (the count includes both, as in the Viṃśottarī of 46.13) and divided by the
 * number of lords, gives the lord the daśā begins with; the part of the nakṣatra still to pass gives the balance, and the sub-periods
 * are the years of the daśā times the years of the lord over the total (51.1).
 */
export type NakshatraSystemKey =
  | 'shodashottari' | 'dvadashottari' | 'panchottari' | 'shatabdika'
  | 'chaturashitisama' | 'dvisaptatisama' | 'shashtihayani' | 'shattrimshatsama';

export interface ConditionChart {
  planets: { name: string; longitude: number; sign: number }[];
  ascendant: { longitude: number; sign: number };
}

/** A sentence of what was found in the chart: an English template with `{name}` places, and the values to fill them with. */
export interface ConditionFact { template: string; values?: Record<string, string> }

export interface ConditionResult {
  met: boolean | null;
  /** What was found in the chart, for the panel to show beside the condition. */
  facts: ConditionFact[];
}

export interface NakshatraSystem {
  key: NakshatraSystemKey;
  /** Name with the diacritics, as the panel titles it. */
  name: string;
  /** The verses of BPHS chapter 46 that give it. */
  verses: string;
  /** The condition, as the text says it, in English. */
  condition: string;
  lords: readonly { lord: string; years: number }[];
  /** The text does not say which of two readings of the condition is meant; shown with the condition. */
  note?: string;
  evaluate(chart: ConditionChart): ConditionResult;
}

const lords = (names: readonly string[], years: readonly number[]) => names.map((lord, index) => ({ lord, years: years[index] }));
const range = (from: number, count: number, step = 1) => Array.from({ length: count }, (_, index) => from + index * step);

const planetSign = (chart: ConditionChart, name: string) => chart.planets.find(planet => planet.name === name)?.sign ?? null;
/** The sign of the nth house from the Lagna, counting the Lagna as the 1st. */
const houseSign = (chart: ConditionChart, house: number) => (chart.ascendant.sign + house - 2) % 12 + 1;
const lordOf = (sign: number) => SIGN_LORDS[sign - 1];

function horaCondition(chart: ConditionChart, want: (bright: boolean, day: boolean, hora: 'Sun' | 'Moon') => boolean): ConditionResult {
  const sun = chart.planets.find(planet => planet.name === 'Sun');
  const moon = chart.planets.find(planet => planet.name === 'Moon');
  if (!sun || !moon) return { met: null, facts: [{ template: 'The Sun or the Moon is not known' }] };
  const hora = horaLord(chart.ascendant.longitude);
  const { day, bright } = birthHalves(sun.longitude, moon.longitude, chart.ascendant.longitude);
  const met = want(bright, day, hora);
  return { met, facts: [{ template: hora === 'Sun' ? 'The Lagna is in the Sun\'s hora' : 'The Lagna is in the Moon\'s hora' }, { template: `Born by ${day ? 'day' : 'night'} in the ${bright ? 'bright' : 'dark'} half of the month` }] };
}

export const NAKSHATRA_SYSTEMS: readonly NakshatraSystem[] = [
  {
    key: 'shodashottari', name: 'Ṣoḍaśottarī', verses: '46.24–26',
    condition: 'The Lagna in the Moon\'s hora in the dark half of the month, or in the Sun\'s hora in the bright half. Counted from Puṣya, divided by 8.',
    lords: lords(['Sun', 'Mars', 'Jupiter', 'Saturn', 'Ketu', 'Moon', 'Mercury', 'Venus'], range(11, 8)),
    evaluate: chart => horaCondition(chart, (bright, _day, hora) => bright ? hora === 'Sun' : hora === 'Moon'),
  },
  {
    key: 'dvadashottari', name: 'Dvādaśottarī', verses: '46.27–28',
    condition: 'Born in a navāṁśa of Venus. Counted from the birth nakṣatra to Revatī, divided by 8.',
    note: 'The verse says "born in the navāṁśa of Venus" without saying of what; the navāṁśa of the Lagna is taken.',
    lords: lords(['Sun', 'Jupiter', 'Ketu', 'Mercury', 'Rahu', 'Mars', 'Saturn', 'Moon'], range(7, 8, 2)),
    evaluate: chart => {
      const sign = navamshaSign(chart.ascendant.longitude);
      return { met: lordOf(sign) === 'Venus', facts: [{ template: 'The navāṁśa of the Lagna is {sign}, ruled by {lord}', values: { sign: signName(sign), lord: lordOf(sign) } }] };
    },
  },
  {
    key: 'panchottari', name: 'Pañcottarī', verses: '46.29–31',
    condition: 'The Lagna Cancer, in the navāṁśa that the Sun goes to (the Lagna and the Sun in the same navāṁśa sign). Counted from the friendly nakṣatra (Anurādhā, whose god is Mitra), divided by 7.',
    note: '"Mitrarkṣa" is read as Anurādhā, the nakṣatra of Mitra; "the Sun\'s aṃśa" as the navāṁśa sign the Sun stands in.',
    lords: lords(['Sun', 'Mercury', 'Saturn', 'Mars', 'Venus', 'Moon', 'Jupiter'], range(12, 7)),
    evaluate: (chart): ConditionResult => {
      const sign = navamshaSign(chart.ascendant.longitude);
      const sun = chart.planets.find(planet => planet.name === 'Sun');
      const sunSign = sun ? navamshaSign(sun.longitude) : null;
      return {
        met: chart.ascendant.sign !== 4 ? false : sunSign == null ? null : sign === sunSign,
        facts: [
          { template: 'The Lagna is {sign}', values: { sign: signName(chart.ascendant.sign) } },
          { template: 'The navāṁśa of the Lagna is {sign}', values: { sign: signName(sign) } },
          ...(sunSign == null ? [] : [{ template: 'The navāṁśa of the Sun is {sign}', values: { sign: signName(sunSign) } }]),
        ],
      };
    },
  },
  {
    key: 'shatabdika', name: 'Śatābdikā', verses: '46.32–34',
    condition: 'The Lagna Vargottama (the same sign in the rāśi and in the navāṁśa). Counted from Revatī, divided by 7.',
    lords: lords(['Sun', 'Moon', 'Venus', 'Mercury', 'Jupiter', 'Mars', 'Saturn'], [5, 5, 10, 10, 20, 20, 30]),
    evaluate: chart => {
      const sign = navamshaSign(chart.ascendant.longitude);
      return { met: sign === chart.ascendant.sign, facts: [{ template: 'The Lagna is {sign}, its navāṁśa {navamsha}', values: { sign: signName(chart.ascendant.sign), navamsha: signName(sign) } }] };
    },
  },
  {
    key: 'chaturashitisama', name: 'Caturaśītisamā', verses: '46.35–36',
    condition: 'The lord of the 10th house in the 10th house. Counted from Svāti, divided by 7.',
    lords: lords(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'], range(12, 7, 0)),
    evaluate: (chart): ConditionResult => {
      const tenth = houseSign(chart, 10);
      const lord = lordOf(tenth);
      const at = planetSign(chart, lord);
      return { met: at == null ? null : at === tenth, facts: [at == null
        ? { template: 'The 10th house is {sign}, its lord {lord} is not known', values: { sign: signName(tenth), lord } }
        : { template: 'The 10th house is {sign}, its lord {lord} is in {at}', values: { sign: signName(tenth), lord, at: signName(at) } }] };
    },
  },
  {
    key: 'dvisaptatisama', name: 'Dvisaptatisamā', verses: '46.37–39',
    condition: 'The lord of the Lagna in the 7th house, or the lord of the 7th in the Lagna. Counted from Mūla, divided by 8.',
    lords: lords(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'], range(9, 8, 0)),
    evaluate: chart => {
      const lagna = chart.ascendant.sign;
      const seventh = houseSign(chart, 7);
      const lagnaLord = lordOf(lagna);
      const seventhLord = lordOf(seventh);
      const lagnaLordAt = planetSign(chart, lagnaLord);
      const seventhLordAt = planetSign(chart, seventhLord);
      return {
        met: lagnaLordAt == null || seventhLordAt == null ? null : lagnaLordAt === seventh || seventhLordAt === lagna,
        facts: [
          { template: 'The lord of the Lagna, {lord}, is in {at}', values: { lord: lagnaLord, at: lagnaLordAt == null ? '?' : signName(lagnaLordAt) } },
          { template: 'The lord of the 7th, {lord}, is in {at}', values: { lord: seventhLord, at: seventhLordAt == null ? '?' : signName(seventhLordAt) } },
        ],
      };
    },
  },
  {
    key: 'shashtihayani', name: 'Ṣaṣṭihāyanī', verses: '46.40–42',
    condition: 'The Sun in the sign of the Lagna. Counted from Aśvinī in groups of 3, 4, 3, 4… nakṣatras (28 with Abhijit).',
    note: 'The text counts 3, 4, 3… without naming Abhijit; the 28 divisions of the Aṣṭottarī are taken, as the eight groups come to 28.',
    lords: lords(['Jupiter', 'Sun', 'Mars', 'Moon', 'Mercury', 'Venus', 'Saturn', 'Rahu'], [10, 10, 10, 6, 6, 6, 6, 6]),
    evaluate: chart => {
      const sun = planetSign(chart, 'Sun');
      return { met: sun == null ? null : sun === chart.ascendant.sign, facts: [{ template: 'The Sun is in {sun}, the Lagna is {lagna}', values: { sun: sun == null ? '?' : signName(sun), lagna: signName(chart.ascendant.sign) } }] };
    },
  },
  {
    key: 'shattrimshatsama', name: 'Ṣaṭtriṃśatsamā', verses: '46.42–43',
    condition: 'The Lagna in the Sun\'s hora by day, or in the Moon\'s hora by night. Counted from Śravaṇa, divided by 8.',
    lords: lords(['Moon', 'Sun', 'Jupiter', 'Mars', 'Mercury', 'Saturn', 'Venus', 'Rahu'], range(1, 8)),
    evaluate: chart => horaCondition(chart, (_bright, day, hora) => day ? hora === 'Sun' : hora === 'Moon'),
  },
];

export const NAKSHATRA_SYSTEM_KEYS: readonly NakshatraSystemKey[] = NAKSHATRA_SYSTEMS.map(system => system.key);
export const isNakshatraSystemKey = (key: string): key is NakshatraSystemKey => (NAKSHATRA_SYSTEM_KEYS as readonly string[]).includes(key);
export const nakshatraSystem = (key: NakshatraSystemKey) => NAKSHATRA_SYSTEMS.find(system => system.key === key)!;

/** Where each system starts counting: the index of a nakṣatra, or Revatī counted backwards from the birth star (Dvādaśottarī). */
const COUNT_FROM: Record<Exclude<NakshatraSystemKey, 'shashtihayani'>, number | 'toRevati'> = {
  shodashottari: NAKSHATRA_NAMES.indexOf('Pushya'),
  dvadashottari: 'toRevati',
  panchottari: NAKSHATRA_NAMES.indexOf('Anuradha'),
  shatabdika: NAKSHATRA_NAMES.indexOf('Revati'),
  chaturashitisama: NAKSHATRA_NAMES.indexOf('Swati'),
  dvisaptatisama: NAKSHATRA_NAMES.indexOf('Mula'),
  shattrimshatsama: NAKSHATRA_NAMES.indexOf('Shravana'),
};

const SHASHTIHAYANI_SEGMENTS = groupedSegments('Ashwini', [3, 4, 3, 4, 3, 4, 3, 4]);

/** The number of the birth nakṣatra in the count of a system (1 for the starting nakṣatra), both ends included. */
export function nakshatraCount(key: Exclude<NakshatraSystemKey, 'shashtihayani'>, nakshatraIndex: number): number {
  const from = COUNT_FROM[key];
  return from === 'toRevati' ? (26 - nakshatraIndex) % 27 + 1 : (nakshatraIndex - from + 27) % 27 + 1;
}

export function calculateNakshatraSystem(key: NakshatraSystemKey, moonLongitude: number, birthDate: Date) {
  const system = nakshatraSystem(key);
  const definitions: NakshatraDashaDefinition[] = system.lords.map(({ lord, years }) => ({ key: lord.toLowerCase(), name: lord, lord, years }));
  const longitude = normalizeDegrees(moonLongitude);
  let startIndex: number;
  let fractionRemaining: number;
  let nakshatra: string;
  if (key === 'shashtihayani') {
    const found = segmentOf(SHASHTIHAYANI_SEGMENTS, longitude);
    startIndex = found.segment.lordIndex;
    fractionRemaining = found.fractionRemaining;
    nakshatra = found.segment.name;
  } else {
    const index = Math.min(Math.floor(longitude / NAKSHATRA_SIZE), 26);
    const remainder = nakshatraCount(key, index) % definitions.length;
    startIndex = remainder === 0 ? definitions.length - 1 : remainder - 1;
    fractionRemaining = ((index + 1) * NAKSHATRA_SIZE - longitude) / NAKSHATRA_SIZE;
    nakshatra = NAKSHATRA_NAMES[index];
  }
  const first = definitions[startIndex];
  return {
    nakshatra,
    startLord: first.lord,
    totalYears: definitions.reduce((sum, definition) => sum + definition.years, 0),
    entries: buildDashaTimeline(definitions, startIndex, first.years * fractionRemaining, birthDate),
  };
}

export function nakshatraSystemSubDashas(key: NakshatraSystemKey, parent: NakshatraDashaEntry): NakshatraDashaEntry[] {
  const definitions: NakshatraDashaDefinition[] = nakshatraSystem(key).lords.map(({ lord, years }) => ({ key: lord.toLowerCase(), name: lord, lord, years }));
  return buildDashaSubPeriods(parent, definitions);
}

export function evaluateNakshatraSystem(key: NakshatraSystemKey, chart: ConditionChart): ConditionResult {
  return nakshatraSystem(key).evaluate(chart);
}
