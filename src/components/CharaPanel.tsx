'use client';

import { useMemo } from 'react';
import { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import {
  calculateCharaDasha,
  calculateCharaSubDashas,
  charaSignAbbr,
  CharaDashaEntry,
  CharaLevel,
} from '@/lib/charaDasha';

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

export default function CharaPanel({ planets, ascendant, birthDatetime }: Props) {
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
    const adEntries = calculateCharaSubDashas(md, 'ad');
    const ad = activeEntry(adEntries, now);
    if (!ad) return [md];
    const pdEntries = calculateCharaSubDashas(ad, 'pd');
    const pd = activeEntry(pdEntries, now);
    return pd ? [md, ad, pd] : [md, ad];
  }, [result, now]);

  const [level, setLevel] = useMemo(() => ['md', () => {}] as const, []);

  if (!result) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; chara dasha</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">Missing data for Chara Dasha calculation.</div>
      </div>
    );
  }

  const current = activeEntry(result.entries, now);

  return (
    <div className="space-y-3 min-w-0 overflow-hidden">
      <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; chara dasha</div>

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
          <div className="text-zinc-700 dark:text-zinc-200">Jaimini Chara v1</div>
        </div>
      </div>

      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">MD · {result.entries.length} periods</div>

      <div className="space-y-1 min-w-0">
        {result.entries.map((entry) => {
          const active = current ? entryKey(current) === entryKey(entry) : false;
          return (
            <div
              key={entryKey(entry)}
              className={`w-full min-w-0 flex items-center gap-2 px-2 py-2 rounded-lg border ${active ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300' : 'border-transparent text-zinc-600 dark:text-zinc-400'}`}
            >
              <span className="font-mono text-xs font-bold w-7 flex-shrink-0">{charaSignAbbr(entry.sign)}</span>
              <span className="min-w-0 flex-1 font-mono text-[11px] md:text-xs text-zinc-500 dark:text-zinc-500 tabular-nums truncate">
                {fmtDate(entry.startDate)}–{fmtDate(entry.endDate)} · {entry.durationYears}y
              </span>
              {active && <span className="text-[8px] text-cyan-500 dark:text-cyan-400 flex-shrink-0">●</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
