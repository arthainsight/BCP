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
  // First create a date in local time, then adjust by timezone offset
  const localDate = new Date(year, month - 1, day, hour, minute, second);
  const utcDate = new Date(localDate.getTime() - timezoneOffset * 3600000);

  const utcYear = utcDate.getFullYear();
  const utcMonth = utcDate.getMonth() + 1;
  const utcDay = utcDate.getDate();
  const utcHour = utcDate.getHours();
  const utcMin = utcDate.getMinutes();
  const utcSec = utcDate.getSeconds();

  const utcTotalHours = utcHour + utcMin / 60 + utcSec / 3600;
  const jd = swisseph.swe_julday(utcYear, utcMonth, utcDay, utcTotalHours, swisseph.SE_GREG_CAL);

  // Set sidereal mode to Lahiri
  swisseph.swe_set_sid_mode(swisseph.SE_SIDM_LAHIRI, 0, 0);

  // Calculate sidereal positions
  const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SIDEREAL;

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
    const result = swisseph.swe_calc_ut(jd, planetId, flags);
    const longitude = result.longitude;
    const sign = Math.floor(longitude / 30) + 1;
    const degree = longitude % 30;

    planets.push({
      name: PLANET_NAMES[planetId],
      longitude,
      sign,
      degree,
      house: 0,
    });
  }

  // Rahu (Mean North Node)
  const rahuResult = swisseph.swe_calc_ut(jd, swisseph.SE_MEAN_NODE, flags);
  const rahuLon = rahuResult.longitude;
  planets.push({
    name: "Rahu",
    longitude: rahuLon,
    sign: Math.floor(rahuLon / 30) + 1,
    degree: rahuLon % 30,
    house: 0,
  });

  // Ketu is opposite Rahu
  const ketuLon = (rahuLon + 180) % 360;
  planets.push({
    name: "Ketu",
    longitude: ketuLon,
    sign: Math.floor(ketuLon / 30) + 1,
    degree: ketuLon % 30,
    house: 0,
  });

  // Calculate houses and ascendant
  const housesResult = swisseph.swe_houses(jd, lat, lng, "W");
  const ascTropical = housesResult.ascendant;

  // Get ayanamsa for sidereal conversion
  const ayanamsa = swisseph.swe_get_ayanamsa_ut(jd);

  // Sidereal ascendant
  const ascSidereal = (ascTropical - ayanamsa + 360) % 360;
  const ascSign = Math.floor(ascSidereal / 30);
  const ascDegree = ascSidereal % 30;

  // Whole sign houses
  const ascStart = ascSign * 30;

  function getWholeSignHouse(longitude: number): number {
    const offset = (longitude - ascStart + 360) % 360;
    return Math.floor(offset / 30) + 1;
  }

  for (const p of planets) {
    p.house = getWholeSignHouse(p.longitude);
  }

  return {
    ascendant: {
      sign: ascSign + 1,
      degree: ascDegree,
      longitude: ascSidereal,
    },
    planets,
  };
}
