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
}

export interface DebugInfo {
  julianDay: number;
  ayanamsa: number;
  utcOffset: number;
  ascendantDegree: number;
  ascendantSign: number;
  ephemerisEngine: string;
  inputDateTime: string;
  latitude: number;
  longitude: number;
}

export interface ChartData {
  ascendant: {
    sign: number;
    degree: number;
    longitude: number;
  };
  planets: PlanetData[];
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

export interface ChartDisplaySettings {
  showSigns: boolean;
  showNatalPlanets: boolean;
  showTransitPlanets: boolean;
  showDegrees: boolean;
  showNakshatra: boolean;
  showCharaKaraka: boolean;
  showSanskrit: boolean;
}

export const DEFAULT_CHART_DISPLAY: ChartDisplaySettings = {
  showSigns: true,
  showNatalPlanets: true,
  showTransitPlanets: false,
  showDegrees: false,
  showNakshatra: true,
  showCharaKaraka: false,
  showSanskrit: false,
};

export interface CalculationSettings {
  ayanamsa: string;
  nodeMode: string;
}

export const DEFAULT_CALCULATION_SETTINGS: CalculationSettings = {
  ayanamsa: 'lahiri',
  nodeMode: 'mean',
};
