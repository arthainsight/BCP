'use client';

import { useState, useMemo } from 'react';
import { calculateSubDashas, MahadashaEntry } from '@/lib/vimshottari';
import { calculateVds } from '@/lib/vds';
import { parseDateTime } from '@/lib/bcp';
import { PlanetData } from '@/types';

const ABBR: Record<string, string> = {
  Ketu: 'Ke', Venus: 'Ve', Sun: 'Su', Moon: 'Mo', Mars: 'Ma',
  Rahu: 'Ra', Jupiter: 'Ju', Saturn: 'Sa', Mercury: 'Me',
};

const LEVELS = ['md', 'ad', 'pd', 'sd', 'prana', 'deha'] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_LABEL: Record<Level, string> = {
  md: 'MD', ad: 'AD', pd: 'PD', sd: 'SD', prana: 'PR', deha: 'DE',
};

function levelIndex(level: Level): number {
  return LEVELS.indexOf(level);
}

function nextLevel(level: Level): Level | null {
  const idx = levelIndex(level);
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

function showTimeForLevel(level: Level): boolean {
  return levelIndex(level) >= levelIndex('pd');
}

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDateTime(d: Date): string {
  return `${fmtDate(d)} ${fmtTime(d)}`;
}

function fmtRange(start: Date, end: Date, level: Level): string {
  return showTimeForLevel(level)
    ? `${fmtDateTime(start)}–${fmtDateTime(end)}`
    : `${fmtDate(start)}–${fmtDate(end)}`;
}

function isActive(e: MahadashaEntry, now: Date): boolean {
  return e.startDate <= now && now < e.endDate;
}

function entryKey(e: MahadashaEntry): string {
  return `${e.lord}-${e.startDate.getTime()}`;
}

function activeEntry(entries: MahadashaEntry[], now: Date): MahadashaEntry | null {
  return entries.find((e) => isActive(e, now)) ?? null;
}

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
}

export default function VdsPanel({ planets, ascendant, birthDatetime }: Props) {
  const [level, setLevel] = useState<Level>('md');
  const [selected, setSelected] = useState<MahadashaEntry[]>([]);

  const result = useMemo(() => {
    const moon = planets.find((p) => p.name === 'Moon');
    const sun  = planets.find((p) => p.name === 'Sun');
    if (!moon || !sun || moon.longitude == null || sun.longitude == null) return null;
    const bd = parseDateTime(birthDatetime);
    if (!bd) return null;

    const planetLongitudes: Record<string, number> = {};
    for (const p of planets) planetLongitudes[p.name] = p.longitude;

    return calculateVds({
      moonLongitude:  moon.longitude,
      sunLongitude:   sun.longitude,
      lagnaLongitude: ascendant.longitude,
      lagnaSign:      ascendant.sign,
      lagnaDegree:    ascendant.degree,
      birthDate:      bd,
      planetLongitudes,
    });
  }, [planets, ascendant, birthDatetime]);

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
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; vds</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
          Moon, Sun, or birth datetime data missing.
        </div>
      </div>
    );
  }

  const currentLevelIdx = levelIndex(level);
  const parent           = currentLevelIdx === 0 ? null : selected[currentLevelIdx - 1];
  const entries          = level === 'md' ? result.entries : parent ? calculateSubDashas(parent) : [];
  const currentActive    = activeEntry(entries, now);
  const currentNextLevel = nextLevel(level);
  const selectedHere     = selected[currentLevelIdx] ?? null;
  const deep             = showTimeForLevel(level);
  const canDrill         = !!currentNextLevel;

  const goToLevel = (target: Level) => {
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

  const handleRowClick = (entry: MahadashaEntry) => {
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

  const cycleLabel = result.cycle === 'krittikadi' ? 'Krittikadi' : 'Ardradi';

  return (
    <div className="space-y-3 min-w-0 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          &gt; vds
        </div>
        <button
          onClick={openNow}
          className="px-2 py-1 rounded-md border border-cyan-300/70 dark:border-cyan-600/60 bg-cyan-50 dark:bg-cyan-900/20 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
        >
          NOW
        </button>
      </div>

      {/* VDS parameters card */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 min-w-0">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1.5">
          vds parameters
        </div>
        <div className="grid grid-cols-3 gap-x-3 text-[10px] font-mono">
          <div>
            <div className="text-zinc-400 dark:text-zinc-600">cycle</div>
            <div className="text-zinc-700 dark:text-zinc-200 font-semibold">{cycleLabel}</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-600">DTP</div>
            <div className="text-cyan-700 dark:text-cyan-300 font-semibold">{ABBR[result.dtp] ?? result.dtp}</div>
          </div>
          <div>
            <div className="text-zinc-400 dark:text-zinc-600">DOP</div>
            <div className="text-emerald-700 dark:text-green-400 font-semibold">{ABBR[result.dop] ?? result.dop}</div>
          </div>
        </div>
        <div className="mt-1.5 text-[9px] font-mono text-zinc-400 dark:text-zinc-600 leading-4">
          DTP nak: {result.dtpNakshatra} · DOP nak: {result.dopNakshatra}
        </div>
      </div>

      {/* Active now */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 min-w-0">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 mb-1">
          active now
        </div>
        <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 leading-5">
          {activePath.map((entry, index) => (
            <span key={`${entryKey(entry)}-${index}`} className="inline-flex items-center gap-1">
              <span>{ABBR[entry.lord] ?? entry.lord} {LEVEL_LABEL[LEVELS[index]]}</span>
              {index < activePath.length - 1 && <span className="text-zinc-400 dark:text-zinc-600">›</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono min-h-[24px] min-w-0">
        {selected.map((entry, index) => {
          const selLevel = LEVELS[index];
          const targetLevel = LEVELS[index + 1];
          if (!selLevel || !targetLevel) return null;
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
                {ABBR[entry.lord] ?? entry.lord} {LEVEL_LABEL[selLevel]}
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

      {/* Back / count */}
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

      {/* Entry list */}
      <div className="space-y-1 min-w-0">
        {entries.map((entry) => {
          const key        = entryKey(entry);
          const active     = currentActive ? entryKey(currentActive) === key : false;
          const isSelected = selectedHere ? entryKey(selectedHere) === key : false;
          const abbr       = ABBR[entry.lord] ?? entry.lord.slice(0, 2);

          return (
            <button
              key={key}
              onClick={() => handleRowClick(entry)}
              className={`w-full min-w-0 text-left flex items-center gap-2 px-2 py-2 rounded-lg border transition-colors group ${
                active
                  ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
                  : isSelected
                  ? 'border-emerald-300 dark:border-green-700 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span className="font-mono text-xs font-bold w-7 flex-shrink-0">{abbr}</span>

              {deep ? (
                <span className="min-w-0 flex-1 font-mono text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-500 tabular-nums leading-4">
                  <span className="block truncate">{fmtDateTime(entry.startDate)}</span>
                  <span className="block truncate text-zinc-400 dark:text-zinc-600">→ {fmtDateTime(entry.endDate)}</span>
                </span>
              ) : (
                <span className="min-w-0 flex-1 font-mono text-[11px] md:text-xs text-zinc-500 dark:text-zinc-500 tabular-nums truncate">
                  {fmtRange(entry.startDate, entry.endDate, level)}
                </span>
              )}

              {active && <span className="text-[8px] text-cyan-500 dark:text-cyan-400 flex-shrink-0">●</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
