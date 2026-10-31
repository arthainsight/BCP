import type { DegreePrecision } from '@/lib/formatDegree';
import type { PlanetMarks } from '@/lib/planetMarks';
import type { NakshatraMode } from '@/lib/nakshatraZodiac';
import type { SaturnPortionLagnas } from '@/lib/upagrahas';
import type { VimshottariVariantChoice } from '@/lib/vimshottariVariants';
import type { DashaYearLength } from '@/lib/time';
import type { ParayaBody } from '@/lib/bnn/nadiParaya';
import type { SpecialSphuta } from '@/lib/specialSphutas';
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
  /** The sensitive degrees and combustion of the planet, set on the planets that a chart draws (for its hover text). */
  marks?: PlanetMarks;
}

export interface DebugInfo {
  julianDay: number;
  ayanamsa: number;
  /** The Lahiri ayanāṁśa at the chart's moment, whatever the chart itself uses. */
  siderealAyanamsa?: number;
  /**
   * The ayanāṁśa of every choice in the ayanamsa list at the chart's moment (the tropical zodiac is 0; Custom Lahiri is not
   * in it, it is Lahiri with the adjustment of Settings). The nakṣatra zodiac of Settings is read from it.
   */
  ayanamsas?: Record<string, number>;
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

/** The time the special sphutas run on: the ishṭa, and the sunrise it was counted from. */
export interface SpecialSphutaTiming {
  /** Ghaṭīs from sunrise to birth. */
  ishta: number;
  /** The sunrise used, in local decimal hours. */
  sunriseUsed: number;
  /** The sunrise the app calculated (true or mean-time, as chosen), in local decimal hours. */
  sunriseCalculated: number;
  source: 'true' | 'mean' | 'manual';
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
  /** All the special sphuṭas (the special lagnas above are six of them) and the time they were counted on. */
  specialSphutas?: SpecialSphuta[];
  specialSphutaTiming?: SpecialSphutaTiming;
  /** Sidereal longitude of the Midheaven (the 10th cusp), for the Śrīpati bhāvas. */
  midheaven?: number;
  /** The Lagna at the beginning, middle and end of Saturn's part of the day or night (Gulika and Māndi); missing when the Sun neither rises nor sets. */
  saturnPortion?: SaturnPortionLagnas;
  /** The amānta lunar month running at the chart moment. */
  lunarMonth?: {
    /** 0 = Chaitra … 11 = Phālguna. */
    masaIndex: number;
    adhika: boolean;
  };
  debug?: DebugInfo;
}

/**
 * `both`: the same chart in the North and the South style, one inside the other. `mixedNorth` and `mixedSouth`: two charts in the
 * houses of one, the D1 chart in the inner part of every house and any varga in the outer part, in the North or the South layout.
 */
export type ChartStyle = 'north' | 'south' | 'both' | 'mixedNorth' | 'mixedSouth';

export interface ChartDisplaySettings {
  chartStyle: ChartStyle;
  showSigns: boolean;
  showNatalPlanets: boolean;
  degreePrecision: DegreePrecision;
  showNakshatra: boolean;
  showCharaKaraka: boolean;
  showOuterPlanets: boolean;
  showSpecialLagnas: boolean;
  /** The target date and time bar above the chart (the transits are calculated for it). */
  showTargetBar: boolean;
  showBnnMajorHighlight: boolean;
  showBnnMinorHighlight: boolean;
  showTransitOverlay: boolean;
  showNadiParaya: boolean;
  /** Which of Jupiter, Saturn, Rahu and Ketu the Paraya layer draws. */
  parayaBodies: ParayaBody[];
  /** BCP running year and month houses; off by default since v1.80 removed them from the chart. */
  showBcpHighlight: boolean;
  /** Marks the Yogi (ʸ), the Sahayogi (ˢ) and the Avayogi (ᵃ) graha on the charts. */
  showYogiMarks: boolean;
  /** Marks the running Vimshottari mahadasha and antardasha lords. */
  showDashaLords: boolean;
  /** Coloured borders on the houses of the running mahadasha and antardasha lords. */
  showDashaHouses: boolean;
  /** Which graha-based dasha system the marks follow. */
  dashaMarkSystem: 'vimshottari' | 'vimshottariVariant' | 'vds' | 'yogini' | 'ashtottari' | 'naisargika';
  /** Interface language. */
  language: 'en' | 'fi';
  /** Names of the grahas: English or Sanskrit. */
  grahaNames: GrahaNameStyle;
  /** Text size of the full-size charts, as a multiple of the usual size (1 = usual). */
  chartFontScale: number;
  /** The varga chart drawn outside the D1 chart in the mixed style (the divisor: 9 is the navamsa). */
  mixedOuterDivision: number;
}

export const DEFAULT_CHART_DISPLAY: ChartDisplaySettings = {
  chartStyle: 'north',
  showSigns: true,
  showNatalPlanets: true,
  degreePrecision: 'minute',
  showNakshatra: false,
  showCharaKaraka: false,
  showOuterPlanets: false,
  showSpecialLagnas: false,
  showTargetBar: false,
  showBnnMajorHighlight: false,
  showBnnMinorHighlight: false,
  showTransitOverlay: false,
  showNadiParaya: false,
  parayaBodies: ['Jupiter', 'Saturn', 'Rahu', 'Ketu'],
  showBcpHighlight: false,
  showYogiMarks: false,
  showDashaLords: false,
  showDashaHouses: false,
  dashaMarkSystem: 'vimshottari',
  language: 'en',
  grahaNames: 'english',
  chartFontScale: 1,
  mixedOuterDivision: 9,
};

/** How the grahas are named on screen: English (Sun, Moon …) or Sanskrit (Sūrya, Candra …). */
export type GrahaNameStyle = 'english' | 'sanskrit';

/** How the Nāḍī Paraya walks a graha through the signs: alternating long and short stays (Saturn 3 / 2 years, Rahu 2 / 1) or the same stay in every sign (2.5 and 1.5 years). */
export type ParayaSpeed = 'alternating' | 'even';

/** Where a Paraya graha that was retrograde at birth begins: one sign before its natal sign, or in the natal sign itself. */
export type ParayaRetro = 'previous' | 'same';

export interface CalculationSettings {
  ayanamsa: string;
  ayanamsaOffsetDegrees: number;
  nodeMode: string;
  /** The zodiac the nakshatras are counted in: the grahas' ayanamsa (the default), Lahiri, or the tropical zodiac. */
  nakshatraMode: NakshatraMode;
  charaKarakaRankMode: 'degree' | 'minute';
  /** Chara karakas: 8 with Rahu, or 7 without. */
  charaKarakaCount: 7 | 8;
  /** Paraya Saturn: 3 / 2 years alternating, or 2.5 years in every sign. */
  parayaSaturn: ParayaSpeed;
  /** Paraya Rahu and Ketu: 2 / 1 years alternating, or 1.5 years in every sign. */
  parayaRahu: ParayaSpeed;
  /** Paraya Jupiter, Saturn, Mars, Mercury and Venus that were retrograde at birth: begin in the previous sign (the default), or in the same sign. */
  parayaRetro: ParayaRetro;
  /** The sunrise the special lagnas count from: true (the default), or mean-time (true sunrise plus the equation of time). */
  sunriseMode: 'true' | 'mean';
  /** A sunrise typed in (HH:MM:SS, for example the one another program shows); it replaces the calculated sunrise when it is a time of day. */
  sunriseManual: string;
}

export const DEFAULT_CALCULATION_SETTINGS: CalculationSettings = {
  ayanamsa: 'lahiri',
  ayanamsaOffsetDegrees: 0,
  nodeMode: 'mean',
  nakshatraMode: 'same',
  charaKarakaRankMode: 'degree',
  charaKarakaCount: 8,
  parayaSaturn: 'alternating',
  parayaRahu: 'alternating',
  parayaRetro: 'previous',
  sunriseMode: 'true',
  sunriseManual: '',
};

export interface CharaOptions {
  /**
   * `jaimini`: the rules of the Jaimini Sūtras (2.3, 2.4) and BPHS 46.155–165: the order of the signs by the pada of the 9th from the start, the
   * years by the count to the lord (less one, in the direction of the pada of the sign), the lord of Scorpio and Aquarius chosen between the two,
   * the sub-periods by the kind of the sign. `custom`: the choices below.
   */
  method: 'jaimini' | 'custom';
  start: 'lagna' | 'ak';
  mahadashaDirection: 'rashi-type' | 'odd-even';
  antardashaStart: 'next-dasha-rasi' | 'same-dasha-rasi';
  antardashaDirection: 'dasha-rasi-9h' | 'dasha-rasi';
  strongerLordRule: 'graha' | 'rashi';
  durationCount: 'inclusive' | 'exclusive';
  exaltDebilAdjust: boolean;
  scorpioLord: 'Ketu' | 'Mars';
  aquariusLord: 'Saturn' | 'Rahu';
  /** How the Ātmakāraka is found when the daśā starts from it; the chart's own karaka choice, filled in by the page. */
  karaka?: { rankMode: 'degree' | 'minute'; count: 7 | 8 };
}

export interface RasiDashaOptions {
  narayanaSeed: 'stronger-lagna-seventh' | 'lagna';
  moolaSeed: 'stronger-lagna-seventh' | 'lagna';
  /** `jaimini`: the Sthira daśā of the Jaimini Sūtras 2.3.1–4 (the signs run direct from an odd Brahma sign, reverse from an even one; the sub-periods from the sign itself or, for an even sign, from its 7th in reverse). `brahma-pvr`: always forward, as PyJHora does. */
  sthiraMethod: 'jaimini' | 'brahma-pvr';
}

// v2.15 removed the 20+ never-implemented placeholder keys (tara, brahma,
// drig, …) that only ever existed in this type and in the registry's
// "Other systems" group. Stored settings containing them still parse:
// migrateDashaSettings keeps the keys below and drops the rest.
export interface DashaSettings {
  dashas: {
    vimshottari: boolean;
    /** Vimśottarī from the Utpanna, Kṣema or Ādhāna nakṣatra of the Moon. */
    vimshottariVariant?: boolean;
    vds: boolean;
    chara?: boolean;
    yogini?: boolean;
    ashtottari?: boolean;
    /** The natural daśā: Moon 1, Mars 2, Mercury 9, Venus 20, Jupiter 18, Sun 20, Saturn 50 and the Lagna 12 years. */
    naisargika?: boolean;
    kalaChakra?: boolean;
    narayana?: boolean;
    moola?: boolean;
    sthira?: boolean;
    /** The conditional nakṣatra daśās of BPHS 46.24–43: each is read only for a birth that meets the condition the text gives it. */
    shodashottari?: boolean;
    dvadashottari?: boolean;
    panchottari?: boolean;
    shatabdika?: boolean;
    chaturashitisama?: boolean;
    dvisaptatisama?: boolean;
    shashtihayani?: boolean;
    shattrimshatsama?: boolean;
  };
  charaOptions?: CharaOptions;
  rasiOptions?: RasiDashaOptions;
  /** Which of Utpanna, Kṣema and Ādhāna the variant Vimśottarī starts from; auto follows the house of the Moon. */
  variantChoice?: VimshottariVariantChoice;
  /** The year the daśās count in: Julian (365.25 days), sidereal (365.256364), tropical (365.2422) or sāvana (360). */
  yearLength?: DashaYearLength;
}

export const DEFAULT_DASHA_SETTINGS: Required<DashaSettings> = {
  dashas: {
    vimshottari: true,
    vimshottariVariant: true,
    vds: false,
    chara: false,
    yogini: true,
    ashtottari: true,
    naisargika: false,
    kalaChakra: false,
    narayana: true,
    moola: true,
    sthira: true,
    // Off to begin with: each is for a birth that meets its own condition, which most charts do not (the panel says whether this one does).
    shodashottari: false,
    dvadashottari: false,
    panchottari: false,
    shatabdika: false,
    chaturashitisama: false,
    dvisaptatisama: false,
    shashtihayani: false,
    shattrimshatsama: false,
  },
  charaOptions: {
    method: 'jaimini',
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
    sthiraMethod: 'jaimini',
  },
  variantChoice: 'auto',
  yearLength: 'julian',
};
