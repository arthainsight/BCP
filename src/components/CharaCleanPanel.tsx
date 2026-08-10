'use client';

import { useMemo, useState } from 'react';
import { PlanetData, CharaOptions } from '@/types';
import { calculateCleanCharaMD, calculateCleanCharaSubDashas, type CleanCharaEntry } from '@/lib/charaClean';
import { parseDateTime } from '@/lib/bcp';

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  settings: CharaOptions;
}

export default function CharaCleanPanel({ planets, ascendant, birthDatetime, settings }: Props) {
  const [selected, setSelected] = useState<CleanCharaEntry | null>(null);
  const now = useMemo(() => new Date(), []);
  const bd = parseDateTime(birthDatetime);
  const result = bd ? calculateCleanCharaMD(planets, ascendant.sign, bd, settings) : null;

  if (!result) {
    return <div className="text-xs font-mono text-zinc-400">No data</div>;
  }

  const rows = selected ? calculateCleanCharaSubDashas(selected, settings) : result.entries;
  const fmt = (date: Date) => `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  const isActive = (entry: CleanCharaEntry) => entry.startDate <= now && now < entry.endDate;
  const current = result.entries.find(isActive);

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest">&gt; chara daśā</div>
        {selected && <button type="button" onClick={() => setSelected(null)} className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-mono dark:border-zinc-700">← MD</button>}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        <div>Start: {result.startBasis}</div>
        {current && <div className="mt-1 text-cyan-700 dark:text-cyan-300">Now: {current.abbr} MD · {fmt(current.startDate)}–{fmt(current.endDate)}</div>}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{selected ? `${selected.abbr} antardaśā` : 'mahādaśā'}</div>
      <div className="space-y-1">
        {rows.map((entry) => {
          const active = isActive(entry);
          return (
            <button key={`${entry.sign}-${entry.startDate.getTime()}`} type="button" onClick={() => !selected && setSelected(entry)} className={`w-full rounded-md border px-3 py-2 text-left font-mono text-xs ${active ? 'border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300' : 'border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200'}`}>
              <span className="inline-block w-8 font-bold">{entry.abbr}</span>
              <span>{fmt(entry.startDate)}–{fmt(entry.endDate)}</span>
              <span className="float-right text-zinc-400">{entry.durationYears.toFixed(2)} y</span>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">Rāśi periods from {result.startBasis}; durations counted to each sign lord with the selected Chara settings.</p>
    </div>
  );
}
