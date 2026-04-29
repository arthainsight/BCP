// NOAA/USNO sunrise-sunset algorithm (after Meeus, Astronomical Algorithms)
// Returns times as decimal UTC hours. Polar day/night yields null.

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function julianDay(year: number, month: number, day: number): number {
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function geomMeanLongSun(t: number): number {
  const l = 280.46646 + t * (36000.76983 + t * 0.0003032);
  return ((l % 360) + 360) % 360;
}

function geomMeanAnomalySun(t: number): number {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t);
}

function eccentricity(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
}

function sunEqOfCenter(t: number): number {
  const m = geomMeanAnomalySun(t) * RAD;
  return Math.sin(m) * (1.9146 - t * (0.004817 + 0.000014 * t))
       + Math.sin(2 * m) * (0.019993 - 0.000101 * t)
       + Math.sin(3 * m) * 0.00029;
}

function sunApparentLong(t: number): number {
  const trueLon = geomMeanLongSun(t) + sunEqOfCenter(t);
  const omega = (125.04 - 1934.136 * t) * RAD;
  return trueLon - 0.00569 - 0.00478 * Math.sin(omega);
}

function obliquityCorrection(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  const e0 = 23 + (26 + seconds / 60) / 60;
  const omega = (125.04 - 1934.136 * t) * RAD;
  return e0 + 0.00256 * Math.cos(omega);
}

function sunDeclination(t: number): number {
  return Math.asin(Math.sin(obliquityCorrection(t) * RAD) * Math.sin(sunApparentLong(t) * RAD)) * DEG;
}

function equationOfTime(t: number): number {
  const eps = obliquityCorrection(t) * RAD;
  const l0 = geomMeanLongSun(t) * RAD;
  const e = eccentricity(t);
  const m = geomMeanAnomalySun(t) * RAD;
  const y = Math.tan(eps / 2) ** 2;
  const etime = y * Math.sin(2 * l0) - 2 * e * Math.sin(m)
    + 4 * e * y * Math.sin(m) * Math.cos(2 * l0)
    - 0.5 * y * y * Math.sin(4 * l0)
    - 1.25 * e * e * Math.sin(2 * m);
  return DEG * etime * 4; // minutes
}

export interface SolarTimes {
  sunrise: number | null;  // decimal UTC hours
  sunset: number | null;
  solarNoon: number | null;
}

export function calcSolarTimes(
  year: number, month: number, day: number,
  lat: number, lng: number,
): SolarTimes {
  const jd = julianDay(year, month, day);
  const t = (jd - 2451545.0) / 36525.0;
  const eqTime = equationOfTime(t);
  const decl = sunDeclination(t);
  const noonMin = 720 - 4 * lng - eqTime; // minutes past midnight UTC

  const latRad = lat * RAD;
  const declRad = decl * RAD;
  const arg = Math.cos(90.833 * RAD) / (Math.cos(latRad) * Math.cos(declRad))
            - Math.tan(latRad) * Math.tan(declRad);

  if (arg > 1 || arg < -1) {
    return { sunrise: null, sunset: null, solarNoon: noonMin / 60 };
  }

  const ha = Math.acos(arg) * DEG;
  return {
    sunrise: (noonMin - 4 * ha) / 60,
    sunset:  (noonMin + 4 * ha) / 60,
    solarNoon: noonMin / 60,
  };
}
