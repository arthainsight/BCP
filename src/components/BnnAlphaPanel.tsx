'use client';

import { PlanetData } from '@/types';
import { analyzeBnn } from '@/lib/bnn';

const PLANET_CODES: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

interface Props {
  planets: PlanetData[];
  ascendant: { sign: number; degree: number };
}

export default function BnnAlphaPanel({ planets, ascendant }: Props) {
  const cards = analyzeBnn({ planets, ascendant });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; bnn.alpha</div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
          ALPHA
        </span>
      </div>

      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 leading-relaxed border border-zinc-200 dark:border-zinc-700 rounded p-2 bg-zinc-50 dark:bg-zinc-900/50">
        Bhrigu Nandi Nadi alpha module — illustrative rule cards only. Not a complete or validated
        BNN reading. Rules are structural placeholders for future expansion. Do not use for
        actual predictions.
      </div>

      {cards.length === 0 ? (
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-4">
          No alpha rules triggered for this chart.
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2.5 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-emerald-700 dark:text-green-400">
                  {PLANET_CODES[card.planet] ?? card.planet}
                </span>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  {card.context}
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {card.theme}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700">
        {cards.length} rule{cards.length !== 1 ? 's' : ''} triggered · alpha structural module
      </div>
    </div>
  );
}
