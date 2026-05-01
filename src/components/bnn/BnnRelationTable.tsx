'use client';

import { useState } from 'react';
import type { BnnRelation } from '@/lib/bnn/types';
import { GRAHA_FULL_NAMES, RELATION_LABEL } from '@/lib/bnn/karakas';

interface Props {
  relations: BnnRelation[];
}

export default function BnnRelationTable({ relations }: Props) {
  const [open, setOpen] = useState(false);

  if (relations.length === 0) return null;

  // Deduplicate conjunctions: only show one direction per pair
  const seen = new Set<string>();
  const dedupedRelations = relations.filter((r) => {
    if (r.relationType !== 'conjunction') return true;
    const key = [r.anchor, r.related].sort().join('-');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
      >
        <span className="uppercase tracking-widest">
          Full Relation Map · {dedupedRelations.length} pairs
        </span>
        <span className="text-zinc-400 dark:text-zinc-600">{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40">
                <th className="px-3 py-1.5 text-left font-normal text-zinc-400 dark:text-zinc-600">Anchor Graha</th>
                <th className="px-3 py-1.5 text-left font-normal text-zinc-400 dark:text-zinc-600">Relationship</th>
                <th className="px-3 py-1.5 text-left font-normal text-zinc-400 dark:text-zinc-600">Related Graha</th>
                <th className="px-3 py-1.5 text-right font-normal text-zinc-400 dark:text-zinc-600">Dist</th>
              </tr>
            </thead>
            <tbody>
              {dedupedRelations.map((r, i) => (
                <tr
                  key={`${r.anchor}-${r.related}-${r.relationType}-${i}`}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <td className="px-3 py-1.5 text-emerald-700 dark:text-green-400 font-semibold">
                    {GRAHA_FULL_NAMES[r.anchor]}
                  </td>
                  <td className="px-3 py-1.5 text-zinc-500 dark:text-zinc-400">
                    {RELATION_LABEL[r.relationType]}
                  </td>
                  <td className="px-3 py-1.5 text-zinc-700 dark:text-zinc-300">
                    {GRAHA_FULL_NAMES[r.related]}
                  </td>
                  <td className="px-3 py-1.5 text-right text-zinc-400 dark:text-zinc-600">
                    {r.distance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
