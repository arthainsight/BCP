'use client';

import { useState } from 'react';
import type { ChartData } from '@/types';
import { useT } from '@/lib/i18n';
import VimsopakaPanel from './VimsopakaPanel';
import ShadbalaPanel from './ShadbalaPanel';
import BhavaBalaPanel from './BhavaBalaPanel';

type BalaView = 'shadbala' | 'bhava' | 'vimsopaka';

const TABS: { key: BalaView; label: string }[] = [
  { key: 'shadbala', label: 'Ṣaḍbala' },
  { key: 'bhava', label: 'Bhāva Bala' },
  { key: 'vimsopaka', label: 'Vimśopaka' },
];

/** The strengths of the grahas and the houses: Ṣaḍbala, Bhāva Bala and Vimśopaka Bala, each with its diagram and table. */
export default function BalaPanel({ chart }: { chart: ChartData | null | undefined }) {
  const t = useT();
  const [view, setView] = useState<BalaView>('shadbala');
  if (!chart) return <div className="flex h-40 items-center justify-center px-4 text-center font-mono text-xs text-zinc-400 dark:text-zinc-600">{t('Calculate a chart first.')}</div>;

  return (
    <div className="min-w-0 space-y-4">
      <div className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setView(tab.key)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-mono ${view === tab.key ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {view === 'shadbala' && <ShadbalaPanel chart={chart} />}
      {view === 'bhava' && <BhavaBalaPanel chart={chart} />}
      {view === 'vimsopaka' && <VimsopakaPanel chart={chart} />}
    </div>
  );
}
