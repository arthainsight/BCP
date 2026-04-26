'use client';

import { useState, useMemo } from 'react';
import {
  calculateVimshottari,
  calculateSubDashas,
  MahadashaEntry,
} from '@/lib/vimshottari';
import { parseDateTime } from '@/lib/bcp';
import { PlanetData } from '@/types';

const ABBR: Record<string, string> = {
  Ketu: 'Ke', Venus: 'Ve', Sun: 'Su', Moon: 'Mo', Mars: 'Ma',
  Rahu: 'Ra', Jupiter: 'Ju', Saturn: 'Sa', Mercury: 'Me',
};

const LEVELS = ['md', 'ad', 'pd', 'sd', 'prana', 'deha'] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_LABEL: Record<Level, string> = {
  md: 'MD',
  ad: 'AD',
  pd: 'PD',
  sd: 'SD',
  prana: 'PR',
  deha: 'DE',
};

function fmtDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function fmtTime(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function fmtDateTime(d: Date): string {
  return `${fmtDate(d)} ${fmtTime(d)}`;
}

function fmtRange(start: Date, end: Date, level: Level): string {
  const showTime = levelIndex(level) >= levelIndex('pd');
  return showTime
    ? `${fmtDateTime(start)}–${fmtDateTime(end)}`
    : `${fmtDate(start)}–${fmtDate(end)}`;
}

function isActive(e: MahadashaEntry, now: Date): boolean {
  return e.startDate <= now && now < e.endDate;
}

function entryKey(e: MahadashaEntry): string {
  return `${e.lord}-${e.startDate.getTime()}`;
}

function levelIndex(level: Level): number {
  return LEVELS.indexOf(level);
}

function nextLevel(level: Level): Level | null {
  const idx = levelIndex(level);
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

function activeEntry(entries: MahadashaEntry[], now: Date): MahadashaEntry | null {
  return entries.find((entry) => isActive(entry, now)) ?? null;
}

interface Props {
  planets: PlanetData[];
  birthDatetime: string;
  showMd: boolean;
  showAd: boolean;
  showPd: boolean;
}

export default function VimshottariPanel({ planets, birthDatetime, showMd, showAd, showPd }: Props) {
  const [level, setLevel] = useState<Level>('md');
  const [selected, setSelected] = useState<MahadashaEntry[]>([]);

  const result = useMemo(() => {
    const moon = planets.find((p) => p.name === 'Moon');
    if (!moon || moon.longitude == null) return null;
    const bd = parseDateTime(birthDatetime);
    if (!bd) return null;
    return calculateVimshottari(moon.longitude, bd);
  }, [planets, birthDatetime]);

  const now = useMemo(() => new Date(), []);

  const activePath = useMemo(() => {
    if (!result) return [] as MahadashaEntry[];
    const path: MahadashaEntry[] = [];
    let entries = result.entries;

    for (let i = 0; i < LEVELS.length; i++) {
      const current = activeEntry(entries, now);
      if (!current) break;
      path.push(current);
      entries = calculateSubDashas(current);
    }

    return path;
  }, [result, now]);

  if (!result) {
    const moon = planets.find((p) => p.name === 'Moon');
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; vimshottari</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
          {!moon ? 'Moon data required.' : 'Invalid birth datetime.'}
        </div>
      </div>
    );
  }

  if (!showMd) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; vimshottari</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
          MD disabled — enable in Settings → Dasha.
        </div>
      </div>
    );
  }

  const currentLevelIndex = levelIndex(level);
  const parent = currentLevelIndex === 0 ? null : selected[currentLevelIndex - 1];
  const entries = level === 'md' ? result.entries : parent ? calculateSubDashas(parent) : [];
  const currentActive = activeEntry(entries, now);
  const currentNextLevel = nextLevel(level);
  const selectedAtThisLevel = selected[currentLevelIndex] ?? null;

  const canDrill = !!currentNextLevel && (level === 'md' ? showAd : level === 'ad' ? showPd : true);

  const goToLevel = (target: Level) => {
    const idx = levelIndex(target);
    setSelected((prev) => prev.slice(0, idx));
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

  const handleRowClick = (entry: MahadashaEntry) => {
    if (canDrill && currentNextLevel) {
      setSelected((prev) => {
        const next = prev.slice(0, currentLevelIndex);
        next[currentLevelIndex] = entry;
        return next;
      });
      setLevel(currentNextLevel);
      return;
    }

    setSelected((prev) => {
      const next = prev.slice(0, currentLevelIndex);
      next[currentLevelIndex] = entry;
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          &gt; vimshottari
        </div>
        <button
          onClick={openNow}
          className="px-2 py-1 rounded-md border border-amber-300/70 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-900/20 text-[10px] font-mono text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          NOW
        </button>
      </div>

      <div className="rounded-lg border border-amber-200/70 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2">
        <div className="text-[9px] font-mono uppercase tracking-widest text-amber-600/80 dark:text-amber-400/80 mb-1">
          active now
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-amber-800 dark:text-amber-300">
          {activePath.map((entry, index) => (
            <span key={`${entryKey(entry)}-${index}`} className="inline-flex items-center gap-1">
              <span>{ABBR[entry.lord] ?? entry.lord} {LEVEL_LABEL[LEVELS[index]]}</span>
              {index < activePath.length - 1 && <span className="text-amber-400 dark:text-amber-600">›</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono min-h-[24px]">
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
                {ABBR[entry.lord] ?? entry.lord} {LEVEL_LABEL[selectedLevel]}
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

      <div className="space-y-1">
        {entries.map((entry) => {
          const key = entryKey(entry);
          const active = currentActive ? entryKey(currentActive) === key : false;
          const selectedHere = selectedAtThisLevel ? entryKey(selectedAtThisLevel) === key : false;
          const abbr = ABBR[entry.lord] ?? entry.lord.slice(0, 2);

          return (
            <button
              key={key}
              onClick={() => handleRowClick(entry)}
              className={`w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg border transition-colors group ${
                active
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                  : selectedHere
                  ? 'border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span className="font-mono text-xs font-bold w-7 flex-shrink-0">
                {abbr}
              </span>
              <span className="font-mono text-[11px] md:text-xs text-zinc-500 dark:text-zinc-500 flex-1 tabular-nums whitespace-nowrap">
                {fmtRange(entry.startDate, entry.endDate, level)}
              </span>
              {active && <span className="text-[8px] text-amber-500 dark:text-amber-400 flex-shrink-0">●</span>}
              {canDrill && (
                <span className="text-[10px] text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 flex-shrink-0">
                  ›
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
