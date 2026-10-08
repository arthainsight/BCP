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
import { lunarMonthAt } from './lunisolar';
import { calculateSpecialSphutas, equationOfTimeMinutes, ishtaGhatis, type SunriseMode } from './specialSphutas';

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
  ayanamsaOffsetDegrees: number = 0,
  sunriseMode: SunriseMode = 'mean',
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
  const sun = planets.find((p) => p.name === 'Sun')!;
  const moon = planets.find((p) => p.name === 'Moon')!;

  // Sunrise and sunset for the birth date, needed by Natonnata and Tribhāga
  // Bala. Computed from local midnight so the returned hours are local.
  const utcAtLocalMidnight = toUtcParts(year, month, day, 0, 0, 0, timezoneOffset);
  const jdLocalMidnight = await sweJulday(
    utcAtLocalMidnight.year, utcAtLocalMidnight.month, utcAtLocalMidnight.day, utcAtLocalMidnight.totalHours,
  );
  const sunTimes = await calculateSunTimes(jdLocalMidnight, lat, lng);
  const previousDay = await calculateSunTimes(jdLocalMidnight - 1, lat, lng);
  const previousSunset = previousDay.sunset !== undefined ? previousDay.sunset - 24 : undefined;
  const previousSunrise = previousDay.sunrise !== undefined ? previousDay.sunrise - 24 : undefined;

  // The special lagnas run on the ishṭa, the time from sunrise to birth.
  const rahu = planets.find((p) => p.name === 'Rahu')!;
  const sunriseForLagnas = sunTimes.sunrise ?? 6;
  const ishta = ishtaGhatis(localHours, sunriseForLagnas, sunriseMode, equationOfTimeMinutes(utc.year, utc.month, utc.day, utc.totalHours));
  const sphutas = calculateSpecialSphutas({
    ascendantLongitude: ascLon,
    sunLongitude: sun.longitude,
    moonLongitude: moon.longitude,
    rahuLongitude: rahu.longitude,
    planets: planets.map((p) => ({ name: p.name, sign: p.sign, degree: p.degree })),
    ishta,
  });
  // The ones the charts mark, in the order they are marked.
  const specialLagnas: SpecialLagna[] = ['HL', 'BL', 'GL', 'SL', 'PP', 'ViL'].map((key) => {
    const sphuta = sphutas.find((item) => item.key === key)!;
    return { name: key, longitude: sphuta.longitude, sign: sphuta.sign, degree: sphuta.degree };
  });
  const lunarMonth = await lunarMonthAt(jd, ayanamsaSetting, ayanamsaOffsetDegrees);

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
    previousSunsetLocalHours: previousSunset,
    previousSunriseLocalHours: previousSunrise,
  };

  return {
    ascendant: {
      sign: ascSignIndex + 1,
      degree: ascDegree,
      longitude: ascLon,
    },
    planets,
    specialLagnas,
    lunarMonth: { masaIndex: lunarMonth.masaIndex, adhika: lunarMonth.adhika },
    debug,
  };
}


/** Bodies the transit-hit search follows; Ketu is Rahu + 180°. */
export const SLOW_TRANSIT_BODIES = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'] as const;

/**
 * Daily sidereal longitudes of the slow grahas, starting at a UTC moment, for
 * the transit-hit search. Uses the same ayanamsa and node settings as the chart.
 */
export async function calculateSlowTransitSeries(
  startUtcMs: number,
  days: number,
  ayanamsaSetting: string = 'lahiri',
  nodeModeSetting: string = 'mean',
  ayanamsaOffsetDegrees: number = 0,
): Promise<Record<(typeof SLOW_TRANSIT_BODIES)[number], number[]>> {
  const ayanamsaMode = resolveAyanamsaMode(ayanamsaSetting);
  const useTropical = ayanamsaMode === 'tropical';
  const nodeId = resolveNodeMode(nodeModeSetting) === 'true' ? SE_TRUE_NODE : SE_MEAN_NODE;
  const start = new Date(startUtcMs);
  const startJd = await sweJulday(
    start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(),
    start.getUTCHours() + start.getUTCMinutes() / 60 + start.getUTCSeconds() / 3600,
  );
  const series = { Jupiter: [] as number[], Saturn: [] as number[], Rahu: [] as number[], Ketu: [] as number[] };
  for (let day = 0; day <= days; day++) {
    const jd = startJd + day;
    const ayanamsa = useTropical ? 0 : applyAyanamsaOffset(await sweGetAyanamsa(jd, ayanamsaMode), ayanamsaMode, ayanamsaOffsetDegrees);
    const sidereal = (tropical: number) => normalize(tropical - ayanamsa);
    series.Jupiter.push(sidereal((await sweCalcUt(jd, SE_JUPITER)).longitude));
    series.Saturn.push(sidereal((await sweCalcUt(jd, SE_SATURN)).longitude));
    const rahu = sidereal((await sweCalcUt(jd, nodeId)).longitude);
    series.Rahu.push(rahu);
    series.Ketu.push(normalize(rahu + 180));
  }
  return series;
}

/** Grahas whose sign changes are listed, with the sample step that suits their speed, in hours. */
export const SIGN_CHANGE_STEP_HOURS = {
  Moon: 3,
  Sun: 12, Mars: 12, Mercury: 12, Venus: 12,
  Jupiter: 24, Saturn: 24, Rahu: 24, Ketu: 24,
} as const;
export type SignChangeBody = keyof typeof SIGN_CHANGE_STEP_HOURS;

const SIGN_CHANGE_IDS: Record<Exclude<SignChangeBody, 'Rahu' | 'Ketu'>, number> = {
  Sun: SE_SUN, Moon: SE_MOON, Mars: SE_MARS, Mercury: SE_MERCURY, Venus: SE_VENUS, Jupiter: SE_JUPITER, Saturn: SE_SATURN,
};

/**
 * Sidereal longitudes of the chosen grahas from a UTC moment for a number of
 * days, each sampled at the step that suits it (see SIGN_CHANGE_STEP_HOURS).
 * Uses the same ayanamsa and node settings as the chart.
 */
export async function calculateSignChangeSeries(
  bodies: SignChangeBody[],
  startUtcMs: number,
  days: number,
  ayanamsaSetting: string = 'lahiri',
  nodeModeSetting: string = 'mean',
  ayanamsaOffsetDegrees: number = 0,
): Promise<Record<string, { step: number; longitudes: number[] }>> {
  const ayanamsaMode = resolveAyanamsaMode(ayanamsaSetting);
  const useTropical = ayanamsaMode === 'tropical';
  const nodeId = resolveNodeMode(nodeModeSetting) === 'true' ? SE_TRUE_NODE : SE_MEAN_NODE;
  const start = new Date(startUtcMs);
  const startJd = await sweJulday(
    start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(),
    start.getUTCHours() + start.getUTCMinutes() / 60 + start.getUTCSeconds() / 3600,
  );
  const result: Record<string, { step: number; longitudes: number[] }> = {};
  for (const body of bodies) {
    const stepHours = SIGN_CHANGE_STEP_HOURS[body];
    const longitudes: number[] = [];
    for (let i = 0; i <= (days * 24) / stepHours; i++) {
      const jd = startJd + (i * stepHours) / 24;
      const ayanamsa = useTropical ? 0 : applyAyanamsaOffset(await sweGetAyanamsa(jd, ayanamsaMode), ayanamsaMode, ayanamsaOffsetDegrees);
      if (body === 'Rahu' || body === 'Ketu') {
        const rahu = normalize((await sweCalcUt(jd, nodeId)).longitude - ayanamsa);
        longitudes.push(body === 'Rahu' ? rahu : normalize(rahu + 180));
      } else {
        longitudes.push(normalize((await sweCalcUt(jd, SIGN_CHANGE_IDS[body])).longitude - ayanamsa));
      }
    }
    result[body] = { step: stepHours * 3_600_000, longitudes };
  }
  return result;
}
