'use client';

import type { BnnFinding, Confidence } from '@/lib/bnn/types';
import { GRAHA_FULL_NAMES, RELATION_LABEL } from '@/lib/bnn/karakas';

const CONF_STYLE: Record<Confidence, string> = {
  high:   'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700',
  medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700',
  low:    'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700',
};

interface Props {
  findings: BnnFinding[];
  emptyLabel?: string;
}

export default function BnnFindings({ findings, emptyLabel }: Props) {
  if (findings.length === 0) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-1">
        {emptyLabel ?? 'No findings.'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {findings.map((f, i) => (
        <div
          key={`${f.anchor}-${f.relatedGraha}-${f.relationType}-${i}`}
          className="border border-zinc-200 dark:border-zinc-700 rounded-md p-3 bg-white dark:bg-zinc-900"
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200">
              {GRAHA_FULL_NAMES[f.anchor]} — {GRAHA_FULL_NAMES[f.relatedGraha]}
            </span>
            <span className={`shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded ${CONF_STYLE[f.confidence]}`}>
              {f.confidence}
            </span>
          </div>
          <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mb-1.5">
            {RELATION_LABEL[f.relationType]} · strength {f.strength}
          </div>
          <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {f.interpretation}
          </div>
          {f.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {f.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
