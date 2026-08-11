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

const LEVELS = ['md', 'ad', 'pd', 'sd', 'prana', 'deha'] as const;
type Level = (typeof LEVELS)[number];
const LEVEL_LABEL: Record<Level, string> = { md: 'MD', ad: 'AD', pd: 'PD', sd: 'SD', prana: 'PR', deha: 'DE' };

function fmt(date: Date, withTime = false) {
  const day = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  return withTime ? `${day} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : day;
}

function entryKey(entry: CleanCharaEntry) {
  return `${entry.sign}-${entry.startDate.getTime()}`;
}

export default function CharaCleanPanel({ planets, ascendant, birthDatetime, settings }: Props) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [path, setPath] = useState<CleanCharaEntry[]>([]);
  const now = useMemo(() => new Date(), []);
  const bd = parseDateTime(birthDatetime);
  const result = bd ? calculateCleanCharaMD(planets, ascendant.sign, bd, settings) : null;

  if (!result) {
    return <div className="text-xs font-mono text-zinc-400">No data</div>;
  }

  const parent = levelIndex > 0 ? path[levelIndex - 1] : null;
  const rows = parent ? calculateCleanCharaSubDashas(parent, settings) : result.entries;
  const isActive = (entry: CleanCharaEntry) => entry.startDate <= now && now < entry.endDate;
  const activePath: CleanCharaEntry[] = [];
  let activeRows = result.entries;
  for (let index = 0; index < LEVELS.length; index++) {
    const current = activeRows.find(isActive);
    if (!current) break;
    activePath.push(current);
    activeRows = calculateCleanCharaSubDashas(current, settings);
  }
  const currentLevel = LEVELS[levelIndex];
  const deep = levelIndex >= 2;

  const openEntry = (entry: CleanCharaEntry) => {
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
        <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest">&gt; chara daśā</div>
        <button type="button" onClick={openNow} className="rounded border border-cyan-300 px-2 py-1 text-[10px] font-mono text-cyan-700 dark:border-cyan-700 dark:text-cyan-300">NOW</button>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        <div>Start: {result.startBasis}</div>
        {activePath.length > 0 && <div className="mt-1 text-cyan-700 dark:text-cyan-300">Now: {activePath.map((entry, index) => `${entry.abbr} ${LEVEL_LABEL[LEVELS[index]]}`).join(' › ')}</div>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={goBack} disabled={levelIndex === 0} className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-mono disabled:opacity-30 dark:border-zinc-700">← back</button>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{LEVEL_LABEL[currentLevel]} · {rows.length} periods</div>
      </div>
      {path.length > 0 && <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">{path.map((entry, index) => `${entry.abbr} ${LEVEL_LABEL[LEVELS[index]]}`).join(' › ')} › {LEVEL_LABEL[currentLevel]}</div>}
      <div className="space-y-1">
        {rows.map((entry) => {
          const active = isActive(entry);
          return (
            <button key={entryKey(entry)} type="button" onClick={() => openEntry(entry)} className={`w-full rounded-md border px-3 py-2 text-left font-mono text-xs ${active ? 'border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300' : 'border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200'}`}>
              <span className="inline-block w-8 font-bold">{entry.abbr}</span>
              <span>{fmt(entry.startDate, deep)}–{fmt(entry.endDate, deep)}</span>
              <span className="float-right text-zinc-400">{entry.durationYears.toFixed(2)} y</span>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">Rāśi periods from {result.startBasis}; durations counted to each sign lord with the selected Chara settings.</p>
    </div>
  );
}
