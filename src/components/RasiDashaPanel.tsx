'use client';

import { useMemo, useState } from 'react';
import type { PlanetData } from '@/types';
import type { RasiDashaOptions } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateRasiDasha, calculateRasiSubDashas, type RasiDashaEntry, type RasiDashaSystem } from '@/lib/rasiDashas';
import { validateRasiDashaRegression } from '@/lib/rasiDashaValidation';

const LEVELS = ['MD', 'AD', 'PD', 'SD', 'PR', 'DE'] as const;
const TITLES: Record<RasiDashaSystem, string> = { narayana: 'nārāyaṇa daśā', moola: 'mūla daśā', sthira: 'sthira daśā' };
const NOTES: Record<RasiDashaSystem, string> = {
  narayana: 'Rāśi daśā · stronger Lagna/7th seed · 144-year two-cycle method with Saturn/Ketu exceptions.',
  moola: 'Lagna Kendrādi Rāśi (Mūla) variant · kendra, pāṇaphara and apoklima progression.',
  sthira: 'Rāśi daśā · Brahma seed · movable 7 y, fixed 8 y and dual 9 y.',
};

function fmt(date: Date, withTime: boolean) {
  const day = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
  return withTime ? `${day} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : day;
}

export default function RasiDashaPanel({ system, planets, ascendant, birthDatetime, options }: { system: RasiDashaSystem; planets: PlanetData[]; ascendant: { sign: number }; birthDatetime: string; options: RasiDashaOptions }) {
  const [level, setLevel] = useState(0);
  const [path, setPath] = useState<RasiDashaEntry[]>([]);
  const now = useMemo(() => new Date(), []);
  const result = useMemo(() => {
    const birth = parseDateTime(birthDatetime);
    return birth ? calculateRasiDasha(system, planets, ascendant.sign, birth, options) : null;
  }, [system, planets, ascendant.sign, birthDatetime, options]);
  const validation = useMemo(() => validateRasiDashaRegression(system), [system]);
  if (!result) return <div className="text-xs font-mono text-zinc-400">Valid birth datetime required.</div>;

  const children = (entry: RasiDashaEntry) => calculateRasiSubDashas(entry, planets, system);
  const rows = level ? children(path[level - 1]) : result.entries;
  const activePath: RasiDashaEntry[] = [];
  let current = result.entries;
  for (let i = 0; i < LEVELS.length; i++) {
    const found = current.find(item => item.startDate <= now && now < item.endDate);
    if (!found) break; activePath.push(found); current = children(found);
  }
  const open = (entry: RasiDashaEntry) => { if (level < LEVELS.length - 1) { setPath(old => [...old.slice(0, level), entry]); setLevel(level + 1); } };
  const back = () => { if (level) { setLevel(level - 1); setPath(old => old.slice(0, level - 1)); } };
  const openNow = () => { if (activePath.length) { const target = Math.min(activePath.length - 1, LEVELS.length - 1); setPath(activePath.slice(0, target)); setLevel(target); } };

  return <div className="space-y-3 min-w-0">
    <div className="flex items-center justify-between gap-2"><div className="min-w-0 break-words font-mono text-xs uppercase tracking-widest text-zinc-500">&gt; {TITLES[system]}</div><button type="button" onClick={openNow} className="min-h-11 rounded border border-cyan-300 px-3 py-2 text-[10px] font-mono text-cyan-700 dark:border-cyan-700 dark:text-cyan-300">NOW</button></div>
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-mono leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"><div className="break-words">{result.basis}</div>{activePath.length > 0 && <div className="mt-1 break-words text-cyan-700 dark:text-cyan-300">Now: {activePath.map((entry, i) => `${entry.abbr} ${LEVELS[i]}`).join(' › ')}</div>}</div>
    <details className="rounded-lg border border-zinc-200 bg-white text-[10px] font-mono dark:border-zinc-700 dark:bg-zinc-900">
      <summary className="cursor-pointer px-3 py-2 text-zinc-600 dark:text-zinc-300">Calculation details · <span className="text-amber-600 dark:text-amber-400">Beta</span> · <span className={validation.passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}>{validation.passed ? `${validation.goldenCharts} golden vectors pass` : 'golden parity failed'}</span></summary>
      <div className="space-y-1 border-t border-zinc-100 px-3 py-2 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"><div className="font-semibold text-zinc-700 dark:text-zinc-200">{result.method}</div>{result.audit.map(line => <div key={line}>· {line}</div>)}<p className={validation.passed ? 'pt-1 text-emerald-700 dark:text-emerald-300' : 'pt-1 text-red-700 dark:text-red-300'}>{validation.fixture}: {validation.checks} locked seed, order, duration, continuity and date checks {validation.passed ? 'pass' : 'failed'}.</p><p className="text-zinc-500">Reference: {validation.reference}.</p><p className="text-amber-700 dark:text-amber-400">Source-derived golden vectors pass, but Beta remains until direct JHora application exports are added as a second independent dataset.</p></div>
    </details>
    <div className="flex items-center justify-between gap-2"><button type="button" onClick={back} disabled={!level} className="min-h-11 rounded border border-zinc-300 px-3 py-2 text-[10px] font-mono disabled:opacity-30 dark:border-zinc-700">← back</button><div className="text-right text-[10px] font-mono uppercase tracking-widest text-zinc-400">{LEVELS[level]} · {rows.length} periods</div></div>
    {path.length > 0 && <div className="break-words text-[10px] font-mono leading-relaxed text-emerald-700 dark:text-emerald-300">{path.map((entry, i) => `${entry.abbr} ${LEVELS[i]}`).join(' › ')} › {LEVELS[level]}</div>}
    <div className="space-y-1">{rows.map((entry) => { const active = entry.startDate <= now && now < entry.endDate; return <button title={entry.calculation} key={`${entry.sign}-${entry.startDate.getTime()}`} type="button" onClick={() => open(entry)} className={`grid min-h-11 w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 rounded-md border px-3 py-2 text-left font-mono text-xs ${active ? 'border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300' : 'border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200'}`}><span className="row-span-2 font-bold">{entry.abbr}</span><span className="break-words text-[10px] sm:text-xs">{fmt(entry.startDate, level >= 2)}–{fmt(entry.endDate, level >= 2)}</span><span className="break-words text-[10px] text-zinc-400">{entry.durationYears.toFixed(2)} y{entry.cycle ? ` · C${entry.cycle}` : ''} · ⓘ</span></button>; })}</div>
    <p className="text-[9px] font-mono leading-relaxed text-zinc-400 dark:text-zinc-600">{NOTES[system]}</p>
  </div>;
}
