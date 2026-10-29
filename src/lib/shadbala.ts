// Ṣaḍbala engine.
//
// The six balas of the seven grahas in virūpa (60 virūpa make a rūpa), by the Sanskrit text of
// Bṛhat Parāśara Horā Śāstra, chapter 27 (the numbers are those of the edition the app was audited
// against; others number the verses differently). The verses decide; where they are silent or give a
// choice, a comment says what was taken and from whom, and the written audit lists every such point.
//
// What the text does not say is taken from the commentaries of R. Santhanam and B. V. Raman, and the
// astrology programs (JHora, LagnaOne, Viveka) are only compared with, never followed. On purpose this
// differs from JHora in three places: the waning Moon is a malefic in Dṛg Bala, the Sun's and the Moon's
// Cheṣṭā Bala are added to the total (the verses count it as a bala of its own), and Dig Bala is
// measured from the four angles. Yuddha Bala (planetary war) is left out because the sources
// contradict one another about who wins and by how much.

import { getVargaSignIndex, getDegreesInSign } from './varga';
import { normalizeLongitude } from './varga/utils';
import { SIGN_LORDS } from './signs';
import { DEBILITATION, EXALTATION, NATURAL_ENEMIES, NATURAL_FRIENDS, OWN_SIGNS as OWN_SIGN_NUMBERS } from './dignity';
import { aspectVirupa, isMoonBenefic } from './shadbalaAspects';
import { cheshtaKendraBalaVirupa, type CheshtaGraha } from './shadbalaCheshta';
import { ABDA_VIRUPA, HORA_VIRUPA, MASA_VIRUPA, VARA_VIRUPA, horaLord, yearMonthDayLords, type DayLord } from './shadbalaTime';

export type ShadbalaPlanet = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
export type Dignity = 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated' | 'none';

export type ShadbalaChartPlanet = {
  name: string;
  longitude?: number;
  sign?: number;
  degree?: number;
  house?: number;
  isRetrograde?: boolean;
  /** Apparent geocentric motion in degrees per day. */
  speed?: number;
  /** True equatorial declination in degrees. Ayana Bala falls back on it when the ayanamsa is not known. */
  declination?: number;
};

export type ShadbalaChartLike = {
  ascendant?: { sign?: number; longitude?: number };
  /** Longitude of the midheaven, the cusp of the 10th house; Dig Bala is measured from the four angles. */
  midheaven?: number;
  planets?: ShadbalaChartPlanet[];
  debug?: {
    inputDateTime?: string;
    /** Julian day (UT) of the birth. Cheṣṭā Bala needs it for the mean positions. */
    julianDay?: number;
    /** The ayanamsa the longitudes are in (0 for the tropical zodiac). */
    ayanamsa?: number;
    /** The Lahiri ayanamsa, in whose zodiac the mean positions of Cheṣṭā Bala are. */
    siderealAyanamsa?: number;
    sunriseLocalHours?: number;
    sunsetLocalHours?: number;
    nextSunriseLocalHours?: number;
    previousSunriseLocalHours?: number;
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
  /** Varṣa-Māsa-Dina-Horā Bala: 15, 30, 45 and 60 virūpa to the lords of the year, month, day and hour. */
  varsheshadi: number;
  /** Who those four lords are for this birth, when the birth moment is known. */
  varsheshadiLords?: { abda: DayLord; masa: DayLord; vara: DayLord; hora: DayLord };
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

// The dignity tables count signs from 1 (Aries); this module counts them from 0.
const fromZero = (table: Record<string, number>) => Object.fromEntries(Object.entries(table).map(([planet, sign]) => [planet, sign - 1])) as Record<ShadbalaPlanet, number>;
const OWN_SIGNS = Object.fromEntries(Object.entries(OWN_SIGN_NUMBERS).map(([planet, signs]) => [planet, signs.map(sign => sign - 1)])) as Record<ShadbalaPlanet, number[]>;
const EXALTATION_SIGNS = fromZero(EXALTATION);
const DEBILITATION_SIGNS = fromZero(DEBILITATION);
const EXALTATION_LONGITUDES: Record<ShadbalaPlanet, number> = { Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200 };

export const SHADBALA_REQUIRED_VIRUPA: Record<ShadbalaPlanet, number> = { Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300 };

/** Naisargika Bala (27.14): 60/7 times 1 to 7 for Saturn, Mars, Mercury, Jupiter, Venus, the Moon and the Sun, in fractions, not rounded. */
export const NAISARGIKA_BALA_VIRUPA: Record<ShadbalaPlanet, number> = {
  Saturn: 60 / 7, Mars: (60 / 7) * 2, Mercury: (60 / 7) * 3, Jupiter: (60 / 7) * 4, Venus: (60 / 7) * 5, Moon: (60 / 7) * 6, Sun: 60,
};

/**
 * Dig Bala (27.7–8): a graha has the full 60 virūpa at one of the four angles and nothing at the opposite
 * one. The verse names the house the strength is subtracted from: the 4th for the Sun and Mars, the 7th
 * for Jupiter and Mercury, the 1st for Saturn and the 10th for the Moon and Venus, so the strongest
 * points are the opposite ones below.
 */
export type DigPoint = 'asc' | 'ic' | 'desc' | 'mc';
export const DIG_BALA_STRONG_POINT: Record<ShadbalaPlanet, DigPoint> = {
  Sun: 'mc', Mars: 'mc', Moon: 'ic', Venus: 'ic', Jupiter: 'asc', Mercury: 'asc', Saturn: 'desc',
};

/** Ojhayugma (27.5): the Moon and Venus gain in even signs, the five others (Mercury and Saturn too: *anye*, the others) in odd signs. */
const EVEN_SIGN_PLANETS: readonly ShadbalaPlanet[] = ['Moon', 'Venus'];
/** Drekkana (27.6, 3.19): males in the first decanate, the neuters (Mercury, Saturn) in the second, the females in the third. */
const DREKKANA_STRENGTH: Record<ShadbalaPlanet, number> = { Sun: 1, Mars: 1, Jupiter: 1, Mercury: 2, Saturn: 2, Moon: 3, Venus: 3 };
const DAY_NIGHT_STRENGTH: Record<ShadbalaPlanet, 'day' | 'night' | 'both'> = { Sun: 'day', Jupiter: 'day', Venus: 'day', Moon: 'night', Mars: 'night', Saturn: 'night', Mercury: 'both' };

// Saptavargaja Bala (27.2–4): a graha scores in each of seven vargas (rāśi, hora, drekkāṇa, saptāṃśa,
// navāṃśa, dvādaśāṃśa, triṃśāṃśa) by the standing of the sign it occupies there, and the seven scores are
// added (aikya), not averaged: the most a graha can have is 315 virūpa.
//
//   own mūlatrikoṇa 45 · own sign 30 · sign of an adhimitra 20 · of a mitra 15 · of a sama 10 ·
//   of a śatru 4 · of an adhiśatru 2
//
// The grades of friendship are the compound ones of BPHS 3.55–58: the natural relation and the temporary
// one together. There is no score of its own for exaltation or debilitation. B. V. Raman allows the 45
// of the mūlatrikoṇa only in the rāśi and not in the other six vargas, and so does the app. The temporary
// relation is read from the rāśi chart alone, in every varga (Santhanam's note to 27.2–4; Raman does the
// same). This is not JHora's table, which is Raman's with 22.5, 7.5, 3.75 and 1.875 for the grades.
export type CompoundRelation = 'adhimitra' | 'mitra' | 'sama' | 'shatru' | 'adhishatru';
const SAPTAVARGAJA_VIRUPA = { moolatrikona: 45, own: 30, adhimitra: 20, mitra: 15, sama: 10, shatru: 4, adhishatru: 2 } as const;
const SAPTAVARGAJA_DIVISIONS = [1, 2, 3, 7, 9, 12, 30] as const;

// Mūlatrikoṇa is a sign plus a degree band, unlike the other dignities which
// are whole-sign. Bands are those of BPHS 3.51–54: [signIndex, fromDegree, toDegree).
const MOOLATRIKONA: Record<ShadbalaPlanet, { sign: number; from: number; to: number }> = {
  Sun:     { sign: 4,  from: 0,  to: 20 },  // Leo 0–20°
  Moon:    { sign: 1,  from: 3,  to: 30 },  // Taurus 3–30° (the first 3° are its exaltation)
  Mars:    { sign: 0,  from: 0,  to: 12 },  // Aries 0–12°
  Mercury: { sign: 5,  from: 15, to: 20 },  // Virgo 15–20° (the first 15° are its exaltation)
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
  if (NATURAL_FRIENDS[planet]?.includes(signLord)) return 'friend';
  if (NATURAL_ENEMIES[planet]?.includes(signLord)) return 'enemy';
  return 'neutral';
}

/** The angles of the chart a graha's Dig Bala is measured from, as longitudes. */
export type DigAngles = { ascendant?: number; midheaven?: number };

/**
 * Dig Bala (27.7–8): the distance, in degrees, from the point where the graha is powerless, divided by
 * three, so 60 virūpa at the strongest point and nothing at the opposite. The points are the four angles
 * of the chart: the ascendant, the descendant, the midheaven and the nadir (Santhanam: "the cuspal
 * degree"; Raman, articles 44–45). The verse does not say what it means by a house; JHora's desktop
 * version takes equal houses from the ascendant instead. Without a midheaven the 10th cusp is taken as
 * 90° before the descendant.
 */
export function calculateDigBalaVirupa(planetName: string, longitude: number | undefined, angles: DigAngles): number {
  if (!isShadbalaPlanet(planetName) || typeof longitude !== 'number' || typeof angles.ascendant !== 'number') return 0;
  const midheaven = angles.midheaven ?? angles.ascendant + 270;
  const strongPoint = {
    asc: angles.ascendant,
    desc: angles.ascendant + 180,
    mc: midheaven,
    ic: midheaven + 180,
  }[DIG_BALA_STRONG_POINT[planetName]];
  return 60 - circularDegreeDistance(longitude, strongPoint) / 3;
}

export function calculateUcchaBalaVirupa(planetName: string, longitude: number | undefined): number {
  const exaltLongitude = isShadbalaPlanet(planetName) ? EXALTATION_LONGITUDES[planetName] : undefined;
  if (typeof exaltLongitude !== 'number' || typeof longitude !== 'number') return 0;
  return clamp(60 * (1 - circularDegreeDistance(longitude, exaltLongitude) / 180), 0, 60);
}

/** The sign each of the seven grahas stands in in the rāśi, from 0 (Aries). */
export type RasiSigns = Partial<Record<ShadbalaPlanet, number>>;

/**
 * The compound relation (BPHS 3.55–58) of a graha to another: the natural and the temporary relation
 * together. The other is a temporary friend when it stands in the 2nd, 3rd, 4th, 10th, 11th or 12th sign
 * from the graha, a temporary enemy elsewhere. A friend that is a temporary friend too is an adhimitra,
 * a friend that is a temporary enemy a sama; a neutral is a mitra or a śatru; an enemy is a sama or an
 * adhiśatru. When the rāśi signs of the two are not known the natural relation alone is used (friend as
 * mitra, neutral as sama, enemy as śatru).
 */
export function getCompoundRelation(planet: ShadbalaPlanet, other: ShadbalaPlanet, rasiSigns: RasiSigns): CompoundRelation {
  const natural = NATURAL_FRIENDS[planet]?.includes(other) ? 'friend' : NATURAL_ENEMIES[planet]?.includes(other) ? 'enemy' : 'neutral';
  const planetSign = rasiSigns[planet];
  const otherSign = rasiSigns[other];
  if (typeof planetSign !== 'number' || typeof otherSign !== 'number') {
    return natural === 'friend' ? 'mitra' : natural === 'enemy' ? 'shatru' : 'sama';
  }
  const place = ((otherSign - planetSign + 12) % 12) + 1;
  const temporaryFriend = [2, 3, 4, 10, 11, 12].includes(place);
  if (natural === 'friend') return temporaryFriend ? 'adhimitra' : 'sama';
  if (natural === 'neutral') return temporaryFriend ? 'mitra' : 'shatru';
  return temporaryFriend ? 'sama' : 'adhishatru';
}

export function calculateSaptavargajaBalaVirupa(planetName: string, longitude: number | undefined, rasiSigns: RasiSigns): number {
  if (!isShadbalaPlanet(planetName) || typeof longitude !== 'number') return 0;
  return SAPTAVARGAJA_DIVISIONS.reduce((sum, division) => {
    const signIndex = getVargaSignIndex(longitude, division);
    // Mūlatrikoṇa has a degree band, which is meaningful in the rāśi only; in the other vargas the sign is just an own sign.
    if (division === 1 && getDignity(planetName, signIndex, getDegreesInSign(longitude)) === 'moolatrikona') {
      return sum + SAPTAVARGAJA_VIRUPA.moolatrikona;
    }
    if (OWN_SIGNS[planetName].includes(signIndex)) return sum + SAPTAVARGAJA_VIRUPA.own;
    const lord = SIGN_LORDS[signIndex] as ShadbalaPlanet;
    return sum + SAPTAVARGAJA_VIRUPA[getCompoundRelation(planetName, lord, rasiSigns)];
  }, 0);
}

/** Ojhayugma Bala (27.5): 15 virūpa for the rāśi and 15 for the navāṃśa standing in a sign of the graha's kind. */
export function calculateOjhayugmaBalaVirupa(planetName: string, longitude: number | undefined): number {
  if (!isShadbalaPlanet(planetName) || typeof longitude !== 'number') return 0;
  const wantsEven = EVEN_SIGN_PLANETS.includes(planetName);
  const signMatches = (signIndex: number) => (signIndex % 2 === 1) === wantsEven;
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

export function calculateSthanaBalaBreakdown(planetName: string, planet: ShadbalaChartPlanet | undefined, house: number | null, rasiSigns: RasiSigns): SthanaBalaBreakdown {
  const longitude = planet?.longitude;
  const uccha = calculateUcchaBalaVirupa(planetName, longitude);
  const saptavargaja = calculateSaptavargajaBalaVirupa(planetName, longitude, rasiSigns);
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

/**
 * The lords of the year, month, day and hour of the birth (see shadbalaTime.ts), or null when the birth
 * moment is not known. The Vedic day runs from sunrise to sunrise, so a birth before sunrise belongs to
 * the day before; the hour is counted in clock time from that sunrise. Without sunrise times the
 * sunrise is taken to be at 6:00.
 */
function getVarsheshadiLords(chart: ShadbalaChartLike): { abda: DayLord; masa: DayLord; vara: DayLord; hora: DayLord } | null {
  const input = chart?.debug?.inputDateTime;
  const birthHour = getBirthHour(chart);
  const dateMatch = input?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch || birthHour === null) return null;
  const [year, month, day] = [Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3])];
  const sunrise = chart.debug?.sunriseLocalHours ?? 6;
  const beforeSunrise = birthHour < sunrise;
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  const vedicDay = beforeSunrise
    ? { year: previous.getUTCFullYear(), month: previous.getUTCMonth() + 1, day: previous.getUTCDate() }
    : { year, month, day };
  const hoursSinceSunrise = beforeSunrise
    ? birthHour - (chart.debug?.previousSunriseLocalHours ?? sunrise - 24)
    : birthHour - sunrise;
  const { abda, masa, vara } = yearMonthDayLords(vedicDay);
  return { abda, masa, vara, hora: horaLord(vara, hoursSinceSunrise) };
}

/** Varṣa-Māsa-Dina-Horā Bala (27.13): 15 to the lord of the year, 30 to the month's, 45 to the day's and 60 to the hour's. */
function calculateVarsheshadiBalaVirupa(planetName: ShadbalaPlanet, lords: ReturnType<typeof getVarsheshadiLords>): number {
  if (!lords) return 0;
  return (lords.abda === planetName ? ABDA_VIRUPA : 0)
    + (lords.masa === planetName ? MASA_VIRUPA : 0)
    + (lords.vara === planetName ? VARA_VIRUPA : 0)
    + (lords.hora === planetName ? HORA_VIRUPA : 0);
}

// Ayana Bala (27.15–17).
//
// A graha is strong in the half of the year its declination (krānti) favours: the Sun, Mars, Jupiter and
// Venus in the north, the Moon and Saturn in the south; Mercury is strong in both, so it takes the
// magnitude of the declination.
//
//   Ayana Bala = 60 × (24 + k·δ) / 48
//
// The declination is read from the graha's sāyana longitude by the table of the verse, which splits the
// quarter of the ecliptic from an equinox to a solstice into 45, 33 and 12 parts of the 24° of the
// obliquity (ninety parts in all) and interpolates inside the sign. It does not use the graha's latitude,
// so the Moon's declination stays under 24°. Without an ayanamsa in the chart the true declination from
// the ephemeris stands in. The Sun's value is not doubled here: the doubling the commentaries speak of is
// the way Raman and Santhanam count the Sun's Cheṣṭā Bala (which the verses set equal to its Ayana Bala,
// 27.18) into the total, and the app adds that Cheṣṭā Bala as a bala of its own.
const AYANA_NORTH_STRONG: Record<ShadbalaPlanet, 1 | -1 | 0> = {
  Sun: 1, Mars: 1, Jupiter: 1, Venus: 1,
  Moon: -1, Saturn: -1,
  Mercury: 0, // 0 marks "strong in both", handled with |δ|
};
const TRADITIONAL_OBLIQUITY = 24;
const AYANA_PARTS = [45, 33, 12];
const AYANA_PARTS_TOTAL = 90;

/** The declination, in degrees (north positive), of a point of the ecliptic by the table of BPHS 27.15. */
export function declinationFromSayanaLongitude(sayanaLongitude: number): number {
  const longitude = normalizeLongitude(sayanaLongitude);
  const north = longitude <= 180;
  // The distance from the nearest equinox, 0–90°.
  let fromEquinox = north ? longitude : 360 - longitude;
  if (fromEquinox > 90) fromEquinox = 180 - fromEquinox;
  const signIndex = Math.min(Math.floor(fromEquinox / 30), 2);
  const fraction = (fromEquinox - signIndex * 30) / 30;
  const parts = AYANA_PARTS.slice(0, signIndex).reduce((sum, part) => sum + part, 0) + AYANA_PARTS[signIndex] * fraction;
  const declination = (parts / AYANA_PARTS_TOTAL) * TRADITIONAL_OBLIQUITY;
  return north ? declination : -declination;
}

function calculateAyanaBalaVirupa(planetName: ShadbalaPlanet, planet: ShadbalaChartPlanet | undefined, ayanamsa: number | undefined): number {
  const declination = typeof planet?.longitude === 'number' && typeof ayanamsa === 'number'
    ? declinationFromSayanaLongitude(planet.longitude + ayanamsa)
    : planet?.declination;
  if (typeof declination !== 'number') return 0;
  const direction = AYANA_NORTH_STRONG[planetName];
  const effective = direction === 0 ? Math.abs(declination) : direction * declination;
  return clamp(60 * (TRADITIONAL_OBLIQUITY + effective) / (2 * TRADITIONAL_OBLIQUITY), 0, 60);
}

export function calculateKalaBalaBreakdown(planetName: ShadbalaPlanet, chart: ShadbalaChartLike, planet: ShadbalaChartPlanet | undefined): KalaBalaBreakdown {
  const sect = estimateSect(chart);
  const times = getSunTimes(chart);
  const pakshaMap = calculatePakshaBalaVirupa(chart);
  const natonnata = calculateNatonnataBalaVirupa(planetName, sect, times);
  const paksha = pakshaMap[planetName] ?? 0;
  const tribhaaga = calculateTribhaagaBalaVirupa(planetName, chart);
  const tribhagaLord = getTribhagaLord(chart);
  const varsheshadiLords = getVarsheshadiLords(chart) ?? undefined;
  const varsheshadi = calculateVarsheshadiBalaVirupa(planetName, varsheshadiLords ?? null);
  const ayana = calculateAyanaBalaVirupa(planetName, planet, chart?.debug?.ayanamsa);
  return { sect, natonnata, paksha, tribhaaga, tribhagaLord, varsheshadi, varsheshadiLords, ayana, total: natonnata + paksha + tribhaaga + varsheshadi + ayana };
}

// Cheṣṭā Bala (27.18, 27.24–25).
//
// The Sun's Cheṣṭā Bala is its Ayana Bala and the Moon's its Pakṣa Bala (27.18). The verses then count
// Cheṣṭā as a bala of its own among the six (27.25), so these two are in the total twice: once as a part
// of Kāla and once here. Mars, Mercury, Jupiter, Venus and Saturn are measured by the cheṣṭā-kendra
// (see shadbalaCheshta.ts). The verses also list eight motions with a fixed strength each (vakra,
// anuvakra, vikala, manda, mandatara, sama, cara, aticara, 27.21–23), but give no speeds for the
// states, and Santhanam points to the kendra for the calculation; the app does not use the list.
const CHESHTA_GRAHAS: readonly ShadbalaPlanet[] = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

export function calculateCheshtaBalaVirupa(
  planetName: ShadbalaPlanet,
  planet: ShadbalaChartPlanet | undefined,
  ayanaBala: number,
  pakshaBala: number,
  chart?: ShadbalaChartLike,
): number {
  if (planetName === 'Sun') return ayanaBala;
  if (planetName === 'Moon') return pakshaBala;
  const julianDay = chart?.debug?.julianDay;
  if (!CHESHTA_GRAHAS.includes(planetName) || typeof planet?.longitude !== 'number' || typeof julianDay !== 'number') return 0;
  // The mean positions are in the Lahiri zodiac: move the longitude there from the chart's own zodiac
  // (the tropical one has an ayanamsa of 0).
  const ayanamsa = chart?.debug?.ayanamsa ?? 0;
  const lahiri = chart?.debug?.siderealAyanamsa ?? ayanamsa;
  return cheshtaKendraBalaVirupa(planetName as CheshtaGraha, julianDay, normalizeLongitude(planet.longitude + ayanamsa - lahiri));
}

// Dṛg Bala (27.19, 26.6–12).
//
// Each graha's aspect on the target is read from the sphuṭa dṛṣṭi table (shadbalaAspects.ts). A quarter
// of the malefic aspects is taken off and a quarter of the benefic ones put on. The verse also says
// *jñejya-dṛk-yuktam*, "joined with the aspect of Mercury and Jupiter"; as in the verse for Bhāva Bala
// (27.29), where it means that their aspects count in full, but unlike Raman and JHora's planetary
// Dṛg Bala, which take only the quarter, the app takes only the quarter here too: adding Mercury's and
// Jupiter's aspects in full would swamp the other five (14–58 virūpa for the reference chart).
//
// Benefics and malefics (3.11): Jupiter and Venus are benefics; the Sun, Mars and Saturn (and Rahu and
// Ketu, which only matter as companions of Mercury) are malefics; the waning Moon is a malefic and the
// waxing one a benefic (isMoonBenefic); Mercury is a malefic in the company (the same sign) of a malefic.
function classifyBenefics(chart: ShadbalaChartLike): Set<ShadbalaPlanet> {
  const benefics = new Set<ShadbalaPlanet>(['Jupiter', 'Venus']);
  const sun = getPlanet(chart, 'Sun');
  const moon = getPlanet(chart, 'Moon');
  const moonBenefic = typeof sun?.longitude === 'number' && typeof moon?.longitude === 'number'
    && isMoonBenefic(moon.longitude - sun.longitude);
  if (moonBenefic) benefics.add('Moon');

  const mercury = getPlanet(chart, 'Mercury');
  if (typeof mercury?.longitude === 'number') {
    const mercurySign = Math.floor(normalizeLongitude(mercury.longitude) / 30);
    const maleficCompanion = (chart?.planets ?? []).some((other) => {
      if (typeof other.longitude !== 'number' || Math.floor(normalizeLongitude(other.longitude) / 30) !== mercurySign) return false;
      if (['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'].includes(other.name)) return true;
      return other.name === 'Moon' && !moonBenefic;
    });
    if (!maleficCompanion) benefics.add('Mercury');
  }
  return benefics;
}

export function calculateDrikBalaVirupa(targetName: ShadbalaPlanet, chart: ShadbalaChartLike, benefics: Set<ShadbalaPlanet> = classifyBenefics(chart)): number {
  const target = getPlanet(chart, targetName);
  if (typeof target?.longitude !== 'number') return 0;
  let sum = 0;
  SCORE_PLANETS.forEach((fromName) => {
    if (fromName === targetName) return;
    const from = getPlanet(chart, fromName);
    if (typeof from?.longitude !== 'number') return;
    const aspect = aspectVirupa(fromName, normalizeLongitude(target.longitude! - from.longitude));
    sum += benefics.has(fromName) ? aspect : -aspect;
  });
  return sum / 4;
}

export function rasiSignsOf(chart: ShadbalaChartLike): RasiSigns {
  const signs: RasiSigns = {};
  SCORE_PLANETS.forEach((name) => {
    const longitude = getPlanet(chart, name)?.longitude;
    if (typeof longitude === 'number') signs[name] = Math.floor(normalizeLongitude(longitude) / 30);
  });
  return signs;
}

export function buildShadbalaRows(chart: ShadbalaChartLike): ShadbalaRow[] {
  const ascendantSign = chart?.ascendant?.sign;
  const rasiSigns = rasiSignsOf(chart);
  const benefics = classifyBenefics(chart);
  const angles: DigAngles = { ascendant: chart?.ascendant?.longitude, midheaven: chart?.midheaven };
  return SCORE_PLANETS
    .map((planetName): ShadbalaRow | null => {
      const planet = getPlanet(chart, planetName);
      if (!planet) return null;
      const house = getPlanetHouse(planet, ascendantSign);
      const sthanaBreakdown = calculateSthanaBalaBreakdown(planetName, planet, house, rasiSigns);
      const kalaBreakdown = calculateKalaBalaBreakdown(planetName, chart, planet);
      const naisargikaVirupa = NAISARGIKA_BALA_VIRUPA[planetName] ?? 0;
      const digVirupa = calculateDigBalaVirupa(planetName, planet.longitude, angles);
      // Cheṣṭā depends on Kāla for the two luminaries, so it is computed after it.
      const cheshtaVirupa = calculateCheshtaBalaVirupa(planetName, planet, kalaBreakdown.ayana, kalaBreakdown.paksha, chart);
      const drikVirupa = calculateDrikBalaVirupa(planetName, chart, benefics);
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
