'use client';

import { useMemo, useRef, useState } from 'react';
import { DEFAULT_CALCULATION_SETTINGS, type CalculationSettings, type ChartData } from '@/types';
import { loadSavedCharts } from '@/lib/savedCharts';
import { DASHA_EVENT_CATEGORIES, DASHA_EVENT_CATEGORY_LABELS, type DashaEventCategory, type StoredDashaEvent } from '@/lib/dashaEventStore';
import { birthTimeOf, chartRequestUrl, readStoredEvents, researchSources, studyEventsOf } from '@/lib/research/studyData';
import { eventFeatures, runStudy, type FeatureKind, type StudyChart, type StudyOptions } from '@/lib/research/eventStudy';
import { compareGroups } from '@/lib/research/groupStudy';
import { FEATURE_SOURCES, familiesOf, featureId, kindId, targetKindOf, type FeatureFamily, type FeatureSource } from '@/lib/research/features';
import { GRAHA_DASHA_SYSTEMS, type GrahaDashaSystem } from '@/lib/dashaEvents';
import { transitSeriesUrl } from '@/lib/apiParams';
import { DAY_MS } from '@/lib/time';
import type { LongitudeSeries } from '@/lib/transitHits';
import { PARAYA_BETA_BODIES, PARAYA_BODIES, type ParayaBody } from '@/lib/bnn/nadiParaya';
import { EXACT_ORB } from '@/lib/bnn/eventProgressions';
import { PROGRESSION_NATAL } from '@/lib/bnn/parayaProgression';
import { fill, useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';
import { Heading } from './balaShared';
import ResearchResults, { type ChanceOutcome } from './ResearchResults';
import ResearchGroups, { type GroupOutcome } from './ResearchGroups';
import { FAMILY_LABELS, SOURCE_LABELS, WINDOWS, chip } from './researchUi';

type Props = {
  calculationSettings?: CalculationSettings;
};

type Mode = 'chance' | 'groups';
type Filter = { category: 'all' | DashaEventCategory; tag: string };
type Hypothesis = { on: boolean; source: FeatureSource; family: FeatureFamily; body: string; target: string };

type Run =
  | { status: 'idle' }
  | { status: 'running'; message: string }
  | { status: 'error'; message: string }
  | { status: 'chance'; outcome: ChanceOutcome }
  | { status: 'groups'; outcome: GroupOutcome };

const HOUSES = Array.from({ length: 12 }, (_, i) => String(i + 1));
/** The nine grahas, which can be daśā lords; the four whose transits are looked at; the days either side of the first birth that the sky is sampled for. */
const NINE = PROGRESSION_NATAL.filter(name => name !== 'Asc');
const SLOW = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];
const SKY_MARGIN_DAYS = 200;
const SKY_STEP_DAYS = 3;
const DEFAULT_KINDS = ['paraya|house', 'paraya|aspectHouse', 'paraya|aspectNatal'];
const matches = (event: StoredDashaEvent, filter: Filter) => (filter.category === 'all' || event.category === filter.category) && (!filter.tag || event.tags.includes(filter.tag));
const filterLabel = (filter: Filter, t: (text: string) => string) => [filter.category === 'all' ? t('all') : t(DASHA_EVENT_CATEGORY_LABELS[filter.category]), filter.tag].filter(Boolean).join(' · ');

/**
 * Research: do the progressions (Paraya) have something in common at the time of the same kind of event, across several saved charts? The events are
 * those kept for each saved chart; each event's day (or a window around it) is read for the progressing grahas' houses and aspects by sign, and either set
 * against the same chart at random moments of its life, with a permutation test and a correction for looking at many features at once, or compared with a
 * second set of events.
 */
export default function ResearchPanel({ calculationSettings }: Props) {
  const t = useT();
  const { code } = useGrahaNames();
  const sources = useMemo(() => researchSources(loadSavedCharts(), readStoredEvents), []);
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(sources.filter(source => source.events.length > 0).map(source => source.id)));
  const [mode, setMode] = useState<Mode>('chance');
  const [filter, setFilter] = useState<Filter>({ category: 'all', tag: '' });
  const [filterB, setFilterB] = useState<Filter>({ category: 'all', tag: '' });
  const [windowDays, setWindowDays] = useState<number>(0);
  const [kinds, setKinds] = useState<ReadonlySet<string>>(() => new Set(DEFAULT_KINDS));
  const [dashaSystem, setDashaSystem] = useState<GrahaDashaSystem>('vimshottari');
  const [bodies, setBodies] = useState<readonly ParayaBody[]>(PARAYA_BODIES);
  const [hypothesis, setHypothesis] = useState<Hypothesis>({ on: false, source: 'paraya', family: 'house', body: 'Saturn', target: '4' });
  const [run, setRun] = useState<Run>({ status: 'idle' });
  const [runs, setRuns] = useState(0);
  const fetched = useRef(new Map<string, ChartData>());
  const sky = useRef(new Map<string, Record<string, LongitudeSeries>>());

  const settings = calculationSettings ?? DEFAULT_CALCULATION_SETTINGS;
  const chosen = sources.filter(source => selected.has(source.id));
  const grouped = mode === 'groups';
  // In the comparison of two sets, an event that fits both belongs to the first.
  const groupOf = (event: StoredDashaEvent): 'a' | 'b' | null => (matches(event, filter) ? 'a' : grouped && matches(event, filterB) ? 'b' : null);
  const counts = { a: 0, b: 0 };
  const includedCharts = new Set<string>();
  for (const source of chosen) for (const event of source.events) {
    const group = groupOf(event);
    if (group) { counts[group]++; includedCharts.add(source.id); }
  }
  const includedEvents = counts.a + counts.b;
  const ready = grouped ? counts.a > 0 && counts.b > 0 : counts.a > 0;
  const categoryCountsFor = (current: Filter) => DASHA_EVENT_CATEGORIES.map(key => ({ key, count: chosen.reduce((sum, source) => sum + source.events.filter(event => event.category === key && (!current.tag || event.tags.includes(current.tag))).length, 0) }));
  const tagsFor = (current: Filter) => [...new Set(chosen.flatMap(source => source.events.filter(event => current.category === 'all' || event.category === current.category).flatMap(event => event.tags)))].sort((a, b) => a.localeCompare(b));
  const clients = [...new Set(sources.map(source => source.client))].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));

  const toggleSource = (id: string) => setSelected(current => { const next = new Set(current); if (!next.delete(id)) next.add(id); return next; });
  const kindList: FeatureKind[] = FEATURE_SOURCES.flatMap(source => familiesOf(source).filter(family => kinds.has(kindId(source, family))).map(family => ({ source, family })));
  const toggleKind = (source: FeatureSource, family: FeatureFamily) => setKinds(current => { const next = new Set(current); const id = kindId(source, family); if (!next.delete(id)) next.add(id); return next; });
  const toggleBody = (body: ParayaBody) => setBodies(current => (current.includes(body) ? current.filter(item => item !== body) : [...PARAYA_BODIES, ...PARAYA_BETA_BODIES].filter(item => item === body || current.includes(item))));
  const targetKind = targetKindOf(hypothesis.family);
  const targets = targetKind === 'house' ? HOUSES : targetKind === 'natal' ? [...PROGRESSION_NATAL] : ['*'];
  const hypothesisBodies = hypothesis.source === 'dasha' ? NINE : hypothesis.source === 'transit' ? SLOW : [...PARAYA_BODIES, ...PARAYA_BETA_BODIES];
  const setHypothesisSource = (source: FeatureSource) => setHypothesis(current => {
    const family = familiesOf(source)[0];
    const kind = targetKindOf(family);
    return { ...current, source, family, body: source === 'dasha' ? 'Jupiter' : 'Saturn', target: kind === 'house' ? '4' : kind === 'natal' ? 'Moon' : '*' };
  });
  const setHypothesisFamily = (family: FeatureFamily) => setHypothesis(current => ({ ...current, family, target: targetKindOf(family) === 'house' ? '4' : targetKindOf(family) === 'natal' ? 'Moon' : '*' }));

  const start = async (now: number) => {
    setRun({ status: 'running', message: t('Calculating the charts…') });
    setRuns(count => count + 1);
    try {
      const failed: string[] = [];
      const charts: StudyChart[] = [];
      const info = new Map<string, { chart: string; time: number; name: string; category: string; tags: string[] }>();
      const group = new Map<string, 'a' | 'b'>();
      let done = 0;
      const included = chosen.filter(source => source.events.some(event => groupOf(event)));
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
        const events = studyEventsOf(source.events.filter(event => groupOf(event)));
        for (const event of events) {
          const stored = source.events.find(item => item.id === event.id);
          info.set(`${source.id}|${event.id}`, { chart: source.name, time: event.time, name: event.name, category: event.category, tags: event.tags });
          const which = stored ? groupOf(stored) : null;
          if (which) group.set(`${source.id}|${event.id}`, which);
        }
        charts.push({ id: source.id, name: source.name, chart, birthTime, events });
        done++;
        setRun({ status: 'running', message: `${t('Calculating the charts…')} ${done}/${included.length}` });
      }));
      const order = new Map(included.map((source, i) => [source.id, i]));
      charts.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      // A feature chosen beforehand is always among those looked at.
      const wanted = !grouped && hypothesis.on;
      const useKinds: FeatureKind[] = wanted && !kinds.has(kindId(hypothesis.source, hypothesis.family))
        ? FEATURE_SOURCES.flatMap(source => familiesOf(source).filter(family => (source === hypothesis.source && family === hypothesis.family) || kinds.has(kindId(source, family))).map(family => ({ source, family })))
        : kindList;
      const needsBody = wanted && hypothesis.source !== 'dasha' && !bodies.includes(hypothesis.body as ParayaBody);
      const useBodies = needsBody ? [...PARAYA_BODIES, ...PARAYA_BETA_BODIES].filter(item => item === hypothesis.body || bodies.includes(item)) : [...bodies];

      // The sky of the transits is the same for every chart: one table of the slow grahas from the first birth to now, sampled every few days.
      let transitSeries: Record<string, LongitudeSeries> | undefined;
      if (useKinds.some(kind => kind.source === 'transit') && charts.length > 0) {
        setRun({ status: 'running', message: t('Calculating the transits…') });
        const first = Math.min(...charts.map(item => item.birthTime)) - SKY_MARGIN_DAYS * DAY_MS;
        const startDay = new Date(first).toISOString().slice(0, 10);
        const days = Math.ceil((now - Date.parse(`${startDay}T00:00:00Z`)) / DAY_MS) + 400;
        const url = transitSeriesUrl(startDay, days, SLOW, settings, SKY_STEP_DAYS);
        transitSeries = sky.current.get(url);
        if (!transitSeries) {
          const response = await fetch(url);
          const json = await response.json();
          if (!response.ok || json.error) throw new Error(json.error ?? 'Request failed');
          transitSeries = Object.fromEntries(Object.entries(json.series as Record<string, { step: number; longitudes: number[] }>).map(([body, sample]) => [body, { start: json.start as number, step: sample.step, longitudes: sample.longitudes }]));
          sky.current.set(url, transitSeries);
        }
      }
      await new Promise(resolve => window.setTimeout(resolve, 0));
      setRun({ status: 'running', message: grouped ? t('Comparing the two sets…') : t('Comparing with chance…') });
      await new Promise(resolve => window.setTimeout(resolve, 0));
      const options: StudyOptions = {
        bodies: useBodies,
        kinds: useKinds,
        paraya: { saturn: settings.parayaSaturn ?? 'alternating', rahu: settings.parayaRahu ?? 'alternating', retro: settings.parayaRetro ?? 'previous' },
        transitSeries,
        dashaSystem,
        untilTime: now,
        windowDays,
      };
      if (grouped) {
        const { events, skipped } = eventFeatures(charts, options);
        const inA = events.filter(item => group.get(`${item.chartId}|${item.event.id}`) === 'a');
        const inB = events.filter(item => group.get(`${item.chartId}|${item.event.id}`) === 'b');
        setRun({ status: 'groups', outcome: { comparison: compareGroups(inA, inB), labels: { a: filterLabel(filter, t), b: filterLabel(filterB, t) }, events, groupOf: group, info, windowDays, skipped, failed } });
      } else {
        const result = runStudy(charts, options);
        setRun({ status: 'chance', outcome: { result, kinds: useKinds, bodies: useBodies, windowDays, hypothesis: wanted ? featureId(hypothesis.source, hypothesis.family, hypothesis.body, hypothesis.target) : null, info, failed } });
      }
    } catch (error) {
      setRun({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  };

  /** The choice of the kind of event: its category and tag. */
  const filterControls = (current: Filter, set: (next: Filter) => void, label: string) => {
    const categoryCounts = categoryCountsFor(current);
    const tags = tagsFor(current);
    return (
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={label}>
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{label}</span>
        <button type="button" aria-pressed={current.category === 'all'} onClick={() => set({ category: 'all', tag: '' })} className={chip(current.category === 'all')}>{t('all')} {categoryCounts.reduce((sum, item) => sum + item.count, 0)}</button>
        {categoryCounts.filter(item => item.count > 0).map(item => (
          <button key={item.key} type="button" aria-pressed={current.category === item.key} onClick={() => set({ category: item.key, tag: '' })} className={chip(current.category === item.key)}>{t(DASHA_EVENT_CATEGORY_LABELS[item.key])} {item.count}</button>
        ))}
        {tags.length > 0 && (
          <select value={current.tag} onChange={event => set({ ...current, tag: event.target.value })} aria-label={`${t('event tag')} ${label}`} className="rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] font-mono dark:border-zinc-700 dark:bg-zinc-800">
            <option value="">{t('any tag')}</option>
            {tags.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
      </div>
    );
  };
  const select = 'rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] font-mono dark:border-zinc-700 dark:bg-zinc-800';

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

          <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('kind of comparison')}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('compare')}</span>
            <button type="button" aria-pressed={mode === 'chance'} onClick={() => { setMode('chance'); setRun({ status: 'idle' }); }} className={chip(mode === 'chance')}>{t('with chance')}</button>
            <button type="button" aria-pressed={mode === 'groups'} onClick={() => { setMode('groups'); setRun({ status: 'idle' }); }} className={chip(mode === 'groups')}>{t('two kinds of event')}</button>
          </div>

          <div className="space-y-1">
            {filterControls(filter, setFilter, grouped ? t('first group') : t('events'))}
            {grouped && filterControls(filterB, setFilterB, t('second group'))}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('window around an event')}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('window')}</span>
              {WINDOWS.map(days => (
                <button key={days} type="button" aria-pressed={windowDays === days} onClick={() => setWindowDays(days)} className={chip(windowDays === days)}>{days === 0 ? t('the day') : `±${days} ${t('days')}`}</button>
              ))}
            </div>
            <div className="space-y-1" role="group" aria-label={t('features')}>
              {FEATURE_SOURCES.map(source => (
                <div key={source} className="flex flex-wrap items-center gap-1" role="group" aria-label={t(SOURCE_LABELS[source])}>
                  <span className="w-24 shrink-0 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t(SOURCE_LABELS[source])}</span>
                  {familiesOf(source).map(family => {
                    const on = kinds.has(kindId(source, family));
                    return <button key={family} type="button" aria-pressed={on} onClick={() => toggleKind(source, family)} className={chip(on)}>{t(FAMILY_LABELS[family])}</button>;
                  })}
                </div>
              ))}
              {kindList.some(kind => kind.source === 'dasha') && (
                <label className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  {t('daśā system')}
                  <select value={dashaSystem} onChange={event => setDashaSystem(event.target.value as GrahaDashaSystem)} aria-label={t('daśā system')} className={select}>
                    {GRAHA_DASHA_SYSTEMS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>
                </label>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('progressing grahas')}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('grahas')}</span>
              {PARAYA_BODIES.map(body => <button key={body} type="button" aria-pressed={bodies.includes(body)} title={body} onClick={() => toggleBody(body)} className={chip(bodies.includes(body))}>{code(body)}</button>)}
              <span className="ml-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('beta')}</span>
              {PARAYA_BETA_BODIES.map(body => <button key={body} type="button" aria-pressed={bodies.includes(body)} title={body} onClick={() => toggleBody(body)} className={chip(bodies.includes(body))}>{code(body)}</button>)}
            </div>
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('The transits are those of Jupiter, Saturn, Rahu and Ketu (sampled every three days); of the daśā every lord is looked at, whichever grahas are chosen here.')}</p>
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
              {fill(t('A house is counted from the ascendant, so charts with different ascendants can be compared. "Aspects" are by sign (the same sign, or the 5th, 7th or 9th from it); "exact" is within {orb}° of the natal degree, or, over a window, an exact hit inside it.'), { orb: String(EXACT_ORB) })}
            </p>
          </div>

          {!grouped && (
            <div className="space-y-1 rounded border border-zinc-200 p-2 dark:border-zinc-700" role="group" aria-label={t('a feature chosen beforehand')}>
              <label className="flex items-center gap-2 text-[11px] font-mono text-zinc-700 dark:text-zinc-200">
                <input type="checkbox" checked={hypothesis.on} onChange={event => setHypothesis(current => ({ ...current, on: event.target.checked }))} className="h-4 w-4 accent-emerald-600" />
                {t('Test one feature chosen beforehand')}
              </label>
              {hypothesis.on && (
                <div className="flex flex-wrap items-center gap-1">
                  <select value={hypothesis.source} onChange={event => setHypothesisSource(event.target.value as FeatureSource)} aria-label={t('source of the feature')} className={select}>
                    {FEATURE_SOURCES.map(source => <option key={source} value={source}>{t(SOURCE_LABELS[source])}</option>)}
                  </select>
                  <select value={hypothesis.body} onChange={event => setHypothesis(current => ({ ...current, body: event.target.value }))} aria-label={t('graha of the feature')} className={select}>
                    {hypothesisBodies.map(body => <option key={body} value={body}>{code(body)} · {body}</option>)}
                  </select>
                  <select value={hypothesis.family} onChange={event => setHypothesisFamily(event.target.value as FeatureFamily)} aria-label={t('kind of the feature')} className={select}>
                    {familiesOf(hypothesis.source).map(family => <option key={family} value={family}>{t(FAMILY_LABELS[family])}</option>)}
                  </select>
                  {targetKind !== 'none' && (
                    <select value={hypothesis.target} onChange={event => setHypothesis(current => ({ ...current, target: event.target.value }))} aria-label={t('house or natal point of the feature')} className={select}>
                      {targets.map(target => <option key={target} value={target}>{targetKind === 'house' ? target : `${code(target)} · ${target}`}</option>)}
                    </select>
                  )}
                </div>
              )}
              <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('Choose it before you run: a feature picked out of the results after looking at them would need the correction for all the others.')}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { void start(Date.now()); }}
              disabled={!ready || kindList.length === 0 || bodies.length === 0 || run.status === 'running'}
              className="rounded-md border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-[11px] font-mono text-white disabled:opacity-40 dark:border-green-600 dark:bg-green-600"
            >
              {t('Run the comparison')}
            </button>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400" data-research-selection>
              {grouped ? `${counts.a} + ${counts.b} ${t('events')} · ${includedCharts.size} ${t('charts')}` : `${includedEvents} ${t('events')} · ${includedCharts.size} ${t('charts')}`}
            </span>
            {run.status === 'running' && <span className="text-[10px] font-mono text-zinc-400" role="status">{run.message}</span>}
            {run.status === 'error' && <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400" role="alert">{t('Could not calculate:')} {run.message}</span>}
          </div>
          {grouped && counts.a > 0 && counts.b === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('The second group has no events of its own: choose a kind of event that differs from the first.')}</p>}
        </>
      )}

      {run.status === 'chance' && <ResearchResults key={runs} outcome={run.outcome} />}
      {run.status === 'groups' && <ResearchGroups key={runs} outcome={run.outcome} />}
    </section>
  );
}
