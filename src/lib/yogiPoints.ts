import { normalizeDegrees as normalize } from './angles';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE, nakshatraLordOf } from './nakshatras';
import { SIGN_LORDS } from './signs';

// The Yogi, the Sahayogi and the Avayogi (as Jagannatha Hora counts them).
//
// The Yogi point is the Sun plus the Moon plus 93°20' (the sum is one sphuṭa that is reached when the two have run together through
// 13°20' of the Yoga). The lord of its nakṣatra is the Yogi graha, the lord of its sign the Sahayogi, and the lord of the nakṣatra of the
// point 186°40' further on (the Yogi point turned half way round and 6°40' more) is the Avayogi.

export const YOGI_ADDITION = 93 + 20 / 60;
export const AVAYOGI_ADDITION = 186 + 40 / 60;

export interface YogiPoint {
  longitude: number;
  /** Sign 1–12 and degrees inside it. */
  sign: number;
  degree: number;
  /** The nakṣatra and the pada (1–4) of the point, counted in the nakṣatra zodiac. */
  nakshatra: string;
  pada: number;
  /** The lord of the nakṣatra: the Yogi or the Avayogi graha. */
  nakshatraLord: string;
}

export interface Yogi {
  yogi: YogiPoint;
  avayogi: YogiPoint;
  /** The lord of the sign of the Yogi point. */
  sahayogi: string;
}

function pointAt(longitude: number, adjust: number): YogiPoint {
  const lon = normalize(longitude);
  const shifted = normalize(lon + adjust);
  const inNakshatra = shifted % NAKSHATRA_SIZE;
  return {
    longitude: lon,
    sign: Math.floor(lon / 30) + 1,
    degree: lon % 30,
    nakshatra: NAKSHATRA_NAMES[Math.min(26, Math.floor(shifted / NAKSHATRA_SIZE))],
    pada: Math.min(4, Math.floor((inNakshatra / NAKSHATRA_SIZE) * 4) + 1),
    nakshatraLord: nakshatraLordOf(shifted),
  };
}

/** The adjustment is the chart's nakṣatra offset, as for the other sphuṭas. */
export function calculateYogi(sunLongitude: number, moonLongitude: number, adjust = 0): Yogi {
  const yogiLongitude = normalize(sunLongitude + moonLongitude + YOGI_ADDITION);
  const yogi = pointAt(yogiLongitude, adjust);
  return {
    yogi,
    avayogi: pointAt(yogiLongitude + AVAYOGI_ADDITION, adjust),
    sahayogi: SIGN_LORDS[yogi.sign - 1],
  };
}

export type YogiRole = 'Yogi' | 'Sahayogi' | 'Avayogi';

/** The grahas that hold the three roles, each with the roles it holds (a graha can hold more than one). */
export function yogiRoles(sunLongitude: number, moonLongitude: number, adjust = 0): Record<string, YogiRole[]> {
  const { yogi, sahayogi, avayogi } = calculateYogi(sunLongitude, moonLongitude, adjust);
  const roles: Record<string, YogiRole[]> = {};
  for (const [graha, role] of [[yogi.nakshatraLord, 'Yogi'], [sahayogi, 'Sahayogi'], [avayogi.nakshatraLord, 'Avayogi']] as const) {
    (roles[graha] ??= []).push(role);
  }
  return roles;
}
