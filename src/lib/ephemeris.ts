import { ChartData, PlanetData } from "@/types";
import {
  SE_SUN, SE_MOON, SE_MARS, SE_MERCURY, SE_JUPITER, SE_VENUS, SE_SATURN, SE_MEAN_NODE,
  sweJulday, sweGetAyanamsa, sweCalcUt, sweGetAscendant,
} from "./ephemerisAdapter";

const PLANET_NAMES: Record<number, string> = {
  [SE_SUN]:     "Sun",
  [SE_MOON]:    "Moon",
  [SE_MARS]:    "Mars",
  [SE_MERCURY]: "Mercury",
  [SE_JUPITER]: "Jupiter",
  [SE_VENUS]:   "Venus",
  [SE_SATURN]:  "Saturn",
};

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

export async function calculateChart(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  lat: number,
  lng: number,
  timezoneOffset: number
): Promise<ChartData> {
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
  const jd = await sweJulday(utcYear, utcMonth, utcDay, utcTotalHours);
  const lahiriAyanamsa = await sweGetAyanamsa(jd);

  const planetIds = [SE_SUN, SE_MOON, SE_MARS, SE_MERCURY, SE_JUPITER, SE_VENUS, SE_SATURN];
  const planets: PlanetData[] = [];

  for (const planetId of planetIds) {
    const tropicalLon = await sweCalcUt(jd, planetId);
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

  const rahuTropical = await sweCalcUt(jd, SE_MEAN_NODE);
  const rahuSidereal = normalize(rahuTropical - lahiriAyanamsa);
  planets.push({
    name: "Rahu",
    longitude: rahuSidereal,
    sign: Math.floor(rahuSidereal / 30) + 1,
    degree: rahuSidereal % 30,
    house: 0,
  });

  const ketuSidereal = normalize(rahuSidereal + 180);
  planets.push({
    name: "Ketu",
    longitude: ketuSidereal,
    sign: Math.floor(ketuSidereal / 30) + 1,
    degree: ketuSidereal % 30,
    house: 0,
  });

  const ascTropical = await sweGetAscendant(jd, lat, lng);
  const ascSidereal = normalize(ascTropical - lahiriAyanamsa);
  const ascSignIndex = Math.floor(ascSidereal / 30);
  const ascDegree = ascSidereal % 30;

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

export async function calculateTransits(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezoneOffset: number,
  natalAscSignIndex: number
): Promise<PlanetData[]> {
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
  const jd = await sweJulday(utcYear, utcMonth, utcDay, utcTotalHours);
  const lahiriAyanamsa = await sweGetAyanamsa(jd);

  const planetIds = [SE_SUN, SE_MOON, SE_MARS, SE_MERCURY, SE_JUPITER, SE_VENUS, SE_SATURN];
  const planets: PlanetData[] = [];

  for (const planetId of planetIds) {
    const tropicalLon = await sweCalcUt(jd, planetId);
    const siderealLon = normalize(tropicalLon - lahiriAyanamsa);
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

  const rahuTropical = await sweCalcUt(jd, SE_MEAN_NODE);
  const rahuSidereal = normalize(rahuTropical - lahiriAyanamsa);
  const rahuSignIndex = Math.floor(rahuSidereal / 30);
  planets.push({
    name: "Rahu",
    longitude: rahuSidereal,
    sign: rahuSignIndex + 1,
    degree: rahuSidereal % 30,
    house: ((rahuSignIndex - natalAscSignIndex + 12) % 12) + 1,
  });

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
