'use client';

import { useState } from 'react';
import type { ComboResult, ComboSpec } from '@/lib/research/combos';
import type { WindowChoice } from '@/lib/research/eventStudy';
import { dayText } from '@/lib/research/researchCsv';
import { fill, useT } from '@/lib/i18n';
import { BODY_CELL, HEAD_CELL, ROW } from './balaShared';
import { Q_MARK, formatP } from './ResearchMatrix';
import { FeatureLabel, SOURCE_LABELS, FAMILY_LABELS, percent } from './researchUi';

/** What the study of combinations of two kinds of feature leaves for the view. */
export interface ComboOutcome {
  result: ComboResult;
  spec: ComboSpec;
  windowDays: WindowChoice;
  info: ReadonlyMap<string, { chart: string; time: number; name: string; category: string; tags: string[] }>;
  failed: string[];
}

const FIRST_ROWS = 12;

/** A kind of feature in words: its source and family. */
export const kindText = (kind: { source: keyof typeof SOURCE_LABELS; family: keyof typeof FAMILY_LABELS }, t: (text: string) => string) => `${t(SOURCE_LABELS[kind.source])} · ${t(FAMILY_LABELS[kind.family])}`;

/**
 * The combinations of two kinds of feature that are there at the same time, the most unusual first, each with the p of both its parts: a combination is of interest
 * when it is more unusual than either of them.
 */
export default function ResearchCombos({ outcome }: { outcome: ComboOutcome }) {
  const t = useT();
  const { result, spec, windowDays, info, failed } = outcome;
  const [showAll, setShowAll] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const rows = showAll ? result.rows : result.rows.slice(0, FIRST_ROWS);
  const focused = focus ? result.rows.find(row => row.id === focus) : undefined;
  const beyond = result.rows.filter(row => row.beyondParts && row.q <= Q_MARK).length;
  return (
    <div className="space-y-3" data-research-result data-research-combos>
      <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200" data-research-summary>
        {result.events} {t('events')} · {result.charts} {t('charts')} · {result.tested} {t('combinations tested')}
      </p>
      <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{kindText(spec.left, t)} + {kindText(spec.right, t)}{spec.sameGraha ? ` · ${t('the same graha')}` : ''}</p>
      {result.events < 15 && <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{t('Few events: only a very strong pattern can show in so few, and any pattern here is only a hint.')}</p>}
      {result.skipped > 0 && <p className="text-[10px] font-mono text-zinc-400">{fill(t('{count} events before the birth of their chart were left out.'), { count: String(result.skipped) })}</p>}
      {failed.length > 0 && <p className="text-[10px] font-mono text-zinc-400">{t('Left out for want of a place or time zone:')} {failed.join(', ')}</p>}
      {result.tested === 0 && <p className="text-[10px] font-mono text-zinc-400" data-research-combos-none>{t('No event has both at once: choose other kinds, or leave out the same graha.')}</p>}
      {result.tested > 0 && (
        <>
          <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400" data-research-combos-beyond={beyond}>
            {fill(t('{count} combinations are more unusual than either of their parts and hold up after the correction.'), { count: String(beyond) })}
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[720px] border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className={HEAD_CELL}>{t('Combination')}</th>
                  <th className={HEAD_CELL}>{t('events')}</th>
                  <th className={HEAD_CELL}>{t('by chance')}</th>
                  <th className={HEAD_CELL}>×</th>
                  <th className={HEAD_CELL}>p</th>
                  <th className={HEAD_CELL}>q</th>
                  <th className={HEAD_CELL} title={t('the exact p of each part on its own')}>{t('parts p')}</th>
                  <th className={HEAD_CELL} title={t('more unusual than either part')}>{t('beats parts')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className={`${ROW} cursor-pointer ${focus === row.id ? 'bg-violet-50 dark:bg-violet-950/20' : ''}`} data-feature={row.id} data-beyond={row.beyondParts} onClick={() => setFocus(focus === row.id ? null : row.id)}>
                    <td className={BODY_CELL}><FeatureLabel feature={row.parts[0]} /> <span className="text-zinc-400">+</span> <FeatureLabel feature={row.parts[1]} /></td>
                    <td className={BODY_CELL}>{row.observed}/{result.events} <span className="text-zinc-400">{percent(row.observed, result.events)}</span></td>
                    <td className={BODY_CELL}>{row.expected.toFixed(1)}</td>
                    <td className={BODY_CELL}>{row.lift === null ? '—' : row.lift.toFixed(1)}</td>
                    <td className={BODY_CELL}>{formatP(row.p)}</td>
                    <td className={`${BODY_CELL} ${row.q <= Q_MARK ? 'font-bold text-emerald-700 dark:text-green-400' : ''}`}>{formatP(row.q)}{row.q <= Q_MARK && ' ✓'}</td>
                    <td className={`${BODY_CELL} text-zinc-500`}>{formatP(row.partP[0])} · {formatP(row.partP[1])}</td>
                    <td className={`${BODY_CELL} ${row.beyondParts ? 'font-bold text-emerald-700 dark:text-green-400' : 'text-zinc-400'}`}>{row.beyondParts ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.rows.length > FIRST_ROWS && (
            <button type="button" onClick={() => setShowAll(value => !value)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
              {showAll ? t('show fewer') : `${t('show all')} ${result.rows.length}`}
            </button>
          )}
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('A combination is there when both of its parts are there at the same time (over a window: both somewhere within it). Its chance level is how often both are there at random moments of the same chart, and p is exact. A combination is of interest only if it is more unusual than each of its parts, which the last column says; q corrects for the number of combinations looked at.')}
            {windowDays === 'auto' && ` ${t('The window followed the accuracy of each date.')}`}
          </p>
        </>
      )}
      {focused && (
        <div className="space-y-1 rounded border border-violet-200 bg-violet-50/40 p-2 dark:border-violet-900 dark:bg-violet-950/10" data-research-focus={focused.id}>
          <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200"><FeatureLabel feature={focused.parts[0]} /> + <FeatureLabel feature={focused.parts[1]} /> · {focused.observed} {t('events')}</div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {focused.events.map(item => {
              const known = info.get(`${item.chartId}|${item.eventId}`);
              return known ? (
                <li key={`${item.chartId}|${item.eventId}`} className="flex flex-wrap items-baseline gap-x-3 py-1 text-[11px] font-mono" data-research-event>
                  <span className="w-20 shrink-0 text-zinc-500 dark:text-zinc-400">{dayText(known.time)}</span>
                  <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">{known.name}</span>
                  <span className="text-zinc-400">{known.chart}</span>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
