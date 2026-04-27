'use client';

import { useMemo, useState } from 'react';
import { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import {
  calculateCharaDasha,
  calculateCharaSubDashas,
  CharaDashaEntry,
  CharaLevel,
  charaSignAbbr,
} from '@/lib/charaDasha';

const LEVELS = ['md', 'ad', 'pd'] as const;
const LEVEL_LABEL: Record<CharaLevel, string> = { md: 'MD', ad: 'AD', pd: 'PD' };

interface Props {
  planets: PlanetData[];
  ascendant: { sign: number; longitude: number; degree: number };
  birthDatetime: string;
}

function levelIndex(level: CharaLevel): number {
  return LEVELS.indexOf(level);
}

function nextLevel(level: CharaLevel): CharaLevel | null {
  const idx = levelIndex(level);
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function fmtRange(start: Date, end: Date): string {
  return `${fmtDate(start)}–${fmtDate(end)}`;
}

function isActive(entry: CharaDashaEntry, now: Date): boolean {
  return entry.startDate <= now && now < entry.endDate;
}

function entryKey(entry: CharaDashaEntry): string {
  return `${entry.sign}-${entry.level}-${entry.startDate.getTime()}`;
}

function activeEntry(entries: CharaDashaEntry[], now: Date): CharaDashaEntry | null {
  return entries.find((entry) => isActive(entry, now)) ?? null;
}

export default function CharaDashaPanel({ planets, ascendant, birthDatetime }: Props) {
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
    const path: CharaDashaEntry[] = [];
    let entries = result.entries;

    for (let i = 0; i < LEVELS.length; i++) {
      const current = activeEntry(entries, now);
      if (!current) break;
      path.push(current);
      const childLevel = LEVELS[i + 1];
      if (!childLevel) break;
      entries = calculateCharaSubDashas(current, childLevel);
    }

    return path;
  }, [result, now]);

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; chara dasha</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
          Planet, Lagna, or birth datetime data missing.
        </div>
      </div>
    );
  }

  const currentLevelIdx = levelIndex(level);
  const parent = currentLevelIdx === 0 ? null : selected[currentLevelIdx - 1];
  const entries = level === 'md' ? result.entries : parent ? calculateCharaSubDashas(parent, level) : [];
  const currentActive = activeEntry(entries, now);
  const currentNextLevel = nextLevel(level);
  const selectedHere = selected[currentLevelIdx] ?? null;
  const canDrill = !!currentNextLevel;

  const goToLevel = (target: CharaLevel) => {
    setSelected((prev) => prev.slice(0, levelIndex(target)));
    setLevel(target);
  };

  const goBack = () => {
    const idx = levelIndex(level);
    if (idx <= 0) return;
    goToLevel(LEVELS[idx - 1]);
  };

  const openNow = () => {
    const idx = Math.min(activePath.length - 1, LEVELS.length - 1);
    if (idx < 0) return;
    setSelected(activePath.slice(0, idx));
    setLevel(LEVELS[idx]);
  };

  const handleRowClick = (entry: CharaDashaEntry) => {
    if (canDrill && currentNextLevel) {
      setSelected((prev) => {
        const next = prev.slice(0, currentLevelIdx);
        next[currentLevelIdx] = entry;
        return next;
      });
      setLevel(currentNextLevel);
      return;
    }

    setSelected((prev) => {
      const next = prev.slice(0, currentLevelIdx);
      next[currentLevelIdx] = entry;
      return next;
    });
  };

  return (
    <div className="space-y-3 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          &gt; chara dasha
        </div>
        <button
          onClick={openNow}
          className="px-2 py-1 rounded-md border border-cyan-300/70 dark:border-cyan-600/60 bg-cyan-50 dark:bg-cyan-900/20 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
        >
          NOW
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 min-w-0">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1">
          active now
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 leading-5">
          {activePath.length > 0 ? (
            activePath.map((entry, index) => (
              <span key={`${entryKey(entry)}-${index}`} className="inline-flex items-center gap-1">
                <span>{charaSignAbbr(entry.sign)} {LEVEL_LABEL[LEVELS[index]]}</span>
                {index < activePath.length - 1 && <span className="text-zinc-400 dark:text-zinc-600">›</span>}
              </span>
            ))
          ) : (
            <span className="text-zinc-400 dark:text-zinc-600 italic">No current period in generated timeline.</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono min-h-[24px] min-w-0">
        {selected.map((entry, index) => {
          const selectedLevel = LEVELS[index];
          const targetLevel = LEVELS[index + 1];
          if (!selectedLevel || !targetLevel) return null;
          return (
            <span key={`${entryKey(entry)}-crumb`} className="inline-flex items-center gap-1">
              {index > 0 && <span className="text-zinc-300 dark:text-zinc-700">›</span>}
              <button
                onClick={() => goToLevel(targetLevel)}
                className={`px-2 py-1 rounded-md border transition-colors ${
                  level === targetLevel
                    ? 'border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {charaSignAbbr(entry.sign)} {LEVEL_LABEL[selectedLevel]}
              </button>
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1">
          {selected.length > 0 && <span className="text-zinc-300 dark:text-zinc-700">›</span>}
          <button
            onClick={() => goToLevel(level)}
            className="px-2 py-1 rounded-md border border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300"
          >
            {LEVEL_LABEL[level]}
          </button>
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={goBack}
          disabled={level === 'md'}
          className="px-2 py-1 rounded-md text-[10px] font-mono border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 disabled:opacity-30 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          ← back
        </button>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
          {LEVEL_LABEL[level]} · {entries.length} periods
        </div>
      </div>

      <div className="space-y-1 min-w-0">
        {entries.map((entry) => {
          const key = entryKey(entry);
          const active = currentActive ? entryKey(currentActive) === key : false;
          const selectedAtLevel = selectedHere ? entryKey(selectedHere) === key : false;

          return (
            <button
              key={key}
              onClick={() => handleRowClick(entry)}
              className={`w-full min-w-0 text-left flex items-center gap-2 px-2 py-2 rounded-lg border transition-colors group ${
                active
                  ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                  : selectedAtLevel
                  ? 'border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span className="font-mono text-xs font-bold w-7 flex-shrink-0">
                {charaSignAbbr(entry.sign)}
              </span>
              <span className="min-w-0 flex-1 font-mono text-[11px] md:text-xs text-zinc-500 dark:text-zinc-500 tabular-nums truncate">
                {fmtRange(entry.startDate, entry.endDate)} · {entry.durationYears.toFixed(2)}y
              </span>
              {active && <span className="text-[8px] text-cyan-500 dark:text-cyan-400 flex-shrink-0">●</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
