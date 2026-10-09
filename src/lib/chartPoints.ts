import type { ChartData, PlanetData, SpecialLagna } from '@/types';
import { getVargaSignIndex } from './varga';
import { aprakashaUpagrahas, type SaturnPortionMoment } from './upagrahas';

// The upagrahas and Karakāṁśa a viewer can mark on the charts. They are kept as
// longitudes in the rāśi and projected into each divisional chart like the
// special lagnas; Karakāṁśa is a rāśi sign, so it is marked in the rāśi chart only.

export const POINT_KEYS = ['Gu', 'Md', 'Dh', 'Vy', 'Pa', 'In', 'Uk', 'KA'] as const;
export type PointKey = (typeof POINT_KEYS)[number];

export const POINT_NAMES: Record<PointKey, string> = {
  Gu: 'Gulika', Md: 'Maandi', Dh: 'Dhuma', Vy: 'Vyatipata', Pa: 'Parivesha', In: 'Indrachapa', Uk: 'Upaketu', KA: 'Karakamsa',
};

export interface ChartPointsSelection {
  keys: PointKey[];
  /** Which moment of Saturn's part gives the Lagna for Gulika and for Maandi. */
  gulikaAt: SaturnPortionMoment;
  maandiAt: SaturnPortionMoment;
}

export const DEFAULT_POINTS_SELECTION: ChartPointsSelection = { keys: [], gulikaAt: 'begin', maandiAt: 'middle' };

export interface ChartPoint {
  key: PointKey;
  name: string;
  /** Where the point lies in the rāśi. */
  longitude: number;
}

/** Gulika and Maandi from the Lagna in Saturn's part, and the five Sun-based upagrahas. */
export function upagrahaPoints(
  chart: Pick<ChartData, 'planets' | 'saturnPortion'>,
  gulikaAt: SaturnPortionMoment = DEFAULT_POINTS_SELECTION.gulikaAt,
  maandiAt: SaturnPortionMoment = DEFAULT_POINTS_SELECTION.maandiAt,
): ChartPoint[] {
  const points: ChartPoint[] = [];
  const portion = chart.saturnPortion;
  if (portion) {
    points.push({ key: 'Gu', name: POINT_NAMES.Gu, longitude: portion.ascendants[gulikaAt] });
    points.push({ key: 'Md', name: POINT_NAMES.Md, longitude: portion.ascendants[maandiAt] });
  }
  const sun = chart.planets.find(planet => planet.name === 'Sun');
  if (sun) {
    for (const upagraha of aprakashaUpagrahas(sun.longitude)) {
      points.push({ key: upagraha.key as PointKey, name: upagraha.name, longitude: upagraha.longitude });
    }
  }
  return points;
}

export interface Karakamsa {
  planet: string;
  /** The sign the Ātmakāraka holds in the Navāṁśa, 1–12. */
  sign: number;
  /** Its position inside that Navāṁśa sign, on the 0–30 scale. */
  degree: number;
  longitude: number;
}

/** Karakāṁśa: the sign the Ātmakāraka holds in the Navāṁśa, read as a sign of the rāśi. */
export function karakamsa(planets: PlanetData[], atmakaraka: string | undefined): Karakamsa | null {
  const planet = planets.find(item => item.name === atmakaraka);
  if (!planet) return null;
  const sign = getVargaSignIndex(planet.longitude, 9) + 1;
  const stride = 30 / 9;
  const degree = (((planet.longitude % 30) % stride) / stride) * 30;
  return { planet: planet.name, sign, degree, longitude: (sign - 1) * 30 + degree };
}

/** The Ātmakāraka, from the karaka label of each graha ("AK"). */
export function atmakarakaOf(karakaByPlanet: Record<string, string>): string | undefined {
  return Object.keys(karakaByPlanet).find(name => karakaByPlanet[name] === 'AK');
}

/** The points the viewer has chosen, as marks for the rāśi chart (named by their short codes). */
export function selectedChartPoints(
  chart: Pick<ChartData, 'planets' | 'saturnPortion'>,
  selection: ChartPointsSelection,
  atmakaraka?: string,
): SpecialLagna[] {
  if (selection.keys.length === 0) return [];
  const available: ChartPoint[] = upagrahaPoints(chart, selection.gulikaAt, selection.maandiAt);
  const ka = karakamsa(chart.planets, atmakaraka);
  if (ka) available.push({ key: 'KA', name: POINT_NAMES.KA, longitude: ka.longitude });
  return available
    .filter(point => selection.keys.includes(point.key))
    .map(point => ({ name: point.key, longitude: point.longitude, sign: Math.floor(point.longitude / 30) + 1, degree: point.longitude % 30 }));
}

/** The marks for a divisional chart: the rāśi marks of the chosen points, Karakāṁśa only in the rāśi chart itself. */
export function pointsForDivision(points: SpecialLagna[], division: number): SpecialLagna[] {
  return division === 1 ? points : points.filter(point => point.name !== 'KA');
}
