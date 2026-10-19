'use client';

import { useState } from 'react';
import { MAX_RUNS, STRONG_Q, addRun, compareRuns, readRuns, recordOf, removeRun, type RunRecord, type RunSettings } from '@/lib/research/researchRuns';
import { parseFeatureId } from '@/lib/research/features';
import { fill, useT } from '@/lib/i18n';
import { BODY_CELL, HEAD_CELL, ROW } from './balaShared';
import { formatP } from './ResearchMatrix';
import { FeatureLabel, SOURCE_LABELS, chip } from './researchUi';
import type { ChanceOutcome } from './ResearchResults';

const FIRST_ROWS = 12;
const dayOf = (iso: string) => iso.slice(0, 10);

/** What a kept run was run on, in a line. */
function SettingsLine({ settings, run }: { settings: RunSettings; run: RunRecord }) {
  const t = useT();
  const window = settings.window === 'auto' ? t('by the accuracy of the date') : settings.window === 0 ? t('the day') : `±${settings.window} ${t('days')}`;
  return (
    <span className="text-zinc-400">
      {run.events} {t('events')} · {run.charts} {t('charts')} · {settings.events} · {window}{settings.control === 'others' ? ` · ${t('the other charts at the same moment')}` : ''}
    </span>
  );
}

/**
 * The runs kept by name. The run just made can be kept under a name; any two of the kept ones can be set side by side to see how many of the features that held up in
 * the first hold up in the second, for example after charts were added or the window changed.
 */
export default function ResearchRuns({ current, settings }: { current: ChanceOutcome | null; settings: RunSettings | null }) {
  const t = useT();
  const [runs, setRuns] = useState<RunRecord[]>(() => readRuns());
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [kept, setKept] = useState<string | null>(null);

  const keep = () => {
    if (!current || !settings) return;
    const record = recordOf(name, new Date(), settings, { events: current.result.events, charts: current.result.charts, tested: current.result.tested, results: current.result.results });
    setRuns(addRun(record));
    setKept(record.id);
    setName('');
  };
  const togglePick = (id: string) => setPicked(list => (list.includes(id) ? list.filter(item => item !== id) : [...list, id].slice(-2)));
  const remove = (id: string) => { setRuns(removeRun(id)); setPicked(list => list.filter(item => item !== id)); };
  const [first, second] = picked.map(id => runs.find(run => run.id === id));
  const comparison = first && second ? compareRuns(first, second) : null;
  const shown = comparison ? (showAll ? comparison.rows : comparison.rows.slice(0, FIRST_ROWS)) : [];

  if (!current && runs.length === 0) return null;
  return (
    <div className="space-y-2" role="group" aria-label={t('saved runs')} data-research-runs>
      {current && settings && (
        <div className="flex flex-wrap items-center gap-2">
          <input value={name} onChange={event => setName(event.target.value)} placeholder={t('name of the run')} aria-label={t('name of the run')} className="w-48 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11px] font-mono dark:border-zinc-700 dark:bg-zinc-800" />
          <button type="button" onClick={keep} className={chip(false)}>{t('Keep this run')}</button>
          {kept && <span className="text-[10px] font-mono text-emerald-700 dark:text-green-400" role="status" data-research-kept>{t('Kept.')}</span>}
        </div>
      )}
      {runs.length > 0 && (
        <details className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400" open={runs.length > 0 && (picked.length > 0 || kept !== null)}>
          <summary className="cursor-pointer select-none">{t('Kept runs')}: {runs.length}</summary>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {runs.map(run => (
              <li key={run.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1 text-[11px]" data-research-run={run.name}>
                <label className="flex min-h-8 items-center gap-2 text-zinc-700 dark:text-zinc-200">
                  <input type="checkbox" checked={picked.includes(run.id)} onChange={() => togglePick(run.id)} className="h-4 w-4 accent-emerald-600" aria-label={`${t('compare')} ${run.name}`} />
                  <span className="font-bold">{run.name}</span>
                </label>
                <span className="text-zinc-400">{dayOf(run.savedAt)}</span>
                <SettingsLine settings={run.settings} run={run} />
                <button type="button" onClick={() => remove(run.id)} aria-label={`${t('Delete')} ${run.name}`} className="ml-auto text-zinc-400 hover:text-rose-600">×</button>
              </li>
            ))}
          </ul>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-600">{fill(t('Choose two runs to set them side by side. At most {count} runs are kept in this browser, each with its 300 most unusual features.'), { count: String(MAX_RUNS) })}</p>
        </details>
      )}
      {picked.length === 1 && <p className="text-[10px] font-mono text-zinc-400">{t('Choose a second run to compare with.')}</p>}
      {comparison && first && second && (
        <div className="space-y-1" data-research-comparison>
          <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200" data-research-comparison-summary>
            {fill(t('{kept} of the {strong} features that held up in {first} hold up in {second} too ({same} are more than chance there).'), { kept: String(comparison.kept), strong: String(comparison.strongA), first: first.name, second: second.name, same: String(comparison.samePattern) })}
            <span className="text-zinc-400"> {fill(t('{count} hold up in {second}.'), { count: String(comparison.strongB), second: second.name })}</span>
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[620px] border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className={HEAD_CELL}>{t('Feature')}</th>
                  <th className={HEAD_CELL}>{first.name}</th>
                  <th className={HEAD_CELL}>{second.name}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(row => (
                  <tr key={row.id} className={ROW} data-feature={row.id}>
                    <td className={BODY_CELL}><FeatureLabel feature={parseFeatureId(row.id)} /> <span className="text-zinc-400">{t(SOURCE_LABELS[parseFeatureId(row.id).source])}</span></td>
                    {[row.a, row.b].map((side, i) => (
                      <td key={i} className={`${BODY_CELL} ${side && side.q <= STRONG_Q ? 'font-bold text-emerald-700 dark:text-green-400' : ''}`}>
                        {side ? <>{side.observed} <span className="text-zinc-400">{side.lift !== null ? `×${side.lift.toFixed(1)}` : ''} p {formatP(side.p)} q {formatP(side.q)}{side.q <= STRONG_Q ? ' ✓' : ''}</span></> : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {comparison.rows.length > FIRST_ROWS && (
            <button type="button" onClick={() => setShowAll(value => !value)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
              {showAll ? t('show fewer') : `${t('show all')} ${comparison.rows.length}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
