import { newId } from '../ids';
// Annotations drawn on a palm photograph.
//
// Everything is kept in image pixels, so the drawing looks the same at any zoom
// and in the exported picture. Sizes that should scale with the photo (stroke,
// number badges, text) are given in "units", one unit being a thousandth of the
// photo's longer side.

export interface Point {
  x: number;
  y: number;
}

export type AnnotationKind = 'pen' | 'line' | 'arrow' | 'ellipse' | 'circle' | 'ruler' | 'pin' | 'text';

/** Ages marked along a pen stroke or a line: the age at its start and at its end, and a mark every `step` years. */
export interface AgeScale {
  from: number;
  to: number;
  step: number;
}

interface Base {
  id: string;
  kind: AnnotationKind;
  color: string;
  /** Stroke width in image pixels. */
  width: number;
  /** Ages along a pen stroke, a line or an arrow, such as the years of a life line. */
  ages?: AgeScale;
  /** A short text drawn on the photo beside the annotation. */
  label?: string;
  /** What it means, for the client; numbered and listed beside the photo. */
  note?: string;
}

export interface PenAnnotation extends Base { kind: 'pen'; points: Point[] }
export interface LineAnnotation extends Base { kind: 'line' | 'arrow'; from: Point; to: Point }
/** An ellipse inscribed in the box between two corners. */
export interface EllipseAnnotation extends Base { kind: 'ellipse'; from: Point; to: Point }
/** A true circle: a centre and a radius, so it cannot be pulled into an ellipse. */
export interface CircleAnnotation extends Base { kind: 'circle'; at: Point; radius: number }
/** A measuring line, divided into `parts` equal parts by marks (2 parts: the middle). */
export interface RulerAnnotation extends Base { kind: 'ruler'; from: Point; to: Point; parts: number }
export interface PinAnnotation extends Base { kind: 'pin'; at: Point }
export interface TextAnnotation extends Base { kind: 'text'; at: Point; size: number }
export type Annotation = PenAnnotation | LineAnnotation | EllipseAnnotation | CircleAnnotation | RulerAnnotation | PinAnnotation | TextAnnotation;

export const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ffffff', '#111827'] as const;
export const DEFAULT_COLOR = COLORS[0];

/** One unit: a thousandth of the longer side of the photo. */
export const unitOf = (width: number, height: number) => Math.max(width, height) / 1000;

/** The stroke widths on offer, in units: from a fine line to a marker pen. */
export const STROKE_MIN = 1;
export const STROKE_MAX = 24;
export const STROKE_STEP = 0.5;
export const STROKE_DEFAULT = 6;

/** A stroke width brought into the range on offer, in whole steps. */
export const clampStroke = (units: number) =>
  Number.isFinite(units) ? Math.min(STROKE_MAX, Math.max(STROKE_MIN, Math.round(units / STROKE_STEP) * STROKE_STEP)) : STROKE_DEFAULT;

/** Radius of the number badge, the size of free text and the size of a label, in units. */
export const BADGE_UNITS = 22;
export const TEXT_UNITS = 38;
export const LABEL_UNITS = 32;

// ── Geometry ───────────────────────────────────────────────────────────────

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** The point a fraction of the way from a to b. */
const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Distance from a point to the segment between two points. */
export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distance(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Where the annotation is anchored: the number badge and the label sit here. */
export function anchorOf(annotation: Annotation): Point {
  switch (annotation.kind) {
    case 'pen': return annotation.points[0] ?? { x: 0, y: 0 };
    case 'line': case 'arrow': case 'ellipse': case 'ruler': return annotation.from;
    case 'pin': case 'text': case 'circle': return annotation.at;
  }
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function boundingBox(annotation: Annotation, unit = 1): Box {
  const points: Point[] = (() => {
    switch (annotation.kind) {
      case 'pen': return annotation.points;
      case 'line': case 'arrow': case 'ellipse': case 'ruler': return [annotation.from, annotation.to];
      case 'circle': return [{ x: annotation.at.x - annotation.radius, y: annotation.at.y - annotation.radius }, { x: annotation.at.x + annotation.radius, y: annotation.at.y + annotation.radius }];
      case 'pin': return [annotation.at];
      case 'text': return [annotation.at, { x: annotation.at.x + annotation.size * 0.6 * (annotation.label ?? '').length, y: annotation.at.y - annotation.size }];
    }
  })();
  const pad = annotation.kind === 'pin' ? BADGE_UNITS * unit : annotation.width / 2;
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const x = Math.min(...xs) - pad;
  const y = Math.min(...ys) - pad;
  return { x, y, width: Math.max(...xs) + pad - x, height: Math.max(...ys) + pad - y };
}

export function moveAnnotation<T extends Annotation>(annotation: T, dx: number, dy: number): T {
  const shift = (point: Point): Point => ({ x: point.x + dx, y: point.y + dy });
  switch (annotation.kind) {
    case 'pen': return { ...annotation, points: annotation.points.map(shift) };
    case 'line': case 'arrow': case 'ellipse': case 'ruler': return { ...annotation, from: shift(annotation.from), to: shift(annotation.to) };
    case 'pin': case 'text': case 'circle': return { ...annotation, at: shift(annotation.at) };
  }
}

/** Distance from a point to an annotation's outline (0 when it lies on it); the badge and pins count as discs. */
export function distanceToAnnotation(annotation: Annotation, p: Point, unit: number): number {
  const outline = (() => {
    switch (annotation.kind) {
      case 'pen': {
        const { points } = annotation;
        if (points.length === 1) return distance(p, points[0]);
        let best = Infinity;
        for (let index = 1; index < points.length; index++) best = Math.min(best, distanceToSegment(p, points[index - 1], points[index]));
        return best;
      }
      case 'line': case 'arrow': case 'ruler': return distanceToSegment(p, annotation.from, annotation.to);
      case 'circle': return Math.abs(distance(p, annotation.at) - annotation.radius);
      case 'ellipse': {
        const cx = (annotation.from.x + annotation.to.x) / 2;
        const cy = (annotation.from.y + annotation.to.y) / 2;
        const rx = Math.abs(annotation.to.x - annotation.from.x) / 2;
        const ry = Math.abs(annotation.to.y - annotation.from.y) / 2;
        if (rx === 0 || ry === 0) return distanceToSegment(p, annotation.from, annotation.to);
        // Normalised distance from the outline, scaled back by the smaller radius.
        return Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1) * Math.min(rx, ry);
      }
      case 'pin': return Math.max(0, distance(p, annotation.at) - BADGE_UNITS * unit);
      case 'text': {
        const width = annotation.size * 0.6 * Math.max(1, (annotation.label ?? '').length);
        const dx = Math.max(annotation.at.x - p.x, 0, p.x - (annotation.at.x + width));
        const dy = Math.max(annotation.at.y - annotation.size - p.y, 0, p.y - annotation.at.y);
        return Math.hypot(dx, dy);
      }
    }
  })();
  const badge = isNumbered(annotation) && annotation.kind !== 'pin'
    ? Math.max(0, distance(p, anchorOf(annotation)) - BADGE_UNITS * unit)
    : Infinity;
  return Math.min(outline, badge);
}

/** The topmost annotation within `tolerance` of the point, or null. */
export function hitTest(annotations: Annotation[], p: Point, unit: number, tolerance: number): Annotation | null {
  for (let index = annotations.length - 1; index >= 0; index--) {
    const annotation = annotations[index];
    const reach = tolerance + (annotation.kind === 'pin' || annotation.kind === 'text' ? 0 : annotation.width / 2);
    if (distanceToAnnotation(annotation, p, unit) <= reach) return annotation;
  }
  return null;
}

// ── The ruler ──────────────────────────────────────────────────────────────

export const RULER_MIN_PARTS = 1;
export const RULER_MAX_PARTS = 12;
/** Two parts: the ruler shows its middle. */
export const RULER_DEFAULT_PARTS = 2;
/** The size of the figures on a ruler, in units. */
export const RULER_LABEL_UNITS = 26;

/** A number of parts brought into the range on offer, in whole parts. */
export const clampParts = (parts: number) =>
  Number.isFinite(parts) ? Math.min(RULER_MAX_PARTS, Math.max(RULER_MIN_PARTS, Math.round(parts))) : RULER_DEFAULT_PARTS;

/** The points that divide the ruler into its parts, the two ends included. */
export function rulerPoints(from: Point, to: Point, parts: number): Point[] {
  const count = clampParts(parts);
  return Array.from({ length: count + 1 }, (_, index) => ({
    x: from.x + ((to.x - from.x) * index) / count,
    y: from.y + ((to.y - from.y) * index) / count,
  }));
}

const roundTo = (value: number, places: number) => Math.round(value * 10 ** places) / 10 ** places;

/** A scale is pixels of the photograph to a centimetre: only a positive number is one. */
export const validScale = (scale: unknown): scale is number => typeof scale === 'number' && Number.isFinite(scale) && scale > 0;

/**
 * What the ruler says: its length, and the length of one part when it is divided. In centimetres when the photograph
 * has a scale, and otherwise in pixels of the photograph.
 */
export function rulerLabel(ruler: RulerAnnotation, scale?: number): string {
  const length = distance(ruler.from, ruler.to);
  const parts = clampParts(ruler.parts);
  if (validScale(scale)) {
    const cm = length / scale;
    return parts > 1 ? `${roundTo(cm, 2)} cm ÷ ${parts} = ${roundTo(cm / parts, 2)} cm` : `${roundTo(cm, 2)} cm`;
  }
  return parts > 1 ? `${Math.round(length)} ÷ ${parts} = ${roundTo(length / parts, 1)}` : String(Math.round(length));
}

/** The unit vector across a line, turned to point up the page, or to the right when the line is upright. */
function sideNormal(ux: number, uy: number): [number, number] {
  let nx = -uy;
  let ny = ux;
  if (ny > 0 || (Math.abs(ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
  return [nx, ny];
}

export interface RulerGeometry {
  /** The marks across the line: longer at the two ends. */
  ticks: [Point, Point][];
  /** The middle of the ruler, marked with a dot, when the parts are an even number. */
  middle: Point | null;
  label: { text: string; at: Point; anchor: 'start' | 'middle' | 'end'; size: number };
}

/** Where the marks and the figures of a ruler are drawn; the screen and the saved picture both use it. */
export function rulerGeometry(ruler: RulerAnnotation, unit: number, scale?: number): RulerGeometry {
  const parts = clampParts(ruler.parts);
  const points = rulerPoints(ruler.from, ruler.to, parts);
  const length = distance(ruler.from, ruler.to);
  const ux = length > 0 ? (ruler.to.x - ruler.from.x) / length : 1;
  const uy = length > 0 ? (ruler.to.y - ruler.from.y) / length : 0;
  const [nx, ny] = sideNormal(ux, uy);

  const end = Math.max(ruler.width * 1.6, 7 * unit);
  const ticks = points.map((point, index): [Point, Point] => {
    const half = index === 0 || index === parts ? end : end * 0.65;
    return [{ x: point.x - nx * half, y: point.y - ny * half }, { x: point.x + nx * half, y: point.y + ny * half }];
  });

  const size = RULER_LABEL_UNITS * unit;
  const sideways = Math.abs(nx) > 0.5;
  const reach = end + (sideways ? 4 * unit : size * 0.6);
  const centre = { x: (ruler.from.x + ruler.to.x) / 2, y: (ruler.from.y + ruler.to.y) / 2 };
  return {
    ticks,
    middle: parts % 2 === 0 ? points[parts / 2] : null,
    label: { text: rulerLabel(ruler, scale), at: { x: centre.x + nx * reach, y: centre.y + ny * reach }, anchor: sideways ? (nx > 0 ? 'start' : 'end') : 'middle', size },
  };
}

// ── Ages along a line ──────────────────────────────────────────────────────

export const AGE_LABEL_UNITS = 22;
export const AGE_LIMIT = 120;
export const AGE_STEP_MIN = 0.5;
export const AGE_STEP_MAX = 60;
/** The usual life line: from birth to seventy, a mark every ten years. */
export const AGE_DEFAULT: AgeScale = { from: 0, to: 70, step: 10 };

/** The scale if it is a sensible one (ages within a life, a step that gives at most a hundred marks), else null. */
export function validAgeScale(value: unknown): AgeScale | null {
  if (!value || typeof value !== 'object') return null;
  const { from, to, step } = value as Record<string, unknown>;
  if (typeof from !== 'number' || typeof to !== 'number' || typeof step !== 'number') return null;
  if (![from, to, step].every(Number.isFinite)) return null;
  if (from < 0 || to < 0 || from > AGE_LIMIT || to > AGE_LIMIT || from === to) return null;
  if (step < AGE_STEP_MIN || step > AGE_STEP_MAX || Math.abs(to - from) / step > 99) return null;
  return { from, to, step };
}

/** The ages that have a mark: the multiples of the step between the two ages. */
export function ageValues(ages: AgeScale): number[] {
  const low = Math.min(ages.from, ages.to);
  const high = Math.max(ages.from, ages.to);
  const values: number[] = [];
  for (let k = Math.ceil(low / ages.step - 1e-9); k * ages.step <= high + 1e-9; k++) values.push(roundTo(k * ages.step, 3) + 0); // + 0 turns a negative zero into zero
  return values;
}

export interface AgeMark {
  age: number;
  at: Point;
  tick: [Point, Point];
  label: { text: string; at: Point; anchor: 'start' | 'middle' | 'end'; size: number };
}

/** The drawings along which ages can be marked, as the line of points they follow. */
export function pathOfAnnotation(annotation: Annotation): Point[] | null {
  switch (annotation.kind) {
    case 'pen': return annotation.points;
    case 'line': case 'arrow': return [annotation.from, annotation.to];
    default: return null;
  }
}

/**
 * The marks of an age scale: the ages are spread evenly along the length of the line, from the first age at its
 * start to the second at its end, and each mark is a short stroke across the line with the age beside it.
 */
export function ageMarks(annotation: Annotation, unit: number): AgeMark[] {
  const ages = validAgeScale(annotation.ages);
  const path = pathOfAnnotation(annotation);
  if (!ages || !path || path.length < 2) return [];
  const lengths = [0];
  for (let index = 1; index < path.length; index++) lengths.push(lengths[index - 1] + distance(path[index - 1], path[index]));
  const total = lengths[lengths.length - 1];
  if (total <= 0) return [];

  const half = Math.max(annotation.width * 1.2, 5 * unit);
  const size = AGE_LABEL_UNITS * unit;
  return ageValues(ages).map(age => {
    const along = ((age - ages.from) / (ages.to - ages.from)) * total;
    let index = 1;
    while (index < lengths.length - 1 && lengths[index] < along) index++;
    const span = lengths[index] - lengths[index - 1];
    const at = lerp(path[index - 1], path[index], span > 0 ? Math.min(1, Math.max(0, (along - lengths[index - 1]) / span)) : 0);
    const dx = path[index].x - path[index - 1].x;
    const dy = path[index].y - path[index - 1].y;
    const length = Math.hypot(dx, dy) || 1;
    const [nx, ny] = sideNormal(dx / length, dy / length);
    const sideways = Math.abs(nx) > 0.5;
    const reach = half + (sideways ? 3 * unit : size * 0.6);
    return {
      age,
      at,
      tick: [{ x: at.x - nx * half, y: at.y - ny * half }, { x: at.x + nx * half, y: at.y + ny * half }],
      label: { text: String(age), at: { x: at.x + nx * reach, y: at.y + ny * reach }, anchor: sideways ? (nx > 0 ? 'start' : 'end') : 'middle', size },
    };
  });
}

// ── Changing a drawing: handles ────────────────────────────────────────────

export interface Handle {
  id: string;
  at: Point;
}

const boxOf = (a: { from: Point; to: Point }) => ({
  x0: Math.min(a.from.x, a.to.x), y0: Math.min(a.from.y, a.to.y), x1: Math.max(a.from.x, a.to.x), y1: Math.max(a.from.y, a.to.y),
});

/**
 * The points of a drawing that can be dragged to change it: the ends of a line, an arrow or a ruler, the edge
 * of a circle, the corners of an ellipse and every point of a pen stroke. Pins and text are only moved.
 */
export function handlesOf(annotation: Annotation): Handle[] {
  switch (annotation.kind) {
    case 'line': case 'arrow': case 'ruler': return [{ id: 'from', at: annotation.from }, { id: 'to', at: annotation.to }];
    case 'circle': return [{ id: 'radius', at: { x: annotation.at.x + annotation.radius, y: annotation.at.y } }];
    case 'ellipse': {
      const { x0, y0, x1, y1 } = boxOf(annotation);
      return [{ id: 'nw', at: { x: x0, y: y0 } }, { id: 'ne', at: { x: x1, y: y0 } }, { id: 'sw', at: { x: x0, y: y1 } }, { id: 'se', at: { x: x1, y: y1 } }];
    }
    case 'pen': return annotation.points.map((at, index) => ({ id: `p${index}`, at }));
    case 'pin': case 'text': return [];
  }
}

/** The nearest handle within `tolerance` of the point, or null. */
export function handleAt(handles: Handle[], p: Point, tolerance: number): Handle | null {
  let best: Handle | null = null;
  let bestDistance = tolerance;
  for (const handle of handles) {
    const d = distance(handle.at, p);
    if (d <= bestDistance) { best = handle; bestDistance = d; }
  }
  return best;
}

const OPPOSITE: Record<string, [number, number]> = { nw: [1, 1], ne: [0, 1], sw: [1, 0], se: [0, 0] };

/** The drawing with one of its handles dragged to a new place. */
export function reshapeAnnotation(annotation: Annotation, handle: string, to: Point): Annotation {
  switch (annotation.kind) {
    case 'line': case 'arrow': case 'ruler':
      return handle === 'from' ? { ...annotation, from: to } : handle === 'to' ? { ...annotation, to } : annotation;
    case 'circle':
      return handle === 'radius' ? { ...annotation, radius: Math.max(1, distance(annotation.at, to)) } : annotation;
    case 'ellipse': {
      const fixed = OPPOSITE[handle];
      if (!fixed) return annotation;
      const { x0, y0, x1, y1 } = boxOf(annotation);
      return { ...annotation, from: { x: fixed[0] ? x1 : x0, y: fixed[1] ? y1 : y0 }, to };
    }
    case 'pen': {
      const index = /^p(\d+)$/.exec(handle)?.[1];
      if (index === undefined || Number(index) >= annotation.points.length) return annotation;
      return { ...annotation, points: annotation.points.map((point, i) => (i === Number(index) ? to : point)) };
    }
    case 'pin': case 'text': return annotation;
  }
}

// ── Snapping ───────────────────────────────────────────────────────────────

/**
 * The places a new drawing can catch on: every mark of a ruler (the middle among them), the ends and the middle
 * of a line or an arrow, the ends of a pen stroke, the centre of a circle or an ellipse and a pin.
 */
export function snapTargets(annotations: Annotation[], except?: string): Point[] {
  const targets: Point[] = [];
  for (const annotation of annotations) {
    if (annotation.id === except) continue;
    switch (annotation.kind) {
      case 'ruler': targets.push(...rulerPoints(annotation.from, annotation.to, annotation.parts)); break;
      case 'line': case 'arrow': targets.push(annotation.from, annotation.to, { x: (annotation.from.x + annotation.to.x) / 2, y: (annotation.from.y + annotation.to.y) / 2 }); break;
      case 'pen': targets.push(annotation.points[0], annotation.points[annotation.points.length - 1]); break;
      case 'circle': targets.push(annotation.at); break;
      case 'ellipse': targets.push({ x: (annotation.from.x + annotation.to.x) / 2, y: (annotation.from.y + annotation.to.y) / 2 }); break;
      case 'pin': targets.push(annotation.at); break;
      case 'text': break;
    }
  }
  return targets;
}

/** The nearest target within `tolerance` of the point, or null. */
export function snapPoint(targets: Point[], p: Point, tolerance: number): Point | null {
  let best: Point | null = null;
  let bestDistance = tolerance;
  for (const target of targets) {
    const d = distance(target, p);
    if (d <= bestDistance) { best = target; bestDistance = d; }
  }
  return best;
}

// ── The eraser ─────────────────────────────────────────────────────────────

/** Pieces of a stroke shorter than this are not worth keeping, in units. */
const MIN_PIECE_UNITS = 3;


/** The pieces of a drawing after the first, which keeps the note and the label, as new drawings of their own. */
function withoutWords<T extends Annotation>(annotation: T, id: string): T {
  const { label, note, ...rest } = annotation;
  void label; void note;
  return { ...rest, id } as T;
}

function erasePen(annotation: PenAnnotation, p: Point, reach: number, unit: number, makeId: () => string): Annotation[] | null {
  const { points } = annotation;
  const touched = points.length === 1
    ? distance(points[0], p) <= reach
    : points.some((point, index) => index > 0 && distanceToSegment(p, points[index - 1], point) <= reach);
  if (!touched) return null;

  // Walk the stroke in small steps and cut out the steps that are under the eraser.
  const step = Math.max(reach / 4, unit);
  const dense: Point[] = [points[0]];
  for (let index = 1; index < points.length; index++) {
    const count = Math.max(1, Math.ceil(distance(points[index - 1], points[index]) / step));
    for (let k = 1; k <= count; k++) dense.push(lerp(points[index - 1], points[index], k / count));
  }
  const runs: Point[][] = [];
  let run: Point[] = [];
  for (const point of dense) {
    if (distance(point, p) <= reach) {
      if (run.length) runs.push(run);
      run = [];
    } else {
      run.push(point);
    }
  }
  if (run.length) runs.push(run);

  const pieces = runs
    .filter(piece => piece.length >= 2 && (piece.length - 1) * step >= MIN_PIECE_UNITS * unit)
    .map(piece => simplifyPath(piece, unit * 0.4));
  return pieces.map((piecePoints, index) => (index === 0 ? { ...annotation, points: piecePoints } : withoutWords({ ...annotation, points: piecePoints }, makeId())));
}

function eraseLine(annotation: LineAnnotation, p: Point, reach: number, unit: number, makeId: () => string): Annotation[] | null {
  const { from, to } = annotation;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const a = dx * dx + dy * dy;
  if (a === 0) return distance(from, p) <= reach ? [] : null;
  const fx = from.x - p.x;
  const fy = from.y - p.y;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - reach * reach;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const root = Math.sqrt(discriminant);
  const t1 = (-b - root) / (2 * a);
  const t2 = (-b + root) / (2 * a);
  if (t2 < 0 || t1 > 1) return null;

  const length = Math.sqrt(a);
  const minimum = (MIN_PIECE_UNITS * unit) / length;
  const pieces: Annotation[] = [];
  // The arrow keeps its head on the piece at the head's end; the other piece is a plain line.
  if (t1 > minimum) pieces.push({ ...annotation, kind: annotation.kind === 'arrow' ? 'line' : annotation.kind, to: lerp(from, to, t1) });
  if (t2 < 1 - minimum) {
    const rest = { ...annotation, from: lerp(from, to, t2) };
    pieces.push(pieces.length === 0 ? rest : withoutWords(rest, makeId()));
  }
  return pieces;
}

/**
 * The drawing after the eraser, a disc of the given radius, has been at a point. A pen stroke or a line is cut
 * where the eraser passes, in two where it passes through the middle; any other drawing the eraser touches is
 * removed whole. The same list is returned when nothing was touched.
 */
export function eraseAt(annotations: Annotation[], p: Point, radius: number, unit: number, makeId: () => string = newId): Annotation[] {
  let changed = false;
  const next: Annotation[] = [];
  for (const annotation of annotations) {
    const reach = radius + (annotation.kind === 'pin' || annotation.kind === 'text' ? 0 : annotation.width / 2);
    let pieces: Annotation[] | null;
    if (annotation.kind === 'pen') pieces = erasePen(annotation, p, reach, unit, makeId);
    else if (annotation.kind === 'line' || annotation.kind === 'arrow') pieces = eraseLine(annotation, p, reach, unit, makeId);
    else pieces = distanceToAnnotation(annotation, p, unit) <= reach ? [] : null;
    if (pieces) {
      changed = true;
      next.push(...pieces);
    } else {
      next.push(annotation);
    }
  }
  return changed ? next : annotations;
}

/** The eraser drawn from one place to another: it is applied at small steps, so a quick stroke leaves no gaps. */
export function eraseAlong(annotations: Annotation[], from: Point, to: Point, radius: number, unit: number, makeId: () => string = newId): Annotation[] {
  const steps = Math.max(1, Math.ceil(distance(from, to) / Math.max(radius / 2, unit)));
  let list = annotations;
  for (let index = 0; index <= steps; index++) list = eraseAt(list, lerp(from, to, index / steps), radius, unit, makeId);
  return list;
}

// ── Pen strokes ────────────────────────────────────────────────────────────

/** Ramer–Douglas–Peucker: drops points that lie within `epsilon` of the line between their neighbours. */
export function simplifyPath(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  let farthest = 0;
  let index = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = distanceToSegment(points[i], first, last);
    if (d > farthest) { farthest = d; index = i; }
  }
  if (farthest <= epsilon) return [first, last];
  const left = simplifyPath(points.slice(0, index + 1), epsilon);
  const right = simplifyPath(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

const round = (value: number) => Math.round(value * 100) / 100;

/** SVG path data for a smooth curve through the points (quadratic curves between midpoints). */
export function pathData(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${round(points[0].x)} ${round(points[0].y)}l0.01 0`;
  if (points.length === 2) return `M${round(points[0].x)} ${round(points[0].y)}L${round(points[1].x)} ${round(points[1].y)}`;
  let d = `M${round(points[0].x)} ${round(points[0].y)}`;
  for (let index = 1; index < points.length - 1; index++) {
    const mid = { x: (points[index].x + points[index + 1].x) / 2, y: (points[index].y + points[index + 1].y) / 2 };
    d += `Q${round(points[index].x)} ${round(points[index].y)} ${round(mid.x)} ${round(mid.y)}`;
  }
  const last = points[points.length - 1];
  return `${d}L${round(last.x)} ${round(last.y)}`;
}

/** The two wing points of an arrow head at the end of a line. */
export function arrowHead(from: Point, to: Point, size: number): [Point, Point] {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const wing = (offset: number): Point => ({
    x: to.x - size * Math.cos(angle + offset),
    y: to.y - size * Math.sin(angle + offset),
  });
  return [wing(Math.PI / 7), wing(-Math.PI / 7)];
}

// ── Notes and numbers ──────────────────────────────────────────────────────

/** Pins are always numbered; other annotations get a number once they carry a note. */
export function isNumbered(annotation: Annotation): boolean {
  return annotation.kind === 'pin' || Boolean(annotation.note?.trim());
}

/** The number of each numbered annotation, in the order they were drawn. */
export function numbering(annotations: Annotation[]): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const annotation of annotations) if (isNumbered(annotation)) numbers.set(annotation.id, numbers.size + 1);
  return numbers;
}

export interface NoteEntry {
  number: number;
  id: string;
  label: string;
  note: string;
}

/** The numbered annotations as the list shown beside the photo. */
export function noteList(annotations: Annotation[]): NoteEntry[] {
  const numbers = numbering(annotations);
  return annotations
    .filter(annotation => numbers.has(annotation.id))
    .map(annotation => ({ number: numbers.get(annotation.id)!, id: annotation.id, label: annotation.label?.trim() ?? '', note: annotation.note?.trim() ?? '' }));
}

// ── History ────────────────────────────────────────────────────────────────

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

export const startHistory = <T,>(present: T): History<T> => ({ past: [], present, future: [] });
export function pushHistory<T>(history: History<T>, next: T, limit = 100): History<T> {
  return { past: [...history.past, history.present].slice(-limit), present: next, future: [] };
}
export function undoHistory<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history;
  return { past: history.past.slice(0, -1), present: history.past[history.past.length - 1], future: [history.present, ...history.future] };
}
export function redoHistory<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history;
  return { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1) };
}

// ── Saved data ─────────────────────────────────────────────────────────────

const isPoint = (value: unknown): value is Point =>
  !!value && typeof value === 'object' && Number.isFinite((value as Point).x) && Number.isFinite((value as Point).y);

/** The annotations in saved data that are well formed; anything else is dropped. */
export function sanitizeAnnotations(raw: unknown): Annotation[] {
  if (!Array.isArray(raw)) return [];
  const result: Annotation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const a = item as Record<string, unknown>;
    if (typeof a.id !== 'string' || typeof a.color !== 'string' || !Number.isFinite(a.width)) continue;
    const base = {
      id: a.id,
      color: a.color,
      width: a.width as number,
      ...(typeof a.label === 'string' && a.label ? { label: a.label } : {}),
      ...(typeof a.note === 'string' && a.note ? { note: a.note } : {}),
      // Ages are marked along strokes and lines only.
      ...((a.kind === 'pen' || a.kind === 'line' || a.kind === 'arrow') && validAgeScale(a.ages) ? { ages: validAgeScale(a.ages)! } : {}),
    };
    switch (a.kind) {
      case 'pen':
        if (Array.isArray(a.points) && a.points.length > 0 && a.points.every(isPoint)) result.push({ ...base, kind: 'pen', points: a.points as Point[] });
        break;
      case 'line': case 'arrow': case 'ellipse':
        if (isPoint(a.from) && isPoint(a.to)) result.push({ ...base, kind: a.kind, from: a.from, to: a.to });
        break;
      case 'ruler':
        if (isPoint(a.from) && isPoint(a.to)) result.push({ ...base, kind: 'ruler', from: a.from, to: a.to, parts: clampParts(Number(a.parts)) });
        break;
      case 'circle':
        if (isPoint(a.at) && Number.isFinite(a.radius) && (a.radius as number) > 0) result.push({ ...base, kind: 'circle', at: a.at, radius: a.radius as number });
        break;
      case 'pin':
        if (isPoint(a.at)) result.push({ ...base, kind: 'pin', at: a.at });
        break;
      case 'text':
        if (isPoint(a.at) && Number.isFinite(a.size)) result.push({ ...base, kind: 'text', at: a.at, size: a.size as number });
        break;
    }
  }
  return result;
}

// ── Colours ────────────────────────────────────────────────────────────────

/** Dark or white text, whichever reads better on the colour. */
export function contrastText(color: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return '#ffffff';
  const value = parseInt(match[1], 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111827' : '#ffffff';
}
