import { ChartData } from '@/types';
import { calcSolarTimes } from './solar';
import { normalizeDegrees } from '../angles';

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const TITHI_NAMES = [
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima / Amavasya',
];

const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana',
  'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
  'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
  'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma',
  'Indra', 'Vaidhriti',
];

const VARA_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const VARA_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

const MASA_NAMES = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashvina', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna',
];

// Hora lord cycle: Sun → Venus → Mercury → Moon → Saturn → Jupiter → Mars
const HORA_CYCLE = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
// weekday (0=Sun…6=Sat) → index of that day's lord in HORA_CYCLE
const DAY_TO_HORA_START = [0, 3, 6, 2, 5, 1, 4];

function norm360(deg: number): number {
  return normalizeDegrees(deg);
}

function degToDMS(deg: number): string {
  const d = Math.floor(deg);
  const mf = (deg - d) * 60;
  const m = Math.floor(mf);
  const s = Math.round((mf - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
}

function parseBirth(dt: string): { year: number; month: number; day: number; localHours: number } | null {
  const m = dt.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!m) return null;
  const [, dd, mo, yyyy, hh, min, ss] = m;
  return {
    year: parseInt(yyyy),
    month: parseInt(mo),
    day: parseInt(dd),
    localHours: parseInt(hh) + parseInt(min) / 60 + parseInt(ss) / 3600,
  };
}

function shiftDate(year: number, month: number, day: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + delta);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function toLocalHours(utcHours: number, utcOffset: number): number {
  return ((utcHours + utcOffset) % 24 + 24) % 24;
}

function fmtLocalHours(hours: number): string {
  const local = ((hours % 24) + 24) % 24;
  const h = Math.floor(local);
  const mf = (local - h) * 60;
  const mi = Math.floor(mf);
  const s = Math.round((mf - mi) * 60);
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export interface PanchangResult {
  vara: string;
  varaLord: string;
  /** True when the birth precedes sunrise, so the vāra is the previous weekday's. */
  beforeSunrise: boolean;
  tithi: string;
  tithiNumber: number;
  paksha: 'Shukla' | 'Krishna';
  nakshatra: string;
  nakshatraPada: number;
  karana: string;
  yoga: string;
  hora: string;
  sunrise: string | null;
  sunset: string | null;
  solarNoon: string | null;
  ayanamsa: string;
  masa: string;
}

export function calculatePanchang(
  chart: ChartData,
  birthDatetime: string,
  utcOffsetHours: number,
  ayanamsaName: string,
  nakshatraAdjust = 0,
): PanchangResult {
  const sun  = chart.planets.find(p => p.name === 'Sun')!;
  const moon = chart.planets.find(p => p.name === 'Moon')!;
  const lat  = chart.debug?.latitude ?? 0;
  const lng  = chart.debug?.longitude ?? 0;

  const parsed = parseBirth(birthDatetime);
  const { year, month, day, localHours: localBirth } = parsed
    ?? { year: 2000, month: 1, day: 1, localHours: 12 };

  // ── Sunrise and sunset ───────────────────────────────────────────────
  // Local decimal hours from midnight of the birth date. The chart carries
  // ephemeris-based times (sunTimes.ts); the NOAA approximation is only a
  // fallback for charts built without them.
  const dbg = chart.debug;
  let sunTimes: { sunrise: number | null; sunset: number | null; nextSunrise: number | null; previousSunset: number | null; solarNoon: number | null };
  if (dbg?.sunriseLocalHours !== undefined || dbg?.sunsetLocalHours !== undefined) {
    sunTimes = {
      sunrise: dbg.sunriseLocalHours ?? null,
      sunset: dbg.sunsetLocalHours ?? null,
      nextSunrise: dbg.nextSunriseLocalHours ?? null,
      previousSunset: dbg.previousSunsetLocalHours ?? null,
      solarNoon: dbg.sunriseLocalHours !== undefined && dbg.sunsetLocalHours !== undefined
        ? (dbg.sunriseLocalHours + dbg.sunsetLocalHours) / 2
        : null,
    };
  } else {
    const solar = calcSolarTimes(year, month, day, lat, lng);
    const prevDate = shiftDate(year, month, day, -1);
    const solarPrev = calcSolarTimes(prevDate.year, prevDate.month, prevDate.day, lat, lng);
    const local = (utc: number | null) => (utc === null ? null : toLocalHours(utc, utcOffsetHours));
    const sunrise = local(solar.sunrise);
    const sunset = local(solar.sunset);
    const prevSunset = local(solarPrev.sunset);
    sunTimes = {
      sunrise,
      sunset,
      nextSunrise: sunrise === null ? null : sunrise + 24,
      previousSunset: prevSunset === null ? null : prevSunset - 24,
      solarNoon: local(solar.solarNoon),
    };
  }

  // ── Vara ─────────────────────────────────────────────────────────────
  // The Vedic day runs from sunrise to sunrise, so a birth before sunrise
  // still belongs to the previous weekday.
  const calendarWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun…6=Sat
  const beforeSunrise = sunTimes.sunrise !== null && localBirth < sunTimes.sunrise;
  const dayOfWeek = beforeSunrise ? (calendarWeekday + 6) % 7 : calendarWeekday;
  const vara      = VARA_NAMES[dayOfWeek];
  const varaLord  = VARA_LORDS[dayOfWeek];

  // ── Tithi ─────────────────────────────────────────────────────────────
  const tithiDiff  = norm360(moon.longitude - sun.longitude);
  const tithiIdx   = Math.floor(tithiDiff / 12);         // 0–29
  const paksha: 'Shukla' | 'Krishna' = tithiIdx < 15 ? 'Shukla' : 'Krishna';
  const tithiNumber = (tithiIdx % 15) + 1;
  const tithi       = TITHI_NAMES[tithiIdx % 15];

  // ── Nakshatra ─────────────────────────────────────────────────────────
  const nkWidth      = 360 / 27;
  const moonNakLon   = normalizeDegrees(moon.longitude + nakshatraAdjust);
  const nkIdx        = Math.floor(moonNakLon / nkWidth);
  const nakshatra    = NAKSHATRA_NAMES[nkIdx] ?? '?';
  const nkFrac       = (moonNakLon % nkWidth) / nkWidth;
  const nakshatraPada = Math.floor(nkFrac * 4) + 1;

  // ── Karana ────────────────────────────────────────────────────────────
  const karanaIdx = Math.floor(tithiDiff / 6); // 0–59
  let karana: string;
  if (karanaIdx === 0) {
    karana = 'Kintughna';
  } else if (karanaIdx >= 57) {
    karana = (['Shakuni', 'Chatushpada', 'Naga'] as const)[karanaIdx - 57] ?? 'Naga';
  } else {
    karana = MOVABLE_KARANAS[(karanaIdx - 1) % 7];
  }

  // ── Yoga ──────────────────────────────────────────────────────────────
  const yogaIdx = Math.floor(norm360(sun.longitude + moon.longitude) / nkWidth) % 27;
  const yoga    = YOGA_NAMES[yogaIdx];

  // ── Hora ──────────────────────────────────────────────────────────────
  // Twelve unequal horās by day and twelve by night, the first belonging to
  // the lord of the Vedic day.
  let hora = varaLord; // fallback when the Sun does not rise or set
  const { sunrise, sunset, nextSunrise, previousSunset } = sunTimes;
  let horaIndex: number | null = null;
  if (sunrise !== null && sunset !== null) {
    if (beforeSunrise) {
      if (previousSunset !== null) {
        horaIndex = 12 + Math.floor(((localBirth - previousSunset) / (sunrise - previousSunset)) * 12);
      }
    } else if (localBirth < sunset) {
      horaIndex = Math.floor(((localBirth - sunrise) / (sunset - sunrise)) * 12);
    } else if (nextSunrise !== null) {
      horaIndex = 12 + Math.floor(((localBirth - sunset) / (nextSunrise - sunset)) * 12);
    }
  }
  if (horaIndex !== null) {
    horaIndex = Math.max(0, Math.min(horaIndex, 23));
    hora = HORA_CYCLE[(DAY_TO_HORA_START[dayOfWeek] + horaIndex) % 7];
  }

  // ── Ayanamsa ──────────────────────────────────────────────────────────
  const ayanamsa = `${degToDMS(chart.debug?.ayanamsa ?? 0)} (${ayanamsaName})`;

  // ── Masa ──────────────────────────────────────────────────────────────
  // Amānta month from the ephemeris new moon when the chart carries it; the
  // Sun's current sign is only a rough stand-in otherwise.
  const masa = chart.lunarMonth
    ? `${chart.lunarMonth.adhika ? 'Adhika ' : ''}${MASA_NAMES[chart.lunarMonth.masaIndex]} (amānta)`
    : `${MASA_NAMES[(Math.floor(sun.longitude / 30) + 1) % 12]} (approx.)`;

  return {
    vara,
    varaLord,
    tithi,
    tithiNumber,
    paksha,
    nakshatra,
    nakshatraPada,
    karana,
    yoga,
    hora,
    beforeSunrise,
    sunrise:   sunrise !== null ? fmtLocalHours(sunrise) : null,
    sunset:    sunset !== null ? fmtLocalHours(sunset) : null,
    solarNoon: sunTimes.solarNoon !== null ? fmtLocalHours(sunTimes.solarNoon) : null,
    ayanamsa,
    masa,
  };
}
