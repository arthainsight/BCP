import { ChartData, DebugInfo, PlanetData, SpecialLagna } from "@/types";
import {
  SE_SUN, SE_MOON, SE_MARS, SE_MERCURY, SE_JUPITER, SE_VENUS, SE_SATURN,
  SE_URANUS, SE_NEPTUNE, SE_PLUTO,
  SE_MEAN_NODE, SE_TRUE_NODE,
  sweJulday, sweGetAyanamsa, sweCalcUt, sweGetAscendant,
} from "./ephemerisAdapter";

const PLANET_NAMES: Record<number, string> = {
  [SE_SUN]: "Sun",
  [SE_MOON]: "Moon",
  [SE_MARS]: "Mars",
  [SE_MERCURY]: "Mercury",
  [SE_JUPITER]: "Jupiter",
  [SE_VENUS]: "Venus",
  [SE_SATURN]: "Saturn",
  [SE_URANUS]: "Uranus",
  [SE_NEPTUNE]: "Neptune",
  [SE_PLUTO]: "Pluto",
};

const PLANET_IDS = [
  SE_SUN, SE_MOON, SE_MARS, SE_MERCURY, SE_JUPITER, SE_VENUS, SE_SATURN,
  SE_URANUS, SE_NEPTUNE, SE_PLUTO,
];

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function resolveAyanamsaMode(value: string): 'tropical' | 'lahiri' | 'raman' | 'krishnamurti' {
  if (value === 'tropical' || value === 'raman' || value === 'krishnamurti') return value;
  return 'lahiri';
}

function resolveNodeMode(value: string): 'mean' | 'true' {
  return value === 'true' ? 'true' : 'mean';
}

function toUtcParts(year: number, month: number, day: number, hour: number, minute: number, second: number, timezoneOffset: number) {
  const localEpoch = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  const utcEpoch = localEpoch - timezoneOffset * 3600000;
  const utcDate = new Date(utcEpoch);
  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    totalHours: utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60 + utcDate.getUTCSeconds() / 3600,
  };
}

async function calculatePlanetPositions(jd: number, ayanamsa: number, useTropical: boolean): Promise<PlanetData[]> {
  const planets: PlanetData[] = [];

  for (const planetId of PLANET_IDS) {
    const tropicalLon = await sweCalcUt(jd, planetId);
    const lon = useTropical ? normalize(tropicalLon) : normalize(tropicalLon - ayanamsa);
    planets.push({
      name: PLANET_NAMES[planetId],
      longitude: lon,
      sign: Math.floor(lon / 30) + 1,
      degree: lon % 30,
      house: 0,
    });
  }

  return planets;
}

async function addNodes(planets: PlanetData[], jd: number, ayanamsa: number, useTropical: boolean, nodeMode: 'mean' | 'true') {
  const nodeId = nodeMode === 'true' ? SE_TRUE_NODE : SE_MEAN_NODE;
  const rahuTropical = await sweCalcUt(jd, nodeId);
  const rahuLon = useTropical ? normalize(rahuTropical) : normalize(rahuTropical - ayanamsa);
  planets.push({ name: "Rahu", longitude: rahuLon, sign: Math.floor(rahuLon / 30) + 1, degree: rahuLon % 30, house: 0 });

  const ketuLon = normalize(rahuLon + 180);
  planets.push({ name: "Ketu", longitude: ketuLon, sign: Math.floor(ketuLon / 30) + 1, degree: ketuLon % 30, house: 0 });
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
  ayanamsaSetting: string = 'lahiri',
  nodeModeSetting: string = 'mean'
): Promise<ChartData> {
  const ayanamsaMode = resolveAyanamsaMode(ayanamsaSetting);
  const nodeMode = resolveNodeMode(nodeModeSetting);
  const utc = toUtcParts(year, month, day, hour, minute, second, timezoneOffset);

  const jd = await sweJulday(utc.year, utc.month, utc.day, utc.totalHours);
  const ayanamsa = await sweGetAyanamsa(jd, ayanamsaMode);
  const useTropical = ayanamsaMode === 'tropical';

  const planets = await calculatePlanetPositions(jd, ayanamsa, useTropical);
  await addNodes(planets, jd, ayanamsa, useTropical, nodeMode);

  const ascTropical = await sweGetAscendant(jd, lat, lng);
  const ascLon = useTropical ? normalize(ascTropical) : normalize(ascTropical - ayanamsa);
  const ascSignIndex = Math.floor(ascLon / 30);
  const ascDegree = ascLon % 30;

  for (const p of planets) {
    const planetSignIndex = Math.floor(p.longitude / 30);
    p.house = ((planetSignIndex - ascSignIndex + 12) % 12) + 1;
  }

  const localHours = hour + minute / 60 + second / 3600;
  const dayFraction = localHours / 24;
  const sun = planets.find((p) => p.name === 'Sun')!;
  const moon = planets.find((p) => p.name === 'Moon')!;

  function sl(lon: number): SpecialLagna & { name: string } {
    return { name: '', longitude: lon, sign: Math.floor(lon / 30) + 1, degree: lon % 30 };
  }

  const specialLagnas: SpecialLagna[] = [
    { ...sl(normalize(sun.longitude + dayFraction * 360)), name: 'HL' },
    { ...sl(normalize(ascLon + dayFraction * 360)), name: 'BL' },
    { ...sl(normalize(ascLon + dayFraction * 720)), name: 'GL' },
    { ...sl(normalize((ascLon + moon.longitude) / 2)), name: 'SL' },
    { ...sl(normalize(ascLon + dayFraction * 1080)), name: 'PP' },
    { ...sl(normalize(ascLon + dayFraction * 1440)), name: 'ViL' },
  ];

  const pad = (n: number) => String(n).padStart(2, '0');
  const debug: DebugInfo = {
    julianDay: jd,
    ayanamsa,
    utcOffset: timezoneOffset,
    ascendantDegree: ascDegree,
    ascendantSign: ascSignIndex + 1,
    ephemerisEngine: `swisseph-wasm · ${ayanamsaMode} · ${nodeMode}-node`,
    inputDateTime: `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`,
    latitude: lat,
    longitude: lng,
  };

  return {
    ascendant: {
      sign: ascSignIndex + 1,
      degree: ascDegree,
      longitude: ascLon,
    },
    planets,
    specialLagnas,
    debug,
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
  natalAscSignIndex: number,
  ayanamsaSetting: string = 'lahiri',
  nodeModeSetting: string = 'mean'
): Promise<PlanetData[]> {
  const ayanamsaMode = resolveAyanamsaMode(ayanamsaSetting);
  const nodeMode = resolveNodeMode(nodeModeSetting);
  const utc = toUtcParts(year, month, day, hour, minute, second, timezoneOffset);

  const jd = await sweJulday(utc.year, utc.month, utc.day, utc.totalHours);
  const ayanamsa = await sweGetAyanamsa(jd, ayanamsaMode);
  const useTropical = ayanamsaMode === 'tropical';

  const planets = await calculatePlanetPositions(jd, ayanamsa, useTropical);
  await addNodes(planets, jd, ayanamsa, useTropical, nodeMode);

  for (const p of planets) {
    const signIndex = Math.floor(p.longitude / 30);
    p.house = ((signIndex - natalAscSignIndex + 12) % 12) + 1;
  }

  return planets;
}
