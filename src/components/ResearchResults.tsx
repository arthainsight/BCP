'use client';

import { useMemo, useState } from 'react';
import { leaveOneChartOut, testFeature, type FeatureKind, type FeatureResult, type StudyResult, type WindowChoice } from '@/lib/research/eventStudy';
import { kindId, parseFeatureId } from '@/lib/research/features';
import { dayText, eventsCsv, resultsCsv, type EventRow } from '@/lib/research/researchCsv';
import type { ParayaBody } from '@/lib/bnn/nadiParaya';
import type { ProfilePoint } from '@/lib/research/timeProfile';
import type { RunSettings } from '@/lib/research/researchRuns';
import { saveFile } from '@/lib/download';
import { fill, useT } from '@/lib/i18n';
import { BODY_CELL, HEAD_CELL, ROW } from './balaShared';
import ResearchMatrix, { Q_MARK, formatP } from './ResearchMatrix';
import { FAMILY_LABELS, FeatureLabel, SOURCE_LABELS, chip, percent } from './researchUi';
import ResearchProfile from './ResearchProfile';
import { PROGRESSION_NATAL } from '@/lib/bnn/parayaProgression';

/** What the comparison with chance leaves for the view. */
export interface ChanceOutcome {
  result: StudyResult;
  kinds: FeatureKind[];
  bodies: ParayaBody[];
  windowDays: WindowChoice;
  /** Where the chance level came from: the same chart at random moments of its life, or the other charts at the same moment. */
  control: 'life' | 'others';
  /** What the run was run on, for keeping it by name. */
  runSettings: RunSettings;
  /** The feature around the events, month by month (the study's charts and options are kept by the panel that made the outcome). */
  profile: (id: string) => ProfilePoint[];
  /** A feature chosen before running, as its id, or null. */
  hypothesis: string | null;
  /** The event of each chart and event id: the chart, the moment, the name, the category and the tags. */
  info: ReadonlyMap<string, { chart: string; time: number; name: string; category: string; tags: string[] }>;
  failed: string[];
}

const FIRST_ROWS = 12;
/** The nine grahas, the daśā lords; and the slow ones whose transits are looked at. */
const NINE = PROGRESSION_NATAL.filter(name => name !== 'Asc');
const SLOW = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'] as const;

/** The grahas in the rows of the matrix of a kind: the progressing grahas, the slow ones for the transits and the gochara (Jupiter and Saturn for what only they have), the daśā lords. */
function matrixRows(kind: FeatureKind, bodies: readonly string[]): readonly string[] {
  if (kind.source === 'dasha') return NINE;
  const slow = bodies.filter(body => (SLOW as readonly string[]).includes(body));
  if (kind.source === 'transit') return slow;
  if (kind.source === 'gochara') {
    if (kind.family === 'rule') return ['Saturn'];
    return kind.family === 'favourable' || kind.family === 'bindu' ? slow.filter(body => body === 'Jupiter' || body === 'Saturn') : slow;
  }
  return bodies;
}

/** How a feature fares with each chart left out in turn: a finding that rests on one chart is weaker without it. */
function LeaveOneOut({ outcome, id }: { outcome: ChanceOutcome; id: string }) {
  const t = useT();
  const rows = useMemo(() => leaveOneChartOut(outcome.result.data, id), [outcome, id]);
  if (rows.length < 2) return null;
  return (
    <div className="space-y-0.5" data-research-loco={id}>
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('without each chart in turn')}</div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {rows.map(row => (
          <li key={row.chartId} className="flex flex-wrap items-baseline gap-x-3 py-0.5 text-[11px] font-mono" data-research-loco-row={row.chartName}>
            <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">{t('without')} {row.chartName}</span>
            <span className="text-zinc-500 dark:text-zinc-400">{row.test.observed}/{row.test.total}</span>
            <span className={row.test.p <= 0.05 ? 'font-bold text-emerald-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}>p {formatP(row.test.p)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('Exact p of this feature on its own, without any correction: it says whether the finding rests on one chart, not that it is more than chance.')}</p>
    </div>
  );
}

/** The comparison with chance: the summary, a feature chosen beforehand, the matrix, the table of all features and the events behind each. */
export default function ResearchResults({ outcome }: { outcome: ChanceOutcome }) {
  const t = useT();
  const { result, kinds, bodies, windowDays, hypothesis, info, failed } = outcome;
  const [shown, setShown] = useState<string | null>(kinds[0] ? kindId(kinds[0].source, kinds[0].family) : null);
  const [focus, setFocus] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const byId = useMemo(() => new Map(result.results.map(item => [item.id, item])), [result]);
  const rows = showAll ? result.results : result.results.slice(0, FIRST_ROWS);
  const focused: FeatureResult | undefined = focus ? byId.get(focus) : undefined;
  const shownKind = kinds.find(kind => kindId(kind.source, kind.family) === shown);
  const chosen = useMemo(() => (hypothesis ? testFeature(result.data, hypothesis) : null), [result, hypothesis]);

  const exportEvents = () => {
    const names = result.data.names;
    const rowsOut: EventRow[] = result.data.events.map(item => {
      const known = info.get(`${item.chartId}|${item.event.id}`);
      return { chart: item.chartName, id: item.event.id, time: item.event.time, name: item.event.name, category: known?.category ?? '', tags: known?.tags ?? [], features: new Set(Array.from(item.features, index => names[index])) };
    });
    saveFile('research-events.csv', `﻿${eventsCsv(rowsOut)}`, 'text/csv');
  };
  const exportTable = () => saveFile('research-table.csv', `﻿${resultsCsv(result.results, result.events)}`, 'text/csv');
  const eventList = (events: readonly { chartId: string; eventId: string }[]) => (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {events.map(item => {
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
  );

  return (
    <div className="space-y-3" data-research-result>
      <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200" data-research-summary>
        {result.events} {t('events')} · {result.charts} {t('charts')} · {result.tested} {t('features tested')}
      </p>
      {result.events < 15 && <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{t('Few events: only a very strong pattern can show in so few, and any pattern here is only a hint.')}</p>}
      {result.skipped > 0 && <p className="text-[10px] font-mono text-zinc-400">{fill(t('{count} events before the birth of their chart were left out.'), { count: String(result.skipped) })}</p>}
      {failed.length > 0 && <p className="text-[10px] font-mono text-zinc-400">{t('Left out for want of a place or time zone:')} {failed.join(', ')}</p>}
      {result.events === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No events to compare.')}</p>}

      {result.events > 0 && (
        <>
          {chosen && hypothesis && (
            <div className="space-y-1 rounded border border-emerald-300 bg-emerald-50/40 p-2 dark:border-emerald-900 dark:bg-emerald-950/10" data-research-hypothesis={hypothesis}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('the feature chosen beforehand')}</div>
              <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200"><FeatureLabel feature={parseFeatureId(hypothesis)} /></div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                <span>{chosen.observed}/{chosen.total} {t('events')} <span className="text-zinc-400">{percent(chosen.observed, chosen.total)}</span></span>
                <span>{t('by chance')} {chosen.expected.toFixed(1)} <span className="text-zinc-400">{percent(chosen.expected, chosen.total)}</span></span>
                {chosen.lift !== null && <span>×{chosen.lift.toFixed(1)}</span>}
                <span className={chosen.p <= 0.05 ? 'font-bold text-emerald-700 dark:text-green-400' : ''} data-research-hypothesis-p>p {formatP(chosen.p)}</span>
              </div>
              <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('One feature chosen before looking at the results needs no correction for the number of features: p is the exact chance of as many events with it as there are, by chance.')}</p>
              <LeaveOneOut outcome={outcome} id={hypothesis} />
              <ResearchProfile id={hypothesis} load={outcome.profile} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('shown in the matrix')}>
            {kinds.map(kind => {
              const id = kindId(kind.source, kind.family);
              return <button key={id} type="button" aria-pressed={shown === id} onClick={() => setShown(id)} className={chip(shown === id)}>{kinds.some(other => other.source !== kinds[0].source) ? `${t(SOURCE_LABELS[kind.source])} · ` : ''}{t(FAMILY_LABELS[kind.family])}</button>;
            })}
          </div>
          {shownKind && <ResearchMatrix source={shownKind.source} family={shownKind.family} bodies={matrixRows(shownKind, bodies)} results={byId} total={result.events} focus={focus} onFocus={setFocus} />}
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('Each cell is the number of events with that feature. Shade: how many times more often than by chance (none at or under the chance level, darkest at three times or more). Bold and underlined: still more than chance after the correction for the number of features looked at (q at most 0.1). Click a cell to list its events.')}
          </p>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('most unusual first')}</span>
              <button type="button" onClick={exportTable} className={chip(false)}>{t('Export the table (CSV)')}</button>
              <button type="button" onClick={exportEvents} className={chip(false)}>{t('Export the events (CSV)')}</button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[520px] border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-zinc-800">
                    <th className={HEAD_CELL}>{t('Feature')}</th>
                    <th className={HEAD_CELL}>{t('events')}</th>
                    <th className={HEAD_CELL} title={t('how many would have it by chance')}>{t('by chance')}</th>
                    <th className={HEAD_CELL}>×</th>
                    <th className={HEAD_CELL} title={t('the chance of as many or more by chance')}>p</th>
                    <th className={HEAD_CELL} title={t('p corrected for the number of features looked at (false discovery rate)')}>q</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} className={`${ROW} cursor-pointer ${focus === row.id ? 'bg-violet-50 dark:bg-violet-950/20' : ''}`} data-feature={row.id} onClick={() => setFocus(focus === row.id ? null : row.id)}>
                      <td className={BODY_CELL}><FeatureLabel feature={row} /></td>
                      <td className={BODY_CELL}>{row.observed}/{result.events} <span className="text-zinc-400">{percent(row.observed, result.events)}</span></td>
                      <td className={BODY_CELL}>{row.expected.toFixed(1)} <span className="text-zinc-400">{percent(row.expected, result.events)}</span></td>
                      <td className={BODY_CELL}>{row.lift === null ? '—' : row.lift.toFixed(1)}</td>
                      <td className={BODY_CELL}>{formatP(row.p)}</td>
                      <td className={`${BODY_CELL} ${row.q <= Q_MARK ? 'font-bold text-emerald-700 dark:text-green-400' : ''}`}>{formatP(row.q)}{row.q <= Q_MARK && ' ✓'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.results.length > FIRST_ROWS && (
              <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
                {showAll ? t('show fewer') : `${t('show all')} ${result.results.length}`}
              </button>
            )}
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
              {t('p is the chance that as many events would have the feature if they were moved to random moments of their own chart (a permutation test); q corrects p for the number of features looked at, because among many some always look striking by chance. This shows what the events have in common, not why; a handful of events can only hint.')}
              {outcome.control === 'others' && ` ${t('Here the chance level is the other charts at the very same moment (each event is compared with the share of the other charts that have the feature then), p is the exact chance of as many events as there are, not a permutation test, and with few charts it is coarse and cautious.')}`}
              {windowDays === 'auto' && ` ${t('Each event was read over a window that follows how exactly its date is known (to the day: the day; to the month: 15 days either side; to the year: 182), and the random moments over the same windows.')}`}
              {typeof windowDays === 'number' && windowDays > 0 && ` ${fill(t('Every moment, of the events and of the random ones, was read over a window of {days} days either side.'), { days: String(windowDays) })}`}
            </p>
          </div>

          {focused && (
            <div className="space-y-2 rounded border border-violet-200 bg-violet-50/40 p-2 dark:border-violet-900 dark:bg-violet-950/10" data-research-focus={focused.id}>
              <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200"><FeatureLabel feature={focused} /> · {focused.observed} {t('events')}</div>
              {eventList(focused.events)}
              <LeaveOneOut outcome={outcome} id={focused.id} />
              <ResearchProfile id={focused.id} load={outcome.profile} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
