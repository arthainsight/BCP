'use client';

import { useState } from 'react';
import type { Convergence, StripRow } from '@/lib/bnn/parayaAspects';
import { timelineTicks } from '@/lib/timelineTicks';
import { SIGN_ABBR } from '@/lib/signs';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';
import { formatHitDay } from '@/lib/bnn/parayaProgression';

type Props = {
  rows: readonly StripRow[];
  /** The range shown, in years of age. */
  fromAge: number;
  toAge: number;
  timeOf: (age: number) => number;
  /** The text of an aspecting graha with its kind of aspect, as the lists show it. */
  aspectsText: (aspects: Convergence['aspects']) => string;
  onPick?: (time: number) => void;
};

/** One shade for each number of grahas, from one to four or more: a single hue, light to dark (an opacity of the first chart colour). */
const SHADES = [0.28, 0.5, 0.75, 1];
const shadeOf = (count: number) => SHADES[Math.min(count, SHADES.length) - 1];
const WIDTH = 1000;

/**
 * The aspects through time: a row for each sign that holds natal points, the range across, and in each stretch a shade for how many grahas aspect the
 * points in it. The lists below are the same stretches as text. Hover or focus a stretch to read it; click it to move the target moment to its start.
 */
export default function AspectStrip({ rows, fromAge, toAge, timeOf, aspectsText, onPick }: Props) {
  const t = useT();
  const { code } = useGrahaNames();
  const [hover, setHover] = useState<{ row: StripRow; segment: Convergence } | null>(null);
  const span = toAge - fromAge;
  const xOf = (age: number) => ((age - fromAge) / span) * WIDTH;
  const fromTime = timeOf(fromAge);
  const toTime = timeOf(toAge);
  const ticks = timelineTicks(fromTime, toTime);
  const percentOf = (time: number) => ((time - fromTime) / (toTime - fromTime)) * 100;
  const names = (row: StripRow) => `${row.natals.map(name => code(name)).join(' ')} ${SIGN_ABBR[row.signIndex]}`;
  const dates = (segment: Convergence) => `${formatHitDay(timeOf(segment.startAge))} → ${formatHitDay(timeOf(segment.endAge))}`;
  const describe = (row: StripRow, segment: Convergence) => `${names(row)} · ${dates(segment)} · ${aspectsText(segment.aspects)}`;
  if (!(span > 0)) return null;

  return (
    <div className="viz space-y-1" data-strip>
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        <span>{t('timeline')}</span>
        <span className="flex items-center gap-1 normal-case tracking-normal" aria-label={t('number of grahas aspecting')}>
          {SHADES.map((shade, i) => (
            <span key={shade} className="flex items-center gap-0.5">
              <span className="inline-block h-2.5 w-4 rounded-sm" style={{ background: 'var(--viz-1)', opacity: shade }} />
              <span>{i === SHADES.length - 1 ? `${i + 1}+` : i + 1}</span>
            </span>
          ))}
        </span>
      </div>

      <div className="space-y-0.5">
        {rows.map(row => (
          <div key={row.signIndex} className="flex items-center gap-2" data-strip-row={row.natals.join(' ')}>
            <span className="w-28 shrink-0 truncate text-[10px] font-mono text-zinc-600 sm:w-40 dark:text-zinc-300" title={names(row)}>{names(row)}</span>
            <svg className="h-4 min-w-0 flex-1" viewBox={`0 0 ${WIDTH} 16`} preserveAspectRatio="none" role="group" aria-label={names(row)}>
              <rect x={0} y={0} width={WIDTH} height={16} rx={2} fill="var(--viz-grid)" opacity={0.5} />
              {row.segments.map(segment => (
                <rect
                  key={segment.startAge}
                  x={xOf(segment.startAge)}
                  y={0}
                  width={Math.max(2, xOf(segment.endAge) - xOf(segment.startAge))}
                  height={16}
                  fill="var(--viz-1)"
                  fillOpacity={shadeOf(segment.aspects.length)}
                  stroke="var(--viz-surface)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  tabIndex={0}
                  role="img"
                  aria-label={describe(row, segment)}
                  data-count={segment.aspects.length}
                  className={onPick ? 'cursor-pointer outline-none focus:stroke-[color:var(--viz-ink)]' : 'outline-none focus:stroke-[color:var(--viz-ink)]'}
                  onMouseEnter={() => setHover({ row, segment })}
                  onMouseLeave={() => setHover(current => (current?.segment === segment ? null : current))}
                  onFocus={() => setHover({ row, segment })}
                  onBlur={() => setHover(current => (current?.segment === segment ? null : current))}
                  onClick={() => onPick?.(timeOf(segment.startAge))}
                />
              ))}
            </svg>
          </div>
        ))}
        {/* The time axis: the marks sit under the strips, which start after the label column and its gap. */}
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="w-28 shrink-0 sm:w-40" />
          <div className="relative h-4 min-w-0 flex-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
            {ticks.map(tick => (
              <span key={tick.time} className="absolute top-0 -translate-x-1/2 whitespace-nowrap" style={{ left: `${percentOf(tick.time)}%` }}>
                <span className="mx-auto block h-1 w-px bg-zinc-300 dark:bg-zinc-600" />
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="min-h-4 text-[10px] font-mono text-zinc-500 dark:text-zinc-400" data-strip-readout aria-live="polite">
        {hover ? describe(hover.row, hover.segment) : t('Hover or focus a stretch to read it.')}
      </p>
    </div>
  );
}
