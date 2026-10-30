// Runs the Muhūrta Finder against the ephemeris: the sidereal positions of the bodies the conditions need, the
// sunrise of each day (the vāra changes at sunrise), and the walk through time of muhurtaFinder.ts.

import { applyAyanamsaOffset, resolveAyanamsaMode } from './ayanamsas';
import { normalizeDegrees } from './angles';
import {
  SE_JUPITER, SE_MARS, SE_MEAN_NODE, SE_MERCURY, SE_MOON, SE_SATURN, SE_SUN, SE_TRUE_NODE, SE_VENUS,
  sweCalcUt, sweGetAscendant, sweGetAyanamsa, sweJulday,
} from './ephemerisAdapter';
import {
  findWindows, isImpossible, isLimited, karanaOf, matchesVara, momentMatches, nakshatraOf, neededBodies, signOf,
  tithiOf, yogaOf, type FinderCriteria, type FinderGraha, type FinderMoment,
} from './muhurtaFinder';
import { calculateSunTimes } from './sunTimes';
import { getUtcOffsetHours } from './timezone';

/** The most moments the walk may look at: a longer span or a finer step is refused. */
export const MAX_FINDER_STEPS = 120_000;
export const MAX_FINDER_DAYS = 366;
/** The most stretches an answer carries. */
export const MAX_FINDER_WINDOWS = 500;

export interface FinderRequest {
  /** The first day, YYYY-MM-DD, local to the place. */
  start: string;
  days: number;
  lat: number;
  lng: number;
  /** The IANA zone of the place, for the daylight-saving time of each date; `tz` is used without one. */
  zone?: string;
  tz: number;
  ayanamsa: string;
  nodeMode: string;
  ayanamsaOffset: number;
  criteria: FinderCriteria;
}

export interface FinderResultWindow {
  /** UTC, in milliseconds since 1970. */
  start: number;
  end: number;
  /** The vāra at the start, 0 Sunday to 6 Saturday. */
  vara: number;
  /** What the sky is at the start of the stretch. */
  at: { tithi: number; nakshatra: number; yoga: number; karana: number; ascendantSign: number };
}

export interface FinderResult {
  windows: FinderResultWindow[];
  truncated: boolean;
  stepMinutes: number;
  /** The span searched, UTC milliseconds. */
  from: number;
  to: number;
}

const JD_UNIX_EPOCH = 2440587.5;
export const jdToMs = (jd: number) => (jd - JD_UNIX_EPOCH) * 86_400_000;

/** The minutes between looks: finer when the Ascendant, which changes sign in an hour or two, is limited. */
export function finderStepMinutes(criteria: FinderCriteria): number {
  return criteria.signs.Asc !== undefined && isLimited(criteria.signs.Asc, 12) ? 5 : 15;
}

/** Whether a request is small enough to run: the number of moments the walk looks at. */
export function finderStepCount(days: number, stepMinutes: number): number {
  return Math.ceil((days * 1440) / stepMinutes) + 1;
}

const BODY_IDS = { Sun: SE_SUN, Moon: SE_MOON, Mars: SE_MARS, Mercury: SE_MERCURY, Jupiter: SE_JUPITER, Venus: SE_VENUS, Saturn: SE_SATURN } as const;

interface DayRow {
  /** UT Julian day of the sunrise. */
  sunriseJd: number;
  weekday: number;
  /** UT Julian day of the local midnight that begins the date. */
  midnightJd: number;
}

export async function runMuhurtaFinder(request: FinderRequest): Promise<FinderResult> {
  const { criteria } = request;
  const mode = resolveAyanamsaMode(request.ayanamsa);
  const nodeId = request.nodeMode === 'true' ? SE_TRUE_NODE : SE_MEAN_NODE;
  const stepMinutes = finderStepMinutes(criteria);

  // The days of the span, and one on either side, with their sunrises.
  const first = Date.parse(`${request.start}T00:00:00Z`);
  const rows: DayRow[] = [];
  for (let offset = -1; offset <= request.days + 1; offset += 1) {
    const date = new Date(first + offset * 86_400_000);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const offsetHours = request.zone ? getUtcOffsetHours(request.zone, new Date(Date.UTC(year, month - 1, day, 12))) : request.tz;
    const midnightJd = await sweJulday(year, month, day, -offsetHours);
    const times = await calculateSunTimes(midnightJd, request.lat, request.lng);
    // Where the Sun does not rise (the polar day and night) the day is taken to begin at 6 o'clock.
    rows.push({ sunriseJd: midnightJd + (times.sunrise ?? 6) / 24, weekday: date.getUTCDay(), midnightJd });
  }
  const fromJd = rows[1].midnightJd;
  const toJd = rows[request.days + 1].midnightJd;

  const varaAt = (jd: number): number => {
    // The last sunrise at or before the moment: the vāra is that day's weekday.
    let low = 0;
    let high = rows.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (rows[middle].sunriseJd <= jd) low = middle; else high = middle - 1;
    }
    return rows[low].weekday;
  };

  // The ayanamsa moves a few seconds of arc in a day: one value for each day is as good as one for each moment.
  const ayanamsaByDay = new Map<number, number>();
  const ayanamsaAt = async (jd: number): Promise<number> => {
    if (mode === 'tropical') return 0;
    const day = Math.floor(jd);
    let value = ayanamsaByDay.get(day);
    if (value === undefined) {
      value = applyAyanamsaOffset(await sweGetAyanamsa(day + 0.5, mode), mode, request.ayanamsaOffset);
      ayanamsaByDay.set(day, value);
    }
    return value;
  };
  const longitudeOf = async (graha: FinderGraha, jd: number): Promise<number> => {
    const ayanamsa = await ayanamsaAt(jd);
    if (graha === 'Asc') return normalizeDegrees((await sweGetAscendant(jd, request.lat, request.lng)) - ayanamsa);
    if (graha === 'Rahu') return normalizeDegrees((await sweCalcUt(jd, nodeId)).longitude - ayanamsa);
    return normalizeDegrees((await sweCalcUt(jd, BODY_IDS[graha])).longitude - ayanamsa);
  };

  const needs = neededBodies(criteria);
  // The conditions on the Sun and the Moon, with the panchāṅga; those on the others are looked at after them.
  const luminaryCriteria: FinderCriteria = {
    ...criteria,
    signs: Object.fromEntries(Object.entries(criteria.signs).filter(([graha]) => graha === 'Sun' || graha === 'Moon')) as FinderCriteria['signs'],
  };
  // Slow grahas first, the Ascendant, which costs the same but changes fastest, last.
  const others = [...needs.others].sort((a, b) => Number(a === 'Asc') - Number(b === 'Asc'));

  const holds = async (jd: number): Promise<boolean> => {
    if (!matchesVara(criteria, varaAt(jd))) return false;
    if (needs.luminaries) {
      const moment: FinderMoment = { vara: varaAt(jd), sun: await longitudeOf('Sun', jd), moon: await longitudeOf('Moon', jd), others: {} };
      if (!momentMatches(moment, luminaryCriteria)) return false;
    }
    for (const graha of others) {
      const allowed = criteria.signs[graha]!;
      if (!allowed.includes(signOf(await longitudeOf(graha, jd)))) return false;
    }
    return true;
  };

  const empty: FinderResult = { windows: [], truncated: false, stepMinutes, from: jdToMs(fromJd), to: jdToMs(toJd) };
  if (isImpossible(criteria)) return empty;

  const { windows, truncated } = await findWindows(holds, fromJd, toJd, stepMinutes, MAX_FINDER_WINDOWS);
  const result: FinderResultWindow[] = [];
  for (const window of windows) {
    // The window is found to the minute from outside; look a little inside to say what the sky is there.
    const jd = window.startJd + 0.5 / 1440;
    const sun = await longitudeOf('Sun', jd);
    const moon = await longitudeOf('Moon', jd);
    result.push({
      start: jdToMs(window.startJd),
      end: jdToMs(window.endJd),
      vara: varaAt(jd),
      at: {
        tithi: tithiOf(sun, moon),
        nakshatra: nakshatraOf(moon),
        yoga: yogaOf(sun, moon),
        karana: karanaOf(sun, moon),
        ascendantSign: signOf(await longitudeOf('Asc', jd)),
      },
    });
  }
  return { ...empty, windows: result, truncated };
}

