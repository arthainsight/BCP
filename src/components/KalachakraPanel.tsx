'use client';

import { useMemo, useState } from 'react';
import type { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateKalachakra, calculateKalachakraSubDashas, type KalachakraEntry } from '@/lib/kalachakra';

const ABBR: Record<string, string> = { Aries:'Ar', Taurus:'Ta', Gemini:'Ge', Cancer:'Cn', Leo:'Le', Virgo:'Vi', Libra:'Li', Scorpio:'Sc', Sagittarius:'Sg', Capricorn:'Cp', Aquarius:'Aq', Pisces:'Pi' };

const LEVELS = ['md', 'ad', 'pd', 'sd', 'prana', 'deha'] as const;
type Level = (typeof LEVELS)[number];
const LEVEL_LABEL: Record<Level, string> = { md: 'MD', ad: 'AD', pd: 'PD', sd: 'SD', prana: 'PR', deha: 'DE' };

function fmt(date: Date, withTime = false) {
  const day = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  return withTime ? `${day} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : day;
}

function active(entry: KalachakraEntry, now: Date) {
  return entry.startDate <= now && now < entry.endDate;
}

export default function KalachakraPanel({ planets, birthDatetime }: { planets: PlanetData[]; birthDatetime: string }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [path, setPath] = useState<KalachakraEntry[]>([]);
  const now = useMemo(() => new Date(), []);
  const result = useMemo(() => {
    const moon = planets.find((planet) => planet.name === 'Moon');
    const birth = parseDateTime(birthDatetime);
    if (!moon || moon.longitude == null || !birth) return null;
    return calculateKalachakra(moon.longitude, birth);
  }, [planets, birthDatetime]);

  if (!result) return <div className="text-xs font-mono text-zinc-400 italic">Moon longitude and valid birth datetime required.</div>;

  const parent = levelIndex > 0 ? path[levelIndex - 1] : null;
  const rows = parent ? calculateKalachakraSubDashas(parent, result.cycle) : result.entries;
  const activePath: KalachakraEntry[] = [];
  let activeRows = result.entries;
  for (let index = 0; index < LEVELS.length; index++) {
    const current = activeRows.find(item => active(item, now));
    if (!current) break;
    activePath.push(current);
    activeRows = calculateKalachakraSubDashas(current, result.cycle);
  }
  const currentLevel = LEVELS[levelIndex];
  const deep = levelIndex >= 2;

  const openEntry = (entry: KalachakraEntry) => {
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
        <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">&gt; kālachakra daśā</div>
        <button type="button" onClick={openNow} className="rounded border border-cyan-300 px-2 py-1 text-[10px] font-mono text-cyan-700 dark:border-cyan-700 dark:text-cyan-300">NOW</button>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        <div>{result.nakshatra} · pada {result.pada} · {result.motion}</div>
        <div>Deha: {ABBR[result.dehaSign]} · Jīva: {ABBR[result.jeevaSign]}</div>
        {activePath.length > 0 && <div className="mt-1 text-cyan-700 dark:text-cyan-300">Now: {activePath.map((entry, index) => `${ABBR[entry.signName]} ${LEVEL_LABEL[LEVELS[index]]}`).join(' › ')}</div>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={goBack} disabled={levelIndex === 0} className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-mono disabled:opacity-30 dark:border-zinc-700">← back</button>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{LEVEL_LABEL[currentLevel]} · {rows.length} periods</div>
      </div>
      {path.length > 0 && <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">{path.map((entry, index) => `${ABBR[entry.signName]} ${LEVEL_LABEL[LEVELS[index]]}`).join(' › ')} › {LEVEL_LABEL[currentLevel]}</div>}
      <div className="space-y-1">
        {rows.map((item) => {
          const isNow = active(item, now);
          return (
            <button key={`${item.sign}-${item.startDate.getTime()}`} type="button" onClick={() => openEntry(item)} className={`w-full rounded-md border px-3 py-2 text-left font-mono text-xs ${isNow ? 'border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300' : 'border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200'}`}>
              <span className="inline-block w-8 font-bold">{ABBR[item.signName]}</span>
              <span>{fmt(item.startDate, deep)}–{fmt(item.endDate, deep)}</span>
              <span className="float-right text-zinc-400">{item.durationYears.toFixed(2)} y</span>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] font-mono leading-relaxed text-zinc-400 dark:text-zinc-600">Moon-pāda PVR/BPHS table method. Birth balance is the unelapsed portion of the first rāśi period.</p>
    </div>
  );
}
