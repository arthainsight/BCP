// Runs the Muhūrta Finder against the ephemeris: the sidereal positions of the bodies the conditions need, the
// sunrise of each day (the vāra changes at sunrise), and the walk through time of muhurtaFinder.ts.

import { applyAyanamsaOffset, resolveAyanamsaMode } from './ayanamsas';
import { normalizeDegrees } from './angles';
import {
  SE_JUPITER, SE_MARS, SE_MEAN_NODE, SE_MERCURY, SE_MOON, SE_SATURN, SE_SUN, SE_TRUE_NODE, SE_VENUS,
  sweCalcUt, sweGetAscendant, sweGetAyanamsa, sweJulday,
} from './ephemerisAdapter';
import {
  SANKRANTI_ARC_MINUTES, SANKRANTI_SOLSTICE_DEGREES, effectiveRules, findStretches, findWindows, houseFrom, isImpossible, isLimited, karanaOf, matchesVara, momentMatches, momentScore, nakshatraOf, neededBodies,
  ruleMatches, scoredKeys, signOf, tithiOf, yogaOf, type FinderCriteria, type FinderGraha, type FinderMoment, type PreferKey,
} from './muhurtaFinder';
import {
  DOSHA_IDS, EVENT_DOSHAS, doshaNeeds, doshaUsesAscendant, hasDosha, isDoshaId, type DoshaId, type DoshaSky,
} from './mahadosha';
import {
  VYATIPATA_SHORT_HOURS, aroundEvent, ardhayama, calendarDays, declinationEqualities, eclipseMoments, insideWindows, mergeWindows, sankrantiWindows,
  varaVishanadi, type JdWindow,
} from './mahadoshaEvents';
import { lunarMonthAt } from './lunisolar';
import { D1_GRAHAS, d1Held as d1HeldBy, isD1Key, type D1Key } from './muhurtaD1';
import { rahuKala, yamaganda } from './muhurta';
import { VARA_VISHANADI_START } from './mahadosha';
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
  /** The score of the stretch when some groups are wishes: the weights of the wishes it holds, out of all the weights, and which. */
  score?: number;
  maxScore?: number;
  held?: (PreferKey | D1Key)[];
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

/** The minutes between looks: finer when the Ascendant, which changes sign in an hour or two, is limited or the houses are asked about. */
export function finderStepMinutes(criteria: FinderCriteria): number {
  const ascendant = criteria.signs.Asc !== undefined && isLimited(criteria.signs.Asc, 12);
  const wishes = (criteria.d1 ?? []).some(isD1Key);
  const doshas = (criteria.avoid ?? []).filter(isDoshaId).some(doshaUsesAscendant);
  return ascendant || wishes || doshas || effectiveRules(criteria).length > 0 ? 5 : 15;
}

/** Whether a request is small enough to run: the number of moments the walk looks at. */
export function finderStepCount(days: number, stepMinutes: number): number {
  return Math.ceil((days * 1440) / stepMinutes) + 1;
}

const BODY_IDS = { Sun: SE_SUN, Moon: SE_MOON, Mars: SE_MARS, Mercury: SE_MERCURY, Jupiter: SE_JUPITER, Venus: SE_VENUS, Saturn: SE_SATURN } as const;

interface DayRow {
  /** UT Julian day of the sunrise. */
  sunriseJd: number;
  /** Local hours of the sunrise and the sunset (undefined where the Sun does not rise or set). */
  sunriseHour?: number;
  sunsetHour?: number;
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
    rows.push({ sunriseJd: midnightJd + (times.sunrise ?? 6) / 24, sunriseHour: times.sunrise, sunsetHour: times.sunset, weekday: date.getUTCDay(), midnightJd });
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
    if (graha === 'Ketu') return normalizeDegrees((await sweCalcUt(jd, nodeId)).longitude - ayanamsa + 180);
    return normalizeDegrees((await sweCalcUt(jd, BODY_IDS[graha])).longitude - ayanamsa);
  };

  const needs = neededBodies(criteria);
  // The conditions on the Sun and the Moon, with the panchāṅga; those on the others and the rules are looked at after them.
  const luminaryCriteria: FinderCriteria = {
    ...criteria,
    rules: [],
    signs: Object.fromEntries(Object.entries(criteria.signs).filter(([graha]) => graha === 'Sun' || graha === 'Moon')) as FinderCriteria['signs'],
  };
  // Slow grahas first, the Ascendant, which costs the same but changes fastest, last.
  const others = [...needs.others].sort((a, b) => Number(a === 'Asc') - Number(b === 'Asc'));

  const rules = effectiveRules(criteria);

  // The Mahādoṣas: those of a stretch around an event are found for the whole span first, the others are looked at as
  // the walk goes. The Aṣṭama Lagna and the others of the sky are checked with the grahas they name.
  const avoid = new Set<DoshaId>((criteria.avoid ?? []).filter(isDoshaId));
  const stateDoshas = DOSHA_IDS.filter(id => avoid.has(id) && !EVENT_DOSHAS.includes(id));
  const offsetAt = (jd: number) => (request.zone ? getUtcOffsetHours(request.zone, new Date(jdToMs(jd))) : request.tz);
  const blockedWindows: JdWindow[] = [];
  const eclipseNakshatras: { startJd: number; endJd: number; nakshatra: number }[] = [];
  if (!isImpossible(criteria)) {
    if (avoid.has('sankranti')) {
      blockedWindows.push(...await sankrantiWindows(
        jd => longitudeOf('Sun', jd), fromJd, toJd, criteria.sankrantiArc ?? SANKRANTI_ARC_MINUTES, criteria.sankrantiSolstice ?? SANKRANTI_SOLSTICE_DEGREES,
      ));
    }
    if (avoid.has('varaDosha')) {
      rows.forEach((row, index) => {
        if (row.sunriseHour === undefined || row.sunsetHour === undefined || index + 1 >= rows.length) return;
        const day = { sunrise: row.sunriseHour, sunset: row.sunsetHour, nextSunrise: row.sunsetHour };
        for (const span of [rahuKala(day, row.weekday), yamaganda(day, row.weekday)]) {
          blockedWindows.push({ startJd: row.midnightJd + span.start / 24, endJd: row.midnightJd + span.end / 24 });
        }
        blockedWindows.push(...ardhayama(row.weekday, row.sunriseJd, row.midnightJd + row.sunsetHour / 24, rows[index + 1].sunriseJd));
      });
    }
    if (avoid.has('vishaGhati')) {
      // The Viṣanāḍī of the weekday: 4 nāḍīs from the nāḍī of its table after sunrise, in the weekday that lasts to the next sunrise.
      rows.forEach((row, index) => {
        if (index + 1 < rows.length) blockedWindows.push(varaVishanadi(row.sunriseJd, rows[index + 1].sunriseJd, VARA_VISHANADI_START[row.weekday]));
      });
    }
    if (avoid.has('vyatipata') || avoid.has('vaidhriti')) {
      const found = await declinationEqualities(fromJd - 3, toJd + 3);
      for (const [id, moments] of [['vyatipata', found.vyatipata], ['vaidhriti', found.vaidhriti]] as const) {
        if (!avoid.has(id)) continue;
        // The day before, the day of and the day after, by the clock of the place; or the short time of the book around the moment.
        for (const moment of moments) {
          blockedWindows.push(criteria.vyatipataLength === 'short' ? aroundEvent(moment, VYATIPATA_SHORT_HOURS / 24, VYATIPATA_SHORT_HOURS / 24) : calendarDays(moment, offsetAt(moment), 1, 1));
        }
      }
    }
    if (avoid.has('eclipse')) {
      // Seven days around a solar eclipse and three around a lunar one; the nakṣatra of each, for six months after it.
      const found = await eclipseMoments(fromJd - 190, toJd + 10);
      for (const moment of found.solar) blockedWindows.push(aroundEvent(moment, 7, 7));
      for (const moment of found.lunar) blockedWindows.push(aroundEvent(moment, 3, 3));
      for (const moment of [...found.solar, ...found.lunar]) {
        eclipseNakshatras.push({ startJd: moment, endJd: moment + 180, nakshatra: nakshatraOf(await longitudeOf('Moon', moment)) });
      }
    }
  }
  // The lunar month, for the Śūnya tithis of the Pañcāṅga Doṣa: the months of the span, each from new Moon to new Moon.
  const masaWindows: { startJd: number; endJd: number; masa: number }[] = [];
  if (avoid.has('panchanga') && !isImpossible(criteria)) {
    try {
      for (let at = fromJd; at < toJd + 1;) {
        const month = await lunarMonthAt(at, request.ayanamsa, request.ayanamsaOffset);
        masaWindows.push({ startJd: month.startJd, endJd: month.endJd, masa: month.masaIndex });
        at = month.endJd + 0.5;
      }
    } catch {
      // A zodiac the month cannot be named in (the tropical): the Śūnya tithis are then left out.
      masaWindows.length = 0;
    }
  }
  const masaAt = (jd: number) => masaWindows.find(window => jd >= window.startJd && jd < window.endJd)?.masa;
  const gandantaOptions = { gandantaNakshatra: criteria.gandantaNakshatra };
  const blocked = mergeWindows(blockedWindows);
  const watchedNakshatras = eclipseNakshatras.filter(entry => entry.endJd > fromJd && entry.startJd < toJd);

  const holds = async (jd: number): Promise<boolean> => {
    if (!matchesVara(criteria, varaAt(jd))) return false;
    if (blocked.length > 0 && insideWindows(blocked, jd)) return false;
    if (watchedNakshatras.length > 0) {
      const active = watchedNakshatras.filter(entry => jd >= entry.startJd && jd < entry.endJd);
      if (active.length > 0) {
        const moonNakshatra = nakshatraOf(await longitudeOf('Moon', jd));
        if (active.some(entry => entry.nakshatra === moonNakshatra)) return false;
      }
    }
    if (needs.luminaries) {
      const moment: FinderMoment = { vara: varaAt(jd), sun: await longitudeOf('Sun', jd), moon: await longitudeOf('Moon', jd), others: {} };
      if (!momentMatches(moment, luminaryCriteria)) return false;
    }
    for (const graha of others) {
      const allowed = criteria.signs[graha]!;
      if (!allowed.includes(signOf(await longitudeOf(graha, jd)))) return false;
    }
    if (rules.length > 0) {
      // The houses of the grahas the rules name, from the sign of the Ascendant; each graha is worked out once.
      const ascSign = signOf(await longitudeOf('Asc', jd));
      const houses = new Map<FinderGraha, number>();
      for (const rule of rules) {
        for (const graha of rule.grahas) {
          if (!houses.has(graha)) houses.set(graha, houseFrom(ascSign, await longitudeOf(graha, jd)));
        }
        if (!ruleMatches(rule, graha => houses.get(graha))) return false;
      }
    }
    if (stateDoshas.length > 0) {
      // The grahas the doṣas name, each worked out once for this moment.
      const found = new Map<string, number>();
      const position = async (key: string) => {
        let value = found.get(key);
        if (value === undefined) {
          value = await longitudeOf(key as FinderGraha, jd);
          found.set(key, value);
        }
        return value;
      };
      for (const id of stateDoshas) {
        const required = doshaNeeds(id);
        if (required.luminaries) { await position('Sun'); await position('Moon'); }
        if (required.asc) await position('Asc');
        for (const graha of required.grahas) await position(graha);
        const sky: DoshaSky = {
          vara: varaAt(jd), sun: found.get('Sun') ?? 0, moon: found.get('Moon') ?? 0, asc: found.get('Asc') ?? 0,
          masa: masaAt(jd),
          others: Object.fromEntries([...found].filter(([key]) => !['Sun', 'Moon', 'Asc'].includes(key))) as DoshaSky['others'],
        };
        if (hasDosha(id, sky, criteria.natal, gandantaOptions)) return false;
      }
    }
    return true;
  };

  const empty: FinderResult = { windows: [], truncated: false, stepMinutes, from: jdToMs(fromJd), to: jdToMs(toJd) };
  if (isImpossible(criteria)) return empty;

  // The wishes: a moment out of the conditions is -1, any other has the score of the wishes it holds.
  const wishes = scoredKeys(criteria);
  const d1Wishes = [...new Set((criteria.d1 ?? []).filter(isD1Key))];
  const momentAt = async (jd: number): Promise<FinderMoment> => ({ vara: varaAt(jd), sun: await longitudeOf('Sun', jd), moon: await longitudeOf('Moon', jd), others: {} });
  // The wishes about the Rāśi chart, one point each: the sky of the moment with the Ascendant and the grahas the wishes name.
  const d1Sky = async (jd: number): Promise<DoshaSky> => {
    const others: DoshaSky['others'] = {};
    for (const graha of D1_GRAHAS) if (graha !== 'Sun' && graha !== 'Moon') others[graha] = await longitudeOf(graha, jd);
    return { vara: varaAt(jd), sun: await longitudeOf('Sun', jd), moon: await longitudeOf('Moon', jd), asc: await longitudeOf('Asc', jd), others };
  };
  const d1Held = async (jd: number): Promise<D1Key[]> => {
    if (d1Wishes.length === 0) return [];
    const sky = await d1Sky(jd);
    return d1Wishes.filter(key => d1HeldBy(key, sky));
  };
  const valueAt = async (jd: number): Promise<number> => {
    if (!(await holds(jd))) return -1;
    return (wishes.length > 0 ? momentScore(await momentAt(jd), criteria).score : 0) + (await d1Held(jd)).length;
  };

  let windows: { startJd: number; endJd: number }[];
  let truncated: boolean;
  if (wishes.length === 0 && d1Wishes.length === 0) {
    ({ windows, truncated } = await findWindows(holds, fromJd, toJd, stepMinutes, MAX_FINDER_WINDOWS));
  } else {
    const lowest = Math.max(0, criteria.minScore ?? 0);
    const found = await findStretches(valueAt, fromJd, toJd, stepMinutes, value => value >= lowest, MAX_FINDER_WINDOWS);
    windows = found.stretches;
    truncated = found.truncated;
  }
  const result: FinderResultWindow[] = [];
  for (const window of windows) {
    // The window is found to the minute from outside; look a little inside to say what the sky is there.
    const jd = window.startJd + 0.5 / 1440;
    const sun = await longitudeOf('Sun', jd);
    const moon = await longitudeOf('Moon', jd);
    const panchanga = wishes.length > 0 ? momentScore({ vara: varaAt(jd), sun, moon, others: {} }, criteria) : { score: 0, max: 0, held: [] as PreferKey[] };
    const d1 = await d1Held(jd);
    const scored = wishes.length > 0 || d1Wishes.length > 0
      ? { score: panchanga.score + d1.length, max: panchanga.max + d1Wishes.length, held: [...panchanga.held, ...d1] }
      : undefined;
    result.push({
      start: jdToMs(window.startJd),
      end: jdToMs(window.endJd),
      vara: varaAt(jd),
      ...(scored ? { score: scored.score, maxScore: scored.max, held: scored.held } : {}),
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

