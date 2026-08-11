'use client';

import { useMemo, useState } from 'react';
import type { NakshatraDashaEntry } from '@/lib/nakshatraDasha';

const LEVELS = ['md', 'ad', 'pd', 'sd', 'prana', 'deha'] as const;
const LABELS = ['MD', 'AD', 'PD', 'SD', 'PR', 'DE'] as const;
const PLANET_ABBR: Record<string, string> = { Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me', Jupiter:'Ju', Venus:'Ve', Saturn:'Sa', Rahu:'Ra' };

function fmt(date: Date, withTime: boolean) {
  const day = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  return withTime ? `${day} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : day;
}

function isActive(entry: NakshatraDashaEntry, now: Date) {
  return entry.startDate <= now && now < entry.endDate;
}

export default function NakshatraDashaPanel({
  title, subtitle, entries, calculateChildren, showYoginiName = false,
}: {
  title: string;
  subtitle: string;
  entries: NakshatraDashaEntry[];
  calculateChildren: (parent: NakshatraDashaEntry) => NakshatraDashaEntry[];
  showYoginiName?: boolean;
}) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [path, setPath] = useState<NakshatraDashaEntry[]>([]);
  const now = useMemo(() => new Date(), []);
  const parent = levelIndex > 0 ? path[levelIndex - 1] : null;
  const rows = parent ? calculateChildren(parent) : entries;
  const activePath: NakshatraDashaEntry[] = [];
  let activeRows = entries;
  for (let index = 0; index < LEVELS.length; index++) {
    const current = activeRows.find(entry => isActive(entry, now));
    if (!current) break;
    activePath.push(current);
    activeRows = calculateChildren(current);
  }
  const displayName = (entry: NakshatraDashaEntry) => showYoginiName ? `${entry.name} (${PLANET_ABBR[entry.lord]})` : entry.name;

  const openEntry = (entry: NakshatraDashaEntry) => {
    if (levelIndex >= LEVELS.length - 1) return;
    setPath(previous => [...previous.slice(0, levelIndex), entry]);
    setLevelIndex(levelIndex + 1);
  };
  const goBack = () => {
    if (levelIndex === 0) return;
    setLevelIndex(levelIndex - 1);
    setPath(previous => previous.slice(0, levelIndex - 1));
  };
  const openNow = () => {
    if (activePath.length === 0) return;
    const target = Math.min(activePath.length - 1, LEVELS.length - 1);
    setPath(activePath.slice(0, target));
    setLevelIndex(target);
  };

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">&gt; {title}</div>
        <button type="button" onClick={openNow} className="rounded border border-cyan-300 px-2 py-1 text-[10px] font-mono text-cyan-700 dark:border-cyan-700 dark:text-cyan-300">NOW</button>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        <div>{subtitle}</div>
        {activePath.length > 0 && <div className="mt-1 text-cyan-700 dark:text-cyan-300">Now: {activePath.map((entry, index) => `${displayName(entry)} ${LABELS[index]}`).join(' › ')}</div>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={goBack} disabled={levelIndex === 0} className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-mono disabled:opacity-30 dark:border-zinc-700">← back</button>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{LABELS[levelIndex]} · {rows.length} periods</div>
      </div>
      {path.length > 0 && <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">{path.map((entry, index) => `${displayName(entry)} ${LABELS[index]}`).join(' › ')} › {LABELS[levelIndex]}</div>}
      <div className="space-y-1">
        {rows.map(entry => (
          <button key={`${entry.key}-${entry.startDate.getTime()}`} type="button" onClick={() => openEntry(entry)} className={`w-full rounded-md border px-3 py-2 text-left font-mono text-xs ${isActive(entry, now) ? 'border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300' : 'border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200'}`}>
            <span className="inline-block min-w-20 font-bold">{displayName(entry)}</span>
            <span>{fmt(entry.startDate, levelIndex >= 2)}–{fmt(entry.endDate, levelIndex >= 2)}</span>
            <span className="float-right text-zinc-400">{entry.durationYears.toFixed(2)} y</span>
          </button>
        ))}
      </div>
    </div>
  );
}
