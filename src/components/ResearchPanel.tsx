'use client';

import { useMemo, useRef, useState } from 'react';
import { DEFAULT_CALCULATION_SETTINGS, type CalculationSettings, type ChartData } from '@/types';
import { loadSavedCharts } from '@/lib/savedCharts';
import { DASHA_EVENT_CATEGORIES, DASHA_EVENT_CATEGORY_LABELS, formatEventDate, type DashaEventCategory, type StoredDashaEvent } from '@/lib/dashaEventStore';
import { birthTimeOf, chartRequestUrl, readStoredEvents, researchSources, studyEventsOf } from '@/lib/research/studyData';
import { eventFeatures, runStudy, type FeatureKind, type StudyChart, type StudyOptions, type WindowChoice } from '@/lib/research/eventStudy';
import { runControlStudy } from '@/lib/research/controlStudy';
import { comboStudy, type ComboSpec } from '@/lib/research/combos';
import { fitJointModel } from '@/lib/research/jointModel';
import { timeProfile } from '@/lib/research/timeProfile';
import type { RunSettings } from '@/lib/research/researchRuns';
import { validateStudy, type SplitBy } from '@/lib/research/validation';
import { compareParayaSettings } from '@/lib/research/settingsStudy';
import { compareGroups } from '@/lib/research/groupStudy';
import { eventMatches, filterWords, type EventFilter } from '@/lib/research/eventFilter';
import { FEATURE_SOURCES, TARGET_LISTS, familiesOf, featureId, kindId, targetKindOf, type FeatureFamily, type FeatureSource } from '@/lib/research/features';
import { GRAHA_DASHA_SYSTEMS, type GrahaDashaSystem } from '@/lib/dashaEvents';
import { transitSeriesUrl } from '@/lib/apiParams';
import { DAY_MS } from '@/lib/time';
import type { LongitudeSeries } from '@/lib/transitHits';
import { PARAYA_BETA_BODIES, PARAYA_BODIES, type ParayaBody } from '@/lib/bnn/nadiParaya';
import { EXACT_ORB } from '@/lib/bnn/eventProgressions';
import { PROGRESSION_NATAL } from '@/lib/bnn/parayaProgression';
import { saveFile } from '@/lib/download';
import { APP_VERSION } from '@/lib/config';
import { fill, useLanguage, useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';
import { Heading } from './balaShared';
import ResearchResults, { type ChanceOutcome } from './ResearchResults';
import ResearchGroups, { type GroupOutcome } from './ResearchGroups';
import ResearchValidation, { type ValidationOutcome } from './ResearchValidation';
import ResearchSettings, { type SettingsOutcome } from './ResearchSettings';
import ResearchCombos, { kindText, type ComboOutcome } from './ResearchCombos';
import ResearchModel, { type ModelOutcome } from './ResearchModel';
import ResearchRuns from './ResearchRuns';
import ResearchHitFinder from './ResearchHitFinder';
import ResearchEventRelations from './ResearchEventRelations';
import { buildReport, type ReportBody, type ReportContext } from './researchReport';
import { FAMILY_LABELS, SOURCE_LABELS, WINDOWS, chip } from './researchUi';

type Props = {
  calculationSettings?: CalculationSettings;
};

type Mode = 'chance' | 'groups' | 'validate' | 'settings' | 'combine' | 'model';
type Filter = EventFilter & { category: 'all' | DashaEventCategory };
type Hypothesis = { on: boolean; source: FeatureSource; family: FeatureFamily; body: string; target: string };

type Run =
  | { status: 'idle' }
  | { status: 'running'; message: string }
  | { status: 'error'; message: string }
  | { status: 'chance'; outcome: ChanceOutcome }
  | { status: 'groups'; outcome: GroupOutcome }
  | { status: 'validate'; outcome: ValidationOutcome }
  | { status: 'settings'; outcome: SettingsOutcome }
  | { status: 'combine'; outcome: ComboOutcome }
  | { status: 'model'; outcome: ModelOutcome };

const HOUSES = Array.from({ length: 12 }, (_, i) => String(i + 1));
/** The nine grahas, which can be daśā lords; the four whose transits are looked at; the days either side of the first birth that the sky is sampled for. */
const NINE = PROGRESSION_NATAL.filter(name => name !== 'Asc');
const SLOW = ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];
/** The grahas a gochara feature is looked at for: the rules are Saturn's, the favourable houses and the bindus those of Jupiter and Saturn. */
const gocharaBodiesOf = (family: FeatureFamily) => (family === 'rule' ? ['Saturn'] : family === 'favourable' || family === 'bindu' ? ['Jupiter', 'Saturn'] : SLOW);
/** The first target of a family. */
const firstTargetOf = (family: FeatureFamily) => { const kind = targetKindOf(family); return kind === 'house' ? '4' : kind === 'natal' ? 'Moon' : kind === 'list' ? TARGET_LISTS[family as keyof typeof TARGET_LISTS][0] : '*'; };
/** The shares of the data that can go to the training, and how many of its best features are carried over, in the check on a part not looked at. */
/** What the named targets of the gochara are called in a list. */
const LIST_TARGET_LABELS: Record<string, string> = {
  favourable: 'favourable', unfavourable: 'unfavourable', strong: 'strong', average: 'average', weak: 'weak', high: 'high', low: 'low',
  sadeSati: 'Sade Sati', kantaka: 'Saturn 4th from the Moon (kantaka)', ashtama: 'Saturn 8th from the Moon (ashtama)',
};
/** Every kind of feature, for choosing the two parts of a combination. */
const ALL_KINDS: FeatureKind[] = FEATURE_SOURCES.flatMap(source => familiesOf(source).map(family => ({ source, family })));
const kindFromId = (id: string): FeatureKind => ALL_KINDS.find(kind => kindId(kind.source, kind.family) === id) ?? ALL_KINDS[0];
/** The fewest charts for taking the other charts at the same moment as the chance level: each event then has at least two to be compared with. */
const MIN_CONTROL_CHARTS = 3;
const SHARES = [0.5, 0.6, 0.7];
const TOPS = [5, 10, 20];
const hasSky = (kind: FeatureKind) => kind.source === 'transit' || kind.source === 'gochara';
const SKY_MARGIN_DAYS = 200;
const SKY_STEP_DAYS = 3;
const DEFAULT_KINDS = ['paraya|house', 'paraya|aspectHouse', 'paraya|aspectNatal'];
const matches = (event: StoredDashaEvent, filter: Filter) => eventMatches(event, filter);
/** A set of events in words, for the heading of its column: the category, the tag and the words asked for, or "all". */
const filterLabel = (filter: Filter, t: (text: string) => string) => [filter.category === 'all' ? '' : t(DASHA_EVENT_CATEGORY_LABELS[filter.category]), ...filterWords({ ...filter, category: 'all' })].filter(Boolean).join(' · ') || t('all');
const NO_FILTER: Filter = { category: 'all', tag: '', text: '' };

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
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const [filterB, setFilterB] = useState<Filter>(NO_FILTER);
  const [windowDays, setWindowDays] = useState<WindowChoice>(0);
  const [split, setSplit] = useState<{ by: SplitBy; share: number; top: number; seed: number }>({ by: 'charts', share: 0.6, top: 10, seed: 1 });
  const [control, setControl] = useState<'life' | 'others'>('life');
  const [combo, setCombo] = useState<{ left: string; right: string; sameGraha: boolean }>({ left: 'dasha|mdGraha', right: 'gochara|fromMoon', sameGraha: true });
  const [kinds, setKinds] = useState<ReadonlySet<string>>(() => new Set(DEFAULT_KINDS));
  const [dashaSystem, setDashaSystem] = useState<GrahaDashaSystem>('vimshottari');
  const [bodies, setBodies] = useState<readonly ParayaBody[]>(PARAYA_BODIES);
  const [hypothesis, setHypothesis] = useState<Hypothesis>({ on: false, source: 'paraya', family: 'house', body: 'Saturn', target: '4' });
  const [run, setRun] = useState<Run>({ status: 'idle' });
  const [showHitFinder, setShowHitFinder] = useState(false);
  const [showEventRelations, setShowEventRelations] = useState(false);
  const [runs, setRuns] = useState(0);
  const language = useLanguage();
  /** What the last run was run on, for the report. */
  const [reportContext, setReportContext] = useState<ReportContext | null>(null);
  const fetched = useRef(new Map<string, ChartData>());
  const sky = useRef(new Map<string, Record<string, LongitudeSeries>>());

  const settings = calculationSettings ?? DEFAULT_CALCULATION_SETTINGS;
  const chosen = sources.filter(source => selected.has(source.id));
  const grouped = mode === 'groups';
  const settingsMode = mode === 'settings';
  const comboMode = mode === 'combine';
  const needsSplit = mode === 'validate' || mode === 'model';
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
  const categoryCountsFor = (current: Filter) => DASHA_EVENT_CATEGORIES.map(key => ({ key, count: chosen.reduce((sum, source) => sum + source.events.filter(event => event.category === key && eventMatches(event, { ...current, category: 'all' })).length, 0) }));
  const tagsFor = (current: Filter) => [...new Set(chosen.flatMap(source => source.events.filter(event => eventMatches(event, { ...current, tag: '' })).flatMap(event => event.tags)))].sort((a, b) => a.localeCompare(b));
  /** The events of a group, as the preview lists them: the chart, the day and the name, in the order of the days. */
  const chosenOf = (which: 'a' | 'b') => chosen.flatMap(source => source.events.filter(event => groupOf(event) === which).map(event => ({ id: `${source.id}|${event.id}`, chart: source.name, day: event.date, date: formatEventDate(event.date), name: event.name, category: event.category }))).sort((a, b) => a.day.localeCompare(b.day) || a.chart.localeCompare(b.chart));
  const clients = [...new Set(sources.map(source => source.client))].sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));

  const toggleSource = (id: string) => setSelected(current => { const next = new Set(current); if (!next.delete(id)) next.add(id); return next; });
  const kindList: FeatureKind[] = FEATURE_SOURCES.flatMap(source => familiesOf(source).filter(family => kinds.has(kindId(source, family))).map(family => ({ source, family })));
  const toggleKind = (source: FeatureSource, family: FeatureFamily) => setKinds(current => { const next = new Set(current); const id = kindId(source, family); if (!next.delete(id)) next.add(id); return next; });
  const toggleBody = (body: ParayaBody) => setBodies(current => (current.includes(body) ? current.filter(item => item !== body) : [...PARAYA_BODIES, ...PARAYA_BETA_BODIES].filter(item => item === body || current.includes(item))));
  const targetKind = targetKindOf(hypothesis.family);
  const targets = targetKind === 'house' ? HOUSES : targetKind === 'natal' ? [...PROGRESSION_NATAL] : targetKind === 'list' ? [...TARGET_LISTS[hypothesis.family as keyof typeof TARGET_LISTS]] : ['*'];
  const hypothesisBodies = hypothesis.source === 'dasha' ? NINE : hypothesis.source === 'transit' ? SLOW : hypothesis.source === 'gochara' ? gocharaBodiesOf(hypothesis.family) : [...PARAYA_BODIES, ...PARAYA_BETA_BODIES];
  const setHypothesisSource = (source: FeatureSource) => setHypothesis(current => {
    const family = familiesOf(source)[0];
    return { ...current, source, family, body: source === 'dasha' ? 'Jupiter' : 'Saturn', target: firstTargetOf(family) };
  });
  const setHypothesisFamily = (family: FeatureFamily) => setHypothesis(current => ({
    ...current,
    family,
    body: current.source === 'gochara' && !gocharaBodiesOf(family).includes(current.body) ? 'Saturn' : current.body,
    target: firstTargetOf(family),
  }));

  /** The run on the screen as the report takes it, or null when there is none. */
  const report: ReportBody | null = run.status === 'chance' ? { mode: 'chance', outcome: run.outcome }
    : run.status === 'groups' ? { mode: 'groups', outcome: run.outcome }
    : run.status === 'validate' ? { mode: 'validate', outcome: run.outcome }
    : run.status === 'settings' ? { mode: 'settings', outcome: run.outcome }
    : run.status === 'combine' ? { mode: 'combine', outcome: run.outcome }
    : run.status === 'model' ? { mode: 'model', outcome: run.outcome }
    : null;

  const start = async (now: number, seed = split.seed) => {
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
      const wanted = mode === 'chance' && hypothesis.on;
      const wantedKinds: FeatureKind[] = wanted && !kinds.has(kindId(hypothesis.source, hypothesis.family))
        ? FEATURE_SOURCES.flatMap(source => familiesOf(source).filter(family => (source === hypothesis.source && family === hypothesis.family) || kinds.has(kindId(source, family))).map(family => ({ source, family })))
        : kindList;
      // Only the progressions depend on their settings: the others are not looked at when the settings are compared.
      const useKinds = comboMode ? [kindFromId(combo.left), kindFromId(combo.right)] : settingsMode ? wantedKinds.filter(kind => kind.source === 'paraya') : wantedKinds;
      const needsBody = wanted && hypothesis.source !== 'dasha' && !bodies.includes(hypothesis.body as ParayaBody);
      const useBodies = needsBody ? [...PARAYA_BODIES, ...PARAYA_BETA_BODIES].filter(item => item === hypothesis.body || bodies.includes(item)) : [...bodies];

      // The sky of the transits is the same for every chart: one table of the slow grahas from the first birth to now, sampled every few days.
      let transitSeries: Record<string, LongitudeSeries> | undefined;
      if (useKinds.some(hasSky) && charts.length > 0) {
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
      setRun({ status: 'running', message: grouped ? t('Comparing the two sets…') : mode === 'validate' ? t('Checking on the test part…') : mode === 'model' ? t('Fitting the model…') : comboMode ? t('Looking at the combinations…') : settingsMode ? t('Comparing the settings…') : control === 'others' ? t('Comparing with the other charts…') : t('Comparing with chance…') });
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
      const paraya = options.paraya!;
      const runSettings: RunSettings = { charts: charts.map(item => item.name), events: filterLabel(filter, t), window: windowDays, kinds: useKinds.map(kind => kindId(kind.source, kind.family)), bodies: [...useBodies], dashaSystem, control: mode === 'chance' ? control : 'life' };
      setReportContext({
        generated: new Date(now),
        version: APP_VERSION,
        charts: charts.map(item => ({ name: item.name, events: item.events.length })),
        events: filterLabel(filter, t),
        ...(grouped ? { eventsB: filterLabel(filterB, t) } : {}),
        window: windowDays,
        kinds: comboMode ? [`${kindText(useKinds[0], t)} + ${kindText(useKinds[1], t)}${combo.sameGraha ? ` · ${t('the same graha')}` : ''}`] : useKinds.map(kind => kindText(kind, t)),
        bodies: [...useBodies],
        dashaSystem: GRAHA_DASHA_SYSTEMS.find(item => item.key === dashaSystem)?.label ?? dashaSystem,
        paraya: `${t(paraya.retro === 'same' ? 'retrograde: the natal sign' : 'retrograde: the sign before')} · ${t(paraya.saturn === 'even' ? 'Saturn even' : 'Saturn alternating')} · ${t(paraya.rahu === 'even' ? 'Rahu even' : 'Rahu alternating')}`,
        control: runSettings.control,
      });
      if (mode === 'validate') {
        const result = validateStudy(charts, options, { by: split.by, share: split.share, seed, top: split.top });
        setRun({ status: 'validate', outcome: { result, by: split.by, share: split.share, top: split.top, seed, windowDays, failed } });
      } else if (mode === 'model') {
        const result = fitJointModel(charts, options, { by: split.by, share: split.share, seed });
        setRun({ status: 'model', outcome: { result, by: split.by, share: split.share, seed, windowDays, failed } });
      } else if (comboMode) {
        const spec: ComboSpec = { left: useKinds[0], right: useKinds[1], sameGraha: combo.sameGraha };
        setRun({ status: 'combine', outcome: { result: comboStudy(charts, options, spec), spec, windowDays, info, failed } });
      } else if (settingsMode) {
        const rows = await compareParayaSettings(charts, options, async (index, total) => {
          setRun({ status: 'running', message: `${t('Comparing the settings…')} ${index + 1}/${total}` });
          await new Promise(resolve => window.setTimeout(resolve, 0));
        });
        setRun({ status: 'settings', outcome: { rows, windowDays, failed } });
      } else if (grouped) {
        const { events, skipped } = eventFeatures(charts, options);
        const inA = events.filter(item => group.get(`${item.chartId}|${item.event.id}`) === 'a');
        const inB = events.filter(item => group.get(`${item.chartId}|${item.event.id}`) === 'b');
        setRun({ status: 'groups', outcome: { comparison: compareGroups(inA, inB), labels: { a: filterLabel(filter, t), b: filterLabel(filterB, t) }, events, groupOf: group, info, windowDays, skipped, failed } });
      } else {
        const result = control === 'others' ? runControlStudy(charts, options) : runStudy(charts, options);
        setRun({ status: 'chance', outcome: { result, kinds: useKinds, bodies: useBodies, windowDays, control, runSettings, profile: id => timeProfile(charts, options, id), hypothesis: wanted ? featureId(hypothesis.source, hypothesis.family, hypothesis.body, hypothesis.target) : null, info, failed } });
      }
    } catch (error) {
      setRun({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  };

  /** The choice of the kind of event: its category, its tag and the words in it; and a list of the events chosen, to see what is to be compared. */
  const filterControls = (current: Filter, set: (next: Filter) => void, label: string, which: 'a' | 'b') => {
    const categoryCounts = categoryCountsFor(current);
    const tags = tagsFor(current);
    const list = chosenOf(which);
    return (
      <div className="space-y-1" role="group" aria-label={label}>
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{label}</span>
          <button type="button" aria-pressed={current.category === 'all'} onClick={() => set({ ...current, category: 'all', tag: '' })} className={chip(current.category === 'all')}>{t('all')} {categoryCounts.reduce((sum, item) => sum + item.count, 0)}</button>
          {categoryCounts.filter(item => item.count > 0).map(item => (
            <button key={item.key} type="button" aria-pressed={current.category === item.key} onClick={() => set({ ...current, category: item.key, tag: '' })} className={chip(current.category === item.key)}>{t(DASHA_EVENT_CATEGORY_LABELS[item.key])} {item.count}</button>
          ))}
          {tags.length > 0 && (
            <select value={current.tag} onChange={event => set({ ...current, tag: event.target.value })} aria-label={`${t('event tag')} ${label}`} className="rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] font-mono dark:border-zinc-700 dark:bg-zinc-800">
              <option value="">{t('any tag')}</option>
              {tags.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          )}
        </div>
        <input
          type="search"
          value={current.text}
          onChange={event => set({ ...current, text: event.target.value })}
          placeholder={t('words in the name, tags or notes: move, moved, relocation')}
          aria-label={`${t('words in the events')} · ${label}`}
          className="w-full max-w-md rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[11px] font-mono dark:border-zinc-700 dark:bg-zinc-800"
        />
        <details className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400" data-research-chosen={which}>
          <summary className="cursor-pointer select-none">{t('the events chosen')}: {list.length}</summary>
          {list.length === 0 ? <p className="py-1 text-zinc-400">{t('None of the saved events fits.')}</p> : (
            <ul className="max-h-48 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
              {list.map(item => (
                <li key={item.id} className="flex flex-wrap items-baseline gap-x-3 py-0.5 text-[11px]" data-research-chosen-event>
                  <span className="w-20 shrink-0 text-zinc-500 dark:text-zinc-400">{item.date}</span>
                  <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-200">{item.name}</span>
                  <span className="text-zinc-400">{item.chart} · {t(DASHA_EVENT_CATEGORY_LABELS[item.category as DashaEventCategory] ?? 'Other')}</span>
                </li>
              ))}
            </ul>
          )}
        </details>
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
          <section className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800" data-research-step="data" aria-labelledby="research-step-data">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
              <h2 id="research-step-data" className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-200">{t('1. Choose your data')}</h2>
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{chosen.length} {t('charts selected')} · {chosen.reduce((sum, source) => sum + source.events.length, 0)} {t('events available')}</span>
            </div>
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

          </section>

          <section className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800" data-research-step="design" aria-labelledby="research-step-design">
          <h2 id="research-step-design" className="border-b border-zinc-100 pb-2 text-xs font-semibold tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">{t('2. Design and run the study')}</h2>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('kind of comparison')}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('compare')}</span>
            <button type="button" aria-pressed={mode === 'chance'} onClick={() => { setMode('chance'); setRun({ status: 'idle' }); }} className={chip(mode === 'chance')}>{t('with chance')}</button>
            <button type="button" aria-pressed={mode === 'groups'} onClick={() => { setMode('groups'); setRun({ status: 'idle' }); }} className={chip(mode === 'groups')}>{t('two kinds of event')}</button>
            <button type="button" aria-pressed={mode === 'validate'} onClick={() => { setMode('validate'); setRun({ status: 'idle' }); }} className={chip(mode === 'validate')}>{t('training and test')}</button>
            <button type="button" aria-pressed={mode === 'settings'} onClick={() => { setMode('settings'); setRun({ status: 'idle' }); }} className={chip(mode === 'settings')}>{t('the Paraya settings')}</button>
            <button type="button" aria-pressed={mode === 'combine'} onClick={() => { setMode('combine'); setRun({ status: 'idle' }); }} className={chip(mode === 'combine')}>{t('combinations')}</button>
            <button type="button" aria-pressed={mode === 'model'} onClick={() => { setMode('model'); setRun({ status: 'idle' }); }} className={chip(mode === 'model')}>{t('joint model')}</button>
            <button type="button" aria-expanded={showHitFinder} onClick={() => setShowHitFinder(value => !value)} className={chip(showHitFinder)}>{t('Graha Hit Finder')}</button>
            <button type="button" aria-expanded={showEventRelations} onClick={() => setShowEventRelations(value => !value)} className={chip(showEventRelations)}>{t('Event Nadi relationships')}</button>
          </div>
          {showHitFinder && <ResearchHitFinder sources={sources} initialSelected={selected} calculationSettings={settings} />}
          {showEventRelations && <ResearchEventRelations sources={sources} initialSelected={selected} calculationSettings={settings} />}

          <div className="space-y-1">
            {filterControls(filter, setFilter, grouped ? t('first group') : t('events'), 'a')}
            {grouped && filterControls(filterB, setFilterB, t('second group'), 'b')}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('window around an event')}>
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('window')}</span>
              {WINDOWS.map(days => (
                <button key={days} type="button" aria-pressed={windowDays === days} onClick={() => setWindowDays(days)} className={chip(windowDays === days)}>{days === 0 ? t('the day') : days === 'auto' ? t('by the accuracy of the date') : `±${days} ${t('days')}`}</button>
              ))}
            </div>
            {windowDays === 'auto' && <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600" data-research-auto-window>{t('A date known to the day is read for that day, one known to the month for 15 days either side, one known to the year for 182. The random moments they are set against are read over the same windows. Dates imported with only a month or a year are marked "approx.".')}</p>}
            <div className="space-y-1" role="group" aria-label={t('features')}>
              {!comboMode && FEATURE_SOURCES.map(source => (
                <div key={source} className="flex flex-wrap items-center gap-1" role="group" aria-label={t(SOURCE_LABELS[source])}>
                  <span className="w-24 shrink-0 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t(SOURCE_LABELS[source])}</span>
                  {familiesOf(source).map(family => {
                    const on = kinds.has(kindId(source, family));
                    return <button key={family} type="button" aria-pressed={on} onClick={() => toggleKind(source, family)} className={chip(on)}>{t(FAMILY_LABELS[family])}</button>;
                  })}
                </div>
              ))}
              {(comboMode ? [kindFromId(combo.left), kindFromId(combo.right)] : kindList).some(kind => kind.source === 'dasha') && (
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
            {(comboMode ? [kindFromId(combo.left), kindFromId(combo.right)] : kindList).some(kind => kind.source === 'transit') && <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600" data-research-transit-aspects-note>{t('For the transits the aspects are those of each graha by its own rule, counted from the graha: Saturn the 3rd, 7th and 10th, Jupiter the 5th, 7th and 9th, Mars the 4th, 7th and 8th, Rahu and Ketu the 5th and 9th, the others the 7th. The progressions have the 1st, 5th, 7th and 9th for every graha.')}</p>}
            {(comboMode ? [kindFromId(combo.left), kindFromId(combo.right)] : kindList).some(kind => kind.source === 'gochara') && <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600" data-research-gochara-note>{t('The gochara counts the houses of the slow grahas from the natal Moon: the traditional favourable houses of Jupiter and Saturn, the bindus of their own Bhinnāṣṭakavarga in the sign, the Sarvāṣṭakavarga of the sign, and Saturn over the Moon (Sade Sati, the 4th and the 8th).')}</p>}
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
              {fill(t('A house is counted from the ascendant, so charts with different ascendants can be compared. "Aspects" are by sign (the same sign, or the 5th, 7th or 9th from it); "exact" is within {orb}° of the natal degree, or, over a window, an exact hit inside it.'), { orb: String(EXACT_ORB) })}
            </p>
          </div>

          {mode === 'chance' && (
            <div className="space-y-1" role="group" aria-label={t('chance level')}>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('chance level from')}</span>
                <button type="button" aria-pressed={control === 'life'} onClick={() => setControl('life')} className={chip(control === 'life')}>{t('the same chart at random moments')}</button>
                <button type="button" aria-pressed={control === 'others'} disabled={includedCharts.size < MIN_CONTROL_CHARTS} onClick={() => setControl('others')} className={`${chip(control === 'others')} disabled:opacity-40`}>{t('the other charts at the same moment')}</button>
              </div>
              {control === 'others' && <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600" data-research-control-note>{fill(t('Each event is compared with the same moment in the other charts: it asks whether the date is unusual, not only the moment in the life. It needs at least {count} charts, and with few the chance level is coarse and the p-values cautious.'), { count: String(MIN_CONTROL_CHARTS) })}</p>}
            </div>
          )}

          {comboMode && (
            <div className="space-y-1 rounded border border-zinc-200 p-2 dark:border-zinc-700" role="group" aria-label={t('the two parts of a combination')}>
              <div className="flex flex-wrap items-center gap-1">
                <select value={combo.left} onChange={event => setCombo(current => ({ ...current, left: event.target.value }))} aria-label={t('first part of the combination')} className={select}>
                  {ALL_KINDS.map(kind => <option key={kindId(kind.source, kind.family)} value={kindId(kind.source, kind.family)}>{kindText(kind, t)}</option>)}
                </select>
                <span className="text-[10px] font-mono text-zinc-400">+</span>
                <select value={combo.right} onChange={event => setCombo(current => ({ ...current, right: event.target.value }))} aria-label={t('second part of the combination')} className={select}>
                  {ALL_KINDS.map(kind => <option key={kindId(kind.source, kind.family)} value={kindId(kind.source, kind.family)}>{kindText(kind, t)}</option>)}
                </select>
                <label className="flex min-h-8 items-center gap-1.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                  <input type="checkbox" checked={combo.sameGraha} onChange={event => setCombo(current => ({ ...current, sameGraha: event.target.checked }))} className="h-4 w-4 accent-emerald-600" />
                  {t('only the same graha')}
                </label>
              </div>
              <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('Two kinds of feature that are there at the same time, for example the lord of the daśā and the gochara of the same graha. Each combination is set against how often both are there at random moments of the chart, and is of interest only if it is more unusual than each part.')}</p>
            </div>
          )}

          {mode === 'chance' && (
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
                      {targets.map(target => <option key={target} value={target}>{targetKind === 'house' ? target : targetKind === 'list' ? t(LIST_TARGET_LABELS[target] ?? target) : `${code(target)} · ${target}`}</option>)}
                    </select>
                  )}
                </div>
              )}
              <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('Choose it before you run: a feature picked out of the results after looking at them would need the correction for all the others.')}</p>
            </div>
          )}

          {needsSplit && (
            <div className="space-y-1 rounded border border-zinc-200 p-2 dark:border-zinc-700" role="group" aria-label={t('the split into training and test')}>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('split by')}</span>
                {(['charts', 'events'] as const).map(by => <button key={by} type="button" aria-pressed={split.by === by} onClick={() => setSplit(current => ({ ...current, by }))} className={chip(split.by === by)}>{t(by)}</button>)}
                <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('training share')}</span>
                {SHARES.map(share => <button key={share} type="button" aria-pressed={split.share === share} onClick={() => setSplit(current => ({ ...current, share }))} className={chip(split.share === share)}>{Math.round(share * 100)} %</button>)}
                {mode === 'validate' && <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('carried over')}</span>}
                {mode === 'validate' && TOPS.map(top => <button key={top} type="button" aria-pressed={split.top === top} onClick={() => setSplit(current => ({ ...current, top }))} className={chip(split.top === top)}>{top}</button>)}
              </div>
              <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('The best features are found in the training part and then tested on the other part, which they were not chosen from. Splitting by charts is the stricter test; with few charts split by events.')}</p>
            </div>
          )}
          {settingsMode && <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('The same study is run eight times: the progressions of a retrograde graha beginning one sign back or in the natal sign, Saturn and Rahu staying by turns or evenly. Only the features of the progressions are used.')}</p>}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { void start(Date.now()); }}
              disabled={!ready || (!comboMode && kindList.length === 0) || bodies.length === 0 || run.status === 'running' || (mode === 'chance' && control === 'others' && includedCharts.size < MIN_CONTROL_CHARTS)}
              className="rounded-md border border-emerald-500 bg-emerald-500 px-3 py-1.5 text-[11px] font-mono text-white disabled:opacity-40 dark:border-green-600 dark:bg-green-600"
            >
              {mode === 'validate' ? t('Run the check') : mode === 'model' ? t('Fit the model') : t('Run the comparison')}
            </button>
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400" data-research-selection>
              {grouped ? `${counts.a} + ${counts.b} ${t('events')} · ${includedCharts.size} ${t('charts')}` : `${includedEvents} ${t('events')} · ${includedCharts.size} ${t('charts')}`}
            </span>
            {run.status === 'running' && <span className="text-[10px] font-mono text-zinc-400" role="status">{run.message}</span>}
            {run.status === 'error' && <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400" role="alert">{t('Could not calculate:')} {run.message}</span>}
          </div>
          {grouped && counts.a > 0 && counts.b === 0 && <p className="text-[10px] font-mono text-zinc-400">{t('The second group has no events of its own: choose a kind of event that differs from the first.')}</p>}
          </section>
        </>
      )}

      <section className="space-y-3" data-research-step="results" aria-labelledby="research-step-results">
        <h2 id="research-step-results" className="border-b border-zinc-200 pb-2 text-xs font-semibold tracking-wide text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">{t('3. Review results')}</h2>
      {run.status === 'chance' && <ResearchResults key={runs} outcome={run.outcome} />}
      {run.status === 'chance' && <ResearchRuns key={`runs-${runs}`} current={run.outcome} settings={run.outcome.runSettings} />}
      {run.status === 'idle' && mode === 'chance' && <ResearchRuns current={null} settings={null} />}
      {run.status === 'groups' && <ResearchGroups key={runs} outcome={run.outcome} />}
      {run.status === 'validate' && <ResearchValidation key={runs} outcome={run.outcome} onAnother={() => { const seed = split.seed + 1; setSplit(current => ({ ...current, seed })); void start(Date.now(), seed); }} />}
      {run.status === 'settings' && <ResearchSettings key={runs} outcome={run.outcome} />}
      {run.status === 'combine' && <ResearchCombos key={runs} outcome={run.outcome} />}
      {run.status === 'model' && <ResearchModel key={runs} outcome={run.outcome} onAnother={() => { const seed = split.seed + 1; setSplit(current => ({ ...current, seed })); void start(Date.now(), seed); }} />}
      {report && reportContext && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => saveFile('research-report.html', buildReport(report, reportContext, t, code, language), 'text/html')} className={chip(false)} data-research-report>{t('Save the report (HTML)')}</button>
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('One page with the data, the method, the strongest results and the cautions; open it in a browser to print it or save it as a PDF.')}</span>
        </div>
      )}
      </section>
    </section>
  );
}
