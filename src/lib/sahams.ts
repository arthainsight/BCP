import type { ChartData } from '@/types';
import { calcSolarTimes } from './panchang/solar';
import { normalizeDegrees } from './angles';

const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const NAKSHATRAS = ['Aśvinī', 'Bharaṇī', 'Kṛttikā', 'Rohiṇī', 'Mṛgaśīrṣa', 'Ārdrā', 'Punarvasu', 'Puṣya', 'Āśleṣā', 'Maghā', 'Pūrvaphālgunī', 'Uttaraphālgunī', 'Hasta', 'Citrā', 'Svātī', 'Viśākhā', 'Anurādhā', 'Jyeṣṭhā', 'Mūla', 'Pūrvāṣāḍhā', 'Uttarāṣāḍhā', 'Śravaṇa', 'Dhaniṣṭhā', 'Śatabhiṣaj', 'Pūrvabhādrapadā', 'Uttarabhādrapadā', 'Revatī'];

export type SahamResult = {
  key: string;
  name: string;
  meaning: string;
  longitude: number;
  sign: number;
  signName: string;
  degree: number;
  house: number;
  nakshatra: string;
  pada: number;
  formula: string;
};

type Context = {
  asc: number;
  night: boolean;
  planet: (name: string) => number;
  house: (number: number) => number;
  lord: (sign: number) => number;
  part: (a: number, b: number, c: number, reverseAtNight?: boolean) => number;
};

type Definition = { key: string; name: string; meaning: string; formula: string; calculate: (ctx: Context, values: Record<string, number>) => number };

function norm360(value: number): number { return normalizeDegrees(value); }

// Tajika correction: add 30° when C is not encountered while moving zodiacally
// from B toward A. The comparison is made by rāśi, as in the classical method.
function isCBetweenBToA(a: number, b: number, c: number): boolean {
  const aSign = Math.floor(norm360(a) / 30);
  const bSign = Math.floor(norm360(b) / 30);
  const cSign = Math.floor(norm360(c) / 30);
  for (let n = bSign; n < bSign + 11; n++) {
    const next = (n + 1) % 12;
    if (next === cSign) return true;
    if (next === aSign) return false;
  }
  return false;
}

function correctedPart(a: number, b: number, c: number): number {
  return norm360(a - b + c + (isCBetweenBToA(a, b, c) ? 0 : 30));
}

function parseBirth(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  return { year: +match[1], month: +match[2], day: +match[3], hours: +match[4] + +match[5] / 60 + +(match[6] ?? 0) / 3600 };
}

export function isNightBirth(chart: ChartData, birthDatetime: string): boolean {
  const birth = parseBirth(birthDatetime);
  const debug = chart.debug;
  if (!birth || !debug) {
    const sun = chart.planets.find((planet) => planet.name === 'Sun');
    return sun ? sun.house < 7 : false;
  }
  const solar = calcSolarTimes(birth.year, birth.month, birth.day, debug.latitude, debug.longitude);
  if (solar.sunrise === null || solar.sunset === null) {
    const sun = chart.planets.find((planet) => planet.name === 'Sun');
    return sun ? sun.house < 7 : false;
  }
  const local = (utc: number) => ((utc + debug.utcOffset) % 24 + 24) % 24;
  const sunrise = local(solar.sunrise);
  const sunset = local(solar.sunset);
  return birth.hours < sunrise || birth.hours >= sunset;
}

const DEFINITIONS: Definition[] = [
  { key: 'punya', name: 'Puṇya', meaning: 'Fortune, good deeds', formula: 'Moon − Sun + Lagna', calculate: (c) => c.part(c.planet('Moon'), c.planet('Sun'), c.asc) },
  { key: 'vidya', name: 'Vidyā', meaning: 'Learning, education', formula: 'Sun − Moon + Lagna', calculate: (c) => c.part(c.planet('Sun'), c.planet('Moon'), c.asc) },
  { key: 'yasas', name: 'Yaśas', meaning: 'Fame, recognition', formula: 'Jupiter − Puṇya + Lagna', calculate: (c, v) => c.part(c.planet('Jupiter'), v.punya, c.asc) },
  { key: 'mitra', name: 'Mitra', meaning: 'Friends, allies', formula: 'Jupiter − Puṇya + Venus', calculate: (c, v) => c.part(c.planet('Jupiter'), v.punya, c.planet('Venus')) },
  { key: 'mahatmya', name: 'Māhātmya', meaning: 'Greatness, eminence', formula: 'Puṇya − Mars + Lagna', calculate: (c, v) => c.part(v.punya, c.planet('Mars'), c.asc) },
  { key: 'asha', name: 'Āśā', meaning: 'Hope, desire', formula: 'Saturn − Mars + Lagna', calculate: (c) => c.part(c.planet('Saturn'), c.planet('Mars'), c.asc) },
  { key: 'samartha', name: 'Samartha', meaning: 'Ability, enterprise', formula: 'Mars − Lagna lord + Lagna', calculate: (c) => {
    const lordName = SIGN_LORDS[Math.floor(c.asc / 30)];
    const useJupiter = lordName === 'Mars';
    const a = c.planet('Mars');
    const b = c.planet(useJupiter ? 'Jupiter' : lordName);
    return useJupiter ? c.part(b, a, c.asc) : c.part(a, b, c.asc);
  } },
  { key: 'bhratri', name: 'Bhrātṛ', meaning: 'Siblings', formula: 'Jupiter − Saturn + Lagna', calculate: (c) => c.part(c.planet('Jupiter'), c.planet('Saturn'), c.asc, false) },
  { key: 'gaurava', name: 'Gaurava', meaning: 'Respect, regard', formula: 'Jupiter − Moon + Sun', calculate: (c) => c.part(c.planet('Jupiter'), c.planet('Moon'), c.planet('Sun')) },
  { key: 'pitri', name: 'Pitṛ', meaning: 'Father', formula: 'Saturn − Sun + Lagna', calculate: (c) => c.part(c.planet('Saturn'), c.planet('Sun'), c.asc) },
  { key: 'rajya', name: 'Rājya', meaning: 'Position, authority', formula: 'Saturn − Sun + Lagna', calculate: (c) => c.part(c.planet('Saturn'), c.planet('Sun'), c.asc) },
  { key: 'matri', name: 'Mātṛ', meaning: 'Mother', formula: 'Moon − Venus + Lagna', calculate: (c) => c.part(c.planet('Moon'), c.planet('Venus'), c.asc) },
  { key: 'putra', name: 'Putra', meaning: 'Children', formula: 'Jupiter − Moon + Lagna', calculate: (c) => c.part(c.planet('Jupiter'), c.planet('Moon'), c.asc) },
  { key: 'jeeva', name: 'Jīva', meaning: 'Life, vitality', formula: 'Saturn − Jupiter + Lagna', calculate: (c) => c.part(c.planet('Saturn'), c.planet('Jupiter'), c.asc) },
  { key: 'karma', name: 'Karma', meaning: 'Work, action', formula: 'Mars − Mercury + Lagna', calculate: (c) => c.part(c.planet('Mars'), c.planet('Mercury'), c.asc) },
  { key: 'roga', name: 'Roga', meaning: 'Disease', formula: 'Lagna − Moon + Lagna', calculate: (c) => norm360(c.asc - c.planet('Moon') + c.asc) },
  { key: 'kali', name: 'Kālī', meaning: 'Great misfortune', formula: 'Jupiter − Mars + Lagna', calculate: (c) => c.part(c.planet('Jupiter'), c.planet('Mars'), c.asc) },
  { key: 'sastra', name: 'Śāstra', meaning: 'Sciences, scripture', formula: 'Jupiter − Saturn + Mercury', calculate: (c) => c.part(c.planet('Jupiter'), c.planet('Saturn'), c.planet('Mercury')) },
  { key: 'bandhu', name: 'Bandhu', meaning: 'Relatives, kin', formula: 'Mercury − Moon + Lagna', calculate: (c) => c.part(c.planet('Mercury'), c.planet('Moon'), c.asc) },
  { key: 'mrityu', name: 'Mṛtyu', meaning: 'Death, ending', formula: '8th house − Moon + Lagna', calculate: (c) => correctedPart(c.house(8), c.planet('Moon'), c.asc) },
  { key: 'paradesa', name: 'Paradeśa', meaning: 'Foreign lands', formula: '9th house − 9th lord + Lagna', calculate: (c) => correctedPart(c.house(9), c.lord(Math.floor(c.house(9) / 30)), c.asc) },
  { key: 'artha', name: 'Artha', meaning: 'Money, resources', formula: '2nd house − 2nd lord + Lagna', calculate: (c) => correctedPart(c.house(2), c.lord(Math.floor(c.house(2) / 30)), c.asc) },
  { key: 'paradara', name: 'Paradāra', meaning: 'Other relationships', formula: 'Venus − Sun + Lagna', calculate: (c) => c.part(c.planet('Venus'), c.planet('Sun'), c.asc) },
  { key: 'vanika', name: 'Vaṇik', meaning: 'Commerce, trade', formula: 'Moon − Mercury + Lagna', calculate: (c) => c.part(c.planet('Moon'), c.planet('Mercury'), c.asc) },
  { key: 'karyasiddhi', name: 'Kāryasiddhi', meaning: 'Success in endeavours', formula: 'Saturn − luminary + its sign lord', calculate: (c) => {
    const luminary = c.night ? 'Moon' : 'Sun';
    const lon = c.planet(luminary);
    return correctedPart(c.planet('Saturn'), lon, c.lord(Math.floor(lon / 30)));
  } },
  { key: 'vivaha', name: 'Vivāha', meaning: 'Marriage', formula: 'Venus − Saturn + Lagna', calculate: (c) => c.part(c.planet('Venus'), c.planet('Saturn'), c.asc) },
  { key: 'santapa', name: 'Santāpa', meaning: 'Sorrow, distress', formula: 'Saturn − Moon + 6th house', calculate: (c) => c.part(c.planet('Saturn'), c.planet('Moon'), c.house(6)) },
  { key: 'sraddha', name: 'Śraddhā', meaning: 'Devotion, sincerity', formula: 'Venus − Mars + Lagna', calculate: (c) => c.part(c.planet('Venus'), c.planet('Mars'), c.asc) },
  { key: 'preeti', name: 'Prīti', meaning: 'Love, attachment', formula: 'Śāstra − Puṇya + Lagna', calculate: (c, v) => c.part(v.sastra, v.punya, c.asc) },
  { key: 'jadya', name: 'Jāḍya', meaning: 'Chronic disease, inertia', formula: 'Mars − Saturn + Mercury', calculate: (c) => c.part(c.planet('Mars'), c.planet('Saturn'), c.planet('Mercury')) },
  { key: 'vyapara', name: 'Vyāpāra', meaning: 'Business, occupation', formula: 'Mars − Saturn + Lagna', calculate: (c) => c.part(c.planet('Mars'), c.planet('Saturn'), c.asc, false) },
  { key: 'satru', name: 'Śatru', meaning: 'Enemies, opposition', formula: 'Mars − Saturn + Lagna', calculate: (c) => c.part(c.planet('Mars'), c.planet('Saturn'), c.asc) },
  { key: 'jalapatana', name: 'Jalapatana', meaning: 'Ocean crossing, sea travel', formula: 'Cancer 15° − Saturn + Lagna', calculate: (c) => c.part(105, c.planet('Saturn'), c.asc) },
  { key: 'bandhana', name: 'Bandhana', meaning: 'Confinement, imprisonment', formula: 'Puṇya − Saturn + Lagna', calculate: (c, v) => c.part(v.punya, c.planet('Saturn'), c.asc) },
  { key: 'apamrityu', name: 'Apamṛtyu', meaning: 'Untimely death, danger', formula: '8th house − Mars + Lagna', calculate: (c) => c.part(c.house(8), c.planet('Mars'), c.asc) },
  { key: 'labha', name: 'Lābha', meaning: 'Material gains', formula: '11th house − 11th lord + Lagna', calculate: (c) => c.part(c.house(11), c.lord(Math.floor(c.house(11) / 30)), c.asc) },
];

export function calculateSahams(chart: ChartData, birthDatetime: string): { night: boolean; rows: SahamResult[] } {
  const night = isNightBirth(chart, birthDatetime);
  const asc = chart.ascendant.longitude;
  const planetMap = new Map(chart.planets.map((planet) => [planet.name, planet.longitude]));
  const planet = (name: string) => {
    const longitude = planetMap.get(name);
    if (longitude === undefined) throw new Error(`Missing ${name} for Saham calculation`);
    return longitude;
  };
  const house = (number: number) => asc + (number - 1) * 30;
  const lord = (sign: number) => planet(SIGN_LORDS[((sign % 12) + 12) % 12]);
  const part = (a: number, b: number, c: number, reverseAtNight = true) => night && reverseAtNight ? correctedPart(b, a, c) : correctedPart(a, b, c);
  const context: Context = { asc, night, planet, house, lord, part };
  const values: Record<string, number> = {};

  const rows = DEFINITIONS.map((definition) => {
    const longitude = norm360(definition.calculate(context, values));
    values[definition.key] = longitude;
    const signIndex = Math.floor(longitude / 30);
    const degree = longitude % 30;
    const nakshatraIndex = Math.floor(longitude / (360 / 27));
    const pada = Math.floor((longitude % (360 / 27)) / (360 / 108)) + 1;
    return {
      key: definition.key, name: definition.name, meaning: definition.meaning, longitude,
      sign: signIndex + 1, signName: SIGN_NAMES[signIndex], degree,
      house: ((signIndex - (chart.ascendant.sign - 1) + 12) % 12) + 1,
      nakshatra: NAKSHATRAS[nakshatraIndex], pada, formula: definition.formula,
    };
  });
  return { night, rows };
}