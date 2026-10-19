'use client';

import { useMemo, useRef, useState } from 'react';
import { DEFAULT_CALCULATION_SETTINGS, type CalculationSettings, type ChartData } from '@/types';
import { loadSavedCharts } from '@/lib/savedCharts';
import { DASHA_EVENT_CATEGORIES, DASHA_EVENT_CATEGORY_LABELS, formatEventDate, type DashaEventCategory } from '@/lib/dashaEventStore';
import { birthTimeOf, chartRequestUrl, readStoredEvents, researchSources, studyEventsOf, type ResearchSource } from '@/lib/research/studyData';
import { runStudy, type FeatureResult, type StudyChart, type StudyResult } from '@/lib/research/eventStudy';
import { FEATURE_FAMILIES, type FeatureFamily } from '@/lib/research/progressionFeatures';
import { PARAYA_BETA_BODIES, PARAYA_BODIES, type ParayaBody } from '@/lib/bnn/nadiParaya';
import { EXACT_ORB } from '@/lib/bnn/eventProgressions';
import { fill, useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';
import { BODY_CELL, Heading, HEAD_CELL, ROW } from './balaShared';
import ResearchMatrix, { Q_MARK, formatP } from './ResearchMatrix';

type Props = {
  calculationSettings?: CalculationSettings;
};

/** The label of each kind of feature, in a row: "Sa" + "in house" + "4". */
const FAMILY_LABELS: Record<FeatureFamily, string> = {
  house: 'in house',
  aspectHouse: 'aspects house',
  aspectNatal: 'aspects natal',
  exact: 'exact on natal',
};
const FIRST_ROWS = 12;

interface Finished {
  result: StudyResult;
  /** The family and the grahas the study was made with. */
  families: FeatureFamily[];
  bodies: ParayaBody[];
  /** For the list of the events of a feature: chart id and event id to the chart, the day and the event. */
  events: Map<string, { chart: string; date: string; name: string; category: DashaEventCategory }>;
  /** Charts left out for want of a place or time zone, by name. */
  failed: string[];
}

type Run = { status: 'idle' } | { status: 'running'; message: string } | { status: 'error'; message: string } | ({ status: 'done' } & Finished);

/**
 * Research: do the progressions (Paraya) have something in common at the time of the same kind of event, across several saved charts? The events are
 * those kept for each saved chart; each event's day is read for the progressing grahas' houses and aspects by sign, and set against the same chart at
 * random moments of its life, with a permutation test and a correction for looking at many features at once.
 */
export default function ResearchPanel({ calculationSettings }: Props) {
  const t = useT();
  const { code } = useGrahaNames();
  const sources = useMemo(() => researchSources(loadSavedCharts(), readStoredEvents), []);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(sources.filter(source => source.events.length > 0).map(source => source.id)));
  const [category, setCategory] = useState<'all' | DashaEventCategory>('all');
  const [tag, setTag] = useState('');
  const [families, setFamilies] = useState<readonly FeatureFamily[]>(['house', 'aspectHouse', 'aspectNatal']);
  const [bodies, setBodies] = useState<readonly ParayaBody[]>(PARAYA_BODIES);
  const [shown, setShown] = useState<FeatureFamily | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [run, setRun] = useState<Run>({ status: 'idle' });
  const fetched = useRef(new Map<string, ChartData>());

  const settings = calculationSettings ?? DEFAULT_CALCULATION_SETTINGS;
  const chosen = sources.filter(source => selected.has(source.id));
  const matches = (event: ResearchSource['events'][number]) => (category === 'all' || event.category === category) && (!tag || event.tags.includes(tag));
  const eventsOf = (source: ResearchSource) => source.events.filter(matches);
  const included = chosen.filter(source => eventsOf(source).length > 0);
  const includedEvents = included.reduce((sum, source) => sum + eventsOf(source).length, 0);
  const categoryCounts = DASHA_EVENT_CATEGORIES.map(key => ({ key, count: chosen.reduce((sum, source) => sum + source.events.filter(event => event.category === key && (!tag || event.tags.includes(tag))).length, 0) }));
  const tags = [...new Set(chosen.flatMap(source => source.events.filter(event => category === 'all' || event.category === category).flatMap(event => event.tags)))].sort((a, b) => a.localeCompare(b));
  const clients = [...new Set(sources.map(source => source.client))].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));

  const chip = (on: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
      ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
      : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;
  const toggleSource = (id: string) => setSelected(current => { const next = new Set(current); if (!next.delete(id)) next.add(id); return next; });
  const toggleFamily = (family: FeatureFamily) => setFamilies(current => (current.includes(family) ? current.filter(item => item !== family) : FEATURE_FAMILIES.filter(item => item === family || current.includes(item))));
  const toggleBody = (body: ParayaBody) => setBodies(current => (current.includes(body) ? current.filter(item => item !== body) : [...PARAYA_BODIES, ...PARAYA_BETA_BODIES].filter(item => item === body || current.includes(item))));

  const start = async (now: number) => {
    setRun({ status: 'running', message: t('Calculating the charts…') });
    setFocus(null);
    setShowAll(false);
    try {
      const failed: string[] = [];
      const charts: StudyChart[] = [];
      const events = new Map<string, Finished['events'] extends Map<string, infer V> ? V : never>();
      let done = 0;
      await Promise.all(included.map(async source => {
        const url = chartRequestUrl(source.saved, settings);
        const birthTime = birthTimeOf(source.saved);
        if (!url || birthTime === null) { failed.push(source.name); return; }
        let chart = fetched.current.get(url);
        if (!chart) {
          const response = await fetch(url);
          const json = await response.json();
          if (!response.ok || json.error) throw new Error(json.error ?? 'Request failed');
          chart = json as ChartData;
          fetched.current.set(url, chart);
        }
        const wanted = studyEventsOf(eventsOf(source));
        for (const event of wanted) events.set(`${source.id}|${event.id}`, { chart: source.name, date: formatEventDate(new Date(event.time).toISOString().slice(0, 10)), name: event.name, category: event.category as DashaEventCategory });
        charts.push({ id: source.id, name: source.name, chart, birthTime, events: wanted });
        done++;
        setRun({ status: 'running', message: `${t('Calculating the charts…')} ${done}/${included.length}` });
      }));
      // Let the message show before the work that holds the page for a moment.
      await new Promise(resolve => window.setTimeout(resolve, 0));
      setRun({ status: 'running', message: t('Comparing with chance…') });
      await new Promise(resolve => window.setTimeout(resolve, 0));
      const order = new Map(included.map((source, i) => [source.id, i]));
      charts.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      const result = runStudy(charts, {
        bodies,
        families,
        paraya: { saturn: settings.parayaSaturn ?? 'alternating', rahu: settings.parayaRahu ?? 'alternating', retro: settings.parayaRetro ?? 'previous' },
        untilTime: now,
      });
      setShown(families[0] ?? null);
      setRun({ status: 'done', result, families: [...families], bodies: [...bodies], events, failed });
    } catch (error) {
      setRun({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  };

  const done = run.status === 'done' ? run : null;
  const byId = useMemo(() => new Map((done?.result.results ?? []).map(result => [result.id, result])), [done]);
  const label = (result: Pick<FeatureResult, 'family' | 'body' | 'target'>) => (
    <>
      <span className="font-bold text-violet-600 dark:text-violet-400">{code(result.body)}</span>
      {` ${t(FAMILY_LABELS[result.family])} `}
      <span className="font-bold">{result.family === 'house' || result.family === 'aspectHouse' ? result.target : code(result.target)}</span>
    </>
  );
  const percent = (value: number, of: number) => (of > 0 ? `${Math.round((100 * value) / of)} %` : '—');
  const focused = done && focus ? byId.get(focus) : undefined;
  const rows = done ? (showAll ? done.result.results : done.result.results.slice(0, FIRST_ROWS)) : [];

  return (
    <section aria-label={t('research')} className="min-w-0 space-y-4">
      <Heading command="research.progressions">
        {t('Do the progressions (Paraya) have something in common at the time of the same kind of event, across your saved charts? Each event is read for the houses and aspects of the progressing grahas and set against the same chart at random moments of its life.')}
      </Heading>

      {sources.length === 0 ? (
        <p className="text-[10px] font-mono text-zinc-400" data-research-empty>{t('No saved charts yet. Save a chart with SAVE and add its events in TIMING → Dasha → Events.')}</p>
      ) : (
        <>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('charts')}</span>
              <button type="button" onClick={() => setSelected(new Set(sources.filter(source => source.events.length > 0).map(source => source.id)))} className={chip(false)}>{t('all with events')}</button>
              <button type="button" onClick={() => setSelected(new Set())} className={chip(false)}>{t('none')}</button>
            </div>
            <div className="space-y-1" role="group" aria-label={t('saved charts')}>
              {clients.map(client => (
                <div key={client || 'none'} className="space-y-0.5">
                  {clients.length > 1 && <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">{client || t('no client')}</div>}
                  <ul className="grid gap-x-3 gap-y-0.5 sm:grid-cols-2">
                    {sources.filter(source => source.client === client).map(source => (
                      <li key={source.id}>
                        <label className={`flex min-h-8 items-center gap-2 text-[11px] font-mono ${source.events.length === 0 ? 'text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                          <input type="checkbox" checked={selected.has(source.id)} disabled={source.events.length === 0} onChange={() => toggleSource(source.id)} className="h-4 w-4 accent-emerald-600" aria-label={source.name} />
                          <span className="min-w-0 truncate">{source.name}</span>
                          <span className="shrink-0 text-zinc-400">{source.events.length} {t('events')}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('event category')}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('events')}</span>
              <button type="button" aria-pressed={category === 'all'} onClick={() => { setCategory('all'); setTag(''); }} className={chip(category === 'all')}>{t('all')} {categoryCounts.reduce((sum, item) => sum + item.count, 0)}</button>
              {categoryCounts.filter(item => item.count > 0).map(item => (
                <button key={item.key} type="button" aria-pressed={category === item.key} onClick={() => { setCategory(item.key); setTag(''); }} className={chip(category === item.key)}>{t(DASHA_EVENT_CATEGORY_LABELS[item.key])} {item.count}</button>
              ))}
              {tags.length > 0 && (
                <select value={tag} onChange={event => setTag(event.target.value)} aria-label={t('event tag')} className="rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] font-mono dark:border-zinc-700 dark:bg-zinc-800">
                  <option value="">{t('any tag')}</option>
                  {tags.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('features')}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('features')}</span>
              {FEATURE_FAMILIES.map(family => (
                <button key={family} type="button" aria-pressed={families.includes(family)} onClick={() => toggleFamily(family)} className={chip(families.includes(family))}>{t(FAMILY_LABELS[family])}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('progressing grahas')}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('grahas')}</span>
              {PARAYA_BODIES.map(body => <button key={body} type="button" aria-pressed={bodies.includes(body)} title={body} onClick={() => toggleBody(body)} className={chip(bodies.includes(body))}>{code(body)}</button>)}
              <span className="ml-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('beta')}</span>
              {PARAYA_BETA_BODIES.map(body => <button key={body} type="button" aria-pressed={bodies.includes(body)} title={body} onClick={() => toggleBody(body)} className={chip(bodies.includes(body))}>{code(body)}</button>)}
            </div>
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{fill(t('A house is counted from the ascendant, so charts with different ascendants can be compared. "Aspects" are by sign (the same sign, or the 5th, 7th or 9th from it); "exact" is within {orb}° of the natal degree.'), { orb: String(EXACT_ORB) })}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { void start(Date.now()); }}
              disabled={includedEvents === 0 || families.length === 0 || bodies.length === 0 || run.status === 'running'}
              className="rounded-md border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-[11px] font-mono text-white disabled:opacity-40 dark:border-green-600 dark:bg-green-600"
            >
              {t('Run the comparison')}
            </button>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400" data-research-selection>{includedEvents} {t('events')} · {included.length} {t('charts')}</span>
            {run.status === 'running' && <span className="text-[10px] font-mono text-zinc-400" role="status">{run.message}</span>}
            {run.status === 'error' && <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400" role="alert">{t('Could not calculate:')} {run.message}</span>}
          </div>
        </>
      )}

      {done && (
        <div className="space-y-3" data-research-result>
          <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200" data-research-summary>
            {done.result.events} {t('events')} · {done.result.charts} {t('charts')} · {done.result.tested} {t('features tested')}
          </p>
          {done.result.events < 15 && <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{t('Few events: only a very strong pattern can show in so few, and any pattern here is only a hint.')}</p>}
          {done.result.skipped > 0 && <p className="text-[10px] font-mono text-zinc-400">{fill(t('{count} events before the birth of their chart were left out.'), { count: String(done.result.skipped) })}</p>}
          {done.failed.length > 0 && <p className="text-[10px] font-mono text-zinc-400">{t('Left out for want of a place or time zone:')} {done.failed.join(', ')}</p>}
          {done.result.events === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('No events to compare.')}</p>}

          {done.result.events > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('shown in the matrix')}>
                {done.families.map(family => <button key={family} type="button" aria-pressed={shown === family} onClick={() => setShown(family)} className={chip(shown === family)}>{t(FAMILY_LABELS[family])}</button>)}
              </div>
              {shown && <ResearchMatrix family={shown} bodies={done.bodies} results={byId} total={done.result.events} focus={focus} onFocus={setFocus} />}
              <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                {t('Each cell is the number of events with that feature. Shade: how many times more often than by chance (none at or under the chance level, darkest at three times or more). Bold and underlined: still more than chance after the correction for the number of features looked at (q at most 0.1). Click a cell to list its events.')}
              </p>

              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('most unusual first')}</div>
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
                      {rows.map(result => (
                        <tr key={result.id} className={`${ROW} cursor-pointer ${focus === result.id ? 'bg-violet-50 dark:bg-violet-950/20' : ''}`} data-feature={result.id} onClick={() => setFocus(focus === result.id ? null : result.id)}>
                          <td className={BODY_CELL}>{label(result)}</td>
                          <td className={BODY_CELL}>{result.observed}/{done.result.events} <span className="text-zinc-400">{percent(result.observed, done.result.events)}</span></td>
                          <td className={BODY_CELL}>{result.expected.toFixed(1)} <span className="text-zinc-400">{percent(result.expected, done.result.events)}</span></td>
                          <td className={BODY_CELL}>{result.lift === null ? '—' : result.lift.toFixed(1)}</td>
                          <td className={BODY_CELL}>{formatP(result.p)}</td>
                          <td className={`${BODY_CELL} ${result.q <= Q_MARK ? 'font-bold text-emerald-700 dark:text-green-400' : ''}`}>{formatP(result.q)}{result.q <= Q_MARK && ' ✓'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {done.result.results.length > FIRST_ROWS && (
                  <button type="button" onClick={() => setShowAll(v => !v)} className="text-[10px] font-mono text-emerald-700 dark:text-green-400">
                    {showAll ? t('show fewer') : `${t('show all')} ${done.result.results.length}`}
                  </button>
                )}
                <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                  {t('p is the chance that as many events would have the feature if they were moved to random moments of their own chart (a permutation test); q corrects p for the number of features looked at, because among many some always look striking by chance. This shows what the events have in common, not why; a handful of events can only hint.')}
                </p>
              </div>

              {focused && (
                <div className="space-y-1 rounded border border-violet-200 bg-violet-50/40 p-2 dark:border-violet-900 dark:bg-violet-950/10" data-research-focus={focused.id}>
                  <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200">{label(focused)} · {focused.observed} {t('events')}</div>
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {focused.events.map(item => {
                      const info = done.events.get(`${item.chartId}|${item.eventId}`);
                      return info ? (
                        <li key={`${item.chartId}|${item.eventId}`} className="flex flex-wrap items-baseline gap-x-3 py-1 text-[11px] font-mono" data-research-event>
                          <span className="w-20 shrink-0 text-zinc-500 dark:text-zinc-400">{info.date}</span>
                          <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">{info.name}</span>
                          <span className="text-zinc-400">{info.chart}</span>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
