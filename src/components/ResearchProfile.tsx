'use client';

import { useState } from 'react';
import type { ProfilePoint } from '@/lib/research/timeProfile';
import { fill, useT } from '@/lib/i18n';
import { formatP } from './ResearchMatrix';
import { chip } from './researchUi';

/** The bars reach their full height at this many times the chance level. */
const FULL_LIFT = 4;
const HEIGHT = 56;

type State = { status: 'idle' } | { status: 'running' } | { status: 'error'; message: string } | { status: 'done'; points: ProfilePoint[] };

const offsetText = (days: number) => (days > 0 ? `+${days}` : String(days));

/**
 * When a feature is there around the events, half a year before to half a year after, a month at a time: a bar for how many times more often than by chance the events
 * have it at that offset. A pattern that leads the event shows to the left of 0, one that follows it to the right.
 */
export default function ResearchProfile({ id, load }: { id: string; load: (id: string) => ProfilePoint[] }) {
  const t = useT();
  const [state, setState] = useState<State>({ status: 'idle' });
  const run = async () => {
    setState({ status: 'running' });
    await new Promise(resolve => window.setTimeout(resolve, 0));
    try { setState({ status: 'done', points: load(id) }); } catch (error) { setState({ status: 'error', message: error instanceof Error ? error.message : String(error) }); }
  };
  return (
    <div className="space-y-1" data-research-profile={id}>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => { void run(); }} disabled={state.status === 'running'} className={chip(false)}>{t('Time profile')}</button>
        {state.status === 'running' && <span className="text-[10px] font-mono text-zinc-400" role="status">{t('Calculating the time profile…')}</span>}
        {state.status === 'error' && <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400" role="alert">{t('Could not calculate:')} {state.message}</span>}
      </div>
      {state.status === 'done' && (
        <>
          <div className="viz overflow-x-auto" data-research-profile-chart>
            <div className="flex min-w-[420px] items-end gap-1" style={{ height: HEIGHT + 16 }} role="img" aria-label={t('Time profile of the feature around the events')}>
              {state.points.map(point => {
                const lift = point.lift ?? 0;
                const strong = point.lift !== null && point.lift > 1 && point.p <= 0.05;
                const title = `${offsetText(point.offsetDays)} ${t('days')}: ${point.observed}/${point.total}${point.lift !== null ? ` · ×${point.lift.toFixed(1)}` : ''} · p ${formatP(point.p)}`;
                return (
                  <div key={point.offsetDays} className="relative flex flex-1 flex-col items-center justify-end" style={{ height: HEIGHT + 16 }} title={title} data-offset={point.offsetDays} data-observed={point.observed} data-total={point.total} data-strong={strong}>
                    <div className="w-full rounded-t" style={{ height: Math.max(1, (Math.min(lift, FULL_LIFT) / FULL_LIFT) * HEIGHT), background: strong ? 'var(--viz-1)' : 'var(--viz-axis)' }} aria-hidden="true" />
                    <span className="mt-0.5 h-4 text-[8px] leading-4 text-[var(--viz-ink-3)]">{point.offsetDays % 60 === 0 ? offsetText(point.offsetDays) : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {fill(t('Bars: how many times more often than by chance the events have the feature at each distance in days from the event (full height at {full} times or more); coloured when more than chance at p 0.05, not corrected. The chance level is the same chart at random moments of its life. To the left of 0 the pattern leads the event, to the right it follows it.'), { full: String(FULL_LIFT) })}
          </p>
        </>
      )}
    </div>
  );
}
