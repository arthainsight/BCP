'use client';

import { useMemo, useState } from 'react';
import type { GroupComparison, GroupRow } from '@/lib/research/groupStudy';
import { dayText, eventsCsv, groupsCsv, type EventRow } from '@/lib/research/researchCsv';
import type { EventFeatures, WindowChoice } from '@/lib/research/eventStudy';
import { saveFile } from '@/lib/download';
import { fill, useT } from '@/lib/i18n';
import { BODY_CELL, HEAD_CELL, ROW } from './balaShared';
import { Q_MARK, formatP } from './ResearchMatrix';
import { FeatureLabel, chip, percent } from './researchUi';

/** What the comparison of two sets of events leaves for the view. */
export interface GroupOutcome {
  comparison: GroupComparison;
  labels: { a: string; b: string };
  /** The events with the features, and which group each is in (by chart and event id). */
  events: EventFeatures[];
  groupOf: ReadonlyMap<string, 'a' | 'b'>;
  info: ReadonlyMap<string, { chart: string; time: number; name: string; category: string; tags: string[] }>;
  windowDays: WindowChoice;
  skipped: number;
  failed: string[];
}

const FIRST_ROWS = 12;

/** The comparison of two sets of events: how many of each have each feature, and where they differ most. */
export default function ResearchGroups({ outcome }: { outcome: GroupOutcome }) {
  const t = useT();
  const { comparison, labels, events, groupOf, info, windowDays, skipped, failed } = outcome;
  const [focus, setFocus] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? comparison.rows : comparison.rows.slice(0, FIRST_ROWS);
  const byId = useMemo(() => new Map(comparison.rows.map(row => [row.id, row])), [comparison]);
  const focused: GroupRow | undefined = focus ? byId.get(focus) : undefined;

  const exportTable = () => saveFile('research-groups.csv', `﻿${groupsCsv(comparison, labels.a, labels.b)}`, 'text/csv');
  const exportEvents = () => {
    const rowsOut: EventRow[] = events.map(item => {
      const known = info.get(`${item.chartId}|${item.event.id}`);
      return {
        chart: item.chartName, id: item.event.id, time: item.event.time, name: item.event.name, category: known?.category ?? '', tags: known?.tags ?? [],
        features: new Set(item.features), group: groupOf.get(`${item.chartId}|${item.event.id}`) === 'a' ? labels.a : labels.b,
      };
    });
    saveFile('research-group-events.csv', `﻿${eventsCsv(rowsOut)}`, 'text/csv');
  };
  const eventList = (list: readonly { chartId: string; eventId: string }[], label: string) => (
    <div className="space-y-0.5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{label} · {list.length}</div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {list.map(item => {
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
  );

  return (
    <div className="space-y-3" data-research-result data-research-groups>
      <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200" data-research-summary>
        {labels.a} {comparison.totalA} · {labels.b} {comparison.totalB} · {comparison.tested} {t('features tested')}
      </p>
      {(comparison.totalA < 10 || comparison.totalB < 10) && <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{t('Few events in a group: only a very large difference can show, and any difference here is only a hint.')}</p>}
      {skipped > 0 && <p className="text-[10px] font-mono text-zinc-400">{fill(t('{count} events before the birth of their chart were left out.'), { count: String(skipped) })}</p>}
      {failed.length > 0 && <p className="text-[10px] font-mono text-zinc-400">{t('Left out for want of a place or time zone:')} {failed.join(', ')}</p>}

      {comparison.tested > 0 && (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('most different first')}</span>
            <button type="button" onClick={exportTable} className={chip(false)}>{t('Export the table (CSV)')}</button>
            <button type="button" onClick={exportEvents} className={chip(false)}>{t('Export the events (CSV)')}</button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[560px] border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className={HEAD_CELL}>{t('Feature')}</th>
                  <th className={HEAD_CELL}>{labels.a}</th>
                  <th className={HEAD_CELL}>{labels.b}</th>
                  <th className={HEAD_CELL} title={t('the share of the first group minus the share of the second')}>Δ</th>
                  <th className={HEAD_CELL} title={t('the chance of a difference as large by chance (two-sided)')}>p</th>
                  <th className={HEAD_CELL} title={t('p corrected for the number of features looked at (false discovery rate)')}>q</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className={`${ROW} cursor-pointer ${focus === row.id ? 'bg-violet-50 dark:bg-violet-950/20' : ''}`} data-feature={row.id} onClick={() => setFocus(focus === row.id ? null : row.id)}>
                    <td className={BODY_CELL}><FeatureLabel feature={row} /></td>
                    <td className={BODY_CELL}>{row.a}/{comparison.totalA} <span className="text-zinc-400">{percent(row.a, comparison.totalA)}</span></td>
                    <td className={BODY_CELL}>{row.b}/{comparison.totalB} <span className="text-zinc-400">{percent(row.b, comparison.totalB)}</span></td>
                    <td className={BODY_CELL}>{row.difference > 0 ? '+' : ''}{Math.round(row.difference * 100)} %</td>
                    <td className={BODY_CELL}>{formatP(row.p)}</td>
                    <td className={`${BODY_CELL} ${row.q <= Q_MARK ? 'font-bold text-emerald-700 dark:text-green-400' : ''}`}>{formatP(row.q)}{row.q <= Q_MARK && ' ✓'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {comparison.rows.length > FIRST_ROWS && (
            <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
              {showAll ? t('show fewer') : `${t('show all')} ${comparison.rows.length}`}
            </button>
          )}
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('Each feature is counted in both groups and compared with the Fisher exact test; q corrects p for the number of features looked at, because among many some always look striking by chance. This shows how the two groups differ, not why; a handful of events can only hint.')}
            {windowDays === 'auto' && ` ${t('Each event was read over a window that follows how exactly its date is known (to the day: the day; to the month: 15 days either side; to the year: 182).')}`}
            {typeof windowDays === 'number' && windowDays > 0 && ` ${fill(t('Every event was read over a window of {days} days either side.'), { days: String(windowDays) })}`}
          </p>
        </div>
      )}

      {focused && (
        <div className="space-y-2 rounded border border-violet-200 bg-violet-50/40 p-2 dark:border-violet-900 dark:bg-violet-950/10" data-research-focus={focused.id}>
          <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200"><FeatureLabel feature={focused} /></div>
          {eventList(focused.eventsA, labels.a)}
          {eventList(focused.eventsB, labels.b)}
        </div>
      )}
    </div>
  );
}
