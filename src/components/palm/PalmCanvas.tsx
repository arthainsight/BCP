'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  BADGE_UNITS, LABEL_UNITS, TEXT_UNITS, anchorOf, arrowHead, boundingBox, contrastText, hitTest, moveAnnotation, newId, numbering,
  pathData, simplifyPath, unitOf, type Annotation, type Point,
} from '@/lib/palm/annotations';
import { MAX_ZOOM, fitTransform, focusTransform, toImage, zoomAt, type Transform } from '@/lib/palm/viewport';
import { useT } from '@/lib/i18n';

export type PalmTool = 'view' | 'select' | 'pen' | 'line' | 'arrow' | 'ellipse' | 'pin' | 'text';

type Props = {
  imageUrl: string;
  width: number;
  height: number;
  annotations: Annotation[];
  tool: PalmTool;
  color: string;
  /** Stroke width of new shapes, in units of a thousandth of the photo's longer side. */
  strokeUnits: number;
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
  | { kind: 'line' | 'arrow' | 'ellipse'; from: Point; to: Point };

const HIT_SCREEN_PX = 10;

function Shape({ annotation, unit, number, selected }: { annotation: Annotation; unit: number; number?: number; selected: boolean }) {
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
  imageUrl, width, height, annotations, tool, color, strokeUnits, selectedId, focusId, focusNonce = 0,
  readOnly = false, onSelect, onCreate, onCommit,
}: Props) {
  const t = useT();
  const unit = unitOf(width, height);
  const clipId = `palm-clip-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<Transform>({ k: 1, tx: 0, ty: 0 });
  const fit = useMemo(() => (size.w > 0 ? fitTransform(size.w, size.h, width, height) : null), [size, width, height]);
  const moved = useRef(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);

  // Latest values for the event handlers that are added by hand.
  const live = useRef({ view, fit });
  useEffect(() => { live.current = { view, fit }; });

  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<
    | { mode: 'pan'; last: Point }
    | { mode: 'pinch'; distance: number; centre: Point; start: Transform }
    | { mode: 'draw' }
    | { mode: 'move'; id: string; origin: Point; original: Annotation }
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

  const zoomBy = useCallback((factor: number) => {
    if (!fit) return;
    moved.current = true;
    setView(current => zoomAt(current, size.w / 2, size.h / 2, factor, fit.k));
  }, [fit, size]);

  const fitToWindow = () => {
    if (!fit) return;
    moved.current = false;
    setView(fit);
  };

  /** A point of the photo, kept inside it: nothing is drawn beyond the edge. */
  const inside = (point: Point): Point => ({ x: Math.min(width, Math.max(0, point.x)), y: Math.min(height, Math.max(0, point.y)) });

  const pointOf = (event: ReactPointerEvent): Point => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

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
    const at = inside(raw);
    const hit = hitTest(annotations, raw, unit, HIT_SCREEN_PX / view.k);
    if (readOnly || tool === 'view') {
      gesture.current = { mode: 'pan', last: screen };
      if (readOnly) onSelect(hit?.id ?? null);
      return;
    }
    if (tool === 'select') {
      onSelect(hit?.id ?? null);
      gesture.current = hit ? { mode: 'move', id: hit.id, origin: raw, original: hit } : { mode: 'pan', last: screen };
      return;
    }
    if (tool === 'pen') {
      setDraft({ kind: 'pen', points: [at] });
      gesture.current = { mode: 'draw' };
    } else if (tool === 'line' || tool === 'arrow' || tool === 'ellipse') {
      setDraft({ kind: tool, from: at, to: at });
      gesture.current = { mode: 'draw' };
    } else {
      gesture.current = { mode: 'tap', origin: screen };
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
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
      const at = inside(toImage(view, screen.x, screen.y));
      setDraft(d => {
        if (!d) return d;
        if (d.kind === 'pen') {
          const last = d.points[d.points.length - 1];
          return Math.hypot(at.x - last.x, at.y - last.y) * view.k < 1.5 ? d : { kind: 'pen', points: [...d.points, at] };
        }
        return { ...d, to: at };
      });
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
      } else if (Math.hypot(draft.to.x - draft.from.x, draft.to.y - draft.from.y) * view.k > 4) {
        onCreate({ ...base, kind: draft.kind, from: draft.from, to: draft.to });
      }
      setDraft(null);
    } else if (current.mode === 'move') {
      if (drag && (Math.abs(drag.dx) > 0 || Math.abs(drag.dy) > 0) && onCommit) {
        onCommit(annotations.map(annotation => (annotation.id === drag.id ? moveAnnotation(annotation, drag.dx, drag.dy) : annotation)));
      }
      setDrag(null);
    } else if (current.mode === 'tap' && onCreate && Math.hypot(screen.x - current.origin.x, screen.y - current.origin.y) < 6) {
      const at = toImage(view, current.origin.x, current.origin.y);
      if (at.x < 0 || at.y < 0 || at.x > width || at.y > height) return;
      const base = { id: newId(), color, width: strokeUnits * unit };
      onCreate(tool === 'text' ? { ...base, kind: 'text', at, size: TEXT_UNITS * unit, label: t('Text') } : { ...base, kind: 'pin', at });
    }
  };

  const numbers = useMemo(() => numbering(annotations), [annotations]);
  const shown = annotations.map(annotation => (drag && drag.id === annotation.id ? moveAnnotation(annotation, drag.dx, drag.dy) : annotation));
  const selected = shown.find(annotation => annotation.id === selectedId);
  const selection = selected ? boundingBox(selected, unit) : null;
  const cursor = readOnly || tool === 'view' ? 'grab' : tool === 'select' ? 'default' : 'crosshair';

  const draftAnnotation: Annotation | null = draft
    ? draft.kind === 'pen'
      ? { id: 'draft', kind: 'pen', color, width: strokeUnits * unit, points: draft.points }
      : { id: 'draft', kind: draft.kind, color, width: strokeUnits * unit, from: draft.from, to: draft.to }
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
    >
      <svg className="absolute inset-0 h-full w-full" role="img" aria-label={t('Palm photograph')} data-palm="svg">
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
          <defs>
            <clipPath id={clipId}><rect x={0} y={0} width={width} height={height} /></clipPath>
          </defs>
          <image href={imageUrl} x={0} y={0} width={width} height={height} />
          <g clipPath={`url(#${clipId})`}>
            {shown.map(annotation => (
              <Shape key={annotation.id} annotation={annotation} unit={unit} number={numbers.get(annotation.id)} selected={annotation.id === selectedId} />
            ))}
            {draftAnnotation && <Shape annotation={draftAnnotation} unit={unit} selected={false} />}
          </g>
          {selection && !readOnly && (
            <rect x={selection.x} y={selection.y} width={selection.width} height={selection.height} fill="none" stroke="#22d3ee" strokeWidth={2 / view.k} pointerEvents="none" />
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
