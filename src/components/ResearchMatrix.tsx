'use client';

import type { FeatureResult } from '@/lib/research/eventStudy';
import { featureId, type FeatureFamily } from '@/lib/research/progressionFeatures';
import type { ParayaBody } from '@/lib/bnn/nadiParaya';
import { PROGRESSION_NATAL } from '@/lib/bnn/parayaProgression';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

type Props = {
  family: FeatureFamily;
  bodies: readonly ParayaBody[];
  results: ReadonlyMap<string, FeatureResult>;
  /** The events that were studied. */
  total: number;
  focus: string | null;
  onFocus: (id: string | null) => void;
};

const HOUSES = Array.from({ length: 12 }, (_, i) => String(i + 1));
/** A feature at or under this q-value (false discovery rate) is marked as one that may be more than chance. */
export const Q_MARK = 0.1;
/** The shading reaches its darkest at this many times the chance level. */
const FULL_SHADE_LIFT = 3;

const shadeOf = (lift: number | null) => (lift === null || lift <= 1 ? 0 : 0.15 + (0.75 * Math.min(lift - 1, FULL_SHADE_LIFT - 1)) / (FULL_SHADE_LIFT - 1));

/** The size of a number of this kind, for a title. */
export const formatP = (p: number) => (p < 0.001 ? '<0.001' : p.toFixed(3));

/**
 * One kind of feature across the studied events: a row for each progressing graha, a column for each house or natal point, in each cell how many events
 * had it, shaded by how many times more often than by chance (a single hue, none at or under the chance level) and in bold when it holds up after the
 * correction for looking at so many. Click a cell to list the events.
 */
export default function ResearchMatrix({ family, bodies, results, total, focus, onFocus }: Props) {
  const t = useT();
  const { code } = useGrahaNames();
  const byHouse = family === 'house' || family === 'aspectHouse';
  const columns: readonly string[] = byHouse ? HOUSES : PROGRESSION_NATAL;
  const header = (column: string) => (byHouse ? `H${column}` : code(column));
  return (
    <div className="viz overflow-x-auto" data-research-matrix={family}>
      <table className="w-full min-w-[420px] border-collapse text-[10px] font-mono">
        <thead>
          <tr>
            <th className="p-1" />
            {columns.map(column => <th key={column} className="p-1 text-center font-normal text-zinc-500 dark:text-zinc-400">{header(column)}</th>)}
          </tr>
        </thead>
        <tbody>
          {bodies.map(body => (
            <tr key={body}>
              <th className="p-1 text-left font-bold text-violet-600 dark:text-violet-400" title={body}>{code(body)}</th>
              {columns.map(column => {
                const id = featureId(family, body, column);
                const result = results.get(id);
                const strong = result !== undefined && result.q <= Q_MARK;
                const title = result
                  ? `${code(body)} · ${header(column)}: ${result.observed}/${total} · ${t('by chance')} ${result.expected.toFixed(1)}${result.lift !== null ? ` · ×${result.lift.toFixed(1)}` : ''} · p ${formatP(result.p)} · q ${formatP(result.q)}`
                  : `${code(body)} · ${header(column)}: 0/${total}`;
                return (
                  <td key={column} className="p-0.5 text-center">
                    {result ? (
                      <button
                        type="button"
                        title={title}
                        aria-label={title}
                        aria-pressed={focus === id}
                        data-cell={`${body}|${column}`}
                        data-count={result.observed}
                        data-strong={strong}
                        onClick={() => onFocus(focus === id ? null : id)}
                        className={`relative block h-7 w-full min-w-6 overflow-hidden rounded ${focus === id ? 'ring-2 ring-violet-500' : strong ? 'ring-1 ring-[var(--viz-ink)]' : ''}`}
                      >
                        <span className="absolute inset-0" style={{ background: 'var(--viz-1)', opacity: shadeOf(result.lift) }} aria-hidden="true" />
                        <span className={`relative text-zinc-800 dark:text-zinc-100 ${strong ? 'font-bold underline' : ''}`}>{result.observed}</span>
                      </button>
                    ) : <span title={title} className="block h-7 leading-7 text-zinc-300 dark:text-zinc-600" data-cell={`${body}|${column}`} data-count={0}>·</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
