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
export type UiMode = 'simple' | 'research' | 'debug';

export type WorkspacePanelType =
  | 'natal'
  | 'natal-transit'
  | 'bcp'
  | 'bnn'
  | 'vimshottari'
  | 'graha-table'
  | 'yoga-table'
  | 'varga-matrix'
  | 'varga-strength'
  | 'shadbala'
  | 'bhava-bala';

export type WorkspacePanel = {
  id: string;
  title: string;
  type: WorkspacePanelType;
};

export interface ChartDisplaySettings {
  chartStyle: ChartStyle;
  showSigns: boolean;
  showNatalPlanets: boolean;
  showTransitPlanets: boolean;
  showDegrees: boolean;
  degreePrecision: DegreePrecision;
  showNakshatra: boolean;
  showNakshatraPada: boolean;
  showD108: boolean;
  showCharaKaraka: boolean;
  showSanskrit: boolean;
  showOuterPlanets: boolean;
  showSpecialLagnas: boolean;
  showPanchang: boolean;
  showGrahaDrishti: boolean;
  showRashiDrishti: boolean;
  showBnnAlpha: boolean;
  showBnnJupiterianRounds: boolean;
  showBnnJupiterMinor: boolean;
  showBnnEventDetection: boolean;
  showBnnMajorHighlight: boolean;
  showBnnMinorHighlight: boolean;
  showWorkspace: boolean;
}

export const DEFAULT_CHART_DISPLAY: ChartDisplaySettings = {
  chartStyle: 'north',
  showSigns: true,
  showNatalPlanets: true,
  showTransitPlanets: false,
  showDegrees: false,
  degreePrecision: 'off',
  showNakshatra: true,
  showNakshatraPada: true,
  showD108: false,
  showCharaKaraka: false,
  showSanskrit: false,
  showOuterPlanets: false,
  showSpecialLagnas: true,
  showPanchang: false,
  showGrahaDrishti: false,
  showRashiDrishti: false,
  showBnnAlpha: false,
  showBnnJupiterianRounds: false,
  showBnnJupiterMinor: false,
  showBnnEventDetection: true,
  showBnnMajorHighlight: true,
  showBnnMinorHighlight: true,
  showWorkspace: false,
};

export interface CalculationSettings {
  ayanamsa: string;
  ayanamsaOffsetDegrees: number;
  nodeMode: string;
  nakshatraMode: 'sidereal' | 'tropical';
  charaKarakaRankMode: 'degree' | 'minute';
}

export const DEFAULT_CALCULATION_SETTINGS: CalculationSettings = {
  ayanamsa: 'lahiri',
  ayanamsaOffsetDegrees: 0,
  nodeMode: 'mean',
  nakshatraMode: 'sidereal',
  charaKarakaRankMode: 'degree',
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
