'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  BADGE_UNITS, LABEL_UNITS, RULER_DEFAULT_PARTS, TEXT_UNITS, ageMarks, anchorOf, arrowHead, boundingBox, clampParts, contrastText, distance, eraseAlong, eraseAt,
  handleAt, handlesOf, hitTest, moveAnnotation, numbering, pathData, reshapeAnnotation, rulerGeometry, simplifyPath, snapPoint, snapTargets,
  unitOf, type Annotation, type Point,
} from '@/lib/palm/annotations';
import { MAX_ZOOM, fitTransform, focusTransform, fromLinkedView, toImage, toLinkedView, zoomAt, type LinkedView, type Transform } from '@/lib/palm/viewport';
import { useT } from '@/lib/i18n';
import { newId } from '@/lib/ids';

export type PalmTool = 'view' | 'select' | 'pen' | 'line' | 'arrow' | 'circle' | 'ellipse' | 'ruler' | 'pin' | 'text' | 'eraser';

type Props = {
  imageUrl: string;
  width: number;
  height: number;
  annotations: Annotation[];
  tool: PalmTool;
  color: string;
  /** Stroke width of new shapes, in units of a thousandth of the photo's longer side. */
  strokeUnits: number;
  /** Radius of the eraser, in the same units. */
  eraserUnits?: number;
  /** Parts a new ruler is divided into. */
  rulerParts?: number;
  /** New drawings catch on the marks of a ruler, the middle of a line, the centre of a circle … */
  snap?: boolean;
  /** Pixels of the photograph to a centimetre; rulers then give their lengths in centimetres. */
  scale?: number;
  /**
   * Two photographs side by side can share one view: this is the view the other one made, which is applied here,
   * and `onViewChange` is told of every move or zoom made here.
   */
  linkedView?: LinkedView | null;
  onViewChange?: (view: LinkedView) => void;
  selectedId: string | null;
  /** Zooms to this annotation whenever `focusNonce` changes. */
  focusId?: string | null;
  focusNonce?: number;
  /** A client view: the photo can be moved and zoomed, nothing can be changed. */
  readOnly?: boolean;
  onSelect: (id: string | null) => void;
  /** A new annotation was drawn. */
  onCreate?: (annotation: Annotation) => void;
  /** An annotation was moved: the whole new list. */
  onCommit?: (next: Annotation[]) => void;
};

type Draft =
  | { kind: 'pen'; points: Point[] }
  | { kind: 'line' | 'arrow' | 'ellipse' | 'circle' | 'ruler'; from: Point; to: Point };

const HIT_SCREEN_PX = 10;
const HANDLE_HIT_SCREEN_PX = 12;
const SNAP_SCREEN_PX = 9;

function Shape({ annotation, unit, number, selected, scale }: { annotation: Annotation; unit: number; number?: number; selected: boolean; scale?: number }) {
  const { color, width } = annotation;
  const anchor = anchorOf(annotation);
  const stroke = { stroke: color, strokeWidth: width, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const radius = BADGE_UNITS * unit;
  const haloColor = contrastText(color) === '#ffffff' ? '#111827' : '#ffffff';

  let body: React.ReactNode = null;
  switch (annotation.kind) {
    case 'pen':
      body = <path d={pathData(annotation.points)} {...stroke} />;
      break;
    case 'line':
      body = <line x1={annotation.from.x} y1={annotation.from.y} x2={annotation.to.x} y2={annotation.to.y} {...stroke} />;
      break;
    case 'arrow': {
      const [a, b] = arrowHead(annotation.from, annotation.to, width * 5);
      body = (
        <>
          <line x1={annotation.from.x} y1={annotation.from.y} x2={annotation.to.x} y2={annotation.to.y} {...stroke} />
          <polygon points={`${annotation.to.x},${annotation.to.y} ${a.x},${a.y} ${b.x},${b.y}`} fill={color} stroke={color} strokeWidth={width / 2} strokeLinejoin="round" />
        </>
      );
      break;
    }
    case 'ellipse':
      body = (
        <ellipse
          cx={(annotation.from.x + annotation.to.x) / 2} cy={(annotation.from.y + annotation.to.y) / 2}
          rx={Math.max(Math.abs(annotation.to.x - annotation.from.x) / 2, 0.5)} ry={Math.max(Math.abs(annotation.to.y - annotation.from.y) / 2, 0.5)}
          {...stroke}
        />
      );
      break;
    case 'circle':
      body = <circle cx={annotation.at.x} cy={annotation.at.y} r={Math.max(annotation.radius, 0.5)} {...stroke} />;
      break;
    case 'ruler': {
      const geometry = rulerGeometry(annotation, unit, scale);
      const { label } = geometry;
      body = (
        <>
          <path d={`M${annotation.from.x} ${annotation.from.y}L${annotation.to.x} ${annotation.to.y}${geometry.ticks.map(([a, b]) => `M${a.x} ${a.y}L${b.x} ${b.y}`).join('')}`} {...stroke} />
          {geometry.middle && <circle cx={geometry.middle.x} cy={geometry.middle.y} r={Math.max(width * 1.3, 3 * unit)} fill={color} />}
          <text
            x={label.at.x} y={label.at.y} fontSize={label.size} fontWeight="bold" textAnchor={label.anchor} dominantBaseline="central" fill={color}
            stroke={haloColor} strokeWidth={Math.max(2, 4 * unit)} paintOrder="stroke" strokeLinejoin="round" style={{ userSelect: 'none' }} data-ruler-label
          >
            {label.text}
          </text>
        </>
      );
      break;
    }
    case 'text':
      body = annotation.label ? (
        <text x={annotation.at.x} y={annotation.at.y} fontSize={annotation.size} fontWeight="bold" fill={color} stroke={haloColor} strokeWidth={Math.max(2, 4 * unit)} paintOrder="stroke" strokeLinejoin="round" style={{ userSelect: 'none' }}>
          {annotation.label}
        </text>
      ) : null;
      break;
    case 'pin':
      break;
  }

  return (
    <g data-annotation={annotation.id} data-kind={annotation.kind} opacity={selected ? 1 : 0.95}>
      {body}
      {ageMarks(annotation, unit).map(mark => (
        <g key={mark.age} data-age={mark.age}>
          <line x1={mark.tick[0].x} y1={mark.tick[0].y} x2={mark.tick[1].x} y2={mark.tick[1].y} stroke={color} strokeWidth={Math.max(width * 0.6, unit)} strokeLinecap="round" />
          <text
            x={mark.label.at.x} y={mark.label.at.y} fontSize={mark.label.size} fontWeight="bold" textAnchor={mark.label.anchor} dominantBaseline="central" fill={color}
            stroke={haloColor} strokeWidth={Math.max(2, 4 * unit)} paintOrder="stroke" strokeLinejoin="round" style={{ userSelect: 'none' }}
          >
            {mark.label.text}
          </text>
        </g>
      ))}
      {number !== undefined && (
        <g style={{ userSelect: 'none' }}>
          <circle cx={anchor.x} cy={anchor.y} r={radius} fill={color} stroke={haloColor} strokeWidth={2 * unit} />
          <text x={anchor.x} y={anchor.y} fontSize={radius * 1.2} fontWeight="bold" textAnchor="middle" dominantBaseline="central" fill={contrastText(color)}>{number}</text>
        </g>
      )}
      {annotation.kind !== 'text' && annotation.label && (
        <text
          x={anchor.x + (number !== undefined ? (BADGE_UNITS + 6) * unit : 8 * unit)} y={anchor.y + LABEL_UNITS * unit * 0.35}
          fontSize={LABEL_UNITS * unit} fontWeight="bold" fill={color} stroke={haloColor} strokeWidth={Math.max(2, 4 * unit)} paintOrder="stroke" strokeLinejoin="round" style={{ userSelect: 'none' }}
        >
          {annotation.label}
        </text>
      )}
    </g>
  );
}

function ZoomButton({ glyph, label, onClick }: { glyph: string; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="h-9 w-9 rounded-md bg-black/55 text-base font-mono text-white backdrop-blur hover:bg-black/70">
      {glyph}
    </button>
  );
}

/**
 * The photograph with its drawing: an SVG laid over the picture in photo pixels,
 * zoomed and moved with the wheel, a pinch or the buttons. The tools draw on it
 * with a mouse, a finger or a pen.
 */
export default function PalmCanvas({
  imageUrl, width, height, annotations, tool, color, strokeUnits, eraserUnits = 14, rulerParts = RULER_DEFAULT_PARTS, snap = true, scale,
  linkedView, onViewChange, selectedId, focusId, focusNonce = 0, readOnly = false, onSelect, onCreate, onCommit,
}: Props) {
  const t = useT();
  const unit = unitOf(width, height);
  const id = useId();
  const clipId = `palm-clip-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<Transform>({ k: 1, tx: 0, ty: 0 });
  const fit = useMemo(() => (size.w > 0 ? fitTransform(size.w, size.h, width, height) : null), [size, width, height]);
  const moved = useRef(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  // A drawing whose handle is being dragged, the drawing as the eraser leaves it, the place of the eraser and the mark a point snapped to.
  const [reshape, setReshape] = useState<Annotation | null>(null);
  const [wipe, setWipe] = useState<Annotation[] | null>(null);
  const [eraserAt, setEraserAt] = useState<Point | null>(null);
  const [snapMark, setSnapMark] = useState<Point | null>(null);
  // The view that was last taken from the other photograph, and the one it made here: only a view of our own is passed on.
  const [lastLinked, setLastLinked] = useState<LinkedView | null | undefined>(linkedView);
  const [applied, setApplied] = useState<Transform | null>(null);

  // Latest values for the event handlers that are added by hand.
  const live = useRef({ view, fit });
  useEffect(() => { live.current = { view, fit }; });

  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<
    | { mode: 'pan'; last: Point }
    | { mode: 'pinch'; distance: number; centre: Point; start: Transform }
    | { mode: 'draw' }
    | { mode: 'move'; id: string; origin: Point; original: Annotation }
    | { mode: 'reshape'; id: string; handle: string; original: Annotation; targets: Point[] }
    | { mode: 'erase'; last: Point }
    | { mode: 'tap'; origin: Point }
    | null
  >(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setSize({ w: element.clientWidth, h: element.clientHeight }));
    observer.observe(element);
    setSize({ w: element.clientWidth, h: element.clientHeight });
    return () => observer.disconnect();
  }, []);

  // The photo fits the window until the viewer has moved it.
  useEffect(() => {
    moved.current = false;
  }, [imageUrl]);
  useEffect(() => {
    if (fit && !moved.current) setView(fit);
  }, [fit, imageUrl]);

  // The wheel zooms around the pointer; React's handler would be passive, so it is added by hand.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      const { view: current, fit: base } = live.current;
      if (!base) return;
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      moved.current = true;
      setView(zoomAt(current, event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * 0.0015), base.k));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  // Zoom to an annotation, or back to the whole photo, whenever a new request comes.
  const [lastFocus, setLastFocus] = useState(focusNonce);
  if (focusNonce !== lastFocus) {
    setLastFocus(focusNonce);
    const target = focusId ? annotations.find(annotation => annotation.id === focusId) : null;
    if (fit) setView(target ? focusTransform(boundingBox(target, unit), size.w, size.h, fit.k * 4) : fit);
  }
  useEffect(() => {
    if (focusNonce > 0) moved.current = Boolean(focusId);
    // Only a new request counts, not every change of the drawing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNonce]);

  if (linkedView !== lastLinked) {
    setLastLinked(linkedView);
    if (linkedView && linkedView.source !== id && fit) {
      const next = fromLinkedView(linkedView, fit, size.w, size.h, width, height);
      setApplied(next);
      setView(next);
    }
  }
  useEffect(() => {
    if (applied) moved.current = true;
  }, [applied]);

  // Whatever the viewer does to the view is passed on, except what was just taken from the other photograph.
  useEffect(() => {
    if (!onViewChange || !fit || !moved.current || view === applied) return;
    onViewChange(toLinkedView(view, fit, size.w, size.h, width, height, id));
    // Only a change of the view counts, not every change of the props around it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const zoomBy = useCallback((factor: number) => {
    if (!fit) return;
    moved.current = true;
    setView(current => zoomAt(current, size.w / 2, size.h / 2, factor, fit.k));
  }, [fit, size]);

  const fitToWindow = () => {
    if (!fit) return;
    moved.current = false;
    setView(fit);
    onViewChange?.({ source: id, zoom: 1, cx: 0.5, cy: 0.5 });
  };

  /** A point of the photo, kept inside it: nothing is drawn beyond the edge. */
  const inside = (point: Point): Point => ({ x: Math.min(width, Math.max(0, point.x)), y: Math.min(height, Math.max(0, point.y)) });

  const pointOf = (event: ReactPointerEvent): Point => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const targets = useMemo(() => (snap ? snapTargets(annotations) : []), [annotations, snap]);
  /** A point of the photo, caught on the nearest mark when there is one within reach. */
  const caught = (raw: Point, list: Point[] = targets): { at: Point; snapped: boolean } => {
    const target = snap ? snapPoint(list, raw, SNAP_SCREEN_PX / view.k) : null;
    return target ? { at: target, snapped: true } : { at: raw, snapped: false };
  };
  const eraserRadius = eraserUnits * unit;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!fit) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const screen = pointOf(event);
    pointers.current.set(event.pointerId, screen);

    if (pointers.current.size === 2) {
      // A second finger turns whatever was going on into a pinch.
      const [a, b] = [...pointers.current.values()];
      setDraft(null);
      setDrag(null);
      gesture.current = { mode: 'pinch', distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, centre: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, start: view };
      return;
    }

    const raw = toImage(view, screen.x, screen.y);
    const start = caught(raw);
    const at = inside(start.at);
    const hit = hitTest(annotations, raw, unit, HIT_SCREEN_PX / view.k);
    if (readOnly || tool === 'view') {
      gesture.current = { mode: 'pan', last: screen };
      if (readOnly) onSelect(hit?.id ?? null);
      return;
    }
    if (tool === 'select') {
      // The handles of the selected drawing come first: they change it, where a drag on the drawing moves it.
      const chosen = selectedId ? annotations.find(annotation => annotation.id === selectedId) : undefined;
      const handle = chosen ? handleAt(handlesOf(chosen), raw, HANDLE_HIT_SCREEN_PX / view.k) : null;
      if (chosen && handle) {
        gesture.current = { mode: 'reshape', id: chosen.id, handle: handle.id, original: chosen, targets: snap ? snapTargets(annotations, chosen.id) : [] };
        return;
      }
      onSelect(hit?.id ?? null);
      gesture.current = hit ? { mode: 'move', id: hit.id, origin: raw, original: hit } : { mode: 'pan', last: screen };
      return;
    }
    if (tool === 'eraser') {
      setEraserAt(raw);
      setWipe(eraseAt(annotations, raw, eraserRadius, unit));
      gesture.current = { mode: 'erase', last: raw };
    } else if (tool === 'pen') {
      setDraft({ kind: 'pen', points: [inside(raw)] });
      gesture.current = { mode: 'draw' };
    } else if (tool === 'line' || tool === 'arrow' || tool === 'ellipse' || tool === 'circle' || tool === 'ruler') {
      setDraft({ kind: tool, from: at, to: at });
      setSnapMark(start.snapped ? at : null);
      gesture.current = { mode: 'draw' };
    } else {
      gesture.current = { mode: 'tap', origin: screen };
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    // The eraser shows where it is before it is pressed, with a mouse.
    if (tool === 'eraser' && !readOnly && event.pointerType !== 'touch' && fit) {
      const place = pointOf(event);
      setEraserAt(toImage(view, place.x, place.y));
    }
    if (!pointers.current.has(event.pointerId)) return;
    const screen = pointOf(event);
    pointers.current.set(event.pointerId, screen);
    const current = gesture.current;
    if (!current || !fit) return;

    if (current.mode === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const centre = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const zoomed = zoomAt(current.start, current.centre.x, current.centre.y, distance / current.distance, fit.k);
      moved.current = true;
      setView({ ...zoomed, tx: zoomed.tx + centre.x - current.centre.x, ty: zoomed.ty + centre.y - current.centre.y });
    } else if (current.mode === 'pan') {
      moved.current = true;
      setView(v => ({ ...v, tx: v.tx + screen.x - current.last.x, ty: v.ty + screen.y - current.last.y }));
      current.last = screen;
    } else if (current.mode === 'draw') {
      const raw = toImage(view, screen.x, screen.y);
      const end = caught(raw);
      const at = inside(end.at);
      setDraft(d => {
        if (!d) return d;
        if (d.kind === 'pen') {
          const plain = inside(raw);
          const last = d.points[d.points.length - 1];
          return Math.hypot(plain.x - last.x, plain.y - last.y) * view.k < 1.5 ? d : { kind: 'pen', points: [...d.points, plain] };
        }
        return { ...d, to: at };
      });
      setSnapMark(draft && draft.kind !== 'pen' && end.snapped ? at : null);
    } else if (current.mode === 'reshape') {
      const end = caught(toImage(view, screen.x, screen.y), current.targets);
      const at = inside(end.at);
      setReshape(reshapeAnnotation(current.original, current.handle, at));
      setSnapMark(end.snapped ? at : null);
    } else if (current.mode === 'erase') {
      const at = toImage(view, screen.x, screen.y);
      const from = current.last;
      current.last = at;
      setEraserAt(at);
      setWipe(list => eraseAlong(list ?? annotations, from, at, eraserRadius, unit));
    } else if (current.mode === 'move') {
      const at = toImage(view, screen.x, screen.y);
      setDrag({ id: current.id, dx: at.x - current.origin.x, dy: at.y - current.origin.y });
    }
  };

  const finish = (event: ReactPointerEvent<HTMLDivElement>) => {
    const screen = pointers.current.get(event.pointerId) ?? pointOf(event);
    pointers.current.delete(event.pointerId);
    const current = gesture.current;
    if (pointers.current.size === 0) gesture.current = null;
    else if (current?.mode === 'pinch') gesture.current = { mode: 'pan', last: [...pointers.current.values()][0] };
    if (!current) return;

    if (current.mode === 'draw' && draft && onCreate) {
      const base = { id: newId(), color, width: strokeUnits * unit };
      if (draft.kind === 'pen') {
        const points = simplifyPath(draft.points, 0.8 * unit);
        if (points.length > 1 || draft.points.length > 1) onCreate({ ...base, kind: 'pen', points: points.length > 1 ? points : draft.points });
      } else if (distance(draft.from, draft.to) * view.k > 4) {
        if (draft.kind === 'circle') onCreate({ ...base, kind: 'circle', at: draft.from, radius: distance(draft.from, draft.to) });
        else if (draft.kind === 'ruler') onCreate({ ...base, kind: 'ruler', from: draft.from, to: draft.to, parts: clampParts(rulerParts) });
        else onCreate({ ...base, kind: draft.kind, from: draft.from, to: draft.to });
      }
      setDraft(null);
      setSnapMark(null);
    } else if (current.mode === 'reshape') {
      if (reshape && onCommit) onCommit(annotations.map(annotation => (annotation.id === current.id ? reshape : annotation)));
      setReshape(null);
      setSnapMark(null);
    } else if (current.mode === 'erase') {
      if (wipe && wipe !== annotations && onCommit) onCommit(wipe);
      setWipe(null);
      if (event.pointerType === 'touch') setEraserAt(null);
    } else if (current.mode === 'move') {
      if (drag && (Math.abs(drag.dx) > 0 || Math.abs(drag.dy) > 0) && onCommit) {
        onCommit(annotations.map(annotation => (annotation.id === drag.id ? moveAnnotation(annotation, drag.dx, drag.dy) : annotation)));
      }
      setDrag(null);
    } else if (current.mode === 'tap' && onCreate && Math.hypot(screen.x - current.origin.x, screen.y - current.origin.y) < 6) {
      const at = caught(toImage(view, current.origin.x, current.origin.y)).at;
      if (at.x < 0 || at.y < 0 || at.x > width || at.y > height) return;
      const base = { id: newId(), color, width: strokeUnits * unit };
      onCreate(tool === 'text' ? { ...base, kind: 'text', at, size: TEXT_UNITS * unit, label: t('Text') } : { ...base, kind: 'pin', at });
    }
  };

  const numbers = useMemo(() => numbering(annotations), [annotations]);
  const shown = (wipe ?? annotations).map(annotation => (
    reshape && reshape.id === annotation.id ? reshape : drag && drag.id === annotation.id ? moveAnnotation(annotation, drag.dx, drag.dy) : annotation
  ));
  const selected = shown.find(annotation => annotation.id === selectedId);
  const selection = selected ? boundingBox(selected, unit) : null;
  const cursor = readOnly || tool === 'view' ? 'grab' : tool === 'select' ? 'default' : 'crosshair';
  // The points of the selected drawing that can be dragged.
  const handles = tool === 'select' && !readOnly && selected ? handlesOf(selected) : [];

  const draftAnnotation: Annotation | null = draft
    ? (() => {
      const common = { id: 'draft', color, width: strokeUnits * unit };
      if (draft.kind === 'pen') return { ...common, kind: 'pen', points: draft.points } as Annotation;
      if (draft.kind === 'circle') return { ...common, kind: 'circle', at: draft.from, radius: distance(draft.from, draft.to) } as Annotation;
      if (draft.kind === 'ruler') return { ...common, kind: 'ruler', from: draft.from, to: draft.to, parts: clampParts(rulerParts) } as Annotation;
      return { ...common, kind: draft.kind, from: draft.from, to: draft.to } as Annotation;
    })()
    : null;

  return (
    <div
      ref={containerRef}
      data-palm="canvas"
      className="relative h-full w-full touch-none select-none overflow-hidden rounded-lg bg-zinc-900"
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onPointerLeave={event => { if (event.pointerType !== 'touch' && !pointers.current.size) setEraserAt(null); }}
    >
      <svg className="absolute inset-0 h-full w-full" role="img" aria-label={t('Palm photograph')} data-palm="svg">
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
          <defs>
            <clipPath id={clipId}><rect x={0} y={0} width={width} height={height} /></clipPath>
          </defs>
          <image href={imageUrl} x={0} y={0} width={width} height={height} />
          <g clipPath={`url(#${clipId})`}>
            {shown.map(annotation => (
              <Shape key={annotation.id} annotation={annotation} unit={unit} number={numbers.get(annotation.id)} selected={annotation.id === selectedId} scale={scale} />
            ))}
            {draftAnnotation && <Shape annotation={draftAnnotation} unit={unit} selected={false} scale={scale} />}
          </g>
          {selection && !readOnly && (
            <rect x={selection.x} y={selection.y} width={selection.width} height={selection.height} fill="none" stroke="#22d3ee" strokeWidth={2 / view.k} pointerEvents="none" />
          )}
          {handles.map(handle => (
            <circle
              key={handle.id} data-handle={handle.id} cx={handle.at.x} cy={handle.at.y} r={(handles.length > 12 ? 4.5 : 6.5) / view.k}
              fill="#ffffff" stroke="#0891b2" strokeWidth={2 / view.k} pointerEvents="none"
            />
          ))}
          {snapMark && (
            <circle data-snap-mark cx={snapMark.x} cy={snapMark.y} r={9 / view.k} fill="none" stroke="#22d3ee" strokeWidth={2.5 / view.k} pointerEvents="none" />
          )}
          {tool === 'eraser' && eraserAt && !readOnly && (
            <g pointerEvents="none" data-eraser-ring>
              <circle cx={eraserAt.x} cy={eraserAt.y} r={eraserRadius} fill="rgba(255,255,255,0.15)" stroke="#111827" strokeWidth={3 / view.k} />
              <circle cx={eraserAt.x} cy={eraserAt.y} r={eraserRadius} fill="none" stroke="#ffffff" strokeWidth={1.5 / view.k} />
            </g>
          )}
          {selection && readOnly && (
            <rect x={selection.x} y={selection.y} width={selection.width} height={selection.height} rx={8 / view.k} fill="none" stroke="#22d3ee" strokeWidth={3 / view.k} pointerEvents="none" />
          )}
        </g>
      </svg>

      <div className="absolute bottom-2 right-2 flex flex-col gap-1" onPointerDown={event => event.stopPropagation()}>
        <ZoomButton glyph="+" label={t('Zoom in')} onClick={() => zoomBy(1.4)} />
        <ZoomButton glyph="−" label={t('Zoom out')} onClick={() => zoomBy(1 / 1.4)} />
        <ZoomButton glyph="⤢" label={t('Fit to window')} onClick={fitToWindow} />
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-mono text-white/80" data-palm="zoom">
        {fit ? `${Math.round((view.k / fit.k) * 100)}%` : ''}{fit && view.k / fit.k >= MAX_ZOOM ? ' max' : ''}
      </div>
    </div>
  );
}
