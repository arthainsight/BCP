'use client';

import { useState, useMemo } from 'react';
import type { ChartData } from '@/types';
import type { TopicKey, GrahaKey } from '@/lib/bnn/types';
import { TOPIC_LABELS } from '@/lib/bnn/topics';
import { GRAHA_FULL_NAMES } from '@/lib/bnn/karakas';
import { adaptPlanetsForBnn, analyzeBnnFromChart, getAllRelationsFromChart } from '@/lib/bnn/analyze';
import { classifyFindings } from '@/lib/bnn/filter';
import BnnChains from './BnnChains';
import BnnFindings from './BnnFindings';
import BnnRelationTable from './BnnRelationTable';

const TOPICS: TopicKey[] = [
  'general', 'career', 'marriage', 'education',
  'wealth', 'children', 'spirituality', 'health',
];

const ALL_GRAHAS: GrahaKey[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'];

const SELECT =
  'w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300';

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[9px] font-mono text-zinc-300 dark:text-zinc-700">
          {count}
        </span>
      )}
    </div>
  );
}

interface Props {
  chart: ChartData;
}

export default function BnnPanel({ chart }: Props) {
  const [topic, setTopic] = useState<TopicKey>('general');
  const [anchor, setAnchor] = useState<GrahaKey | 'auto'>('auto');

  const presentGrahas = useMemo(
    () => new Set(adaptPlanetsForBnn(chart.planets).map((g) => g.graha)),
    [chart.planets],
  );

  const result = useMemo(
    () => analyzeBnnFromChart(chart, topic, anchor === 'auto' ? undefined : anchor),
    [chart, topic, anchor],
  );

  const { keyFindings, riskFactors, supportFactors } = useMemo(
    () => classifyFindings(result.findings),
    [result.findings],
  );

  const allRelations = useMemo(() => getAllRelationsFromChart(chart), [chart]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; bnn.engine</div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600">
          BNN RELATIONSHIP ENGINE
        </span>
      </div>

      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 leading-relaxed border border-zinc-200 dark:border-zinc-700 rounded p-2 bg-zinc-50 dark:bg-zinc-900/50">
        This is a rule-based BNN reading, not a Parashari house-lordship reading.
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">
            Topic
          </label>
          <select className={SELECT} value={topic} onChange={(e) => setTopic(e.target.value as TopicKey)}>
            {TOPICS.map((t) => (
              <option key={t} value={t}>{TOPIC_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">
            Anchor Graha
          </label>
          <select
            className={SELECT}
            value={anchor}
            onChange={(e) => setAnchor(e.target.value as GrahaKey | 'auto')}
          >
            <option value="auto">Auto (topic anchors)</option>
            {ALL_GRAHAS.filter((g) => presentGrahas.has(g)).map((g) => (
              <option key={g} value={g}>{GRAHA_FULL_NAMES[g]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/60 rounded-md px-3 py-2.5 border border-zinc-200 dark:border-zinc-700 whitespace-pre-line leading-relaxed">
        {result.summary}
      </div>

      {/* Anchors pills */}
      {result.anchorsUsed.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">Anchors:</span>
          {result.anchorsUsed.map((a) => (
            <span
              key={a}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-green-950/30 text-emerald-700 dark:text-green-400 border border-emerald-200 dark:border-green-900"
            >
              {GRAHA_FULL_NAMES[a]}
            </span>
          ))}
        </div>
      )}

      {/* ── Planetary Chains ──────────────────────────────────── */}
      <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-3">
        <SectionHeader label="Planetary Chains" count={result.topChains.length} />
        <BnnChains chains={result.topChains} />
      </div>

      {/* ── Key Patterns ──────────────────────────────────────── */}
      <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-3">
        <SectionHeader label="Key Patterns" count={keyFindings.length} />
        <BnnFindings findings={keyFindings} emptyLabel="No key patterns for this selection." />
      </div>

      {/* ── Support Factors ───────────────────────────────────── */}
      {supportFactors.length > 0 && (
        <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-3">
          <SectionHeader label="Support Factors" count={supportFactors.length} />
          <BnnFindings findings={supportFactors} />
        </div>
      )}

      {/* ── Risk Factors ──────────────────────────────────────── */}
      {riskFactors.length > 0 && (
        <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-3">
          <SectionHeader label="Risk Factors" count={riskFactors.length} />
          <BnnFindings findings={riskFactors} />
        </div>
      )}

      {/* ── Full Relation Map ─────────────────────────────────── */}
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
        <BnnRelationTable relations={allRelations} />
      </div>
    </div>
  );
}
