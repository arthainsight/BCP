import { getVargaSignIndex } from '@/lib/varga';

// The special sphuṭas: the lagnas that run on the clock after sunrise, the
// Moon-based Śrī Lagna and Bhṛgu Bindu, the Jaimini points (Āruḍha, Varṇada)
// and the two Khara points.
//
// The lagnas that move with time (Bhāva, Horā, Ghaṭī, Prāṇapada, Vighaṭī) start
// from the Sun's longitude at birth and run on the ishṭa, the time since
// sunrise in ghaṭīs (1 ghaṭī = 24 minutes, 60 to a day):
//   Bhāva Lagna     +  6° per ghaṭī   (a sign in 5 ghaṭīs)
//   Horā Lagna      + 12° per ghaṭī   (a sign in 2½)
//   Ghaṭī Lagna     + 30° per ghaṭī   (a sign in 1)
//   Vighaṭī Lagna   + 1800° per ghaṭī (a sign in a vighaṭī)
//   Prāṇapada       +  4° per ghaṭī, after 0°, 240° or 120° for a Sun in a
//                     movable, fixed or dual sign

export type SunriseMode = 'true' | 'mean';

export const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'] as const;
/** Kalās of the grahas for the Indu Lagna. */
const INDU_KALAS: Record<string, number> = { Sun: 30, Moon: 16, Mars: 6, Mercury: 8, Jupiter: 10, Venus: 12, Saturn: 1 };

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

const normalize = (value: number) => ((value % 360) + 360) % 360;
const signIndexOf = (longitude: number) => Math.floor(normalize(longitude) / 30);

/**
 * The equation of time in minutes (apparent minus mean solar time), from the
 * NOAA series; good to a few seconds, which is plenty for the ishṭa.
 */
export function equationOfTimeMinutes(year: number, month: number, day: number, hourUt = 0): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const t = (jdn - 0.5 + hourUt / 24 - 2451545) / 36525;
  const rad = Math.PI / 180;
  const l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const mean = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const eps = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 + 0.00256 * Math.cos((125.04 - 1934.136 * t) * rad);
  const y2 = Math.tan((eps / 2) * rad) ** 2;
  const eot =
    y2 * Math.sin(2 * l0 * rad)
    - 2 * e * Math.sin(mean * rad)
    + 4 * e * y2 * Math.sin(mean * rad) * Math.cos(2 * l0 * rad)
    - 0.5 * y2 * y2 * Math.sin(4 * l0 * rad)
    - 1.25 * e * e * Math.sin(2 * mean * rad);
  return 4 * (eot / rad);
}

/**
 * The ishṭa in ghaṭīs: the time from sunrise to birth. With the mean-time
 * sunrise the equation of time is added to the true sunrise, as when the day is
 * reckoned on mean solar time. Before sunrise the time runs from the day before.
 */
export function ishtaGhatis(birthHours: number, sunriseHours: number, mode: SunriseMode, eotMinutes: number): number {
  const reference = sunriseHours + (mode === 'mean' ? eotMinutes / 60 : 0);
  return ((((birthHours - reference) % 24) + 24) % 24) * 2.5;
}

export interface SphutaPlanet {
  name: string;
  /** Sign 1–12. */
  sign: number;
  /** Degrees within the sign. */
  degree: number;
}

export interface SphutaInput {
  ascendantLongitude: number;
  sunLongitude: number;
  moonLongitude: number;
  rahuLongitude: number;
  /** The grahas, for the lagna lord (Āruḍha). */
  planets: SphutaPlanet[];
  /** The ishṭa in ghaṭīs; see ishtaGhatis. */
  ishta: number;
}

export interface SpecialSphuta {
  key: string;
  name: string;
  /** Where the point lies in the zodiac; the nakṣatra and pada follow it. */
  longitude: number;
  /** The sign shown, 1–12: the sign of the longitude, or the D3 / D9 sign for the Khara points. */
  sign: number;
  /** Degrees within the sign shown. */
  degree: number;
}

function point(key: string, name: string, longitude: number): SpecialSphuta {
  const lon = normalize(longitude);
  return { key, name, longitude: lon, sign: Math.floor(lon / 30) + 1, degree: lon % 30 };
}

/** Counts a sign from Aries (odd signs) or backwards from Pisces (even signs), 1–12. */
const jaiminiCount = (sign: number) => (sign % 2 === 1 ? sign : 12 - sign + 1);

/**
 * Varṇada: the Lagna and the Ghaṭī Lagna are each counted from Aries (odd
 * sign) or backwards from Pisces (even sign); the counts are added when the two
 * signs are alike in oddness and subtracted when they are not; the total is
 * counted from Aries for an odd Lagna and backwards from Pisces for an even one.
 */
export function varnadaSign(lagnaSign: number, otherSign: number): number {
  const a = jaiminiCount(lagnaSign);
  const b = jaiminiCount(otherSign);
  const total = lagnaSign % 2 === otherSign % 2 ? a + b : Math.abs(a - b);
  const count = total % 12 === 0 ? 12 : total % 12;
  return lagnaSign % 2 === 1 ? count : 12 - count + 1;
}

/** Āruḍha Lagna: as far from the lagna lord as the lord is from the Lagna; the 1st and the 7th give way to the 10th from them. */
export function arudhaSign(lagnaSign: number, lordSign: number): number {
  const distance = ((lordSign - lagnaSign + 12) % 12) + 1;
  let sign = ((lordSign - 1 + distance - 1) % 12) + 1;
  if (sign === lagnaSign || sign === ((lagnaSign + 5) % 12) + 1) sign = ((sign - 1 + 9) % 12) + 1;
  return sign;
}

/** Indu Lagna: the kalās of the 9th lords from the Lagna and from the Moon, counted from the Moon. */
export function induSign(lagnaSign: number, moonSign: number): number {
  const ninthLord = (sign: number) => SIGN_LORDS[(sign - 1 + 8) % 12];
  const total = INDU_KALAS[ninthLord(lagnaSign)] + INDU_KALAS[ninthLord(moonSign)];
  const count = total % 12 === 0 ? 12 : total % 12;
  return ((moonSign - 1 + count - 1) % 12) + 1;
}

/** The special sphuṭas in the order they are listed. */
export function calculateSpecialSphutas(input: SphutaInput): SpecialSphuta[] {
  const { ascendantLongitude: asc, sunLongitude: sun, moonLongitude: moon, rahuLongitude: rahu, planets, ishta } = input;
  const ascSign = signIndexOf(asc) + 1;
  const ascDegree = normalize(asc) % 30;

  const bhava = point('BL', 'Bhava Lagna', sun + 6 * ishta);
  const hora = point('HL', 'Hora Lagna', sun + 12 * ishta);
  const ghati = point('GL', 'Ghati Lagna', sun + 30 * ishta);
  const vighati = point('ViL', 'Vighati Lagna', sun + 1800 * ishta);
  const sunSign = signIndexOf(sun) + 1;
  const prana = point('PP', 'Pranapada Lagna', sun + ([0, 240, 120][(sunSign - 1) % 3]) + 4 * ishta);

  // Śrī Lagna: the Lagna turned on by the fraction of its nakṣatra the Moon has passed.
  const nakshatraSize = 360 / 27;
  const moonFraction = (normalize(moon) % nakshatraSize) / nakshatraSize;
  const sree = point('SL', 'Sree Lagna', asc + moonFraction * 360);

  // Bhṛgu Bindu: halfway between the Moon and Rahu.
  const bhrigu = point('BB', 'Bhrigu Bindu', (normalize(moon) + normalize(rahu)) / 2);

  // Āruḍha: the lagna lord's degree, in the sign counted from the lord.
  const lord = planets.find(planet => planet.name === SIGN_LORDS[ascSign - 1]);
  const arudhaSignNumber = lord ? arudhaSign(ascSign, lord.sign) : ascSign;
  const arudha: SpecialSphuta = lord
    ? { key: 'AL', name: 'Arudha Lagna', longitude: (arudhaSignNumber - 1) * 30 + lord.degree, sign: arudhaSignNumber, degree: lord.degree }
    : point('AL', 'Arudha Lagna', asc);

  // The Khara points: the Lagna 210° on, shown in the D3 and D9 sign it falls in.
  const khara = normalize(asc + 210);
  const drekkana22: SpecialSphuta = { key: 'D22', name: '22nd Drekkana', longitude: khara, sign: getVargaSignIndex(khara, 3) + 1, degree: khara % 30 };
  const navamsa64: SpecialSphuta = { key: 'N64', name: '64th Navamsa', longitude: khara, sign: getVargaSignIndex(khara, 9) + 1, degree: khara % 30 };

  const moonSign = signIndexOf(moon) + 1;
  const indu = point('IL', 'Indu Lagna', (induSign(ascSign, moonSign) - 1) * 30 + (normalize(moon) % 30));

  const varnadaSignNumber = varnadaSign(ascSign, ghati.sign);
  const varnada: SpecialSphuta = {
    key: 'VL', name: 'Varnada Lagna',
    longitude: (varnadaSignNumber - 1) * 30 + ascDegree, sign: varnadaSignNumber, degree: ascDegree,
  };

  return [bhava, hora, ghati, prana, sree, bhrigu, arudha, drekkana22, navamsa64, indu, varnada, vighati];
}

/** Nakṣatra (1–27) and pada (1–4) of a longitude; the adjustment is the chart's nakṣatra offset. */
export function nakshatraAndPada(longitude: number, adjust = 0): { nakshatra: string; pada: number } {
  const lon = normalize(longitude + adjust);
  const index = Math.min(26, Math.floor(lon / (360 / 27)));
  const pada = Math.min(4, Math.floor(((lon % (360 / 27)) / (360 / 27)) * 4) + 1);
  return { nakshatra: NAKSHATRA_NAMES[index], pada };
}

/** 18° 2' 9.52": degrees, minutes and seconds to hundredths. */
export function formatDms(degrees: number): string {
  let totalHundredths = Math.round(degrees * 3600 * 100);
  const d = Math.floor(totalHundredths / 360000);
  totalHundredths -= d * 360000;
  const m = Math.floor(totalHundredths / 6000);
  totalHundredths -= m * 6000;
  return `${d}° ${m}' ${(totalHundredths / 100).toFixed(2)}"`;
}
