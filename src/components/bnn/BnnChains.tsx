'use client';

import type { BnnChain } from '@/lib/bnn/types';
import { GRAHA_FULL_NAMES } from '@/lib/bnn/karakas';

interface Props {
  chains: BnnChain[];
}

function StrengthBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 85 ? 'bg-emerald-500 dark:bg-green-600' :
    pct >= 70 ? 'bg-amber-500 dark:bg-amber-600' :
                'bg-zinc-300 dark:bg-zinc-600';
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">{value}</span>
    </div>
  );
}

export default function BnnChains({ chains }: Props) {
  if (chains.length === 0) {
    return (
      <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-2">
        No chains of strength ≥ 70 found for these anchors.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chains.map((chain) => {
        const pathKey = chain.path.join('-');
        const hasRa = chain.path.includes('Ra');

        return (
          <div
            key={pathKey}
            className="border border-zinc-200 dark:border-zinc-700 rounded-md p-3 bg-white dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              {/* Path labels */}
              <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 min-w-0">
                {chain.path.flatMap((g, i) => {
                  const items: React.ReactNode[] = [];
                  if (i > 0) {
                    items.push(
                      <span key={`arr-${pathKey}-${i}`} className="text-zinc-400 dark:text-zinc-600 text-[10px]">
                        →
                      </span>,
                    );
                  }
                  items.push(
                    <span key={`g-${pathKey}-${i}`} className="text-xs font-mono font-bold text-emerald-700 dark:text-green-400">
                      {g}
                    </span>,
                  );
                  return items;
                })}
              </div>
              <StrengthBar value={chain.strength} />
            </div>

            <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 leading-relaxed mb-1.5">
              {chain.interpretation}
            </div>

            {chain.combinedKarakas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {chain.combinedKarakas.slice(0, 4).map((k) => (
                  <span
                    key={k}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  >
                    {k}
                  </span>
                ))}
                {hasRa && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    unstable
                  </span>
                )}
              </div>
            )}

            {/* Per-link detail */}
            {chain.relations.length > 0 && (
              <div className="mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800 space-y-0.5">
                {chain.relations.map((r, ri) => (
                  <div key={`${pathKey}-rel-${ri}`} className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    <span className="text-zinc-500 dark:text-zinc-400">{GRAHA_FULL_NAMES[r.anchor]}</span>
                    <span>→</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{GRAHA_FULL_NAMES[r.related]}</span>
                    <span className="text-zinc-300 dark:text-zinc-600">({r.relationType}, dist {r.distance})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
