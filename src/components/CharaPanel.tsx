'use client';

import { useMemo, useState } from 'react';
import { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateCharaDasha, calculateCharaSubDashas, charaSignAbbr, CharaDashaEntry, CharaLevel } from '@/lib/charaDasha';

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
}

const LEVELS = ['md', 'ad', 'pd'] as const;
const LEVEL_LABEL: Record<CharaLevel, string> = { md: 'MD', ad: 'AD', pd: 'PD' };

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function entryKey(e: CharaDashaEntry): string {
  return `${e.level}-${e.sign}-${e.startDate.getTime()}`;
}

function isActive(e: CharaDashaEntry, now: Date): boolean {
  return e.startDate <= now && now < e.endDate;
}

function activeEntry(entries: CharaDashaEntry[], now: Date): CharaDashaEntry | null {
  return entries.find((e) => isActive(e, now)) ?? null;
}

function levelIndex(level: CharaLevel): number {
  return LEVELS.indexOf(level);
}

function nextLevel(level: CharaLevel): CharaLevel | null {
  const idx = levelIndex(level);
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export default function CharaPanel({ planets, ascendant, birthDatetime }: Props) {
  const [level, setLevel] = useState<CharaLevel>('md');
  const [selected, setSelected] = useState<CharaDashaEntry[]>([]);

  const result = useMemo(() => {
    const bd = parseDateTime(birthDatetime);
    if (!bd) return null;
    return calculateCharaDasha(planets, ascendant.sign, bd);
  }, [planets, ascendant.sign, birthDatetime]);

  const now = useMemo(() => new Date(), []);

  const activePath = useMemo(() => {
    if (!result) return [] as CharaDashaEntry[];
    const md = activeEntry(result.entries, now);
    if (!md) return [];
    const adEntries = calculateCharaSubDashas(md, 'ad', result.config, md.sign);
    const ad = activeEntry(adEntries, now);
    if (!ad) return [md];
    const pdEntries = calculateCharaSubDashas(ad, 'pd', result.config, md.sign);
    const pd = activeEntry(pdEntries, now);
    return pd ? [md, ad, pd] : [md, ad];
  }, [result, now]);

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; chara dasha</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">Missing data for Chara Dasha calculation.</div>
      </div>
    );
  }

  const currentLevelIndex = levelIndex(level);
  const parent = currentLevelIndex === 0 ? null : selected[currentLevelIndex - 1];
  const mdParent = currentLevelIndex > 0 ? selected[0] : null;
  const entries = level === 'md'
    ? result.entries
    : parent
      ? calculateCharaSubDashas(parent, level, result.config, mdParent?.sign ?? parent.sign)
      : [];
  const current = activeEntry(entries, now);
  const currentNextLevel = nextLevel(level);
  const selectedHere = selected[currentLevelIndex] ?? null;

  const goBack = () => {
    if (currentLevelIndex <= 0) return;
    setSelected((prev) => prev.slice(0, currentLevelIndex - 1));
    setLevel(LEVELS[currentLevelIndex - 1]);
  };

  const openNow = () => {
    const idx = Math.min(activePath.length - 1, LEVELS.length - 1);
    if (idx < 0) return;
    setSelected(activePath.slice(0, idx));
    setLevel(LEVELS[idx]);
  };

  const handleRowClick = (entry: CharaDashaEntry) => {
    setSelected((prev) => {
      const next = prev.slice(0, currentLevelIndex);
      next[currentLevelIndex] = entry;
      return next;
    });
    if (currentNextLevel) setLevel(currentNextLevel);
  };

  return (
    <div className="space-y-3 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; chara dasha</div>
        <button onClick={openNow} className="px-2 py-1 rounded-md border border-cyan-300/70 dark:border-cyan-600/60 bg-cyan-50 dark:bg-cyan-900/20 text-[10px] font-mono text-cyan-700 dark:text-cyan-300">NOW</button>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1">active now</div>
        <div className="flex flex-wrap gap-1 text-[10px] font-mono text-cyan-700 dark:text-cyan-300">
          {activePath.length ? activePath.map((e, i) => (
            <span key={entryKey(e)}>{charaSignAbbr(e.sign)} {LEVEL_LABEL[LEVELS[i]]}{i < activePath.length - 1 ? ' ›' : ''}</span>
          )) : <span className="text-zinc-400 dark:text-zinc-600 italic">No current period in generated timeline.</span>}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
          <div className="text-zinc-400 dark:text-zinc-600">start</div>
          <div className="text-zinc-700 dark:text-zinc-200">Lagna sign</div>
          <div className="text-zinc-400 dark:text-zinc-600">method</div>
          <div className="text-zinc-700 dark:text-zinc-200">{result.method}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono min-h-[24px] min-w-0">
        {selected.slice(0, currentLevelIndex).map((entry, index) => (
          <span key={`${entryKey(entry)}-crumb`} className="inline-flex items-center gap-1">
            {index > 0 && <span className="text-zinc-300 dark:text-zinc-700">›</span>}
            <button onClick={() => { setSelected((prev) => prev.slice(0, index + 1)); setLevel(LEVELS[index + 1]); }} className="px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              {charaSignAbbr(entry.sign)} {LEVEL_LABEL[LEVELS[index]]}
            </button>
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          {currentLevelIndex > 0 && <span className="text-zinc-300 dark:text-zinc-700">›</span>}
          <button className="px-2 py-1 rounded-md border border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300">
            {LEVEL_LABEL[level]}
          </button>
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button onClick={goBack} disabled={level === 'md'} className="px-2 py-1 rounded-md text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800">← back</button>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{LEVEL_LABEL[level]} · {entries.length} periods</div>
      </div>

      <div className="space-y-1 min-w-0">
        {entries.map((entry) => {
          const active = current ? entryKey(current) === entryKey(entry) : false;
          const selectedAtLevel = selectedHere ? entryKey(selectedHere) === entryKey(entry) : false;
          return (
            <button key={entryKey(entry)} onClick={() => handleRowClick(entry)} className={`w-full min-w-0 text-left flex items-center gap-2 px-2 py-2 rounded-lg border transition-colors ${active ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300' : selectedAtLevel ? 'border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300' : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
              <span className="font-mono text-xs font-bold w-7 flex-shrink-0">{charaSignAbbr(entry.sign)}</span>
              <span className="min-w-0 flex-1 font-mono text-[11px] md:text-xs text-zinc-500 dark:text-zinc-500 tabular-nums truncate">{fmtDate(entry.startDate)}–{fmtDate(entry.endDate)} · {entry.durationYears.toFixed(2).replace(/\.00$/, '')}y</span>
              {active && <span className="text-[8px] text-cyan-500 dark:text-cyan-400 flex-shrink-0">●</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
