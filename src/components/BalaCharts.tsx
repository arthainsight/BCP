'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { niceTicks, scaleLinear, stackSegments } from '@/lib/barScale';

// The diagrams of the Bala views: horizontal bars, stacked horizontal bars and stacked columns, drawn as SVG at the width they are given
// (so the text keeps its size on a phone). Marks are at most 24px thick, with a 4px rounded data end and a square baseline, a 2px gap of the
// surface colour between touching segments, hairline grid; the values are at the bar tips or in the tooltip that every mark has (on
// hover and on focus), and every chart has its table beside it in the view. The colours are the CSS variables of globals.css.

export const SERIES_COLORS = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)', 'var(--viz-4)', 'var(--viz-5)', 'var(--viz-6)'] as const;
export const STATUS_COLORS = { good: 'var(--viz-good)', warning: 'var(--viz-warning)', critical: 'var(--viz-critical)' } as const;

export interface TipLine { color?: string; label: string; value: string }
interface Tip { x: number; y: number; title: string; lines: TipLine[] }

const FONT = 'var(--font-geist-mono), monospace';
const BAR_THICKNESS = 14;
const GAP = 2;

/** The width of an element, kept up to date. */
function useWidth(initial = 640): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(entries => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 0);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** A rectangle with the corners of one side rounded (4px), the other side square. */
function barPath(x: number, y: number, width: number, height: number, round: 'start' | 'end' | 'none', horizontal: boolean): string {
  const w = Math.max(width, 0);
  const h = Math.max(height, 0);
  const r = round === 'none' ? 0 : Math.min(4, w / 2, h / 2);
  if (horizontal) {
    // Bars along x: 'end' is the right end, 'start' the left.
    if (round === 'end') return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
    if (round === 'start') return `M${x + r},${y}H${x + w}V${y + h}H${x + r}Q${x},${y + h} ${x},${y + h - r}V${y + r}Q${x},${y} ${x + r},${y}Z`;
  } else {
    // Columns along y: 'end' is the top, 'start' the bottom.
    if (round === 'end') return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
    if (round === 'start') return `M${x},${y}H${x + w}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x + r}Q${x},${y + h} ${x},${y + h - r}Z`;
  }
  return `M${x},${y}H${x + w}V${y + h}H${x}Z`;
}

// ── The frame: title, legend, the tooltip ────────────────────────────────────────────────────────────────────────────────────────

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]" style={{ color: 'var(--viz-ink-2)' }}>
      {items.map(item => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function Frame({ title, note, legend, children }: { title: string; note?: string; legend?: { label: string; color: string }[]; children: ReactNode }) {
  return (
    <figure className="viz min-w-0 space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700" style={{ background: 'var(--viz-surface)', fontFamily: FONT }}>
      <figcaption className="space-y-1">
        <div className="text-xs font-semibold" style={{ color: 'var(--viz-ink)' }}>{title}</div>
        {note && <div className="text-[10px] leading-relaxed" style={{ color: 'var(--viz-ink-3)' }}>{note}</div>}
        {legend && legend.length > 1 && <Legend items={legend} />}
      </figcaption>
      {children}
    </figure>
  );
}

function TipBox({ tip, width }: { tip: Tip | null; width: number }) {
  if (!tip) return null;
  const flip = tip.x > width / 2;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 min-w-[120px] max-w-[240px] rounded-md border border-zinc-200 px-2.5 py-1.5 text-[10px] shadow-md dark:border-zinc-700"
      style={{ background: 'var(--viz-surface)', left: flip ? undefined : tip.x + 12, right: flip ? width - tip.x + 12 : undefined, top: Math.max(tip.y - 12, 0), color: 'var(--viz-ink-2)' }}
    >
      <div className="mb-1 font-semibold" style={{ color: 'var(--viz-ink)' }}>{tip.title}</div>
      {tip.lines.map((line, index) => (
        <div key={index} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            {line.color && <span aria-hidden="true" className="inline-block h-[2px] w-3" style={{ background: line.color }} />}
            {line.label}
          </span>
          <span className="font-semibold tabular-nums" style={{ color: 'var(--viz-ink)' }}>{line.value}</span>
        </div>
      ))}
    </div>
  );
}

const tipText = (title: string, lines: TipLine[]) => `${title}: ${lines.map(line => `${line.label} ${line.value}`).join(', ')}`;

// ── Horizontal bars: one value per row ─────────────────────────────────────────────────────────────────────────────────────────────

export interface BarRow {
  key: string;
  label: string;
  value: number;
  /** The text at the bar tip. */
  display: string;
  color?: string;
  title: string;
  lines: TipLine[];
}

export function HorizontalBars({ title, note, legend, ariaLabel, rows, max, referenceAt, referenceLabel, formatTick = (value: number) => String(value) }: {
  title: string;
  note?: string;
  /** What the colours of the bars mean, when the rows are not all one colour. */
  legend?: { label: string; color: string }[];
  ariaLabel: string;
  rows: BarRow[];
  /** The top of the axis at least. */
  max: number;
  referenceAt?: number;
  referenceLabel?: string;
  formatTick?: (value: number) => string;
}) {
  const [ref, width] = useWidth();
  const [tip, setTip] = useState<Tip | null>(null);
  const labelWidth = 74;
  const rightPad = 112;
  const top = referenceAt !== undefined ? 18 : 6;
  const rowHeight = 30;
  const axisHeight = 22;
  const height = top + rows.length * rowHeight + axisHeight;
  const x0 = labelWidth;
  const x1 = Math.max(width - rightPad, x0 + 60);
  const axis = niceTicks(0, Math.max(max, ...rows.map(row => row.value)), width < 420 ? 4 : 6);
  const x = (value: number) => scaleLinear(value, axis.min, axis.max, x0, x1);
  const show = (event: { clientX: number; clientY: number }, row: BarRow) => {
    const box = ref.current?.getBoundingClientRect();
    setTip({ x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0), title: row.title, lines: row.lines });
  };
  const showAtRow = (index: number, row: BarRow) => setTip({ x: x(row.value), y: top + index * rowHeight + rowHeight / 2, title: row.title, lines: row.lines });

  return (
    <Frame title={title} note={note} legend={legend}>
      <div ref={ref} className="relative min-w-0">
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block" style={{ fontFamily: FONT }}>
          {axis.ticks.map(tick => (
            <g key={tick}>
              <line x1={x(tick)} x2={x(tick)} y1={top} y2={top + rows.length * rowHeight} stroke={tick === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth={1} />
              <text x={x(tick)} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--viz-ink-3)">{formatTick(tick)}</text>
            </g>
          ))}
          {referenceAt !== undefined && (
            <g>
              <line x1={x(referenceAt)} x2={x(referenceAt)} y1={top - 4} y2={top + rows.length * rowHeight} stroke="var(--viz-ink)" strokeWidth={1.5} />
              {referenceLabel && <text x={x(referenceAt)} y={top - 7} textAnchor="middle" fontSize={10} fill="var(--viz-ink-2)">{referenceLabel}</text>}
            </g>
          )}
          {rows.map((row, index) => {
            const y = top + index * rowHeight;
            const barY = y + (rowHeight - BAR_THICKNESS) / 2;
            const end = x(Math.max(row.value, 0));
            return (
              <g key={row.key}>
                <text x={0} y={y + rowHeight / 2 + 4} fontSize={11} fill="var(--viz-ink)">{row.label}</text>
                <path d={barPath(x0, barY, end - x0, BAR_THICKNESS, 'end', true)} fill={row.color ?? SERIES_COLORS[0]} />
                <text x={end + 6} y={y + rowHeight / 2 + 4} fontSize={11} fontWeight={600} fill="var(--viz-ink)" stroke="var(--viz-surface)" strokeWidth={3} paintOrder="stroke">{row.display}</text>
                <rect
                  x={0} y={y} width={width} height={rowHeight} fill="transparent" tabIndex={0} role="img" aria-label={tipText(row.title, row.lines)}
                  onPointerMove={event => show(event, row)} onPointerLeave={() => setTip(null)} onFocus={() => showAtRow(index, row)} onBlur={() => setTip(null)}
                  style={{ outline: 'none' }}
                />
              </g>
            );
          })}
        </svg>
        <TipBox tip={tip} width={width} />
      </div>
    </Frame>
  );
}

// ── Stacked horizontal bars ────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface StackSeries { key: string; label: string; color: string }
export interface StackRow {
  key: string;
  label: string;
  values: Record<string, number>;
  /** The text at the bar's positive end. */
  display: string;
  title: string;
  /** Extra lines at the end of the tooltip (the total, the required value). */
  extra?: TipLine[];
  /** A mark on the bar at a value (the required strength). */
  markerAt?: number;
}

const signed = (value: number, digits = 0) => `${value > 0 ? '+' : ''}${value.toFixed(digits).replace(/\.0+$/, '')}`;

export function StackedBars({ title, note, ariaLabel, rows, series, markerLabel, unit = '' }: {
  title: string;
  note?: string;
  ariaLabel: string;
  rows: StackRow[];
  series: StackSeries[];
  markerLabel?: string;
  unit?: string;
}) {
  const [ref, width] = useWidth();
  const [tip, setTip] = useState<Tip | null>(null);
  const labelWidth = 74;
  const rightPad = 44;
  const top = 6;
  const rowHeight = 30;
  const axisHeight = 22;
  const height = top + rows.length * rowHeight + axisHeight;
  const x0 = labelWidth;
  const x1 = Math.max(width - rightPad, x0 + 80);
  const stacks = rows.map(row => stackSegments(series.map(item => ({ key: item.key, value: row.values[item.key] ?? 0 }))));
  const lowest = Math.min(0, ...stacks.map(stack => stack.low));
  const highest = Math.max(1, ...stacks.map(stack => stack.high), ...rows.map(row => row.markerAt ?? 0));
  const axis = niceTicks(lowest, highest, width < 420 ? 4 : 6);
  const x = (value: number) => scaleLinear(value, axis.min, axis.max, x0, x1);
  const linesOf = (row: StackRow): TipLine[] => [
    ...series.map(item => ({ color: item.color, label: item.label, value: `${signed(row.values[item.key] ?? 0, 1)}${unit}` })),
    ...(row.extra ?? []),
  ];
  const show = (event: { clientX: number; clientY: number }, row: StackRow) => {
    const box = ref.current?.getBoundingClientRect();
    setTip({ x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0), title: row.title, lines: linesOf(row) });
  };

  return (
    <Frame title={title} note={note} legend={series.map(item => ({ label: item.label, color: item.color }))}>
      <div ref={ref} className="relative min-w-0">
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block" style={{ fontFamily: FONT }}>
          {axis.ticks.map(tick => (
            <g key={tick}>
              <line x1={x(tick)} x2={x(tick)} y1={top} y2={top + rows.length * rowHeight} stroke={tick === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth={1} />
              <text x={x(tick)} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--viz-ink-3)">{tick}</text>
            </g>
          ))}
          {rows.map((row, index) => {
            const y = top + index * rowHeight;
            const barY = y + (rowHeight - BAR_THICKNESS) / 2;
            const stack = stacks[index];
            const lastPositive = [...stack.segments].reverse().find(segment => segment.value > 0)?.key;
            const lastNegative = [...stack.segments].reverse().find(segment => segment.value < 0)?.key;
            return (
              <g key={row.key}>
                <text x={0} y={y + rowHeight / 2 + 4} fontSize={11} fill="var(--viz-ink)">{row.label}</text>
                {stack.segments.map(segment => {
                  if (segment.value === 0) return null;
                  const item = series.find(candidate => candidate.key === segment.key)!;
                  const a = x(Math.min(segment.start, segment.end));
                  const b = x(Math.max(segment.start, segment.end));
                  // 2px of the surface colour between touching segments: 1px is taken from each side that touches another.
                  const touchesStart = segment.start !== 0;
                  const touchesEnd = !(segment.key === lastPositive || segment.key === lastNegative);
                  const left = segment.value > 0 ? a + (touchesStart ? GAP / 2 : 0) : a + (touchesEnd ? GAP / 2 : 0);
                  const right = segment.value > 0 ? b - (touchesEnd ? GAP / 2 : 0) : b - (touchesStart ? GAP / 2 : 0);
                  const round = (segment.key === lastPositive || segment.key === lastNegative) ? (segment.value > 0 ? 'end' : 'start') : 'none';
                  return <path key={segment.key} d={barPath(left, barY, right - left, BAR_THICKNESS, round, true)} fill={item.color} />;
                })}
                {row.markerAt !== undefined && (
                  <g>
                    <line x1={x(row.markerAt)} x2={x(row.markerAt)} y1={barY - 3} y2={barY + BAR_THICKNESS + 3} stroke="var(--viz-ink)" strokeWidth={2} />
                  </g>
                )}
                <text x={x(Math.max(stack.high, row.markerAt ?? 0)) + 8} y={y + rowHeight / 2 + 4} fontSize={11} fontWeight={600} fill="var(--viz-ink)" stroke="var(--viz-surface)" strokeWidth={3} paintOrder="stroke">{row.display}</text>
                <rect
                  x={0} y={y} width={width} height={rowHeight} fill="transparent" tabIndex={0} role="img" aria-label={tipText(row.title, linesOf(row))}
                  onPointerMove={event => show(event, row)} onPointerLeave={() => setTip(null)}
                  onFocus={() => setTip({ x: x(stack.high), y: y + rowHeight / 2, title: row.title, lines: linesOf(row) })} onBlur={() => setTip(null)}
                  style={{ outline: 'none' }}
                />
              </g>
            );
          })}
        </svg>
        {markerLabel && rows.some(row => row.markerAt !== undefined) && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--viz-ink-2)' }}>
            <span aria-hidden="true" className="inline-block h-3 w-[2px]" style={{ background: 'var(--viz-ink)' }} />
            {markerLabel}
          </div>
        )}
        <TipBox tip={tip} width={width} />
      </div>
    </Frame>
  );
}

// ── Stacked columns (the houses) ──────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ColumnRow {
  key: string;
  label: string;
  values: Record<string, number>;
  total: number;
  title: string;
}

export function StackedColumns({ title, note, ariaLabel, rows, series }: {
  title: string;
  note?: string;
  ariaLabel: string;
  rows: ColumnRow[];
  series: StackSeries[];
}) {
  const [ref, width] = useWidth();
  const [tip, setTip] = useState<Tip | null>(null);
  const left = 40;
  const top = 18;
  const labelHeight = 20;
  const plotHeight = 200;
  const height = top + plotHeight + labelHeight;
  const x0 = left;
  const x1 = Math.max(width - 6, x0 + 120);
  const stacks = rows.map(row => stackSegments(series.map(item => ({ key: item.key, value: row.values[item.key] ?? 0 }))));
  const axis = niceTicks(Math.min(0, ...stacks.map(stack => stack.low)), Math.max(1, ...stacks.map(stack => stack.high)), 5);
  const y = (value: number) => scaleLinear(value, axis.min, axis.max, top + plotHeight, top);
  const pitch = (x1 - x0) / rows.length;
  const columnWidth = Math.min(24, pitch - 6);
  // With one series the column is the total and says so once; with several the tooltip gives each part and the sum.
  const single = series.length === 1;
  const linesOf = (row: ColumnRow): TipLine[] => single
    ? [{ color: series[0].color, label: series[0].label, value: row.total.toFixed(1).replace(/\.0$/, '') }]
    : [
      ...series.map(item => ({ color: item.color, label: item.label, value: signed(row.values[item.key] ?? 0, 1) })),
      { label: 'Σ', value: row.total.toFixed(1).replace(/\.0$/, '') },
    ];
  const show = (event: { clientX: number; clientY: number }, row: ColumnRow) => {
    const box = ref.current?.getBoundingClientRect();
    setTip({ x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0), title: row.title, lines: linesOf(row) });
  };

  return (
    <Frame title={title} note={note} legend={single ? undefined : series.map(item => ({ label: item.label, color: item.color }))}>
      <div ref={ref} className="relative min-w-0">
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block" style={{ fontFamily: FONT }}>
          {axis.ticks.map(tick => (
            <g key={tick}>
              <line x1={x0} x2={x1} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth={1} />
              <text x={x0 - 6} y={y(tick) + 3} textAnchor="end" fontSize={10} fill="var(--viz-ink-3)">{tick}</text>
            </g>
          ))}
          {rows.map((row, index) => {
            const cx = x0 + pitch * index + pitch / 2;
            const stack = stacks[index];
            const lastPositive = [...stack.segments].reverse().find(segment => segment.value > 0)?.key;
            const lastNegative = [...stack.segments].reverse().find(segment => segment.value < 0)?.key;
            return (
              <g key={row.key}>
                {stack.segments.map(segment => {
                  if (segment.value === 0) return null;
                  const item = series.find(candidate => candidate.key === segment.key)!;
                  const upper = y(Math.max(segment.start, segment.end));
                  const lower = y(Math.min(segment.start, segment.end));
                  const outer = segment.key === lastPositive || segment.key === lastNegative;
                  const touchesStart = segment.start !== 0;
                  const touchesEnd = !outer;
                  // Positive segments grow upwards (start below, end above); negative ones downwards.
                  const topInset = segment.value > 0 ? (touchesEnd ? GAP / 2 : 0) : (touchesStart ? GAP / 2 : 0);
                  const bottomInset = segment.value > 0 ? (touchesStart ? GAP / 2 : 0) : (touchesEnd ? GAP / 2 : 0);
                  return (
                    <path
                      key={segment.key}
                      d={barPath(cx - columnWidth / 2, upper + topInset, columnWidth, lower - upper - topInset - bottomInset, outer ? (segment.value > 0 ? 'end' : 'start') : 'none', false)}
                      fill={item.color}
                    />
                  );
                })}
                <text x={cx} y={y(stack.high) - 5} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--viz-ink)">{Math.round(row.total)}</text>
                <text x={cx} y={height - 6} textAnchor="middle" fontSize={10} fill="var(--viz-ink-2)">{row.label}</text>
                <rect
                  x={cx - pitch / 2} y={top - 14} width={pitch} height={plotHeight + labelHeight + 14} fill="transparent" tabIndex={0} role="img" aria-label={tipText(row.title, linesOf(row))}
                  onPointerMove={event => show(event, row)} onPointerLeave={() => setTip(null)}
                  onFocus={() => setTip({ x: cx, y: y(stack.high), title: row.title, lines: linesOf(row) })} onBlur={() => setTip(null)}
                  style={{ outline: 'none' }}
                />
              </g>
            );
          })}
        </svg>
        <TipBox tip={tip} width={width} />
      </div>
    </Frame>
  );
}
