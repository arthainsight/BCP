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
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          &gt; vds
        </div>
        <button onClick={openNow} className="px-2 py-1 rounded-md border border-cyan-300/70 dark:border-cyan-600/60 bg-cyan-50 dark:bg-cyan-900/20 text-[10px] font-mono text-cyan-700 dark:text-cyan-300">NOW</button>
      </div>

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 mb-1.5">vds parameters</div>
        <div className="grid grid-cols-3 gap-x-3 text-[10px] font-mono">
          <div>
            <div className="text-zinc-400">cycle</div>
            <div className="font-semibold">{cycleLabel}</div>
          </div>
          <div>
            <div className="text-zinc-400">DTP</div>
            <div className="text-cyan-700 font-semibold">{ABBR[result.dtp]}</div>
          </div>
          <div>
            <div className="text-zinc-400">DOP</div>
            <div className="text-green-600 font-semibold">{ABBR[result.dop]}</div>
          </div>
        </div>
      </div>

      {/* DEBUG BLOCK */}
      {result.debug && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-mono">
          <div>paksha: {result.debug.paksha}</div>
          <div>hora: {result.debug.hora}</div>
          <div>lagna: {result.debug.lagnaNak} ({result.debug.lagnaNakshatra})</div>
          <div>moon: {result.debug.moonNak} ({result.debug.moonNakshatra})</div>
          <div>count: {result.debug.inclusiveCount}</div>
          <div>target: {result.debug.targetNak} ({result.debug.targetNakshatra})</div>
          <div>dtp: {result.debug.dtp}</div>
          <div>dtp nak: {result.debug.dtpPlanetNakshatra}</div>
          <div>dop: {result.debug.dop}</div>
          <div>dop nak: {result.debug.dopNakshatra}</div>
          <div>dop deg: {result.debug.dopDegreeInNakshatra.toFixed(2)}</div>
          <div>elapsed: {result.debug.elapsedYears.toFixed(2)}</div>
          <div>balance: {result.debug.balanceYears.toFixed(2)}</div>
        </div>
      )}

    </div>
  );
}
