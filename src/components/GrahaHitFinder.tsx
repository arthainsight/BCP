'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { findParayaHits } from '@/lib/bnn/parayaHits';
import type { ParayaBody } from '@/lib/bnn/nadiParaya';
import { PROGRESSION_RELATIONS, transitRelationsOf, findTransitHits, type HitRelation, type LongitudeSeries } from '@/lib/transitHits';
import { parseTargetDateString } from '@/lib/dateInput';
import { transitSeriesUrl } from '@/lib/apiParams';
import { useDebouncedJson } from '@/hooks/useDebouncedJson';
import { useGrahaNames } from '@/lib/grahaNames';
import { pad2 } from '@/lib/dateFormat';
import { JULIAN_YEAR_MS } from '@/lib/time';

type Props = {
  chart: ChartData;
  birthDatetime: string;
  calculationSettings?: CalculationSettings;
  onSetTarget?: (value: string) => void;
};

type Source = 'paraya' | 'transit' | 'both';
type SeriesResponse = { start: number; step: number; series: Record<string, { step: number; longitudes: number[] }> };

const NATAL_POINTS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Asc'] as const;
const DATE = (time: number) => {
  const d = new Date(time);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
};
const ISO_DATE = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const TRANSIT_BODIES = ['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Mars', 'Mercury', 'Venus'] as const;
const RELATION_LABEL: Record<number, string> = { 1: '1 · same sign', 3: '3 · Saturn aspect', 4: '4 · Mars aspect', 5: '5 · fifth', 7: '7 · seventh', 8: '8 · Mars aspect', 9: '9 · ninth', 10: '10 · Saturn aspect' };

/** Find exact-degree dates for one progressing/transiting graha against one natal point. */
export default function GrahaHitFinder({ chart, birthDatetime, calculationSettings, onSetTarget }: Props) {
  const { code } = useGrahaNames();
  const [source, setSource] = useState<Source>('both');
  const [body, setBody] = useState<ParayaBody>('Jupiter');
  const [natal, setNatal] = useState<string>('Sun');
  const [relations, setRelations] = useState<HitRelation[]>([1, 5, 7, 9]);
  const [fromDate, setFromDate] = useState(() => ISO_DATE(new Date()));
  const [toDate, setToDate] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 5); return ISO_DATE(d); });
  const [searched, setSearched] = useState(false);

  const birth = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const from = useMemo(() => parseTargetDateString(fromDate), [fromDate]);
  const to = useMemo(() => parseTargetDateString(toDate), [toDate]);
  const days = from && to ? Math.floor((to.getTime() - from.getTime()) / 86400000) + 2 : 0;
  const isTransit = source !== 'paraya';
  const availableRelations = source === 'both'
    ? [...new Set([...PROGRESSION_RELATIONS, ...transitRelationsOf(body)])]
    : [...selectedRelations];

  const transitUrl = searched && isTransit && from && to && days > 0 && days <= 36525
    ? transitSeriesUrl(fromDate, days, [body], calculationSettings, days > 3650 ? 3 : undefined)
    : null;
  const { data, loading, error } = useDebouncedJson<SeriesResponse>(transitUrl);

  const natalPoints = useMemo(() => [
    ...chart.planets.filter(p => (NATAL_POINTS as readonly string[]).includes(p.name)).map(p => ({ name: p.name, longitude: p.longitude })),
    { name: 'Asc', longitude: chart.ascendant.longitude },
  ], [chart]);

  const results = useMemo(() => {
    if (!searched || !from || !to || !birth || days <= 0 || days > 36525) return [];
    const end = to.getTime() + 86400000;
    const rows: { source: 'Paraya' | 'Transit'; body: string; natal: string; relation: HitRelation; time: number; retrograde?: boolean }[] = [];
    if (source !== 'transit') {
      const hits = findParayaHits({
        chart, birthTime: birth.getTime(), fromTime: from.getTime(), toTime: end,
        relations: PROGRESSION_RELATIONS, bodies: [body],
        options: {
          saturn: calculationSettings?.parayaSaturn ?? 'alternating',
          rahu: calculationSettings?.parayaRahu ?? 'alternating',
          retro: calculationSettings?.parayaRetro ?? 'previous',
        },
      });
      rows.push(...hits.filter(hit => hit.natal === natal && relations.includes(hit.relation))
        .map(hit => ({ source: 'Paraya' as const, body: hit.body, natal: hit.natal, relation: hit.relation, time: hit.time })));
    }
    if (source !== 'paraya' && data) {
      const series: Record<string, LongitudeSeries> = {};
      for (const [name, item] of Object.entries(data.series)) series[name] = { start: data.start, step: item.step, longitudes: item.longitudes };
      const hits = findTransitHits(series, natalPoints, transitRelationsOf);
      rows.push(...hits.filter(hit => hit.transit === body && hit.natal === natal && relations.includes(hit.relation) && hit.time >= from.getTime() && hit.time < end)
        .map(hit => ({ source: 'Transit' as const, body: hit.transit, natal: hit.natal, relation: hit.relation, time: hit.time, retrograde: hit.retrograde })));
    }
    return rows.sort((a, b) => a.time - b.time || a.source.localeCompare(b.source));
  }, [searched, from, to, birth, days, source, chart, body, natal, relations, calculationSettings, data, natalPoints]);

  const toggleRelation = (relation: HitRelation) => setRelations(current =>
    current.includes(relation) ? current.filter(item => item !== relation) : [...current, relation]);

  const setTarget = (time: number) => {
    const d = new Date(time);
    onSetTarget?.(`${DATE(time)} ${pad2(d.getHours())}.${pad2(d.getMinutes())}.00`);
  };

  const runSearch = () => {
    setSearched(true);
  };

  return (
    <section className="min-w-0 space-y-4">
      <div>
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Graha Hit Finder</h2>
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Find exact dates when a selected graha reaches a selected natal point by the chosen relationship.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-[10px] font-mono text-zinc-500">Source
          <select value={source} onChange={e => { setSource(e.target.value as Source); setSearched(false); }} className="block w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            <option value="both">Progression + transit</option><option value="paraya">Nadi Progression (Paraya)</option><option value="transit">Transit</option>
          </select>
        </label>
        <label className="space-y-1 text-[10px] font-mono text-zinc-500">Activating graha
          <select value={body} onChange={e => { setBody(e.target.value as ParayaBody); setSearched(false); }} className="block w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            {TRANSIT_BODIES.map(item => <option key={item} value={item}>{item}{(['Mars', 'Mercury', 'Venus'] as string[]).includes(item) ? ' (beta for Paraya)' : ''}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-[10px] font-mono text-zinc-500">Natal point
          <select value={natal} onChange={e => { setNatal(e.target.value); setSearched(false); }} className="block w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
            {NATAL_POINTS.filter(name => name === 'Asc' || chart.planets.some(p => p.name === name)).map(item => <option key={item} value={item}>{item === 'Asc' ? 'Ascendant' : item}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-[10px] font-mono text-zinc-500">From
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setSearched(false); }} className="block w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
          <label className="space-y-1 text-[10px] font-mono text-zinc-500">To
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setSearched(false); }} className="block w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900" />
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-mono text-zinc-500">Relationship (progression uses 1/5/7/9 from natal; transit uses the graha's own aspects)</p>
        <div className="flex flex-wrap gap-1">
          {availableRelations.map(relation => (
            <button key={relation} type="button" aria-pressed={relations.includes(relation)} onClick={() => toggleRelation(relation)} className={`rounded-md border px-2.5 py-1.5 text-[10px] font-mono ${relations.includes(relation) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-200 text-zinc-500 dark:border-zinc-700'}`}>
              {RELATION_LABEL[relation] ?? relation}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-zinc-500">Dates are exact-degree crossings. Transit dates are interpolated from ephemeris samples; ℞ marks a retrograde pass.</p>
      <button type="button" onClick={runSearch} disabled={!from || !to || days <= 0 || days > 36525} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-40">Find dates</button>
      {days > 36525 && <p className="text-[10px] text-amber-600">Choose a range of 100 years or less.</p>}
      {days <= 0 && <p className="text-[10px] text-amber-600">The end date must be after the start date.</p>}
      {loading && <p className="text-[10px] text-zinc-500">Calculating transit positions…</p>}
      {error && <p className="text-[10px] text-rose-600">Could not load transit positions: {error}</p>}
      {searched && !loading && !error && (source === 'paraya' || data) && (
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{results.length} exact hits · {body} → {natal}</p>
          {results.length === 0 ? <p className="text-xs text-zinc-500">No hits found in this date range for the selected relationships.</p> : (
            <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-[10px] text-zinc-500 dark:bg-zinc-900"><tr><th className="px-2 py-2">Date</th><th className="px-2 py-2">Source</th><th className="px-2 py-2">Relationship</th><th className="px-2 py-2">Graha</th><th className="px-2 py-2">Action</th></tr></thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {results.map((hit, index) => <tr key={`${hit.source}-${hit.time}-${index}`}>
                    <td className="whitespace-nowrap px-2 py-2 font-mono">{DATE(hit.time)}{hit.retrograde ? ' ℞' : ''}</td>
                    <td className="px-2 py-2">{hit.source}</td>
                    <td className="px-2 py-2">{RELATION_LABEL[hit.relation]}</td>
                    <td className="px-2 py-2">{code(hit.body)} → {code(hit.natal)}</td>
                    <td className="px-2 py-2">{onSetTarget && <button type="button" onClick={() => setTarget(hit.time)} className="rounded border border-violet-300 px-2 py-1 text-[10px] text-violet-700 dark:border-violet-700 dark:text-violet-300">Open date</button>}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
