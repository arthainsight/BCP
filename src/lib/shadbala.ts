// Ṣaḍbala engine (beta).
//
// Extracted from src/pages/VargaMatrix.jsx, where the calculation grew inside
// the card component as untyped JavaScript. The maths is unchanged; this module
// only gives it types and a home alongside the other calculation code so the
// fixtures in shadbala.test.ts can exercise it directly.
//
// Exactness follows the labels shown in the UI: Uccha, Ojhayugma, Kendradi,
// Drekkana, Paksha, Naisargika and Vara are table-exact; Saptavargaja, Dig,
// Natonnata, Tribhaga, Ayana, Cheshta and Drig are documented approximations.

import { getVargaSignIndex, getDegreesInSign } from './varga';
import { normalizeLongitude } from './varga/utils';

export type ShadbalaPlanet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
export type Dignity = 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated' | 'none';

export type ShadbalaChartPlanet = {
  name: string;
  longitude?: number;
  sign?: number;
  degree?: number;
  house?: number;
  isRetrograde?: boolean;
  /** Apparent geocentric motion in degrees per day. Drives Cheṣṭā Bala. */
  speed?: number;
  /** True equatorial declination in degrees. Drives Ayana Bala. */
  declination?: number;
};

export type ShadbalaChartLike = {
  ascendant?: { sign?: number; longitude?: number };
  planets?: ShadbalaChartPlanet[];
  debug?: {
    inputDateTime?: string;
    ayanamsa?: number;
    sunriseLocalHours?: number;
    sunsetLocalHours?: number;
    nextSunriseLocalHours?: number;
  };
};

export type SthanaBalaBreakdown = {
  uccha: number;
  saptavargaja: number;
  ojhayugma: number;
  kendradi: number;
  drekkana: number;
  total: number;
};

export type KalaBalaBreakdown = {
  sect: 'day' | 'night' | 'unknown';
  natonnata: number;
  paksha: number;
  tribhaaga: number;
  tribhagaLord: string | null;
  varsheshadi: number;
  ayana: number;
  total: number;
};

/** Local decimal hours for the birth day, when the ephemeris supplied them. */
type SunTimeContext = {
  birthHour: number;
  sunrise: number;
  sunset: number;
  nextSunrise: number;
};

export type ShadbalaRow = {
  planet: ShadbalaPlanet;
  house: number | null;
  retrograde: boolean;
  sthana: number;
  sthanaBreakdown: SthanaBalaBreakdown;
  dig: number;
  digVirupa: number;
  kala: number;
  kalaBreakdown: KalaBalaBreakdown;
  cheshta: number;
  cheshtaVirupa: number;
  naisargika: number;
  naisargikaVirupa: number;
  drik: number;
  drikVirupa: number;
  total: number;
  totalVirupa: number;
  requiredVirupa: number;
  ratio: number;
};

export const SCORE_PLANETS: readonly ShadbalaPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const BENEFICS: readonly ShadbalaPlanet[] = ['Moon', 'Mercury', 'Jupiter', 'Venus'];

const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const OWN_SIGNS: Record<ShadbalaPlanet, number[]> = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };
const EXALTATION_SIGNS: Record<ShadbalaPlanet, number> = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBILITATION_SIGNS: Record<ShadbalaPlanet, number> = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
const EXALTATION_LONGITUDES: Record<ShadbalaPlanet, number> = { Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200 };

export const SHADBALA_REQUIRED_VIRUPA: Record<ShadbalaPlanet, number> = { Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300 };
export const NAISARGIKA_BALA_VIRUPA: Record<ShadbalaPlanet, number> = { Sun: 60, Moon: 51, Venus: 43, Jupiter: 34, Mercury: 26, Mars: 17, Saturn: 9 };
export const DIG_BALA_MAX_HOUSE: Record<ShadbalaPlanet, number> = { Sun: 10, Mars: 10, Moon: 4, Venus: 4, Jupiter: 1, Mercury: 1, Saturn: 7 };

const ODD_EVEN_STRENGTH: Record<ShadbalaPlanet, 'odd' | 'even' | 'both'> = { Sun: 'odd', Mars: 'odd', Jupiter: 'odd', Moon: 'even', Venus: 'even', Mercury: 'both', Saturn: 'both' };
const DREKKANA_STRENGTH: Record<ShadbalaPlanet, number> = { Sun: 1, Mars: 1, Jupiter: 1, Mercury: 2, Saturn: 2, Moon: 3, Venus: 3 };
const DAY_NIGHT_STRENGTH: Record<ShadbalaPlanet, 'day' | 'night' | 'both'> = { Sun: 'day', Jupiter: 'day', Venus: 'day', Moon: 'night', Mars: 'night', Saturn: 'night', Mercury: 'both' };

const NATURAL_RELATIONS: Record<ShadbalaPlanet, { friends: string[]; neutral: string[]; enemies: string[] }> = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], neutral: ['Mercury'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], neutral: ['Venus', 'Saturn'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], neutral: ['Mars', 'Jupiter', 'Saturn'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], neutral: ['Saturn'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], neutral: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], neutral: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
};

// Classical Saptavargaja Bala virupa per dignity (BPHS Ch.27). Used as per-varga
// weights; the sum across 7 vargas is divided by 7 so max = 45.
//
// Still simplified in one respect: the classical table separates a great friend
// (22.5) from an ordinary friend (15) and a great enemy (1.875) from an enemy
// (3.75). Those compound grades need temporary (tatkalika) relationships, which
// this module does not model, so every friend scores 22.5 and every enemy 3.75.
const SAPTAVARGAJA_VIRUPA: Record<Dignity, number> = { exalted: 45, moolatrikona: 45, own: 30, friend: 22.5, neutral: 7.5, enemy: 3.75, debilitated: 0, none: 0 };

// Mūlatrikoṇa is a sign plus a degree band, unlike the other dignities which
// are whole-sign. Ranges are the classical ones: [signIndex, fromDegree, toDegree).
const MOOLATRIKONA: Record<ShadbalaPlanet, { sign: number; from: number; to: number }> = {
  Sun:     { sign: 4,  from: 0,  to: 20 },  // Leo 0–20°
  Moon:    { sign: 1,  from: 4,  to: 30 },  // Taurus 4–30°
  Mars:    { sign: 0,  from: 0,  to: 12 },  // Aries 0–12°
  Mercury: { sign: 5,  from: 16, to: 20 },  // Virgo 16–20°
  Jupiter: { sign: 8,  from: 0,  to: 10 },  // Sagittarius 0–10°
  Venus:   { sign: 6,  from: 0,  to: 15 },  // Libra 0–15°
  Saturn:  { sign: 10, from: 0,  to: 20 },  // Aquarius 0–20°
};

function isShadbalaPlanet(name: string): name is ShadbalaPlanet {
  return (SCORE_PLANETS as readonly string[]).includes(name);
}

export function virupaToRupa(virupa: number): number {
  return virupa / 60;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getPlanet(chart: ShadbalaChartLike, name: string): ShadbalaChartPlanet | undefined {
  return (chart?.planets ?? []).find((planet) => planet.name === name);
}

function getPlanetHouse(planet: ShadbalaChartPlanet | undefined, ascendantSign: number | undefined): number | null {
  if (typeof planet?.house === 'number') return planet.house;
  if (typeof planet?.sign !== 'number' || typeof ascendantSign !== 'number') return null;
  return ((planet.sign - ascendantSign + 12) % 12) + 1;
}

function circularHouseDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 12;
  return Math.min(raw, 12 - raw);
}

function circularDegreeDistance(a: number, b: number): number {
  const raw = Math.abs(normalizeLongitude(a) - normalizeLongitude(b));
  return Math.min(raw, 360 - raw);
}

/**
 * @param degreeInSign Position within the sign, 0–30. Only supply it when the
 *   degree is meaningful for the chart being judged — that is, the rāśi. Pass it
 *   and Mūlatrikoṇa can be distinguished from a plain own sign; omit it and the
 *   Mūlatrikoṇa band collapses into 'own' as before.
 */
export function getDignity(planet: string, signIndex: number | null | undefined, degreeInSign?: number): Dignity {
  if (!isShadbalaPlanet(planet) || typeof signIndex !== 'number') return 'none';
  if (DEBILITATION_SIGNS[planet] === signIndex) return 'debilitated';
  const moolatrikona = MOOLATRIKONA[planet];
  if (
    typeof degreeInSign === 'number' &&
    moolatrikona.sign === signIndex &&
    degreeInSign >= moolatrikona.from &&
    degreeInSign < moolatrikona.to
  ) {
    return 'moolatrikona';
  }
  if (EXALTATION_SIGNS[planet] === signIndex) return 'exalted';
  if (OWN_SIGNS[planet]?.includes(signIndex)) return 'own';
  const signLord = SIGN_LORDS[signIndex];
  const relation = NATURAL_RELATIONS[planet];
  if (relation?.friends.includes(signLord)) return 'friend';
  if (relation?.enemies.includes(signLord)) return 'enemy';
  return 'neutral';
}

export function calculateDigBalaVirupa(planetName: string, house: number | null | undefined): number {
  const maxHouse = isShadbalaPlanet(planetName) ? DIG_BALA_MAX_HOUSE[planetName] : undefined;
  if (!maxHouse || typeof house !== 'number') return 0;
  return clamp(60 * (1 - circularHouseDistance(house, maxHouse) / 6), 0, 60);
}

export function calculateUcchaBalaVirupa(planetName: string, longitude: number | undefined): number {
  const exaltLongitude = isShadbalaPlanet(planetName) ? EXALTATION_LONGITUDES[planetName] : undefined;
  if (typeof exaltLongitude !== 'number' || typeof longitude !== 'number') return 0;
  return clamp(60 * (1 - circularDegreeDistance(longitude, exaltLongitude) / 180), 0, 60);
}

export function calculateSaptavargajaBalaVirupa(planetName: string, longitude: number | undefined): number {
  if (typeof longitude !== 'number') return 0;
  return [1, 2, 3, 7, 9, 12, 30].reduce((sum, division) => {
    // Mūlatrikoṇa is a rāśi-level distinction: its degree bands are defined
    // against the natal sign, not against a position inside a divisional sign.
    const degreeInSign = division === 1 ? getDegreesInSign(longitude) : undefined;
    return sum + (SAPTAVARGAJA_VIRUPA[getDignity(planetName, getVargaSignIndex(longitude, division), degreeInSign)] ?? 0);
  }, 0) / 7;
}

export function calculateOjhayugmaBalaVirupa(planetName: string, longitude: number | undefined): number {
  const preference = isShadbalaPlanet(planetName) ? ODD_EVEN_STRENGTH[planetName] : undefined;
  if (!preference || typeof longitude !== 'number') return 0;
  if (preference === 'both') return 15;
  const signMatches = (signIndex: number) => (preference === 'odd' ? signIndex % 2 === 0 : signIndex % 2 === 1);
  return (signMatches(getVargaSignIndex(longitude, 1)) ? 15 : 0) + (signMatches(getVargaSignIndex(longitude, 9)) ? 15 : 0);
}

export function calculateKendradiBalaVirupa(house: number | null | undefined): number {
  if (typeof house !== 'number') return 0;
  if ([1, 4, 7, 10].includes(house)) return 60;
  if ([2, 5, 8, 11].includes(house)) return 30;
  return 15;
}

export function calculateDrekkanaBalaVirupa(planetName: string, longitude: number | undefined): number {
  const preferred = isShadbalaPlanet(planetName) ? DREKKANA_STRENGTH[planetName] : undefined;
  if (!preferred || typeof longitude !== 'number') return 0;
  return Math.floor(getDegreesInSign(longitude) / 10) + 1 === preferred ? 15 : 0;
}

export function calculateSthanaBalaBreakdown(planetName: string, planet: ShadbalaChartPlanet | undefined, house: number | null): SthanaBalaBreakdown {
  const longitude = planet?.longitude;
  const uccha = calculateUcchaBalaVirupa(planetName, longitude);
  const saptavargaja = calculateSaptavargajaBalaVirupa(planetName, longitude);
  const ojhayugma = calculateOjhayugmaBalaVirupa(planetName, longitude);
  const kendradi = calculateKendradiBalaVirupa(house);
  const drekkana = calculateDrekkanaBalaVirupa(planetName, longitude);
  return { uccha, saptavargaja, ojhayugma, kendradi, drekkana, total: uccha + saptavargaja + ojhayugma + kendradi + drekkana };
}

/** Birth hour as local decimal hours, parsed from "YYYY-MM-DD HH:MM:SS". */
function getBirthHour(chart: ShadbalaChartLike): number | null {
  const input = chart?.debug?.inputDateTime;
  const timeParts = input?.split(' ')[1]?.split(':');
  if (!timeParts) return null;
  const hours = Number(timeParts[0]);
  const minutes = Number(timeParts[1] ?? 0);
  const seconds = Number(timeParts[2] ?? 0);
  if (!Number.isFinite(hours)) return null;
  return hours + (Number.isFinite(minutes) ? minutes : 0) / 60 + (Number.isFinite(seconds) ? seconds : 0) / 3600;
}

/**
 * Real sunrise and sunset for the birth day, or null when the ephemeris did not
 * supply them — an older saved chart, or a polar latitude where the Sun never
 * crossed the horizon.
 */
function getSunTimes(chart: ShadbalaChartLike): SunTimeContext | null {
  const birthHour = getBirthHour(chart);
  const { sunriseLocalHours: sunrise, sunsetLocalHours: sunset, nextSunriseLocalHours: nextSunrise } = chart?.debug ?? {};
  if (birthHour === null || typeof sunrise !== 'number' || typeof sunset !== 'number' || typeof nextSunrise !== 'number') {
    return null;
  }
  return { birthHour, sunrise, sunset, nextSunrise };
}

function isDaytimeBirth(times: SunTimeContext): boolean {
  return times.birthHour >= times.sunrise && times.birthHour < times.sunset;
}

function estimateSect(chart: ShadbalaChartLike): 'day' | 'night' | 'unknown' {
  const times = getSunTimes(chart);
  if (times) return isDaytimeBirth(times) ? 'day' : 'night';
  // Fallback for charts calculated before sunrise data existed: the Sun above
  // the horizon means houses 7–12 under whole-sign houses.
  const sunHouse = getPlanetHouse(getPlanet(chart, 'Sun'), chart?.ascendant?.sign);
  if (typeof sunHouse !== 'number') return 'unknown';
  return [7, 8, 9, 10, 11, 12].includes(sunHouse) ? 'day' : 'night';
}

/**
 * Natonnata (Nata = night, Unnata = day) Bala.
 *
 * Classically this is continuous, not a binary day/night award: a planet's
 * strength grows with proximity to its preferred culmination. Day-strong
 * planets peak at local noon and fall to zero at midnight, night-strong planets
 * the reverse, and the two always sum to 60. Mercury takes the full 60 at every
 * hour. Local noon is the midpoint of the real sunrise and sunset rather than
 * clock 12:00, so the equation of time and the longitude offset inside the
 * timezone are both accounted for.
 */
function calculateNatonnataBalaVirupa(
  planetName: ShadbalaPlanet,
  sect: 'day' | 'night' | 'unknown',
  times: SunTimeContext | null,
): number {
  const preference = DAY_NIGHT_STRENGTH[planetName];
  if (preference === 'both') return 60;

  if (times) {
    const noon = (times.sunrise + times.sunset) / 2;
    // Distance from noon, wrapped so it never exceeds half a day.
    let fromNoon = Math.abs(times.birthHour - noon) % 24;
    if (fromNoon > 12) fromNoon = 24 - fromNoon;
    const dayStrength = 60 * (1 - fromNoon / 12);
    return clamp(preference === 'day' ? dayStrength : 60 - dayStrength, 0, 60);
  }

  // No sunrise data: fall back to the older all-or-nothing award.
  if (sect === 'unknown') return 0;
  return preference === sect ? 60 : 0;
}

function calculatePakshaBalaVirupa(chart: ShadbalaChartLike): Partial<Record<ShadbalaPlanet, number>> {
  const sun = getPlanet(chart, 'Sun');
  const moon = getPlanet(chart, 'Moon');
  if (typeof sun?.longitude !== 'number' || typeof moon?.longitude !== 'number') return {};
  const elongation = normalizeLongitude(moon.longitude - sun.longitude);
  const bright = elongation <= 180 ? (elongation / 180) * 60 : ((360 - elongation) / 180) * 60;
  const dark = 60 - bright;
  return { Moon: bright, Venus: bright, Jupiter: bright, Mercury: bright, Sun: dark, Mars: dark, Saturn: dark };
}

/**
 * Tribhāga lord for the birth moment.
 *
 * The day runs sunrise → sunset and the night sunset → next sunrise, each split
 * into three equal parts. Day thirds are ruled by Mercury, the Sun and Saturn;
 * night thirds by the Moon, Venus and Mars. Because the two spans are measured
 * from the real horizon crossings, the thirds are unequal whenever the day is
 * not exactly twelve hours — which is the classical intent.
 */
const TRIBHAGA_DAY_LORDS = ['Mercury', 'Sun', 'Saturn'];
const TRIBHAGA_NIGHT_LORDS = ['Moon', 'Venus', 'Mars'];

function getTribhagaLord(chart: ShadbalaChartLike): string | null {
  const times = getSunTimes(chart);

  if (times) {
    if (isDaytimeBirth(times)) {
      const third = (times.birthHour - times.sunrise) / ((times.sunset - times.sunrise) / 3);
      return TRIBHAGA_DAY_LORDS[Math.min(Math.max(Math.floor(third), 0), 2)];
    }
    // Night. A birth after sunset sits in the night starting tonight; a birth
    // before sunrise sits in the night that began the previous evening, whose
    // start is approximated by stepping one night length back from sunrise.
    const nightLength = times.nextSunrise - times.sunset;
    const nightStart = times.birthHour >= times.sunset ? times.sunset : times.sunrise - nightLength;
    const third = (times.birthHour - nightStart) / (nightLength / 3);
    return TRIBHAGA_NIGHT_LORDS[Math.min(Math.max(Math.floor(third), 0), 2)];
  }

  // No sunrise data: fall back to assuming a 6am/6pm horizon.
  const localHour = getBirthHour(chart);
  if (localHour === null) return null;
  if (localHour >= 6 && localHour < 18) return TRIBHAGA_DAY_LORDS[Math.min(Math.floor((localHour - 6) / 4), 2)];
  const nightHour = localHour >= 18 ? localHour - 18 : localHour + 6;
  return TRIBHAGA_NIGHT_LORDS[Math.min(Math.floor(nightHour / 4), 2)];
}

function calculateTribhaagaBalaVirupa(planetName: ShadbalaPlanet, chart: ShadbalaChartLike): number {
  if (planetName === 'Jupiter') return 60;
  return planetName === getTribhagaLord(chart) ? 60 : 0;
}

function calculateVarsheshadiBalaVirupa(planetName: ShadbalaPlanet, chart: ShadbalaChartLike): number {
  const input = chart?.debug?.inputDateTime;
  const date = input ? new Date(input) : null;
  const dayLords = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const lord = date && !Number.isNaN(date.getTime()) ? dayLords[date.getDay()] : null;
  if (!lord) return 0;
  if (planetName === lord) return 60;
  if (NATURAL_RELATIONS[planetName]?.friends.includes(lord)) return 30;
  if (NATURAL_RELATIONS[planetName]?.enemies.includes(lord)) return 0;
  return 15;
}

// Ayana Bala from true declination (krānti).
//
// A planet is strong in the half of the year its own declination favours:
// the Sun, Mars, Jupiter and Venus in northern declination, the Moon and
// Saturn in southern. Mercury is strong in both, so it takes the magnitude of
// the declination whichever side of the equator it falls.
//
//   Ayana Bala = 60 × (24 + k·δ) / 48
//
// with the traditional obliquity of 24°, so δ = ±24° maps to 60 and 0 virupa.
// Real declinations can exceed 24° (the Moon reaches ±28°), hence the clamp.
const AYANA_NORTH_STRONG: Record<ShadbalaPlanet, 1 | -1 | 0> = {
  Sun: 1, Mars: 1, Jupiter: 1, Venus: 1,
  Moon: -1, Saturn: -1,
  Mercury: 0, // 0 marks "strong in both", handled with |δ|
};
const TRADITIONAL_OBLIQUITY = 24;

function calculateAyanaBalaVirupa(planetName: ShadbalaPlanet, planet: ShadbalaChartPlanet | undefined): number {
  const declination = planet?.declination;
  if (typeof declination !== 'number') return 0;
  const direction = AYANA_NORTH_STRONG[planetName];
  const effective = direction === 0 ? Math.abs(declination) : direction * declination;
  const bala = 60 * (TRADITIONAL_OBLIQUITY + effective) / (2 * TRADITIONAL_OBLIQUITY);
  // BPHS doubles the Sun's Ayana Bala.
  const scaled = planetName === 'Sun' ? bala * 2 : bala;
  return clamp(scaled, 0, planetName === 'Sun' ? 120 : 60);
}

export function calculateKalaBalaBreakdown(planetName: ShadbalaPlanet, chart: ShadbalaChartLike, planet: ShadbalaChartPlanet | undefined): KalaBalaBreakdown {
  const sect = estimateSect(chart);
  const times = getSunTimes(chart);
  const pakshaMap = calculatePakshaBalaVirupa(chart);
  const natonnata = calculateNatonnataBalaVirupa(planetName, sect, times);
  const paksha = pakshaMap[planetName] ?? 0;
  const tribhaaga = calculateTribhaagaBalaVirupa(planetName, chart);
  const tribhagaLord = getTribhagaLord(chart);
  const varsheshadi = calculateVarsheshadiBalaVirupa(planetName, chart);
  const ayana = calculateAyanaBalaVirupa(planetName, planet);
  return { sect, natonnata, paksha, tribhaaga, tribhagaLord, varsheshadi, ayana, total: natonnata + paksha + tribhaaga + varsheshadi + ayana };
}

// Cheṣṭā Bala from the eightfold motion (aṣṭa-gati) of BPHS.
//
// The planet's apparent daily motion is compared with its mean motion and the
// resulting state carries a fixed virupa award:
//
//   Vakra      retrograde                 60
//   Anuvakra   retrograde into the        30   — folded into Vakra here, since
//              previous sign                    it needs sign-crossing history
//   Vikala     stationary                 15
//   Mandatara  far slower than mean        7.5
//   Manda      slower than mean           15
//   Sama       at mean speed              30
//   Chara      faster than mean           30
//   Aticharā   far faster than mean       45
//
// The Sun and Moon are not judged by motion: BPHS gives the Sun its own Ayana
// Bala as Cheṣṭā and the Moon its own Pakṣa Bala.
//
// The mean motions below are *geocentric* — the average apparent speed against
// the zodiac. For Mars, Jupiter and Saturn these match the classical madhya
// gati. Mercury and Venus do not: their traditional 4°05' and 1°36' are sighra
// (heliocentric) rates, whereas seen from Earth both merely accompany the Sun
// once round the zodiac each year. Comparing a geocentric speed against the
// sighra figure would mark them permanently slow, so the solar rate is used.
const MEAN_DAILY_MOTION: Record<ShadbalaPlanet, number> = {
  Sun: 0.9856,
  Moon: 13.1764,
  Mars: 0.5240,
  Mercury: 0.9856,
  Jupiter: 0.0831,
  Venus: 0.9856,
  Saturn: 0.0335,
};

export type MotionState = 'vakra' | 'vikala' | 'mandatara' | 'manda' | 'sama' | 'chara' | 'atichara';

const MOTION_VIRUPA: Record<MotionState, number> = {
  vakra: 60,
  vikala: 15,
  mandatara: 7.5,
  manda: 15,
  sama: 30,
  chara: 30,
  atichara: 45,
};

export function classifyMotion(planetName: ShadbalaPlanet, speed: number): MotionState {
  const mean = MEAN_DAILY_MOTION[planetName];
  if (speed < 0) return 'vakra';
  const ratio = speed / mean;
  if (ratio < 0.02) return 'vikala';
  if (ratio < 0.25) return 'mandatara';
  if (ratio < 0.9) return 'manda';
  if (ratio <= 1.1) return 'sama';
  if (ratio <= 1.5) return 'chara';
  return 'atichara';
}

export function calculateCheshtaBalaVirupa(
  planetName: ShadbalaPlanet,
  planet: ShadbalaChartPlanet | undefined,
  ayanaBala: number,
  pakshaBala: number,
): number {
  if (planetName === 'Sun') return ayanaBala;
  if (planetName === 'Moon') return pakshaBala;
  if (typeof planet?.speed !== 'number') return 0;
  return MOTION_VIRUPA[classifyMotion(planetName, planet.speed)];
}

function aspectOrbStrength(diff: number, exact: number, orb = 30): number {
  const delta = Math.abs(diff - exact);
  return delta <= orb ? 1 - delta / orb : 0;
}

function getAspectStrength(fromName: ShadbalaPlanet, fromLongitude: number, toLongitude: number): number {
  const diff = normalizeLongitude(toLongitude - fromLongitude);
  let strength = aspectOrbStrength(diff, 180, 45);
  if (fromName === 'Mars') strength = Math.max(strength, aspectOrbStrength(diff, 90, 35), aspectOrbStrength(diff, 210, 35));
  if (fromName === 'Jupiter') strength = Math.max(strength, aspectOrbStrength(diff, 120, 35), aspectOrbStrength(diff, 240, 35));
  if (fromName === 'Saturn') strength = Math.max(strength, aspectOrbStrength(diff, 60, 35), aspectOrbStrength(diff, 270, 35));
  return clamp(strength, 0, 1);
}

// Approximation. Classical Drig Bala uses drishti-pinda (aspect points) with fixed weights.
// Here: +45 virupa per benefic aspect, −30 per malefic aspect. No arbitrary base score.
// Aspect orbs are custom (not classical exact-aspect). Negative values allowed per classical convention.
export function calculateDrikBalaVirupa(targetName: ShadbalaPlanet, chart: ShadbalaChartLike): number {
  const target = getPlanet(chart, targetName);
  if (typeof target?.longitude !== 'number') return 0;
  const targetLongitude = target.longitude;
  let score = 0;
  SCORE_PLANETS.forEach((fromName) => {
    if (fromName === targetName) return;
    const from = getPlanet(chart, fromName);
    if (typeof from?.longitude !== 'number') return;
    const aspect = getAspectStrength(fromName, from.longitude, targetLongitude);
    if (!aspect) return;
    score += (BENEFICS.includes(fromName) ? 45 : -30) * aspect;
  });
  return score;
}

export function buildShadbalaRows(chart: ShadbalaChartLike): ShadbalaRow[] {
  const ascendantSign = chart?.ascendant?.sign;
  return SCORE_PLANETS
    .map((planetName): ShadbalaRow | null => {
      const planet = getPlanet(chart, planetName);
      if (!planet) return null;
      const house = getPlanetHouse(planet, ascendantSign);
      const sthanaBreakdown = calculateSthanaBalaBreakdown(planetName, planet, house);
      const kalaBreakdown = calculateKalaBalaBreakdown(planetName, chart, planet);
      const naisargikaVirupa = NAISARGIKA_BALA_VIRUPA[planetName] ?? 0;
      const digVirupa = calculateDigBalaVirupa(planetName, house);
      // Cheṣṭā depends on Kāla for the two luminaries, so it is computed after it.
      const cheshtaVirupa = calculateCheshtaBalaVirupa(planetName, planet, kalaBreakdown.ayana, kalaBreakdown.paksha);
      const drikVirupa = calculateDrikBalaVirupa(planetName, chart);
      const totalVirupa = sthanaBreakdown.total + digVirupa + kalaBreakdown.total + cheshtaVirupa + naisargikaVirupa + drikVirupa;
      const requiredVirupa = SHADBALA_REQUIRED_VIRUPA[planetName] ?? 0;
      return {
        planet: planetName,
        house,
        retrograde: planet.isRetrograde ?? false,
        sthana: virupaToRupa(sthanaBreakdown.total),
        sthanaBreakdown,
        dig: virupaToRupa(digVirupa),
        digVirupa,
        kala: virupaToRupa(kalaBreakdown.total),
        kalaBreakdown,
        cheshta: virupaToRupa(cheshtaVirupa),
        cheshtaVirupa,
        naisargika: virupaToRupa(naisargikaVirupa),
        naisargikaVirupa,
        drik: virupaToRupa(drikVirupa),
        drikVirupa,
        total: virupaToRupa(totalVirupa),
        totalVirupa,
        requiredVirupa,
        ratio: requiredVirupa ? totalVirupa / requiredVirupa : 0,
      };
    })
    .filter((row): row is ShadbalaRow => row !== null);
}
