'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { DASHA_EVENT_CATEGORIES, DASHA_EVENT_CATEGORY_LABELS, formatEventDate, type StoredDashaEvent } from '@/lib/dashaEventStore';
import { birthTimeOf, chartRequestUrl, type ResearchSource } from '@/lib/research/studyData';
import { findParayaHits } from '@/lib/bnn/parayaHits';
import { PARAYA_BETA_BODIES, PARAYA_BODIES, type ParayaBody } from '@/lib/bnn/nadiParaya';
import { findTransitHits, PROGRESSION_RELATIONS, transitRelationsOf, type HitRelation, type LongitudeSeries } from '@/lib/transitHits';
import { transitSeriesUrl } from '@/lib/apiParams';
import { DAY_MS } from '@/lib/time';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

type SourceMode = 'paraya' | 'transit' | 'both';
type HitRow = { chart: string; chartId: string; source: 'Paraya' | 'Transit'; body: string; natal: string; relation: HitRelation; time: number; retrograde?: boolean; events: StoredDashaEvent[] };
type Props = { sources: readonly ResearchSource[]; initialSelected: ReadonlySet<string>; calculationSettings?: CalculationSettings };

const RELATIONS: HitRelation[] = [1, 3, 4, 5, 7, 8, 9, 10];
const RELATION_LABEL: Record<number, string> = { 1: '1 · same sign', 3: '3 · Saturn aspect', 4: '4 · Mars aspect', 5: '5 · fifth', 7: '7 · seventh', 8: '8 · Mars aspect', 9: '9 · ninth', 10: '10 · Saturn aspect' };
const DATE = (time: number) => new Date(time).toISOString().slice(0, 10);
const dateTime = (date: string) => Date.parse(date + 'T00:00:00.000Z');
const eventTime = (event: StoredDashaEvent) => Date.parse(event.date + 'T12:00:00.000Z');
const today = () => DATE(Date.now());
const earliestBirth = (sources: readonly ResearchSource[]) => { const times = sources.map(source => birthTimeOf(source.saved)).filter((time): time is number => time !== null); return times.length ? DATE(Math.min(...times)) : today(); };
const bodies = [...PARAYA_BODIES, ...PARAYA_BETA_BODIES] as ParayaBody[];
const natalNames = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Asc'];

function natalPointsOf(chart: ChartData) {
  return [
    ...chart.planets.filter(planet => natalNames.includes(planet.name)).map(planet => ({ name: planet.name, longitude: planet.longitude })),
    { name: 'Asc', longitude: chart.ascendant.longitude },
  ];
}

/** Focused research view for exact Paraya/transit hits across one or many saved charts. */
export default function ResearchHitFinder({ sources, initialSelected, calculationSettings }: Props) {
  const t = useT();
  const { code } = useGrahaNames();
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(initialSelected));
  const [sourceMode, setSourceMode] = useState<SourceMode>('both');
  const [body, setBody] = useState<ParayaBody>('Jupiter');
  const [natal, setNatal] = useState('Moon');
  const [relations, setRelations] = useState<HitRelation[]>([1, 5, 7, 9]);
  const [from, setFrom] = useState(() => earliestBirth(sources));
  const [to, setTo] = useState(today);
  const [eventWindow, setEventWindow] = useState(30);
  const [eventCategory, setEventCategory] = useState<'all' | StoredDashaEvent['category']>('all');
  const [rows, setRows] = useState<HitRow[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const chosen = useMemo(() => sources.filter(item => selected.has(item.id)), [sources, selected]);
  const availableRelations = sourceMode === 'paraya' ? [...PROGRESSION_RELATIONS] : sourceMode === 'transit' ? [...transitRelationsOf(body)] : [...new Set([...PROGRESSION_RELATIONS, ...transitRelationsOf(body)])];

  const toggleChart = (id: string) => setSelected(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleRelation = (relation: HitRelation) => setRelations(current => current.includes(relation) ? current.filter(item => item !== relation) : [...current, relation]);

  async function run() {
    if (!chosen.length || !from || !to || dateTime(to) < dateTime(from)) return;
    const dayCount = Math.floor((dateTime(to) - dateTime(from)) / DAY_MS) + 1;
    if (dayCount > 36525) { setError(t('Choose a date range of 100 years or less.')); return; }
    setRunning(true); setError(''); setCompleted(false); setRows([]);
    try {
      const fetched = await Promise.all(chosen.map(async source => {
        const birthTime = birthTimeOf(source.saved);
        const url = chartRequestUrl(source.saved, calculationSettings);
        if (birthTime === null || !url) return { source, chart: null as ChartData | null, birthTime: null };
        const response = await fetch(url);
        const json = await response.json();
        if (!response.ok || json.error) throw new Error(source.name + ': ' + (json.error ?? 'Chart request failed'));
        return { source, chart: json as ChartData, birthTime };
      }));
      const valid = fetched.filter((item): item is typeof item & { chart: ChartData; birthTime: number } => item.chart !== null && item.birthTime !== null);
      if (!valid.length) throw new Error(t('None of the selected charts has enough birth data to calculate.'));
      let transitSeries: Record<string, LongitudeSeries> | undefined;
      if (sourceMode !== 'paraya') {
        const url = transitSeriesUrl(from, dayCount, [body], calculationSettings, dayCount > 3650 ? 3 : undefined);
        const response = await fetch(url);
        const json = await response.json();
        if (!response.ok || json.error) throw new Error(json.error ?? 'Transit positions could not be loaded.');
        transitSeries = Object.fromEntries(Object.entries(json.series as Record<string, { step: number; longitudes: number[] }>).map(([name, sample]) => [
          name, { start: json.start as number, step: sample.step, longitudes: sample.longitudes },
        ]));
      }
      const output: HitRow[] = [];
      for (const item of valid) {
        const { source, chart, birthTime } = item;
        const points = natalPointsOf(chart);
        if (sourceMode !== 'transit') {
          const hits = findParayaHits({
            chart, birthTime, fromTime: dateTime(from), toTime: dateTime(to) + DAY_MS,
            relations: PROGRESSION_RELATIONS, bodies: [body],
            options: { saturn: calculationSettings?.parayaSaturn ?? 'alternating', rahu: calculationSettings?.parayaRahu ?? 'alternating', retro: calculationSettings?.parayaRetro ?? 'previous' },
          });
          output.push(...hits.filter(hit => hit.natal === natal && relations.includes(hit.relation)).map(hit => ({
            chart: source.name, chartId: source.id, source: 'Paraya' as const, body: hit.body, natal: hit.natal, relation: hit.relation, time: hit.time, events: source.events,
          })));
        }
        if (sourceMode !== 'paraya' && transitSeries) {
          const hits = findTransitHits(transitSeries, points, transitRelationsOf);
          output.push(...hits.filter(hit => hit.transit === body && hit.natal === natal && relations.includes(hit.relation) && hit.time >= dateTime(from) && hit.time < dateTime(to) + DAY_MS).map(hit => ({
            chart: source.name, chartId: source.id, source: 'Transit' as const, body: hit.transit, natal: hit.natal, relation: hit.relation, time: hit.time, retrograde: hit.retrograde, events: source.events,
          })));
        }
      }
      setRows(output.sort((a, b) => a.time - b.time || a.chart.localeCompare(b.chart) || a.source.localeCompare(b.source)));
      setCompleted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setRunning(false); }
  }

  const matchingRows = useMemo(() => rows.map(row => ({
    ...row,
    nearby: row.events.filter(event => (eventCategory === 'all' || event.category === eventCategory) && Number.isFinite(eventTime(event)) && Math.abs(eventTime(event) - row.time) <= eventWindow * DAY_MS),
  })), [rows, eventCategory, eventWindow]);
  const eventMatchesCount = matchingRows.reduce((sum, row) => sum + row.nearby.length, 0);
  const summary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of matchingRows) for (const event of row.nearby) {
      const key = event.category + '|' + event.name;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].map(([key, count]) => ({ category: key.split('|')[0], name: key.slice(key.indexOf('|') + 1), count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [matchingRows]);

  const selectClass = 'block w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200';
  const labelClass = 'space-y-1 text-[10px] font-mono text-zinc-500';

  return (
    <section className="space-y-4 rounded-lg border border-violet-200 p-3 dark:border-violet-900" data-research-graha-hit-finder>
      <div>
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-violet-700 dark:text-violet-300">{t('Graha Hit Finder · Research')}</h3>
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{t('Find exact Paraya progression or transit hits for one or several saved charts, then inspect life events close to each hit.')}</p>
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{t('charts')}</span>
          <button type="button" onClick={() => setSelected(new Set(sources.map(item => item.id)))} className="rounded border px-2 py-1 text-[10px]">{t('all charts')}</button>
          <button type="button" onClick={() => setSelected(new Set())} className="rounded border px-2 py-1 text-[10px]">{t('none')}</button>
          <span className="text-[10px] text-zinc-400">{chosen.length} / {sources.length}</span>
        </div>
        <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
          {sources.map(item => (
            <label key={item.id} className="flex min-h-8 items-center gap-2 text-[11px] font-mono text-zinc-700 dark:text-zinc-200">
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleChart(item.id)} className="h-4 w-4 accent-emerald-600" />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <span className="text-zinc-400">{item.events.length} {t('events')}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={labelClass}>{t('source')}
          <select value={sourceMode} onChange={event => {
            const next = event.target.value as SourceMode;
            setSourceMode(next);
            setRelations(next === 'paraya' ? [...PROGRESSION_RELATIONS] : next === 'transit' ? [...transitRelationsOf(body)] : [...new Set([...PROGRESSION_RELATIONS, ...transitRelationsOf(body)])]);
          }} className={selectClass}>
            <option value="both">{t('Progression + transit')}</option><option value="paraya">{t('Nadi Progression (Paraya)')}</option><option value="transit">{t('Transit')}</option>
          </select>
        </label>
        <label className={labelClass}>{t('activating graha')}
          <select value={body} onChange={event => {
            const next = event.target.value as ParayaBody;
            setBody(next);
            if (sourceMode !== 'paraya') setRelations(sourceMode === 'transit' ? [...transitRelationsOf(next)] : [...new Set([...PROGRESSION_RELATIONS, ...transitRelationsOf(next)])]);
          }} className={selectClass}>
            {bodies.map(item => <option key={item} value={item}>{item}{PARAYA_BETA_BODIES.includes(item) ? ' (beta)' : ''}</option>)}
          </select>
        </label>
        <label className={labelClass}>{t('natal point')}
          <select value={natal} onChange={event => setNatal(event.target.value)} className={selectClass}>
            {natalNames.map(item => <option key={item} value={item}>{item === 'Asc' ? t('Ascendant') : item}</option>)}
          </select>
        </label>
        <label className={labelClass}>{t('from')}<input type="date" value={from} onChange={event => setFrom(event.target.value)} className={selectClass} /></label>
        <label className={labelClass}>{t('to')}<input type="date" value={to} onChange={event => setTo(event.target.value)} className={selectClass} /></label>
        <label className={labelClass}>{t('life-event window')}
          <select value={eventWindow} onChange={event => setEventWindow(Number(event.target.value))} className={selectClass}>
            <option value={0}>{t('same day')}</option><option value={7}>±7 {t('days')}</option><option value={30}>±30 {t('days')}</option><option value={90}>±90 {t('days')}</option><option value={180}>±180 {t('days')}</option>
          </select>
        </label>
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{t('relationship')}</span>
          {availableRelations.map(relation => (
            <button key={relation} type="button" aria-pressed={relations.includes(relation)} onClick={() => toggleRelation(relation)}
              className={`rounded-md border px-2.5 py-1.5 text-[10px] font-mono ${relations.includes(relation) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-200 text-zinc-500 dark:border-zinc-700'}`}>
              {RELATION_LABEL[relation]}
            </button>
          ))}
        </div>
        <label className="flex max-w-md items-center gap-2 text-[10px] font-mono text-zinc-500">
          {t('event category')}
          <select value={eventCategory} onChange={event => setEventCategory(event.target.value as 'all' | StoredDashaEvent['category'])} className={selectClass}>
            <option value="all">{t('all')}</option>
            {DASHA_EVENT_CATEGORIES.map(category => <option key={category} value={category}>{t(DASHA_EVENT_CATEGORY_LABELS[category])}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={!chosen.length || !from || !to || dateTime(to) < dateTime(from) || running || relations.length === 0}
          onClick={() => { void run(); }} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-40">
          {running ? t('Calculating…') : t('Find dates')}
        </button>
        <span className="text-[10px] text-zinc-500">{t('Exact-degree crossings; no configurable orb in this view yet.')}</span>
        {running && <span role="status" className="text-[10px] text-zinc-500">{t('Calculating charts and positions…')}</span>}
        {error && <span role="alert" className="text-[10px] text-rose-600">{error}</span>}
      </div>
      {completed && (
        <div className="space-y-3">
          <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200">{rows.length} {t('hits')} · {chosen.length} {t('charts')} · {eventMatchesCount} {t('nearby life events')}</p>
          {rows.length === 0 ? <p className="text-xs text-zinc-500">{t('No hits found for the selected date range and relationships.')}</p> : (
            <>
              {summary.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{t('life events near hits')}</p>
                  <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-50 text-[10px] text-zinc-500 dark:bg-zinc-900"><tr><th className="px-2 py-2">{t('category')}</th><th className="px-2 py-2">{t('event')}</th><th className="px-2 py-2">{t('nearby hits')}</th></tr></thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {summary.map(item => <tr key={item.category + '|' + item.name}><td className="px-2 py-2">{t(DASHA_EVENT_CATEGORY_LABELS[item.category as keyof typeof DASHA_EVENT_CATEGORY_LABELS] ?? item.category)}</td><td className="px-2 py-2">{item.name}</td><td className="px-2 py-2 font-mono">{item.count}</td></tr>)}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[9px] font-mono text-zinc-400">{t('These counts are descriptive, not a significance test. Use the main Research comparisons to test event groups against chance and to validate patterns.')}</p>
                </div>
              )}
              <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-zinc-50 text-[10px] text-zinc-500 dark:bg-zinc-900"><tr><th className="px-2 py-2">{t('date')}</th><th className="px-2 py-2">{t('chart')}</th><th className="px-2 py-2">{t('source')}</th><th className="px-2 py-2">{t('relationship')}</th><th className="px-2 py-2">{t('graha')}</th><th className="px-2 py-2">{t('life events')}</th></tr></thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {matchingRows.map((row, index) => (
                      <tr key={row.chartId + '|' + row.source + '|' + row.time + '|' + index}>
                        <td className="whitespace-nowrap px-2 py-2 font-mono">{formatEventDate(DATE(row.time))}{row.retrograde ? ' ℞' : ''}</td>
                        <td className="px-2 py-2">{row.chart}</td><td className="px-2 py-2">{row.source}</td>
                        <td className="px-2 py-2">{RELATION_LABEL[row.relation]}</td><td className="px-2 py-2">{code(row.body)} → {code(row.natal)}</td>
                        <td className="px-2 py-2">{row.nearby.length ? row.nearby.map(event => formatEventDate(event.date) + ' ' + event.name).join('; ') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
