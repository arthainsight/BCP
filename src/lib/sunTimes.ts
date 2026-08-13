// Sunrise and sunset for a given date and place.
//
// swisseph-wasm exposes rise_trans, but its binding does not match the real
// swe_rise_trans signature (it omits starname, epheflag, the geopos array and
// the pressure/temperature arguments) and silently returns zeros instead of
// failing. So the horizon crossings are solved here directly from the Sun's
// true equatorial position, which the ephemeris does give correctly.
//
// Method: the Sun's altitude is
//   sin(alt) = sin(lat)·sin(decl) + cos(lat)·cos(decl)·cos(H)
// where H is the local hour angle, H = local sidereal time − right ascension.
// Both decl and RA come from the ephemeris at the instant being tested, so the
// Sun's own motion during the day is accounted for rather than approximated.
// The crossings of alt = −0.833° are then found by bisection.
//
// −0.833° is the standard sunrise/sunset altitude: −0.5667° for atmospheric
// refraction at the horizon plus −0.2667° for the Sun's semidiameter.

import { SE_SUN, sweCalcUtEquatorial, sweSidtime } from './ephemerisAdapter';

const RAD = Math.PI / 180;
const HORIZON_ALTITUDE = -0.833;

export type SunTimes = {
  /** Local decimal hours from midnight of the requested date. */
  sunrise?: number;
  sunset?: number;
  /** The following day's sunrise, expressed on the same scale, so it exceeds 24. */
  nextSunrise?: number;
};

async function sunAltitude(jdUt: number, latitude: number, longitude: number): Promise<number> {
  const { rightAscension, declination } = await sweCalcUtEquatorial(jdUt, SE_SUN);
  const gmstHours = await sweSidtime(jdUt);
  const localSiderealDegrees = (gmstHours * 15 + longitude) % 360;
  // Wrap the hour angle into (−180, 180] so it is signed around the meridian.
  const hourAngle = ((localSiderealDegrees - rightAscension + 540) % 360) - 180;
  const sinAltitude =
    Math.sin(latitude * RAD) * Math.sin(declination * RAD) +
    Math.cos(latitude * RAD) * Math.cos(declination * RAD) * Math.cos(hourAngle * RAD);
  return Math.asin(Math.max(-1, Math.min(1, sinAltitude))) / RAD;
}

/**
 * Bisect for the altitude crossing between two local hours. Returns undefined
 * when the Sun does not cross the horizon in that window, which is the polar
 * day / polar night case rather than an error.
 */
async function findCrossing(
  jdMidnightUt: number,
  latitude: number,
  longitude: number,
  fromHour: number,
  toHour: number,
): Promise<number | undefined> {
  const offset = (hour: number) => jdMidnightUt + hour / 24;
  let lowAltitude = (await sunAltitude(offset(fromHour), latitude, longitude)) - HORIZON_ALTITUDE;
  const highAltitude = (await sunAltitude(offset(toHour), latitude, longitude)) - HORIZON_ALTITUDE;
  if (Math.sign(lowAltitude) === Math.sign(highAltitude)) return undefined;

  let low = fromHour;
  let high = toHour;
  // 40 halvings of a <=24 h window resolve to well under a millisecond.
  for (let iteration = 0; iteration < 40; iteration += 1) {
    const middle = (low + high) / 2;
    const middleAltitude = (await sunAltitude(offset(middle), latitude, longitude)) - HORIZON_ALTITUDE;
    if (Math.sign(middleAltitude) === Math.sign(lowAltitude)) {
      low = middle;
      lowAltitude = middleAltitude;
    } else {
      high = middle;
    }
  }
  return (low + high) / 2;
}

/**
 * @param jdLocalMidnight Julian day (UT) of the instant that is 00:00 *local*
 *   time on the date in question. Offsets from it are therefore already local
 *   hours, and no further timezone conversion is applied here.
 */
export async function calculateSunTimes(
  jdLocalMidnight: number,
  latitude: number,
  longitude: number,
): Promise<SunTimes> {
  // Scan hour by hour across the local day and into the next one, so the
  // crossings stay correctly bracketed even at high latitudes where the day is
  // very short or very long.
  const crossings: { hour: number; rising: boolean }[] = [];
  let previous = await sunAltitude(jdLocalMidnight, latitude, longitude);
  for (let hour = 1; hour <= 48; hour += 1) {
    const current = await sunAltitude(jdLocalMidnight + hour / 24, latitude, longitude);
    if (Math.sign(previous - HORIZON_ALTITUDE) !== Math.sign(current - HORIZON_ALTITUDE)) {
      const found = await findCrossing(jdLocalMidnight, latitude, longitude, hour - 1, hour);
      if (found !== undefined) crossings.push({ hour: found, rising: current > previous });
    }
    previous = current;
  }

  const sunrise = crossings.find((crossing) => crossing.rising && crossing.hour < 24);
  const sunset = crossings.find((crossing) => !crossing.rising && sunrise !== undefined && crossing.hour > sunrise.hour);
  const nextSunrise = crossings.find((crossing) => crossing.rising && sunset !== undefined && crossing.hour > sunset.hour);

  return {
    sunrise: sunrise?.hour,
    sunset: sunset?.hour,
    nextSunrise: nextSunrise?.hour,
  };
}
