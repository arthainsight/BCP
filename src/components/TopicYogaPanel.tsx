'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { buildShadbalaRows } from '@/lib/shadbala';
import { TOPICS, evaluateTopic, notEvaluatedVerses, SEVEN, type SevenGraha, type TopicContext, type TopicKey, type TopicVerse } from '@/lib/topicYogas';
import { useT } from '@/lib/i18n';

function Verses({ verses }: { verses: TopicVerse[] }) {
  const t = useT();
  return (
    <details className="mt-1 rounded border border-zinc-200 px-2 py-1 dark:border-zinc-700">
      <summary className="cursor-pointer text-[10px] text-zinc-500 dark:text-zinc-400">{t('the verses')}: {verses.map(verse => `${verse.chapter}.${verse.verse}`).join(', ')}</summary>
      <div className="mt-1 space-y-2 text-[11px]">
        {verses.map(verse => (
          <div key={verse.verse} data-topic-verse={verse.verse}>
            <div className="text-zinc-700 dark:text-zinc-200">{verse.chapter}.{verse.verse}: {verse.gloss}</div>
            <div lang="sa">{verse.sanskrit[0]}</div>
            <div lang="sa">{verse.sanskrit[1]}</div>
            <div className="italic text-zinc-500 dark:text-zinc-400">{verse.iast[0]} / {verse.iast[1]}</div>
          </div>
        ))}
      </div>
    </details>
  );
}

/**
 * Yogas by topic, from the classics in their own words (topicYogas.ts). Each rule shows the verses it comes from, whether the chart meets it and why. "Strong" is the Ṣaḍbala of the graha at or over what it needs.
 */
export default function TopicYogaPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const [topic, setTopic] = useState<TopicKey>('spirituality');
  const [show, setShow] = useState<'met' | 'not' | 'unknown' | 'all'>('met');
  const context = useMemo<TopicContext>(() => {
    const ratio: Partial<Record<SevenGraha, number>> = {};
    for (const row of buildShadbalaRows(chart)) if ((SEVEN as readonly string[]).includes(row.planet)) ratio[row.planet as SevenGraha] = row.ratio;
    return {
      ascendantSign: chart.ascendant.sign,
      ascendantLongitude: chart.ascendant.longitude,
      ratio,
      planets: chart.planets.map(planet => ({ name: planet.name, sign: planet.sign, degree: planet.degree, longitude: planet.longitude, isRetrograde: planet.isRetrograde })),
    };
  }, [chart]);
  const results = useMemo(() => evaluateTopic(topic, context), [topic, context]);
  const left = useMemo(() => notEvaluatedVerses(topic), [topic]);
  const counts = useMemo(() => ({
    met: results.filter(result => result.outcome.met === true).length,
    not: results.filter(result => result.outcome.met === false).length,
    unknown: results.filter(result => result.outcome.met === null).length,
    all: results.length,
  }), [results]);
  const shown = useMemo(() => results.filter(result => show === 'all' || (show === 'met' ? result.outcome.met === true : show === 'not' ? result.outcome.met === false : result.outcome.met === null)), [results, show]);
  const badge = (met: boolean | null) => met === true ? ['✓', 'text-emerald-600 dark:text-emerald-400', t('met')] : met === false ? ['✗', 'text-zinc-400', t('not met')] : ['?', 'text-amber-600 dark:text-amber-400', t('cannot be judged')];

  return (
    <div className="min-w-0 space-y-3" data-topic-yogas="panel">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Yogas by topic, from the classics')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Each rule is a verse or verses of the classic with the condition read from the chart. "Strong" (bali) is the Ṣaḍbala of the graha at or over the strength it needs (the Ṣaḍbala panel); the text does not define it, and this is the measure of the app itself. The grahas that aspect are counted by whole signs; Rāhu and Ketu are left out. The verses decide.')}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {TOPICS.map(item => (
          <button key={item.key} type="button" onClick={() => setTopic(item.key)} className={`rounded px-2 py-1 text-[11px] font-mono ${topic === item.key ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>{t(item.label)}</button>
        ))}
      </div>
      <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{TOPICS.find(item => item.key === topic)?.source}</div>
      <div className="flex flex-wrap items-center gap-1" data-topic-filter>
        {([['met', t('met')], ['not', t('not met')], ['unknown', t('cannot be judged')], ['all', t('all')]] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setShow(key)} aria-pressed={show === key} data-topic-filter-key={key} className={`rounded border px-2 py-0.5 text-[10px] font-mono ${show === key ? 'border-zinc-800 bg-zinc-800 text-white dark:border-zinc-200 dark:bg-zinc-200 dark:text-zinc-900' : 'border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300'}`}>{label} ({counts[key]})</button>
        ))}
      </div>

      {TOPICS.find(item => item.key === topic)?.caution && <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400" data-topic-caution>{t(TOPICS.find(item => item.key === topic)!.caution!)}</p>}
      <div className="space-y-2">
        {shown.length === 0 && <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400" data-topic-empty>{show === 'met' ? t('No rule of this topic is met by the chart; the other rules are under the buttons above.') : t('No rule of this kind.')}</p>}
        {shown.map((result, index) => {
          const [icon, color, word] = badge(result.outcome.met);
          const heading = (TOPICS.find(item => item.key === topic)?.chapters.length ?? 0) > 1 && result.rule.chapter !== shown[index - 1]?.rule.chapter;
          return (
            <div key={result.rule.id} className="rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700" data-topic-rule={result.rule.id} data-met={String(result.outcome.met)}>
              {heading && <div className="mb-1 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600" data-topic-chapter={result.rule.chapter}>BPHS {result.rule.chapter}</div>}
              <div className="flex items-baseline gap-2">
                <span className={`font-bold ${color}`} aria-label={word}>{icon}</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-200">{t(result.rule.name)}</span>
                <span className={`text-[10px] ${color}`}>{word}</span>
              </div>
              {result.outcome.lines.map(line => <div key={line} className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-300">· {line}</div>)}
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{t('The text says')}: {t(result.rule.effect)}</div>
              <Verses verses={result.verses} />
            </div>
          );
        })}
      </div>
      {left.length > 0 && (
        <details className="rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700">
          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{t('Verses not judged here (they need the war of the grahas, the daśā or a reading the text does not settle)')}</summary>
          <div className="mt-2"><Verses verses={left} /></div>
        </details>
      )}
    </div>
  );
}
