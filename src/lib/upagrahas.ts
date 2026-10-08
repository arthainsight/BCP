// The upagrahas (sub-planets).
//
// The Sun-based ones (Dhūma, Vyatīpāta, Parivesha, Indrachāpa, Upaketu) follow
// from the Sun's longitude alone:
//   Dhūma       = Sun + 133°20'
//   Vyatīpāta   = 360° − Dhūma
//   Parivesha   = Vyatīpāta + 180°
//   Indrachāpa  = 360° − Parivesha
//   Upaketu     = Indrachāpa + 16°40'   (which is the Sun − 30°)
//
// Gulika and Māndi are the Lagna rising in Saturn's eighth of the day or of
// the night. The day (sunrise to sunset) and the night (sunset to sunrise) are
// each cut in eight equal parts. The first seven belong to the grahas in the
// order of the weekdays, the day starting from the lord of the weekday and the
// night from the fifth graha on from it; the eighth part has no lord. Saturn's
// part is therefore the 7th of a Sunday day, the 1st of a Saturday day, the 3rd
// of a Sunday night, and so on. Traditions differ on the moment of that part
// that gives the Lagna, so the beginning, the middle and the end are all kept.

export const SATURN_PORTION_MOMENTS = ['begin', 'middle', 'end'] as const;
export type SaturnPortionMoment = (typeof SATURN_PORTION_MOMENTS)[number];

const normalize = (value: number) => ((value % 360) + 360) % 360;

export interface AprakashaUpagraha {
  key: string;
  name: string;
  longitude: number;
}

/** Dhūma, Vyatīpāta, Parivesha, Indrachāpa and Upaketu from the Sun's longitude. */
export function aprakashaUpagrahas(sunLongitude: number): AprakashaUpagraha[] {
  const dhuma = normalize(sunLongitude + 133 + 20 / 60);
  const vyatipata = normalize(360 - dhuma);
  const parivesha = normalize(vyatipata + 180);
  const indrachapa = normalize(360 - parivesha);
  const upaketu = normalize(indrachapa + 16 + 40 / 60);
  return [
    { key: 'Dh', name: 'Dhuma', longitude: dhuma },
    { key: 'Vy', name: 'Vyatipata', longitude: vyatipata },
    { key: 'Pa', name: 'Parivesha', longitude: parivesha },
    { key: 'In', name: 'Indrachapa', longitude: indrachapa },
    { key: 'Uk', name: 'Upaketu', longitude: upaketu },
  ];
}

export interface SunDayInput {
  /** Local hours since midnight of the birth date. */
  birthHours: number;
  /** Weekday of the birth date, 0 = Sunday. */
  weekday: number;
  /** Local hours on the same scale; the next sunrise is above 24 and the previous sunset below 0. */
  sunrise?: number;
  sunset?: number;
  nextSunrise?: number;
  previousSunset?: number;
}

export interface SaturnPortion {
  night: boolean;
  /** Weekday of the Vedic day the birth belongs to (it runs from sunrise to sunrise), 0 = Sunday. */
  weekday: number;
  /** Saturn's part, 0–7. */
  portion: number;
  /** The day or night it lies in, in local hours since midnight of the birth date. */
  startHours: number;
  endHours: number;
}

/** Saturn's part of the day or night the birth falls in; null when the Sun never rises or sets. */
export function saturnPortion(input: SunDayInput): SaturnPortion | null {
  const { birthHours, sunrise, sunset, nextSunrise, previousSunset } = input;
  let weekday = input.weekday;
  let night = false;
  let startHours: number;
  let endHours: number;
  if (sunrise === undefined || sunset === undefined) return null;
  if (birthHours < sunrise) {
    // Before dawn the birth still belongs to the night of the day before.
    if (previousSunset === undefined) return null;
    weekday = (weekday + 6) % 7;
    night = true;
    startHours = previousSunset;
    endHours = sunrise;
  } else if (birthHours < sunset) {
    startHours = sunrise;
    endHours = sunset;
  } else {
    if (nextSunrise === undefined) return null;
    night = true;
    startHours = sunset;
    endHours = nextSunrise;
  }
  // The weekdays run Sun, Mon, Tue, Wed, Thu, Fri, Sat; Saturn is the 7th of them (index 6).
  const firstLord = night ? (weekday + 4) % 7 : weekday;
  const portion = (6 - firstLord + 7) % 7;
  return { night, weekday, portion, startHours, endHours };
}

/** The local hour at the beginning, middle or end of Saturn's part. */
export function saturnPortionHour(portion: SaturnPortion, moment: SaturnPortionMoment): number {
  const length = (portion.endHours - portion.startHours) / 8;
  const offset = moment === 'begin' ? 0 : moment === 'middle' ? 0.5 : 1;
  return portion.startHours + (portion.portion + offset) * length;
}

/** The Lagna longitudes at the three moments of Saturn's part, as the chart stores them. */
export interface SaturnPortionLagnas {
  night: boolean;
  weekday: number;
  portion: number;
  ascendants: Record<SaturnPortionMoment, number>;
}
