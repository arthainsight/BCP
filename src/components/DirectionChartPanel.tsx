'use client';

import { useId, useMemo } from 'react';
import type { ChartData } from '@/types';
import { DIRECTIONS, buildCompass, signDirection, type CompassItem, type Direction, type DirectionBody } from '@/lib/directions';
import { formatDegree } from '@/lib/formatDegree';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

type Props = {
  chart: ChartData;
};

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SYMBOL: Record<Direction, string> = { North: 'N', East: 'E', South: 'S', West: 'W' };

// The names the Nadi books write the grahas with.
const NADI_NAME: Record<string, string> = {
  Sun: 'Sun', Moon: 'Mo', Mars: 'Mars', Mercury: 'Mer', Jupiter: 'Jup', Venus: 'Ven', Saturn: 'Sat', Rahu: 'Rah', Ketu: 'Ket',
};
// The colour a graha's bracket is written in.
const BRACKET_COLOR: Record<string, string> = {
  Sun: '#ea580c', Moon: '#64748b', Mars: '#dc2626', Mercury: '#16a34a', Jupiter: '#ca8a04', Venus: '#db2777', Saturn: '#2563eb',
};

// The South Indian chart has the signs in fixed places: Pisces in the top left corner, then clockwise.
// 0 marks the middle, which is left empty.
const GRID: number[] = [
  12, 1, 2, 3,
  11, 0, 0, 4,
  10, 0, 0, 5,
  9, 8, 7, 6,
];
// Where the letter of a sign's direction goes: above, right of, below or left of the cell.
const LETTER_SIDE: Record<number, 'top' | 'right' | 'bottom' | 'left'> = {
  12: 'top', 1: 'top', 2: 'top', 3: 'right',
  4: 'right', 5: 'right', 6: 'bottom',
  7: 'bottom', 8: 'bottom', 9: 'left',
  10: 'left', 11: 'left',
};

const NAME_FILL = 'fill-blue-700 dark:fill-blue-300';
const CHAR_WIDTH = 9;
const ARROW_RED = '#ef4444';

type RowItem = { key: string; text: string; retro: boolean; color?: string; title: string };

/** The x of each item of a row, centred on `centre`, and the width of the row. */
function rowLayout(items: RowItem[], centre: number): { item: RowItem; x: number; width: number }[] {
  const widths = items.map(item => item.text.length * CHAR_WIDTH + (item.retro ? 7 : 0));
  const gap = 14;
  const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, items.length - 1);
  let x = centre - total / 2;
  return items.map((item, index) => {
    const placed = { item, x, width: widths[index] };
    x += widths[index] + gap;
    return placed;
  });
}

/** A small arrow: to the right for a direct graha, to the left for a retrograde one. */
function Arrow({ x, y, left }: { x: number; y: number; left: boolean }) {
  const tip = left ? x - 9 : x + 9;
  const back = left ? x + 9 : x - 9;
  const barb = left ? tip + 5 : tip - 5;
  return <path d={`M${back} ${y}H${tip}M${barb} ${y - 3.5}L${tip} ${y}L${barb} ${y + 3.5}`} stroke={ARROW_RED} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}

/**
 * The directional chart of the Nadi books: the South Indian chart (the signs stand still in it) with the
 * direction of each sign at its edge, the grahas with their degrees, and beside it the compass with every
 * graha written in the direction of its sign, in ascending order of degree from the left. A red arrow over
 * a graha points to the right when it is direct and to the left when it is retrograde; a retrograde graha
 * also casts its aspect on the 12th sign, written in brackets in the direction of that sign.
 */
export default function DirectionChartPanel({ chart }: Props) {
  const t = useT();
  const { style, code } = useGrahaNames();
  const ids = useId().replace(/:/g, '');

  const bodies = useMemo<DirectionBody[]>(() => chart.planets
    .filter(planet => GRAHAS.includes(planet.name))
    .map(planet => ({ name: planet.name, sign: planet.sign, degree: planet.degree, retrograde: planet.isRetrograde === true })), [chart]);
  const compass = useMemo(() => buildCompass(bodies), [bodies]);

  const label = (name: string) => (style === 'sanskrit' ? code(name) : NADI_NAME[name] ?? code(name));
  const tooltip = (item: CompassItem) =>
    `${item.name}${item.retrograde ? ' (R)' : ''} · ${SIGN_ABBR[item.sign - 1]} ${formatDegree(item.degree, 'minute')}`;

  // ── The South Indian chart, signs fixed, with the direction of each sign at its edge ─────────────
  const CELL_W = 96;
  const CELL_H = 78;
  const LEFT = 30;
  const TOP = 26;
  const gridBodies = (sign: number) => bodies.filter(body => body.sign === sign).sort((a, b) => a.degree - b.degree);
  const grid = (
    <svg viewBox={`0 0 ${LEFT * 2 + CELL_W * 4} ${TOP * 2 + CELL_H * 4}`} className="h-auto w-full" role="img" aria-label={t('South Indian chart with the directions of the signs')}>
      {GRID.map((sign, index) => {
        if (sign === 0) return null;
        const x = LEFT + (index % 4) * CELL_W;
        const y = TOP + Math.floor(index / 4) * CELL_H;
        const here = gridBodies(sign);
        const hasAsc = chart.ascendant.sign === sign;
        const lines = here.length + (hasAsc ? 1 : 0);
        const crowded = lines > 5;
        const step = crowded ? 11.5 : 14;
        const direction = signDirection(sign);
        const side = LETTER_SIDE[sign];
        const letterX = side === 'left' ? x - 12 : side === 'right' ? x + CELL_W + 12 : x + CELL_W / 2;
        const letterY = side === 'top' ? y - 9 : side === 'bottom' ? y + CELL_H + 17 : y + CELL_H / 2 + 4;
        return (
          <g key={sign}>
            <rect x={x} y={y} width={CELL_W} height={CELL_H} className="fill-white stroke-zinc-700 dark:fill-zinc-900 dark:stroke-zinc-400" strokeWidth="1.6" />
            <text x={x + CELL_W - 4} y={y + CELL_H - 4} textAnchor="end" fontSize="9" className="fill-zinc-400 font-mono dark:fill-zinc-500">{SIGN_ABBR[sign - 1]}</text>
            {hasAsc && (
              <text x={x + 5} y={y + 14} fontSize={crowded ? 10 : 12} fontWeight="700" className="fill-emerald-700 font-mono dark:fill-green-400">
                Asc
                <tspan dy="-4" fontSize="9" dx="2" className="fill-purple-600 dark:fill-purple-400">{formatDegree(chart.ascendant.degree, 'minute')}</tspan>
              </text>
            )}
            {here.map((body, row) => (
              <text
                key={body.name}
                x={x + 5}
                y={y + 14 + (row + (hasAsc ? 1 : 0)) * step}
                fontSize={crowded ? 10.5 : 12.5}
                fontWeight="700"
                className={`font-mono ${NAME_FILL}`}
              >
                {label(body.name)}
                <tspan dy="-4" dx="2" fontSize="9" className="fill-purple-600 dark:fill-purple-400">
                  {body.retrograde ? 'R ' : ''}{formatDegree(body.degree, 'minute')}
                </tspan>
              </text>
            ))}
            <text x={letterX} y={letterY} textAnchor="middle" fontSize="12" fontWeight="700" className="fill-zinc-700 font-mono dark:fill-zinc-300">{SYMBOL[direction]}</text>
          </g>
        );
      })}
      {/* The middle of the chart is left empty, as in the books. */}
      <rect x={LEFT + CELL_W} y={TOP + CELL_H} width={CELL_W * 2} height={CELL_H * 2} fill="none" className="stroke-zinc-700 dark:stroke-zinc-400" strokeWidth="1.6" />
    </svg>
  );

  // ── The compass: north above, east right, south below, west left ───────────────────────────────
  const CX = 220;
  const CY = 170;
  const place: Record<Direction, { names: { x: number; y: number }; brackets: { x: number; y: number } }> = {
    North: { names: { x: CX, y: 40 }, brackets: { x: CX, y: 62 } },
    South: { names: { x: CX, y: 318 }, brackets: { x: CX, y: 280 } },
    West: { names: { x: 118, y: 152 }, brackets: { x: 118, y: 198 } },
    East: { names: { x: 322, y: 152 }, brackets: { x: 322, y: 198 } },
  };
  const toRow = (items: CompassItem[], prefix: string): RowItem[] => items.map(item => ({
    key: `${prefix}-${item.name}`,
    text: label(item.name),
    retro: item.retrograde,
    color: BRACKET_COLOR[item.name],
    title: tooltip(item),
  }));
  const arrowId = `${ids}-arrow`;
  const turnId = `${ids}-turn`;
  const compassSvg = (
    <svg viewBox="0 0 440 340" className="h-auto w-full" role="img" aria-label={t('Compass with the grahas in their directions')}>
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1L9 5L1 9" fill="none" className="stroke-zinc-700 dark:stroke-zinc-300" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
        <marker id={turnId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M1 1L9 5L1 9" fill="none" stroke="#9333ea" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {/* The cross, and the turn of the directions: north → east → south → west */}
      <line x1={CX} y1="98" x2={CX} y2="242" className="stroke-zinc-700 dark:stroke-zinc-300" strokeWidth="1.8" markerStart={`url(#${arrowId})`} markerEnd={`url(#${arrowId})`} />
      <line x1="38" y1={CY} x2="402" y2={CY} className="stroke-zinc-700 dark:stroke-zinc-300" strokeWidth="1.8" markerStart={`url(#${arrowId})`} markerEnd={`url(#${arrowId})`} />
      <g fill="none" stroke="#9333ea" strokeWidth="2" strokeLinecap="round">
        <path d="M300 50Q368 62 382 112" markerEnd={`url(#${turnId})`} />
        <path d="M392 232Q388 292 332 308" markerEnd={`url(#${turnId})`} />
        <path d="M138 310Q70 298 58 238" markerEnd={`url(#${turnId})`} />
        <path d="M50 122Q62 62 134 46" markerEnd={`url(#${turnId})`} />
      </g>
      <text x={CX + 10} y="94" fontSize="14" fontWeight="700" className="fill-zinc-700 font-mono dark:fill-zinc-300">N</text>
      <text x={CX + 10} y="260" fontSize="14" fontWeight="700" className="fill-zinc-700 font-mono dark:fill-zinc-300">S</text>
      <text x="14" y={CY + 24} fontSize="14" fontWeight="700" className="fill-zinc-700 font-mono dark:fill-zinc-300">W</text>
      <text x="410" y={CY + 24} fontSize="14" fontWeight="700" className="fill-zinc-700 font-mono dark:fill-zinc-300">E</text>

      {DIRECTIONS.map(direction => (
        <g key={direction} data-direction={direction} role="group" aria-label={t(direction)}>
          {rowLayout(toRow(compass.bodies[direction], 'b'), place[direction].names.x).map(({ item, x, width }) => (
            <g key={item.key}>
              <title>{item.title}</title>
              <Arrow x={x + width / 2} y={place[direction].names.y - 20} left={item.retro} />
              <text x={x} y={place[direction].names.y} fontSize="15" fontWeight="700" className={`font-mono ${NAME_FILL}`}>
                {item.text}
                {item.retro && <tspan dy="-6" fontSize="9">R</tspan>}
              </text>
            </g>
          ))}
          {rowLayout(toRow(compass.aspects[direction], 'a'), place[direction].brackets.x).map(({ item, x }) => (
            <g key={item.key}>
              <title>{item.title}</title>
              <text x={x} y={place[direction].brackets.y} fontSize="14" fontWeight="700" fill={item.color ?? '#16a34a'} className="font-mono">
                [{item.text}]
              </text>
            </g>
          ))}
        </g>
      ))}
    </svg>
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Direction chart')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The directional chart of the Nadi. The direction belongs to the sign: fire signs east, earth south, air west, water north. In each direction the grahas stand in ascending order of their degree from the left.')}
        </p>
      </div>

      <div className="@container">
        <div className="grid items-center gap-4 @2xl:grid-cols-2" role="group" aria-label={t('Direction chart')}>
          {grid}
          {compassSvg}
        </div>
      </div>

      <ul className="space-y-0.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        <li><span className="font-bold" style={{ color: ARROW_RED }}>→</span> {t('a direct graha moves to the right')} · <span className="font-bold" style={{ color: ARROW_RED }}>←</span> {t('a retrograde graha moves to the left')}</li>
        <li><span className="font-bold text-emerald-600">[Mer]</span> {t('a retrograde graha also casts its aspect on the 12th sign: it is written in brackets in the direction of that sign')}</li>
        <li><span className="font-bold text-purple-600">↻</span> {t('the directions turn clockwise: north, east, south, west')}</li>
      </ul>
    </div>
  );
}
