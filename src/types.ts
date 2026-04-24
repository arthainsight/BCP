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

export interface ChartData {
  ascendant: {
    sign: number;
    degree: number;
    longitude: number;
  };
  planets: PlanetData[];
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
