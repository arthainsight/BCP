'use client';

import { useMemo, useState } from 'react';
import type { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateKalachakra, calculateKalachakraAntardashas, type KalachakraEntry } from '@/lib/kalachakra';

const ABBR: Record<string, string> = { Aries:'Ar', Taurus:'Ta', Gemini:'Ge', Cancer:'Cn', Leo:'Le', Virgo:'Vi', Libra:'Li', Scorpio:'Sc', Sagittarius:'Sg', Capricorn:'Cp', Aquarius:'Aq', Pisces:'Pi' };

function fmt(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
}

function active(entry: KalachakraEntry, now: Date) {
  return entry.startDate <= now && now < entry.endDate;
}

export default function KalachakraPanel({ planets, birthDatetime }: { planets: PlanetData[]; birthDatetime: string }) {
  const [selected, setSelected] = useState<KalachakraEntry | null>(null);
  const now = useMemo(() => new Date(), []);
  const result = useMemo(() => {
    const moon = planets.find((planet) => planet.name === 'Moon');
    const birth = parseDateTime(birthDatetime);
    if (!moon || moon.longitude == null || !birth) return null;
    return calculateKalachakra(moon.longitude, birth);
  }, [planets, birthDatetime]);

  if (!result) return <div className="text-xs font-mono text-zinc-400 italic">Moon longitude and valid birth datetime required.</div>;

  const current = result.entries.find((item) => active(item, now)) ?? null;
  const rows = selected ? calculateKalachakraAntardashas(selected, result.cycle) : result.entries;

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">&gt; kālachakra daśā</div>
        {selected && <button type="button" onClick={() => setSelected(null)} className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-mono dark:border-zinc-700">← MD</button>}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        <div>{result.nakshatra} · pada {result.pada} · {result.motion}</div>
        <div>Deha: {ABBR[result.dehaSign]} · Jīva: {ABBR[result.jeevaSign]}</div>
        {current && <div className="mt-1 text-cyan-700 dark:text-cyan-300">Now: {ABBR[current.signName]} MD · {fmt(current.startDate)}–{fmt(current.endDate)}</div>}
      </div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{selected ? `${ABBR[selected.signName]} antardaśā` : 'mahādaśā'}</div>
      <div className="space-y-1">
        {rows.map((item) => {
          const isNow = active(item, now);
          return (
            <button key={`${item.sign}-${item.startDate.getTime()}`} type="button" onClick={() => !selected && setSelected(item)} className={`w-full rounded-md border px-3 py-2 text-left font-mono text-xs ${isNow ? 'border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300' : 'border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200'}`}>
              <span className="inline-block w-8 font-bold">{ABBR[item.signName]}</span>
              <span>{fmt(item.startDate)}–{fmt(item.endDate)}</span>
              <span className="float-right text-zinc-400">{item.durationYears.toFixed(2)} y</span>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] font-mono leading-relaxed text-zinc-400 dark:text-zinc-600">Moon-pāda PVR/BPHS table method. Kālachakra is highly birth-time sensitive.</p>
    </div>
  );
}
