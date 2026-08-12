'use client';

import { useState } from 'react';
import type { CharaOptions, DashaSettings, PlanetData, RasiDashaOptions } from '@/types';
import { calculateDashaEventSnapshots, type DashaEventSnapshot } from '@/lib/dashaEvents';
import { groupDailyMatches, snapshotMatches } from '@/lib/dashaDateFinder';
import { parseDateTime } from '@/lib/bcp';

type Key = DashaEventSnapshot['key'];
const KEYS: { key: Key | 'all'; label: string }[] = [{ key: 'all', label: 'All enabled systems' }, { key: 'vimshottari', label: 'Vimsottari' }, { key: 'vds', label: 'Vimsottari Original' }, { key: 'chara', label: 'Chara' }, { key: 'yogini', label: 'Yogini' }, { key: 'ashtottari', label: 'Ashtottari' }, { key: 'kalaChakra', label: 'Kalachakra' }, { key: 'narayana', label: 'Narayana' }, { key: 'moola', label: 'Mula' }, { key: 'sthira', label: 'Sthira' }];
const SETTING: Record<Key, keyof DashaSettings['dashas']> = { vimshottari: 'vimshottari', vds: 'vds', chara: 'chara', yogini: 'yogini', ashtottari: 'ashtottari', kalaChakra: 'kalaChakra', narayana: 'narayana', moola: 'moola', sthira: 'sthira' };
const DAY = 24 * 60 * 60 * 1000;
const value = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const fmt = (date: Date) => `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
const csvCell = (input: unknown) => `"${String(input ?? '').replaceAll('"', '""')}"`;

interface Props { planets: PlanetData[]; ascendant: { longitude: number; sign: number; degree: number }; birthDatetime: string; dashas: DashaSettings['dashas']; charaOptions: CharaOptions; rasiOptions: RasiDashaOptions; }

export default function DashaDateFinder({ planets, ascendant, birthDatetime, dashas, charaOptions, rasiOptions }: Props) {
  const now = new Date(); const later = new Date(now); later.setFullYear(later.getFullYear() + 2);
  const [system, setSystem] = useState<Key | 'all'>('vimshottari'); const [start, setStart] = useState(value(now)); const [end, setEnd] = useState(value(later));
  const [md, setMd] = useState(''); const [ad, setAd] = useState(''); const [pd, setPd] = useState(''); const [any, setAny] = useState(''); const [operator, setOperator] = useState<'and' | 'or'>('and'); const [minimum, setMinimum] = useState(2);
  const [results, setResults] = useState<ReturnType<typeof groupDailyMatches>>([]); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function search() {
    const birthDate = parseDateTime(birthDatetime); const from = new Date(`${start}T12:00:00`); const to = new Date(`${end}T12:00:00`);
    if (!birthDate || !start || !end || from > to) return setMessage('Check the date range.');
    if (!md.trim() && !ad.trim() && !pd.trim() && !any.trim()) return setMessage('Enter at least one level or any-level value.');
    if ((to.getTime() - from.getTime()) / DAY > 5 * 366) return setMessage('One search may cover at most five years.');
    setBusy(true); setMessage('Searching…'); await new Promise(resolve => setTimeout(resolve, 0));
    const matches = [];
    let scanned = 0;
    for (let time = from.getTime(); time <= to.getTime(); time += DAY) {
      const date = new Date(time); const snapshots = calculateDashaEventSnapshots({ eventDate: date, birthDate, planets, ascendant, charaOptions, rasiOptions });
      const candidates = snapshots.filter(snapshot => dashas[SETTING[snapshot.key]] && (system === 'all' || snapshot.key === system) && snapshotMatches(snapshot, { md, ad, pd, any, operator }));
      if (candidates.length >= (system === 'all' ? minimum : 1)) matches.push({ date, snapshots: candidates });
      scanned += 1;
      if (scanned % 31 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    const grouped = groupDailyMatches(matches).slice(0, 100); setResults(grouped); setMessage(grouped.length ? `${grouped.length} matching periods` : 'No matching periods found.'); setBusy(false);
  }
  function select(date: Date) { window.dispatchEvent(new CustomEvent('bcp:dasha-date-selected', { detail: value(date) })); document.getElementById('dasha-timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function exportCsv() { const headers = ['start', 'end', 'systems', 'periods']; const rows = results.map(result => [value(result.start), value(result.end), result.snapshots.map(item => item.label).join(' | '), result.snapshots.map(item => `${item.label}: ${item.levels.map(level => `${level.level} ${level.value}`).join(' · ')}`).join(' | ')]); const url = URL.createObjectURL(new Blob([[headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'bhrigu-dasha-date-finder.csv'; anchor.click(); URL.revokeObjectURL(url); }
  return <details className="rounded-xl border border-violet-200 bg-violet-50/40 dark:border-violet-900 dark:bg-violet-950/10"><summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-violet-800 dark:text-violet-300">Dasha Date Finder</summary><div className="space-y-3 border-t border-violet-100 p-3 dark:border-violet-900">
    <div className="grid gap-2 sm:grid-cols-3"><label className="text-[10px] text-zinc-500">System<select value={system} onChange={event => setSystem(event.target.value as Key | 'all')} className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">{KEYS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><label className="text-[10px] text-zinc-500">From<input type="date" value={start} onChange={event => setStart(event.target.value)} className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"/></label><label className="text-[10px] text-zinc-500">To · max 5 years<input type="date" value={end} onChange={event => setEnd(event.target.value)} className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"/></label></div>
    <div className="grid gap-2 sm:grid-cols-4"><input value={md} onChange={event => setMd(event.target.value)} placeholder="MD e.g. Saturn" aria-label="MD filter" className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"/><input value={ad} onChange={event => setAd(event.target.value)} placeholder="AD e.g. Mercury" aria-label="AD filter" className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"/><input value={pd} onChange={event => setPd(event.target.value)} placeholder="PD e.g. Jupiter" aria-label="PD filter" className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"/><input value={any} onChange={event => setAny(event.target.value)} placeholder="Any level" aria-label="Any level filter" className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"/></div>
    <div className="flex flex-wrap items-center gap-2"><label className="text-[10px] text-zinc-500">Match <select value={operator} onChange={event => setOperator(event.target.value as 'and' | 'or')} className="ml-1 rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"><option value="and">all filters (AND)</option><option value="or">any filter (OR)</option></select></label>{system === 'all' && <label className="flex items-center gap-1 text-[10px] text-zinc-500">Min. systems<input type="number" min="1" max="9" value={minimum} onChange={event => setMinimum(Math.max(1, event.target.valueAsNumber || 1))} className="w-12 rounded border border-zinc-300 bg-white px-1 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"/></label>}<span className="flex-1"/><button type="button" disabled={!results.length} onClick={exportCsv} className="rounded border border-violet-300 px-3 py-1.5 text-xs text-violet-700 disabled:opacity-30 dark:border-violet-700 dark:text-violet-300">Export CSV</button><button type="button" disabled={busy} onClick={search} className="rounded bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">{busy ? 'Searching…' : 'Find dates'}</button></div>
    <div className="text-[10px] text-zinc-500">{message || 'Use exact levels or Any level. Combine active filters with AND or OR.'}</div>
    {results.length > 0 && <div className="max-h-72 space-y-1 overflow-y-auto">{results.map(result => <button type="button" key={`${result.start.toISOString()}-${result.snapshots.map(item => item.key).join('-')}`} onClick={() => select(result.start)} className="w-full rounded border border-violet-100 bg-white px-2 py-2 text-left text-[10px] dark:border-violet-900 dark:bg-zinc-900"><span className="font-semibold text-violet-700 dark:text-violet-300">{fmt(result.start)}{result.end.getTime() !== result.start.getTime() ? `–${fmt(result.end)}` : ''}</span><span className="ml-2 text-zinc-500">{result.snapshots.map(snapshot => `${snapshot.label}: ${snapshot.levels.map(level => `${level.level} ${level.value}`).join(' · ')}`).join(' | ')}</span><span className="float-right text-zinc-400">Open timeline ↘</span></button>)}</div>}
  </div></details>;
}
