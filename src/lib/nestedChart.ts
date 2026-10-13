import type { Point } from './chartLabelLayout';

// The geometry of the chart within a chart: one chart (the outer) and another (the inner) drawn in the same
// houses. A square the inner chart owns, three quarters of the chart's side, sits in the middle; every house (North
// Indian) or sign (South Indian) is cut by it, so the part of it inside the square holds the planets of the inner
// chart and the rest of it the planets of the outer chart. Everything is in the 500-unit square of the charts.

export const CHART_SIZE = 500;
/** The inner square: its side as a fraction of the chart's. */
export const INNER_RATIO = 0.75;
const MARGIN = (CHART_SIZE * (1 - INNER_RATIO)) / 2;
export const INNER_SQUARE = { x0: MARGIN, y0: MARGIN, x1: CHART_SIZE - MARGIN, y1: CHART_SIZE - MARGIN };

export interface NestedRegion {
  /** North Indian: the house, 1 to 12, the house of the sign counted from the lagna of the inner chart. */
  house?: number;
  /** South Indian: the sign, 1 to 12, which never moves. */
  sign?: number;
  /** The whole house or sign. */
  polygon: Point[];
  /** The part of it inside the inner square. */
  inner: Point[];
  /** The part of it outside, the largest convex piece when it is not one. */
  outer: Point[];
  /** Where the name of the sign is written: in the inner part. */
  signAt: Point;
}

/** The area of a polygon. */
export function polygonArea(polygon: readonly Point[]): number {
  let sum = 0;
  for (let index = 0; index < polygon.length; index++) {
    const [x1, y1] = polygon[index];
    const [x2, y2] = polygon[(index + 1) % polygon.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

/** The mean of the corners, which is where the labels of a convex piece are centred. */
export function centroidOf(polygon: readonly Point[]): Point {
  const x = polygon.reduce((sum, point) => sum + point[0], 0) / polygon.length;
  const y = polygon.reduce((sum, point) => sum + point[1], 0) / polygon.length;
  return [x, y];
}

type Side = (point: Point) => number;

/** Sutherland–Hodgman: the part of a convex polygon on the side where `side` is not negative. */
function clip(polygon: readonly Point[], side: Side): Point[] {
  const result: Point[] = [];
  for (let index = 0; index < polygon.length; index++) {
    const current = polygon[index];
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const a = side(current);
    const b = side(previous);
    if ((a >= 0) !== (b >= 0)) {
      const t = b / (b - a);
      result.push([previous[0] + (current[0] - previous[0]) * t, previous[1] + (current[1] - previous[1]) * t]);
    }
    if (a >= 0) result.push(current);
  }
  return result;
}

const { x0, y0, x1, y1 } = INNER_SQUARE;

/** The part of a convex polygon inside the inner square. */
export function insideSquare(polygon: readonly Point[]): Point[] {
  let piece: Point[] = [...polygon];
  for (const side of [(p: Point) => p[0] - x0, (p: Point) => x1 - p[0], (p: Point) => p[1] - y0, (p: Point) => y1 - p[1]]) {
    piece = clip(piece, side);
    if (piece.length < 3) return [];
  }
  return piece;
}

/**
 * The part of a convex polygon outside the inner square. It is the union of the pieces beyond each of the four sides;
 * the largest of them is returned, which for a North Indian house and a South Indian cell is all but a corner.
 */
export function outsideSquare(polygon: readonly Point[]): Point[] {
  const sides: Side[] = [(p: Point) => x0 - p[0], (p: Point) => p[0] - x1, (p: Point) => y0 - p[1], (p: Point) => p[1] - y1];
  let best: Point[] = [];
  for (const side of sides) {
    const piece = clip(polygon, side);
    if (piece.length >= 3 && polygonArea(piece) > polygonArea(best)) best = piece;
  }
  return best;
}

const parse = (points: string): Point[] => points.split(' ').map(pair => pair.split(',').map(Number) as [number, number]);

// The twelve houses of the North Indian chart, as in NorthIndianChart, with where the sign is written in each.
const NORTH: { house: number; points: string; sign: Point }[] = [
  { house: 1, points: '250,0 375,125 250,250 125,125', sign: [250, 220] },
  { house: 2, points: '0,0 250,0 125,125', sign: [125, 95] },
  { house: 3, points: '0,0 125,125 0,250', sign: [95, 130] },
  { house: 4, points: '0,250 125,125 250,250 125,375', sign: [220, 250] },
  { house: 5, points: '0,250 125,375 0,500', sign: [95, 380] },
  { house: 6, points: '0,500 125,375 250,500', sign: [125, 400] },
  { house: 7, points: '250,500 125,375 250,250 375,375', sign: [250, 280] },
  { house: 8, points: '250,500 375,375 500,500', sign: [375, 400] },
  { house: 9, points: '500,500 375,375 500,250', sign: [400, 380] },
  { house: 10, points: '500,250 375,375 250,250 375,125', sign: [280, 250] },
  { house: 11, points: '500,250 375,125 500,0', sign: [400, 130] },
  { house: 12, points: '500,0 375,125 250,0', sign: [375, 95] },
];

export function northRegions(): NestedRegion[] {
  return NORTH.map(({ house, points, sign }) => {
    const polygon = parse(points);
    return { house, polygon, inner: insideSquare(polygon), outer: outsideSquare(polygon), signAt: sign };
  });
}

/** The signs of the South Indian chart by cell, row by row; the four cells of the middle are the chart's own. */
const SOUTH_GRID: (number | null)[] = [
  12, 1, 2, 3,
  11, null, null, 4,
  10, null, null, 5,
  9, 8, 7, 6,
];

export function southRegions(): NestedRegion[] {
  const cell = CHART_SIZE / 4;
  const regions: NestedRegion[] = [];
  SOUTH_GRID.forEach((sign, index) => {
    if (sign === null) return;
    const left = (index % 4) * cell;
    const top = Math.floor(index / 4) * cell;
    const polygon: Point[] = [[left, top], [left + cell, top], [left + cell, top + cell], [left, top + cell]];
    const inner = insideSquare(polygon);
    // The name of the sign goes in the corner of the inner part that is nearest to the middle of the chart.
    const innerLeft = Math.min(...inner.map(point => point[0]));
    const innerTop = Math.min(...inner.map(point => point[1]));
    regions.push({ sign, polygon, inner, outer: outsideSquare(polygon), signAt: [innerLeft + 14, innerTop + 8] });
  });
  return regions;
}

/** The four middle cells of the South Indian chart, where the names of the two charts are written. */
export const SOUTH_CENTRE = { x0: CHART_SIZE / 4, y0: CHART_SIZE / 4, x1: (CHART_SIZE * 3) / 4, y1: (CHART_SIZE * 3) / 4 };

/** The house of a sign counted from a lagna sign, 1 to 12. */
export const houseOfSign = (sign: number, lagnaSign: number) => ((sign - lagnaSign + 12) % 12) + 1;
