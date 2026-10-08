import type { DegreePrecision } from '@/lib/formatDegree';
export type { DegreePrecision };

export interface GeoResult {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface BcpResult {
  completedAge: number;
  runningYear: number;
  activeYearHouse: number;
  bcpCycle: number;
  monthInRunningYear: number;
  activeMonthHouse: number;
}

export interface Planet {
  name: string;
  house: number;
}

export interface PlanetData {
  name: string;
  longitude: number;
  sign: number;
  degree: number;
  house: number;
  isRetrograde?: boolean;
  /** Apparent geocentric motion in degrees per day; negative when retrograde. Drives Cheṣṭā Bala. */
  speed?: number;
  /** True equatorial declination in degrees. Drives Ayana Bala. */
  declination?: number;
}

export interface DebugInfo {
  julianDay: number;
  ayanamsa: number;
  siderealAyanamsa?: number;
  utcOffset: number;
  ascendantDegree: number;
  ascendantSign: number;
  ephemerisEngine: string;
  inputDateTime: string;
  latitude: number;
  longitude: number;
  /**
   * Sunrise and sunset for the birth date, and the following sunrise, as local
   * decimal hours measured from midnight of the birth date. The next sunrise
   * exceeds 24 and can be undefined in polar cases where the Sun never crosses
   * the horizon. Natonnata and Tribhāga Bala read these.
   */
  sunriseLocalHours?: number;
  sunsetLocalHours?: number;
  nextSunriseLocalHours?: number;
  /**
   * The previous evening's sunset on the same scale, so it is negative. A
   * birth before sunrise belongs to the previous Vedic day, whose night horās
   * run from this sunset to the birth-date sunrise.
   */
  previousSunsetLocalHours?: number;
  /** The previous morning's sunrise on the same scale (negative). Ghaṭī for a pre-dawn birth count from it. */
  previousSunriseLocalHours?: number;
}

export interface SpecialLagna {
  name: string;
  longitude: number;
  sign: number;
  degree: number;
}

export interface ChartData {
  ascendant: {
    sign: number;
    degree: number;
    longitude: number;
  };
  planets: PlanetData[];
  specialLagnas?: SpecialLagna[];
  /** The amānta lunar month running at the chart moment. */
  lunarMonth?: {
    /** 0 = Chaitra … 11 = Phālguna. */
    masaIndex: number;
    adhika: boolean;
  };
  debug?: DebugInfo;
}

export interface HouseAnalysis {
  planets: string[];
  ruler: string;
  rulerHouse: number;
}

export interface BcpHouseInfo {
  yearHouse: HouseAnalysis;
  monthHouse: HouseAnalysis;
}

export interface FormData {
  birthDatetime: string;
  city: string;
  targetDate: string;
}

export interface CharaKaraka {
  karaka: string;
  karakaFull: string;
  karakaDesc: string;
  planet: string;
  degree: number;
}

export type ChartStyle = 'north' | 'south';

export interface ChartDisplaySettings {
  chartStyle: ChartStyle;
  showSigns: boolean;
  showNatalPlanets: boolean;
  degreePrecision: DegreePrecision;
  showNakshatra: boolean;
  showNakshatraPada: boolean;
  showD108: boolean;
  showCharaKaraka: boolean;
  showOuterPlanets: boolean;
  showSpecialLagnas: boolean;
  showPanchang: boolean;
  showGrahaDrishti: boolean;
  showRashiDrishti: boolean;
  showBnnMajorHighlight: boolean;
  showBnnMinorHighlight: boolean;
  showTransitOverlay: boolean;
  showNadiParaya: boolean;
  /** BCP running year and month houses; off by default since v1.80 removed them from the chart. */
  showBcpHighlight: boolean;
  /** Marks the running Vimshottari mahadasha and antardasha lords. */
  showDashaLords: boolean;
  /** Which graha-based dasha system the marks follow. */
  dashaMarkSystem: 'vimshottari' | 'vds' | 'yogini' | 'ashtottari';
  /** Interface language. */
  language: 'en' | 'fi';
}

export const DEFAULT_CHART_DISPLAY: ChartDisplaySettings = {
  chartStyle: 'north',
  showSigns: true,
  showNatalPlanets: true,
  degreePrecision: 'off',
  showNakshatra: true,
  showNakshatraPada: true,
  showD108: false,
  showCharaKaraka: false,
  showOuterPlanets: false,
  showSpecialLagnas: true,
  showPanchang: false,
  showGrahaDrishti: false,
  showRashiDrishti: false,
  showBnnMajorHighlight: true,
  showBnnMinorHighlight: true,
  showTransitOverlay: false,
  showNadiParaya: true,
  showBcpHighlight: false,
  showDashaLords: true,
  dashaMarkSystem: 'vimshottari',
  language: 'en',
};

/** How the Nāḍī Paraya walks a graha through the signs: alternating long and short stays (Saturn 3 / 2 years, Rahu 2 / 1) or the same stay in every sign (2.5 and 1.5 years). */
export type ParayaSpeed = 'alternating' | 'even';

export interface CalculationSettings {
  ayanamsa: string;
  ayanamsaOffsetDegrees: number;
  nodeMode: string;
  nakshatraMode: 'sidereal' | 'tropical';
  charaKarakaRankMode: 'degree' | 'minute';
  /** Paraya Saturn: 3 / 2 years alternating, or 2.5 years in every sign. */
  parayaSaturn: ParayaSpeed;
  /** Paraya Rahu and Ketu: 2 / 1 years alternating, or 1.5 years in every sign. */
  parayaRahu: ParayaSpeed;
}

export const DEFAULT_CALCULATION_SETTINGS: CalculationSettings = {
  ayanamsa: 'lahiri',
  ayanamsaOffsetDegrees: 0,
  nodeMode: 'mean',
  nakshatraMode: 'sidereal',
  charaKarakaRankMode: 'degree',
  parayaSaturn: 'alternating',
  parayaRahu: 'alternating',
};

export interface CharaOptions {
  start: 'lagna' | 'ak';
  mahadashaDirection: 'rashi-type' | 'odd-even';
  antardashaStart: 'next-dasha-rasi' | 'same-dasha-rasi';
  antardashaDirection: 'dasha-rasi-9h' | 'dasha-rasi';
  strongerLordRule: 'graha' | 'rashi';
  durationCount: 'inclusive' | 'exclusive';
  exaltDebilAdjust: boolean;
  scorpioLord: 'Ketu' | 'Mars';
  aquariusLord: 'Saturn' | 'Rahu';
}

export interface RasiDashaOptions {
  narayanaSeed: 'stronger-lagna-seventh' | 'lagna';
  moolaSeed: 'stronger-lagna-seventh' | 'lagna';
  sthiraMethod: 'brahma-pvr';
}

// v2.15 removed the 20+ never-implemented placeholder keys (tara, brahma,
// drig, …) that only ever existed in this type and in the registry's
// "Other systems" group. Stored settings containing them still parse:
// migrateDashaSettings keeps the keys below and drops the rest.
export interface DashaSettings {
  dashas: {
    bcp: boolean;
    vimshottari: boolean;
    vds: boolean;
    chara?: boolean;
    yogini?: boolean;
    ashtottari?: boolean;
    kalaChakra?: boolean;
    narayana?: boolean;
    moola?: boolean;
    sthira?: boolean;
  };
  charaOptions?: CharaOptions;
  rasiOptions?: RasiDashaOptions;
}

export const DEFAULT_DASHA_SETTINGS: Required<DashaSettings> = {
  dashas: {
    bcp: true,
    vimshottari: true,
    vds: false,
    chara: false,
    yogini: true,
    ashtottari: true,
    kalaChakra: false,
    narayana: true,
    moola: true,
    sthira: true,
  },
  charaOptions: {
    start: 'lagna',
    mahadashaDirection: 'rashi-type',
    antardashaStart: 'next-dasha-rasi',
    antardashaDirection: 'dasha-rasi-9h',
    strongerLordRule: 'graha',
    durationCount: 'inclusive',
    exaltDebilAdjust: true,
    scorpioLord: 'Ketu',
    aquariusLord: 'Saturn',
  },
  rasiOptions: {
    narayanaSeed: 'stronger-lagna-seventh',
    moolaSeed: 'stronger-lagna-seventh',
    sthiraMethod: 'brahma-pvr',
  },
};
