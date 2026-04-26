import { ChartData, DebugInfo, PlanetData } from "@/types";
import {
  SE_SUN, SE_MOON, SE_MARS, SE_MERCURY, SE_JUPITER, SE_VENUS, SE_SATURN,
  SE_MEAN_NODE, SE_TRUE_NODE,
  sweJulday, sweGetAyanamsa, sweCalcUt, sweGetAscendant,
} from "./ephemerisAdapter";

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
  timezoneOffset: number,
  ayanamsaMode: any = 'lahiri',
  nodeMode: any = 'mean'
): Promise<ChartData> {

  const localEpoch = Date.UTC(year, month - 1, day, hour, minute, second);
  const utcEpoch = localEpoch - timezoneOffset * 3600000;
  const utcDate = new Date(utcEpoch);

  const jd = await sweJulday(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth() + 1,
    utcDate.getUTCDate(),
    utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60
  );

  const ayanamsa = await sweGetAyanamsa(jd, ayanamsaMode);

  const planets: PlanetData[] = [];
  const ids = [SE_SUN, SE_MOON, SE_MARS, SE_MERCURY, SE_JUPITER, SE_VENUS, SE_SATURN];

  for (const id of ids) {
    const tropical = await sweCalcUt(jd, id);
    const lon = ayanamsaMode === 'tropical' ? tropical : normalize(tropical - ayanamsa);

    planets.push({
      name: String(id),
      longitude: lon,
      sign: Math.floor(lon / 30) + 1,
      degree: lon % 30,
      house: 0,
    });
  }

  const nodeId = nodeMode === 'true' ? SE_TRUE_NODE : SE_MEAN_NODE;
  const nodeTropical = await sweCalcUt(jd, nodeId);
  const nodeLon = ayanamsaMode === 'tropical' ? nodeTropical : normalize(nodeTropical - ayanamsa);

  planets.push({ name: "Rahu", longitude: nodeLon, sign: Math.floor(nodeLon / 30) + 1, degree: nodeLon % 30, house: 0 });
  const ketuLon = normalize(nodeLon + 180);
  planets.push({ name: "Ketu", longitude: ketuLon, sign: Math.floor(ketuLon / 30) + 1, degree: ketuLon % 30, house: 0 });

  const ascTropical = await sweGetAscendant(jd, lat, lng);
  const asc = ayanamsaMode === 'tropical' ? ascTropical : normalize(ascTropical - ayanamsa);
  const ascIndex = Math.floor(asc / 30);

  for (const p of planets) {
    const idx = Math.floor(p.longitude / 30);
    p.house = ((idx - ascIndex + 12) % 12) + 1;
  }

  return {
    ascendant: { sign: ascIndex + 1, degree: asc % 30, longitude: asc },
    planets,
    debug: { ayanamsa },
  };
}
