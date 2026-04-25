import { ChartData, PlanetData } from "@/types";

const swisseph = require("swisseph");

const PLANET_NAMES: Record<number, string> = {
  [swisseph.SE_SUN]: "Sun",
  [swisseph.SE_MOON]: "Moon",
  [swisseph.SE_MARS]: "Mars",
  [swisseph.SE_MERCURY]: "Mercury",
  [swisseph.SE_JUPITER]: "Jupiter",
  [swisseph.SE_VENUS]: "Venus",
  [swisseph.SE_SATURN]: "Saturn",
};

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function calculateChart(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  lat: number,
  lng: number,
  timezoneOffset: number
): ChartData {
  if (!swisseph || !swisseph.swe_calc_ut) {
    throw new Error("Swiss Ephemeris not available");
  }

  // Convert local time to UTC
  const localEpoch = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  const utcEpoch = localEpoch - timezoneOffset * 3600000;
  const utcDate = new Date(utcEpoch);
  const utcYear = utcDate.getUTCFullYear();
  const utcMonth = utcDate.getUTCMonth() + 1;
  const utcDay = utcDate.getUTCDate();
  const utcHour = utcDate.getUTCHours();
  const utcMin = utcDate.getUTCMinutes();
  const utcSec = utcDate.getUTCSeconds();

  const utcTotalHours = utcHour + utcMin / 60 + utcSec / 3600;
  const jd = swisseph.swe_julday(utcYear, utcMonth, utcDay, utcTotalHours, swisseph.SE_GREG_CAL);

  // Set sidereal mode to Lahiri (used for ayanamsa calculation)
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

  // Get Lahiri ayanamsa
  const lahiriAyanamsa = swisseph.swe_get_ayanamsa_ut(jd);

  // Use tropical flag (no SIDEREAL) - we will subtract ayanamsa manually
  const flagsTropical = swisseph.SEFLG_SWIEPH;

  const planetIds = [
    swisseph.SE_SUN,
    swisseph.SE_MOON,
    swisseph.SE_MARS,
    swisseph.SE_MERCURY,
    swisseph.SE_JUPITER,
    swisseph.SE_VENUS,
    swisseph.SE_SATURN,
  ];

  const planets: PlanetData[] = [];

  // 1. Calculate all planets tropical longitudes
  for (const planetId of planetIds) {
    const result = swisseph.swe_calc_ut(jd, planetId, flagsTropical);
    const tropicalLon = result.longitude;
    const siderealLon = normalize(tropicalLon - lahiriAyanamsa);
    const sign = Math.floor(siderealLon / 30) + 1;
    const degree = siderealLon % 30;

    planets.push({
      name: PLANET_NAMES[planetId],
      longitude: siderealLon,
      sign,
      degree,
      house: 0,
    });
  }

  // Rahu (Mean North Node) - tropical
  const rahuResult = swisseph.swe_calc_ut(jd, swisseph.SE_MEAN_NODE, flagsTropical);
  const rahuTropical = rahuResult.longitude;
  const rahuSidereal = normalize(rahuTropical - lahiriAyanamsa);
  planets.push({
    name: "Rahu",
    longitude: rahuSidereal,
    sign: Math.floor(rahuSidereal / 30) + 1,
    degree: rahuSidereal % 30,
    house: 0,
  });

  // Ketu is opposite Rahu
  const ketuSidereal = normalize(rahuSidereal + 180);
  planets.push({
    name: "Ketu",
    longitude: ketuSidereal,
    sign: Math.floor(ketuSidereal / 30) + 1,
    degree: ketuSidereal % 30,
    house: 0,
  });

  // 2. Calculate tropical ascendant, then convert to sidereal
  const housesResult = swisseph.swe_houses(jd, lat, lng, "W");
  const ascTropical = housesResult.ascendant;
  const ascSidereal = normalize(ascTropical - lahiriAyanamsa);
  const ascSignIndex = Math.floor(ascSidereal / 30);
  const ascDegree = ascSidereal % 30;

  // 3. Calculate whole sign houses using sidereal sign indices
  for (const p of planets) {
    const planetSignIndex = Math.floor(p.longitude / 30);
    p.house = ((planetSignIndex - ascSignIndex + 12) % 12) + 1;
  }

  return {
    ascendant: {
      sign: ascSignIndex + 1,
      degree: ascDegree,
      longitude: ascSidereal,
    },
    planets,
  };
}

/**
 * Calculate transit planets for a given date/time and overlay them onto
 * the natal chart houses (relative to the natal ascendant sign).
 */
export function calculateTransits(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezoneOffset: number,
  natalAscSignIndex: number // 0-based sign index of natal ascendant
): PlanetData[] {
  if (!swisseph || !swisseph.swe_calc_ut) {
    throw new Error("Swiss Ephemeris not available");
  }

  // Convert local time to UTC
  const localEpoch = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  const utcEpoch = localEpoch - timezoneOffset * 3600000;
  const utcDate = new Date(utcEpoch);
  const utcYear = utcDate.getUTCFullYear();
  const utcMonth = utcDate.getUTCMonth() + 1;
  const utcDay = utcDate.getUTCDate();
  const utcHour = utcDate.getUTCHours();
  const utcMin = utcDate.getUTCMinutes();
  const utcSec = utcDate.getUTCSeconds();

  const utcTotalHours = utcHour + utcMin / 60 + utcSec / 3600;
  const jd = swisseph.swe_julday(utcYear, utcMonth, utcDay, utcTotalHours, swisseph.SE_GREG_CAL);

  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);
  const lahiriAyanamsa = swisseph.swe_get_ayanamsa_ut(jd);
  const flagsTropical = swisseph.SEFLG_SWIEPH;

  const planetIds = [
    swisseph.SE_SUN,
    swisseph.SE_MOON,
    swisseph.SE_MARS,
    swisseph.SE_MERCURY,
    swisseph.SE_JUPITER,
    swisseph.SE_VENUS,
    swisseph.SE_SATURN,
  ];

  const planets: PlanetData[] = [];

  for (const planetId of planetIds) {
    const result = swisseph.swe_calc_ut(jd, planetId, flagsTropical);
    const siderealLon = normalize(result.longitude - lahiriAyanamsa);
    const sign = Math.floor(siderealLon / 30) + 1;
    const signIndex = Math.floor(siderealLon / 30);
    const house = ((signIndex - natalAscSignIndex + 12) % 12) + 1;

    planets.push({
      name: PLANET_NAMES[planetId],
      longitude: siderealLon,
      sign,
      degree: siderealLon % 30,
      house,
    });
  }

  // Rahu
  const rahuResult = swisseph.swe_calc_ut(jd, swisseph.SE_MEAN_NODE, flagsTropical);
  const rahuSidereal = normalize(rahuResult.longitude - lahiriAyanamsa);
  const rahuSignIndex = Math.floor(rahuSidereal / 30);
  planets.push({
    name: "Rahu",
    longitude: rahuSidereal,
    sign: rahuSignIndex + 1,
    degree: rahuSidereal % 30,
    house: ((rahuSignIndex - natalAscSignIndex + 12) % 12) + 1,
  });

  // Ketu
  const ketuSidereal = normalize(rahuSidereal + 180);
  const ketuSignIndex = Math.floor(ketuSidereal / 30);
  planets.push({
    name: "Ketu",
    longitude: ketuSidereal,
    sign: ketuSignIndex + 1,
    degree: ketuSidereal % 30,
    house: ((ketuSignIndex - natalAscSignIndex + 12) % 12) + 1,
  });

  return planets;
}
