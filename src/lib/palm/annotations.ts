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

export type AnnotationKind = 'pen' | 'line' | 'arrow' | 'ellipse' | 'pin' | 'text';

interface Base {
  id: string;
  kind: AnnotationKind;
  color: string;
  /** Stroke width in image pixels. */
  width: number;
  /** A short text drawn on the photo beside the annotation. */
  label?: string;
  /** What it means, for the client; numbered and listed beside the photo. */
  note?: string;
}

export interface PenAnnotation extends Base { kind: 'pen'; points: Point[] }
export interface LineAnnotation extends Base { kind: 'line' | 'arrow'; from: Point; to: Point }
/** An ellipse inscribed in the box between two corners. */
export interface EllipseAnnotation extends Base { kind: 'ellipse'; from: Point; to: Point }
export interface PinAnnotation extends Base { kind: 'pin'; at: Point }
export interface TextAnnotation extends Base { kind: 'text'; at: Point; size: number }
export type Annotation = PenAnnotation | LineAnnotation | EllipseAnnotation | PinAnnotation | TextAnnotation;

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

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// ── Geometry ───────────────────────────────────────────────────────────────

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

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
    case 'line': case 'arrow': case 'ellipse': return annotation.from;
    case 'pin': case 'text': return annotation.at;
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
      case 'line': case 'arrow': case 'ellipse': return [annotation.from, annotation.to];
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
    case 'line': case 'arrow': case 'ellipse': return { ...annotation, from: shift(annotation.from), to: shift(annotation.to) };
    case 'pin': case 'text': return { ...annotation, at: shift(annotation.at) };
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
      case 'line': case 'arrow': return distanceToSegment(p, annotation.from, annotation.to);
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
    };
    switch (a.kind) {
      case 'pen':
        if (Array.isArray(a.points) && a.points.length > 0 && a.points.every(isPoint)) result.push({ ...base, kind: 'pen', points: a.points as Point[] });
        break;
      case 'line': case 'arrow': case 'ellipse':
        if (isPoint(a.from) && isPoint(a.to)) result.push({ ...base, kind: a.kind, from: a.from, to: a.to });
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
