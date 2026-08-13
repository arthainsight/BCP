import { ChartData, DebugInfo, PlanetData, SpecialLagna } from "@/types";
import {
  SE_SUN, SE_MOON, SE_MARS, SE_MERCURY, SE_JUPITER, SE_VENUS, SE_SATURN,
  SE_URANUS, SE_NEPTUNE, SE_PLUTO,
  SE_MEAN_NODE, SE_TRUE_NODE,
  sweJulday, sweGetAyanamsa, sweCalcUt, sweCalcUtEquatorial, sweGetAscendant,
} from "./ephemerisAdapter";
import { applyAyanamsaOffset, resolveAyanamsaMode } from './ayanamsas';
import { calculateSunTimes } from './sunTimes';
import { normalizeDegrees } from './angles';

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
  return normalizeDegrees(value);
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
    const { longitude: tropicalLon, speed } = await sweCalcUt(jd, planetId);
    // Declination is frame-independent: the ayanamsa shifts ecliptic longitude
    // but not the planet's actual position relative to the celestial equator.
    const { declination } = await sweCalcUtEquatorial(jd, planetId);
    const lon = useTropical ? normalize(tropicalLon) : normalize(tropicalLon - ayanamsa);
    planets.push({
      name: PLANET_NAMES[planetId],
      longitude: lon,
      sign: Math.floor(lon / 30) + 1,
      degree: lon % 30,
      house: 0,
      isRetrograde: speed < 0,
      speed,
      declination,
    });
  }

  return planets;
}

async function addNodes(planets: PlanetData[], jd: number, ayanamsa: number, useTropical: boolean, nodeMode: 'mean' | 'true') {
  const nodeId = nodeMode === 'true' ? SE_TRUE_NODE : SE_MEAN_NODE;
  const { longitude: rahuTropical, speed: nodeSpeed } = await sweCalcUt(jd, nodeId);
  const rahuLon = useTropical ? normalize(rahuTropical) : normalize(rahuTropical - ayanamsa);
  const nodeRetro = nodeSpeed < 0;
  planets.push({ name: "Rahu", longitude: rahuLon, sign: Math.floor(rahuLon / 30) + 1, degree: rahuLon % 30, house: 0, isRetrograde: nodeRetro, speed: nodeSpeed });

  const ketuLon = normalize(rahuLon + 180);
  planets.push({ name: "Ketu", longitude: ketuLon, sign: Math.floor(ketuLon / 30) + 1, degree: ketuLon % 30, house: 0, isRetrograde: nodeRetro, speed: nodeSpeed });
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
  nodeModeSetting: string = 'mean',
  ayanamsaOffsetDegrees: number = 0
): Promise<ChartData> {
  const ayanamsaMode = resolveAyanamsaMode(ayanamsaSetting);
  const nodeMode = resolveNodeMode(nodeModeSetting);
  const utc = toUtcParts(year, month, day, hour, minute, second, timezoneOffset);

  const jd = await sweJulday(utc.year, utc.month, utc.day, utc.totalHours);
  const baseAyanamsa = await sweGetAyanamsa(jd, ayanamsaMode);
  const ayanamsa = applyAyanamsaOffset(baseAyanamsa, ayanamsaMode, ayanamsaOffsetDegrees);
  const siderealAyanamsa = ayanamsaMode === 'lahiri' ? ayanamsa : await sweGetAyanamsa(jd, 'lahiri');
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

  // Sunrise and sunset for the birth date, needed by Natonnata and Tribhāga
  // Bala. Computed from local midnight so the returned hours are local.
  const utcAtLocalMidnight = toUtcParts(year, month, day, 0, 0, 0, timezoneOffset);
  const jdLocalMidnight = await sweJulday(
    utcAtLocalMidnight.year, utcAtLocalMidnight.month, utcAtLocalMidnight.day, utcAtLocalMidnight.totalHours,
  );
  const sunTimes = await calculateSunTimes(jdLocalMidnight, lat, lng);

  const pad = (n: number) => String(n).padStart(2, '0');
  const debug: DebugInfo = {
    julianDay: jd,
    ayanamsa,
    siderealAyanamsa,
    utcOffset: timezoneOffset,
    ascendantDegree: ascDegree,
    ascendantSign: ascSignIndex + 1,
    ephemerisEngine: `swisseph-wasm · ${ayanamsaMode} · ${nodeMode}-node`,
    inputDateTime: `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`,
    latitude: lat,
    longitude: lng,
    sunriseLocalHours: sunTimes.sunrise,
    sunsetLocalHours: sunTimes.sunset,
    nextSunriseLocalHours: sunTimes.nextSunrise,
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
  nodeModeSetting: string = 'mean',
  ayanamsaOffsetDegrees: number = 0
): Promise<PlanetData[]> {
  const ayanamsaMode = resolveAyanamsaMode(ayanamsaSetting);
  const nodeMode = resolveNodeMode(nodeModeSetting);
  const utc = toUtcParts(year, month, day, hour, minute, second, timezoneOffset);

  const jd = await sweJulday(utc.year, utc.month, utc.day, utc.totalHours);
  const baseAyanamsa = await sweGetAyanamsa(jd, ayanamsaMode);
  const ayanamsa = applyAyanamsaOffset(baseAyanamsa, ayanamsaMode, ayanamsaOffsetDegrees);
  const useTropical = ayanamsaMode === 'tropical';

  const planets = await calculatePlanetPositions(jd, ayanamsa, useTropical);
  await addNodes(planets, jd, ayanamsa, useTropical, nodeMode);

  for (const p of planets) {
    const signIndex = Math.floor(p.longitude / 30);
    p.house = ((signIndex - natalAscSignIndex + 12) % 12) + 1;
  }

  return planets;
}
