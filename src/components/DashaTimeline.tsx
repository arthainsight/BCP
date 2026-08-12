'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CharaOptions, DashaSettings, PlanetData, RasiDashaOptions } from '@/types';
import { calculateDashaEventSnapshots } from '@/lib/dashaEvents';
import { parseDateTime } from '@/lib/bcp';

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  normalizedDashas: DashaSettings['dashas'];
  charaOptions: CharaOptions;
  rasiOptions: RasiDashaOptions;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const KEY_TO_SETTING: Record<string, keyof DashaSettings['dashas']> = {
  vimshottari: 'vimshottari', vds: 'vds', chara: 'chara', yogini: 'yogini', ashtottari: 'ashtottari',
  kalaChakra: 'kalaChakra', narayana: 'narayana', moola: 'moola', sthira: 'sthira',
};
const COLORS = ['bg-emerald-500', 'bg-cyan-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-lime-600', 'bg-fuchsia-500', 'bg-orange-500'];

function dateValue(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function parseDate(value: string) { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d, 12); }
function fmt(date: Date) { return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`; }

export default function DashaTimeline({ planets, ascendant, birthDatetime, normalizedDashas, charaOptions, rasiOptions }: Props) {
  const [selectedValue, setSelectedValue] = useState(() => dateValue(new Date()));
  useEffect(() => { const select = (event: Event) => setSelectedValue((event as CustomEvent<string>).detail); window.addEventListener('bcp:dasha-date-selected', select); return () => window.removeEventListener('bcp:dasha-date-selected', select); }, []);
  const birthDate = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const selectedDate = useMemo(() => parseDate(selectedValue), [selectedValue]);
  const snapshots = useMemo(() => birthDate ? calculateDashaEventSnapshots({ eventDate: selectedDate, birthDate, planets, ascendant, charaOptions, rasiOptions }) : [], [birthDate, selectedDate, planets, ascendant, charaOptions, rasiOptions]);
  const visible = snapshots.filter(snapshot => normalizedDashas[KEY_TO_SETTING[snapshot.key]]);
  const windowStart = new Date(selectedDate.getTime() - 10 * 365.25 * DAY_MS);
  const windowEnd = new Date(selectedDate.getTime() + 10 * 365.25 * DAY_MS);
  const span = windowEnd.getTime() - windowStart.getTime();
  const moveYears = (years: number) => { const next = new Date(selectedDate); next.setFullYear(next.getFullYear() + years); setSelectedValue(dateValue(next)); };

  return <section id="dasha-timeline" className="scroll-mt-4 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-950/40">
    <div className="grid grid-cols-4 gap-2"><div className="col-span-4 min-w-0"><h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Dasha Timeline</h3><p className="text-[10px] text-zinc-500">Active MD–AD–PD on one date · MD bars share a ±10-year scale.</p></div><button type="button" onClick={() => moveYears(-1)} className="min-h-11 rounded border border-zinc-300 px-2 py-2 text-[10px] font-mono dark:border-zinc-700">−1y</button><input type="date" value={selectedValue} onChange={event => { if (event.target.value) setSelectedValue(event.target.value); }} className="col-span-2 min-h-11 min-w-0 rounded border border-zinc-300 bg-white px-2 py-2 text-xs font-mono dark:border-zinc-700 dark:bg-zinc-900"/><button type="button" onClick={() => moveYears(1)} className="min-h-11 rounded border border-zinc-300 px-2 py-2 text-[10px] font-mono dark:border-zinc-700">+1y</button><button type="button" onClick={() => setSelectedValue(dateValue(new Date()))} className="col-span-4 min-h-11 rounded border border-cyan-300 px-2 py-2 text-[10px] font-mono text-cyan-700 sm:col-span-1 dark:border-cyan-700 dark:text-cyan-300">Today</button></div>
    <div className="relative h-4 text-[9px] font-mono text-zinc-400 sm:ml-[112px]"><span className="absolute left-0">{windowStart.getFullYear()}</span><span className="absolute left-1/2 -translate-x-1/2 text-cyan-600">{selectedDate.getFullYear()}</span><span className="absolute right-0">{windowEnd.getFullYear()}</span></div>
    <div className="space-y-2">{visible.map((snapshot, index) => {
      const range = snapshot.mdRange;
      const left = range ? Math.max(0, Math.min(100, (range.startDate.getTime() - windowStart.getTime()) / span * 100)) : 0;
      const right = range ? Math.max(0, Math.min(100, (range.endDate.getTime() - windowStart.getTime()) / span * 100)) : 0;
      const width = Math.max(0.75, right - left);
      return <div key={snapshot.key} className="grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-2">
        <a href={`#dasha-${snapshot.key}`} className="min-h-8 break-words text-[10px] font-semibold text-zinc-600 hover:text-emerald-700 sm:min-h-0 sm:truncate dark:text-zinc-300 dark:hover:text-emerald-300">{snapshot.label} ↘</a>
        <div className="min-w-0"><div className="relative h-4 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800"><div className="absolute inset-y-0 left-1/2 z-10 w-px bg-cyan-700"/><div className={`absolute inset-y-0 rounded ${COLORS[index % COLORS.length]} opacity-80`} style={{ left: `${left}%`, width: `${width}%` }} title={range ? `${fmt(range.startDate)}–${fmt(range.endDate)}` : snapshot.note}/></div><div className="mt-1 flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-[9px] font-mono">{snapshot.levels.map(level => <span key={level.level} className="break-words"><span className="text-zinc-400">{level.level}</span> <span className="font-semibold text-zinc-700 dark:text-zinc-200">{level.value}</span></span>)}{!snapshot.levels.length && <span className="break-words italic text-zinc-400">{snapshot.note ?? 'Outside calculated cycle'}</span>}{range && <span className="w-full break-words text-zinc-400 sm:ml-auto sm:w-auto">MD {fmt(range.startDate)}–{fmt(range.endDate)}</span>}</div></div>
      </div>;
    })}</div>
  </section>;
}
