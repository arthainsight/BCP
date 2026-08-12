'use client';

import { useMemo, useState } from 'react';
import type { DashaSettings, PlanetData } from '@/types';
import { DEFAULT_DASHA_SETTINGS } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateDashaEventSnapshots, type DashaEventSnapshot } from '@/lib/dashaEvents';

type Key = DashaEventSnapshot['key'];
const SETTING: Record<Key, keyof DashaSettings['dashas']> = { vimshottari: 'vimshottari', vds: 'vds', chara: 'chara', yogini: 'yogini', ashtottari: 'ashtottari', kalaChakra: 'kalaChakra', narayana: 'narayana', moola: 'moola', sthira: 'sthira' };
const isoToday = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };

interface Props { planets: PlanetData[]; ascendant: { longitude: number; sign: number; degree: number }; birthDatetime: string; dashaSettings: DashaSettings; }

export default function DashaOverlap({ planets, ascendant, birthDatetime, dashaSettings }: Props) {
  const [date, setDate] = useState(isoToday);
  const snapshots = useMemo(() => {
    const birthDate = parseDateTime(birthDatetime); const eventDate = new Date(`${date}T12:00:00`);
    if (!birthDate || Number.isNaN(eventDate.getTime())) return [];
    const dashas = { ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas };
    return calculateDashaEventSnapshots({ eventDate, birthDate, planets, ascendant, charaOptions: dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions, rasiOptions: { ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...dashaSettings.rasiOptions } }).filter(snapshot => dashas[SETTING[snapshot.key]]);
  }, [ascendant, birthDatetime, dashaSettings, date, planets]);
  const overlaps = useMemo(() => {
    const values = new Map<string, { value: string; hits: { system: string; level: string }[] }>();
    for (const snapshot of snapshots) for (const level of snapshot.levels) {
      const key = level.value.toLocaleLowerCase(); const item = values.get(key) ?? { value: level.value, hits: [] };
      item.hits.push({ system: snapshot.label, level: level.level }); values.set(key, item);
    }
    return [...values.values()].filter(item => new Set(item.hits.map(hit => hit.system)).size >= 2).sort((a, b) => b.hits.length - a.hits.length);
  }, [snapshots]);
  return <section className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3 dark:border-amber-900 dark:bg-amber-950/10">
    <div className="flex flex-wrap items-end gap-2"><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">Dasha overlap</h3><p className="text-[10px] text-zinc-500">Compare active MD, AD and PD values across all enabled systems on one date.</p></div><label className="text-[10px] text-zinc-500">Date<input type="date" value={date} onChange={event => setDate(event.target.value)} className="ml-2 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"/></label></div>
    {overlaps.length ? <div className="grid gap-2 sm:grid-cols-2">{overlaps.map(item => <div key={item.value} className="rounded border border-amber-200 bg-white p-2 dark:border-amber-900 dark:bg-zinc-900"><div className="font-semibold text-amber-800 dark:text-amber-300">{item.value} <span className="text-[9px] font-normal text-zinc-400">· {new Set(item.hits.map(hit => hit.system)).size} systems</span></div><div className="mt-1 text-[10px] text-zinc-500">{item.hits.map(hit => `${hit.system} ${hit.level}`).join(' · ')}</div></div>)}</div> : <p className="text-xs italic text-zinc-400">No exact values overlap between two enabled systems on this date.</p>}
    <div className="overflow-x-auto"><table className="w-full text-left text-[10px]"><thead className="text-zinc-400"><tr><th className="py-1">System</th><th>MD</th><th>AD</th><th>PD</th></tr></thead><tbody>{snapshots.map(snapshot => <tr key={snapshot.key} className="border-t border-amber-100 dark:border-amber-900"><td className="py-1.5 font-medium">{snapshot.label}</td>{['MD', 'AD', 'PD'].map(level => <td key={level} className="font-mono">{snapshot.levels.find(item => item.level === level)?.value ?? '—'}</td>)}</tr>)}</tbody></table></div>
  </section>;
}
