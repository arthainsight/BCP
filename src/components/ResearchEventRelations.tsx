'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { formatEventDate, parseEventDate, type StoredDashaEvent } from '@/lib/dashaEventStore';
import { birthTimeOf, chartRequestUrl, type ResearchSource } from '@/lib/research/studyData';
import { progressionsAt, progressedRelationsOf } from '@/lib/bnn/eventProgressions';
import { PARAYA_BETA_BODIES, PARAYA_BODIES, type ParayaBody } from '@/lib/bnn/nadiParaya';
import { useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

type Props = {
  sources: readonly ResearchSource[];
  initialSelected: ReadonlySet<string>;
  calculationSettings?: CalculationSettings;
};

type EventRelations = {
  key: string;
  chart: string;
  event: StoredDashaEvent;
  relations: ReturnType<typeof progressedRelationsOf>;
  unavailable?: string;
};

const bodies = [...PARAYA_BODIES, ...PARAYA_BETA_BODIES] as ParayaBody[];
const button = 'rounded-md border border-zinc-200 px-2.5 py-1.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:text-zinc-300';

/** Event-by-event view of the Nadi relationships among progressing grahas in Research. */
export default function ResearchEventRelations({ sources, initialSelected, calculationSettings }: Props) {
  const t = useT();
  const { code } = useGrahaNames();
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(initialSelected));
  const [progressingBodies, setProgressingBodies] = useState<readonly ParayaBody[]>(PARAYA_BODIES);
  const [events, setEvents] = useState<EventRelations[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const chosen = useMemo(() => sources.filter(source => selected.has(source.id) && source.events.length > 0), [sources, selected]);

  const toggleChart = (id: string) => setSelected(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleBody = (body: ParayaBody) => setProgressingBodies(current =>
    current.includes(body) ? current.filter(item => item !== body) : bodies.filter(item => item === body || current.includes(item)),
  );

  async function calculate() {
    if (!chosen.length || !progressingBodies.length) return;
    setRunning(true);
    setError('');
    setCompleted(false);
    setEvents([]);
    try {
      const chartResults = await Promise.all(chosen.map(async source => {
        const birthTime = birthTimeOf(source.saved);
        const url = chartRequestUrl(source.saved, calculationSettings);
        if (birthTime === null || !url) return { source, chart: null as ChartData | null, birthTime: null };
        const response = await fetch(url);
        const json = await response.json();
        if (!response.ok || json.error) throw new Error(source.name + ': ' + (json.error ?? 'Chart request failed'));
        return { source, chart: json as ChartData, birthTime };
      }));
      const result: EventRelations[] = [];
      for (const item of chartResults) {
        for (const event of item.source.events) {
          const key = item.source.id + '|' + event.id;
          const day = parseEventDate(event.date);
          if (!item.chart || item.birthTime === null || !day) {
            result.push({ key, chart: item.source.name, event, relations: [], unavailable: !day ? t('Date unavailable') : t('Chart data unavailable') });
            continue;
          }
          const progressions = progressionsAt({
            chart: item.chart,
            birthTime: item.birthTime,
            time: day.getTime(),
            options: {
              saturn: item.source.saved.calculationSettings?.parayaSaturn ?? calculationSettings?.parayaSaturn ?? 'alternating',
              rahu: item.source.saved.calculationSettings?.parayaRahu ?? calculationSettings?.parayaRahu ?? 'alternating',
              retro: item.source.saved.calculationSettings?.parayaRetro ?? calculationSettings?.parayaRetro ?? 'previous',
            },
            bodies: progressingBodies,
          });
          result.push({
            key,
            chart: item.source.name,
            event,
            relations: progressions ? progressedRelationsOf(progressions) : [],
            unavailable: progressions === null ? t('Date is before birth') : undefined,
          });
        }
      }
      result.sort((a, b) => a.event.date.localeCompare(b.event.date) || a.chart.localeCompare(b.chart) || a.event.name.localeCompare(b.event.name));
      setEvents(result);
      setCompleted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-emerald-200 p-3 dark:border-emerald-900" data-research-event-nadi-relations>
      <div>
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 dark:text-emerald-300">{t('Event Nadi relationships')}</h3>
        <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{t('See the 1st, 5th, 7th and 9th sign relationships among progressing grahas for saved events across selected charts. Degree differences of 1° or less are highlighted.')}</p>
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{t('charts')}</span>
          <button type="button" onClick={() => setSelected(new Set(sources.filter(item => item.events.length > 0).map(item => item.id)))} className={button}>{t('all charts')}</button>
          <button type="button" onClick={() => setSelected(new Set())} className={button}>{t('none')}</button>
          <span className="text-[10px] text-zinc-400">{chosen.length} / {sources.filter(item => item.events.length > 0).length}</span>
        </div>
        <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
          {sources.filter(item => item.events.length > 0).map(item => (
            <label key={item.id} className="flex min-h-7 items-center gap-2 text-[11px] font-mono text-zinc-700 dark:text-zinc-200">
              <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleChart(item.id)} className="h-4 w-4 accent-emerald-600" />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <span className="text-zinc-400">{item.events.length} {t('events')}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('progressing grahas')}>
        <span className="mr-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500">{t('grahas')}</span>
        {bodies.map(body => (
          <button key={body} type="button" aria-pressed={progressingBodies.includes(body)} onClick={() => toggleBody(body)}
            className={`${button} ${progressingBodies.includes(body) ? 'border-emerald-500 bg-emerald-600 text-white' : ''}`}>
            {code(body)}{(PARAYA_BETA_BODIES as readonly string[]).includes(body) ? ' β' : ''}
          </button>
        ))}
      </div>
      <button type="button" disabled={running || !chosen.length || !progressingBodies.length} onClick={calculate}
        className="rounded-md bg-emerald-700 px-3 py-2 text-[11px] font-mono text-white disabled:opacity-50">
        {running ? t('Calculating…') : t('Calculate event relationships')}
      </button>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {completed && <p className="text-[10px] font-mono text-zinc-500">{fillSummary(events.length, t('events analysed'))}</p>}
      {events.length > 0 && (
        <div className="max-h-[38rem] space-y-2 overflow-y-auto pr-1">
          {events.map(item => (
            <article key={item.key} className="rounded border border-zinc-200 p-2 dark:border-zinc-800" data-research-event-relations-row={item.key}>
              <div className="flex flex-wrap items-baseline gap-x-2 text-[11px]">
                <span className="font-mono text-zinc-500">{formatEventDate(item.event.date)}</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">{item.event.name}</span>
                <span className="text-zinc-400">{item.chart}</span>
              </div>
              {item.unavailable ? <p className="mt-1 text-[10px] italic text-zinc-400">{item.unavailable}</p> : item.relations.length === 0 ? (
                <p className="mt-1 text-[10px] italic text-zinc-400">{t('No 1, 5, 7 or 9 relationships between progressing grahas.')}</p>
              ) : (
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.relations.map(relation => (
                    <span key={`${relation.from}|${relation.relation}|${relation.to}`}
                      className={`inline-flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-mono ${relation.exact ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'}`}>
                      {code(relation.from)} {relation.relation} → {code(relation.to)} <span className="text-[9px] opacity-70">{relation.orb.toFixed(1)}°</span>{relation.exact && ' ●'}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <p className="text-[9px] font-mono text-zinc-400">{t('Relationship is counted from the first progressing graha by sign. ● = within 1° by degree.')}</p>
    </section>
  );
}

function fillSummary(count: number, label: string) {
  return `${count} ${label}`;
}
