// The month strip of the Muhūrta Finder: for each stretch of time in which the vāra, tithi, nakṣatra, karaṇa and yoga
// are all the same, one state. The strip colours them against the choices of the page; the server only says what the sky is.

import { applyAyanamsaOffset, resolveAyanamsaMode } from './ayanamsas';
import { normalizeDegrees } from './angles';
import { SE_MOON, SE_SUN, sweCalcUt, sweGetAyanamsa, sweJulday } from './ephemerisAdapter';
import { MINUTE_JD, karanaOf, nakshatraOf, signOf, tithiOf, yogaOf } from './muhurtaFinder';
import { calculateSunTimes } from './sunTimes';
import { getUtcOffsetHours } from './timezone';

export interface StripState {
  /** Start and end of the stretch, in milliseconds since 1970 (UT). */
  start: number;
  end: number;
  /** Vāra from Sunday (0): changes at sunrise. */
  vara: number;
  tithi: number;
  nakshatra: number;
  karana: number;
  yoga: number;
  /** The sign of the Moon, 0 (Aries) to 11, for the Chandrabala. */
  moonSign: number;
}

export interface StripDay {
  /** The local midnight that begins the date, and the date's weekday from Sunday (0). */
  start: number;
  weekday: number;
  /** Day of the month. */
  date: number;
}

export interface StripRequest {
  start: string;
  days: number;
  lat: number;
  lng: number;
  zone?: string;
  tz: number;
  ayanamsa: string;
  ayanamsaOffset: number;
}

export interface StripResult {
  start: number;
  end: number;
  days: StripDay[];
  states: StripState[];
}

/** The most days one strip covers. */
export const MAX_STRIP_DAYS = 62;
/** How often the sky is looked at, in minutes; where it changes, the moment is found to the minute by halving. */
const STEP_MINUTES = 30;
const JD_UNIX_EPOCH = 2440587.5;
const jdToMs = (jd: number) => Math.round((jd - JD_UNIX_EPOCH) * 86_400_000);

type Key = [number, number, number, number, number, number];
const same = (a: Key, b: Key) => a.every((value, index) => value === b[index]);

export async function runMuhurtaStrip(request: StripRequest): Promise<StripResult> {
  const mode = resolveAyanamsaMode(request.ayanamsa);
  const first = Date.parse(`${request.start}T00:00:00Z`);
  const rows: { sunriseJd: number; weekday: number; midnightJd: number; date: number }[] = [];
  for (let offset = -1; offset <= request.days; offset += 1) {
    const date = new Date(first + offset * 86_400_000);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const offsetHours = request.zone ? getUtcOffsetHours(request.zone, new Date(Date.UTC(year, month - 1, day, 12))) : request.tz;
    const midnightJd = await sweJulday(year, month, day, -offsetHours);
    const times = await calculateSunTimes(midnightJd, request.lat, request.lng);
    // Where the Sun does not rise the day is taken to begin at 6 o'clock.
    rows.push({ sunriseJd: midnightJd + (times.sunrise ?? 6) / 24, weekday: date.getUTCDay(), midnightJd, date: day });
  }
  const fromJd = rows[1].midnightJd;
  const toJd = rows[request.days + 1]?.midnightJd ?? rows[rows.length - 1].midnightJd + 1;

  const varaAt = (jd: number): number => {
    let low = 0;
    let high = rows.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (rows[middle].sunriseJd <= jd) low = middle; else high = middle - 1;
    }
    return rows[low].weekday;
  };
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
  const keyAt = async (jd: number): Promise<Key> => {
    const ayanamsa = await ayanamsaAt(jd);
    const sun = normalizeDegrees((await sweCalcUt(jd, SE_SUN)).longitude - ayanamsa);
    const moon = normalizeDegrees((await sweCalcUt(jd, SE_MOON)).longitude - ayanamsa);
    return [varaAt(jd), tithiOf(sun, moon), nakshatraOf(moon), karanaOf(sun, moon), yogaOf(sun, moon), signOf(moon)];
  };

  // Walk through the span; where the state changes inside a step, find the first change to the minute and go on from it.
  const states: StripState[] = [];
  const step = STEP_MINUTES / 1440;
  let startJd = fromJd;
  let current = await keyAt(fromJd);
  let cursor = fromJd;
  while (cursor < toJd) {
    const next = Math.min(cursor + step, toJd);
    const there = await keyAt(next === toJd ? next - MINUTE_JD / 2 : next);
    if (same(there, current)) {
      cursor = next;
      continue;
    }
    // The first moment in (cursor, next] at which the state is not `current`.
    let low = cursor;
    let high = next;
    while (high - low > MINUTE_JD) {
      const middle = (low + high) / 2;
      if (same(await keyAt(middle), current)) low = middle; else high = middle;
    }
    states.push({ start: jdToMs(startJd), end: jdToMs(high), vara: current[0], tithi: current[1], nakshatra: current[2], karana: current[3], yoga: current[4], moonSign: current[5] });
    startJd = high;
    current = await keyAt(high);
    cursor = high;
  }
  states.push({ start: jdToMs(startJd), end: jdToMs(toJd), vara: current[0], tithi: current[1], nakshatra: current[2], karana: current[3], yoga: current[4], moonSign: current[5] });

  return {
    start: jdToMs(fromJd),
    end: jdToMs(toJd),
    days: rows.slice(1, request.days + 1).map(row => ({ start: jdToMs(row.midnightJd), weekday: row.weekday, date: row.date })),
    states,
  };
}
