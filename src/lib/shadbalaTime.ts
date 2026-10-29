// The lords of the year, month, day and hour of a birth, for Varṣa-Māsa-Dina-Horā Bala (BPHS 27.13).
//
// The verse gives only the strengths: the lord of the year 15, of the month 30, of the day 45 and of the
// hour 60 virūpa. How the lords are found is in the commentaries: R. Santhanam (notes to 27.13) and
// B. V. Raman (Graha and Bhava Balas, articles 58–63) count the days since the creation by the
// ahargaṇa of the Sūrya Siddhānta. Santhanam's anchor is 714,404,108,573 days on 1 January 1860, and the
// method gives both authors' worked examples exactly (see shadbalaTime.test.ts).

export type DayLord = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';

/** The lords of the days of the week, Sunday first. */
const WEEKDAY_LORDS: readonly DayLord[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/** The order of the lords of the hours: the hour after the Sun's belongs to Venus, then Mercury and so on. */
const HORA_ORDER: readonly DayLord[] = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];

const AHARGANA_OF_1860_01_01 = 714_404_108_573;
const MS_PER_DAY = 86_400_000;

/** A remainder of 1 is Sunday, 2 Monday ... 0 Saturday, the way the commentaries count. */
const lordOfRemainder = (remainder: number): DayLord => WEEKDAY_LORDS[(((remainder - 1) % 7) + 7) % 7];

export type CalendarDate = { year: number; month: number; day: number };

/** The ahargaṇa of a civil date: the days since the creation. */
export function ahargana({ year, month, day }: CalendarDate): number {
  const days = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(1860, 0, 1)) / MS_PER_DAY);
  return AHARGANA_OF_1860_01_01 + days;
}

/** The lords of the year, the month and the day of a Vedic day (sunrise to sunrise), named by its civil date. */
export function yearMonthDayLords(date: CalendarDate): { abda: DayLord; masa: DayLord; vara: DayLord; ahargana: number } {
  const count = ahargana(date);
  return {
    abda: lordOfRemainder((Math.floor(count / 360) * 3 + 1) % 7),
    masa: lordOfRemainder((Math.floor(count / 30) * 2 + 1) % 7),
    vara: lordOfRemainder(count % 7),
    ahargana: count,
  };
}

/**
 * The lord of the hora, the planetary hour, counted from sunrise: the first hour belongs to the lord of
 * the day and the next ones follow the order Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars.
 * `hoursSinceSunrise` is the clock time since the sunrise of the Vedic day, 0 to 24.
 */
export function horaLord(dayLord: DayLord, hoursSinceSunrise: number): DayLord {
  const index = Math.min(Math.max(Math.floor(hoursSinceSunrise), 0), 23);
  return HORA_ORDER[(HORA_ORDER.indexOf(dayLord) + index) % 7];
}

/** The strengths of the four lords (BPHS 27.13): year 15, month 30, day 45, hour 60 virūpa. */
export const ABDA_VIRUPA = 15;
export const MASA_VIRUPA = 30;
export const VARA_VIRUPA = 45;
export const HORA_VIRUPA = 60;
