// The daily muhūrta times: Rāhu Kāla, Yamaganḍa, Gulika Kāla, Abhijit and the
// Choghaḍiyā, all worked out from sunrise, sunset and the following sunrise.
//
// The day (sunrise to sunset) is cut into eight equal parts. Rāhu Kāla,
// Yamaganḍa and Gulika Kāla are one part each, a different one for each weekday.
// Abhijit is the 8th of the fifteen muhūrtas of the day, the one at midday.
// The Choghaḍiyā cut the day and the night each into eight parts, named after
// seven qualities in turn: every part belongs to a graha, and the graha gives
// the name. The day starts from the lord of the weekday and goes on by five
// along the weekday order; the night starts from the fifth lord from it and goes
// on by four.

/** Local hours since midnight of the date; the next sunrise exceeds 24. */
export interface DayTimes {
  sunrise: number;
  sunset: number;
  nextSunrise: number;
}

export interface Span {
  start: number;
  end: number;
}

export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
/** Lords of the weekdays, Sunday first. */
export const WEEKDAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

/** Which eighth of the day, 1–8, each weekday (Sunday first). */
const RAHU_PART = [8, 2, 7, 5, 6, 4, 3];
const YAMAGANDA_PART = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_PART = [7, 6, 5, 4, 3, 2, 1];

/** The n-th eighth (1–8) of the stretch from `from` to `to`. */
function eighth(from: number, to: number, part: number): Span {
  const length = (to - from) / 8;
  return { start: from + (part - 1) * length, end: from + part * length };
}

export const rahuKala = (day: DayTimes, weekday: number): Span => eighth(day.sunrise, day.sunset, RAHU_PART[weekday]);
export const yamaganda = (day: DayTimes, weekday: number): Span => eighth(day.sunrise, day.sunset, YAMAGANDA_PART[weekday]);
export const gulikaKala = (day: DayTimes, weekday: number): Span => eighth(day.sunrise, day.sunset, GULIKA_PART[weekday]);

/** Abhijit: the 8th of the 15 muhūrtas between sunrise and sunset. */
export function abhijit(day: DayTimes): Span {
  const muhurta = (day.sunset - day.sunrise) / 15;
  return { start: day.sunrise + 7 * muhurta, end: day.sunrise + 8 * muhurta };
}

export type ChoghadiyaName = 'Udveg' | 'Chal' | 'Labh' | 'Amrit' | 'Kaal' | 'Shubh' | 'Rog';
export type ChoghadiyaQuality = 'good' | 'neutral' | 'bad';

/** The name each graha gives its part. */
const NAME_OF_LORD: Record<string, ChoghadiyaName> = {
  Sun: 'Udveg', Venus: 'Chal', Mercury: 'Labh', Moon: 'Amrit', Saturn: 'Kaal', Jupiter: 'Shubh', Mars: 'Rog',
};
export const CHOGHADIYA_QUALITY: Record<ChoghadiyaName, ChoghadiyaQuality> = {
  Amrit: 'good', Shubh: 'good', Labh: 'good', Chal: 'neutral', Udveg: 'bad', Kaal: 'bad', Rog: 'bad',
};

export interface ChoghadiyaPart extends Span {
  name: ChoghadiyaName;
  lord: string;
  quality: ChoghadiyaQuality;
}

function choghadiyaParts(from: number, to: number, firstLord: number, step: number): ChoghadiyaPart[] {
  return Array.from({ length: 8 }, (_, index) => {
    const lord = WEEKDAY_LORDS[(firstLord + index * step) % 7];
    const name = NAME_OF_LORD[lord];
    return { ...eighth(from, to, index + 1), name, lord, quality: CHOGHADIYA_QUALITY[name] };
  });
}

/** The eight Choghaḍiyā of the day (sunrise to sunset) and of the night (sunset to the next sunrise). */
export function choghadiya(day: DayTimes, weekday: number): { day: ChoghadiyaPart[]; night: ChoghadiyaPart[] } {
  return {
    day: choghadiyaParts(day.sunrise, day.sunset, weekday, 5),
    night: choghadiyaParts(day.sunset, day.nextSunrise, (weekday + 4) % 7, 4),
  };
}

/** "06:28:31": local hours as a clock, past 24 hours wrapping to the next day. */
export function clockTime(hours: number, withSeconds = true): string {
  const total = Math.round((((hours % 24) + 24) % 24) * 3600);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}${withSeconds ? `:${pad(total % 60)}` : ''}`;
}
