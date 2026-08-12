'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type { DashaSettings, PlanetData } from '@/types';
import { DEFAULT_DASHA_SETTINGS } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateDashaEventSnapshots, type DashaEventSnapshot } from '@/lib/dashaEvents';
import { getVargaSignIndex, SIGN_ABBR } from '@/lib/varga';
import { analyzeDashaEventPatterns } from '@/lib/dashaEventPatterns';
import { eventIdentity, parseDashaEventImport, type ImportedEvent } from '@/lib/dashaEventImport';

type Category = 'work' | 'money' | 'relationship' | 'health' | 'home' | 'family' | 'spiritual' | 'other';
type Varga = 'D1' | 'D7' | 'D9' | 'D10' | 'D12' | 'D60';
type SnapshotKey = DashaEventSnapshot['key'];
interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  dashaSettings: DashaSettings;
  transitPlanets?: PlanetData[];
  transitDatetime?: string;
  onSetTransitDatetime?: (value: string) => void;
  onOpenVargaMatrix?: () => void;
}
interface StoredEvent { id: string; name: string; date: string; category: Category; varga: Varga; }

const CATEGORY_LABELS: Record<Category, string> = { work: 'Work', money: 'Money', relationship: 'Relationship', health: 'Health', home: 'Home / move', family: 'Family', spiritual: 'Spiritual', other: 'Other' };
const VARGAS: Varga[] = ['D1', 'D7', 'D9', 'D10', 'D12', 'D60'];
const KEY_TO_SETTING: Record<SnapshotKey, keyof DashaSettings['dashas']> = { vimshottari: 'vimshottari', vds: 'vds', chara: 'chara', yogini: 'yogini', ashtottari: 'ashtottari', kalaChakra: 'kalaChakra', narayana: 'narayana', moola: 'moola', sthira: 'sthira' };

function today(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function parseEventDate(value: string): Date | null { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); if (!match) return null; const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12); return Number.isNaN(date.getTime()) ? null : date; }
function formatDate(value: string): string { const [year, month, day] = value.split('-'); return `${day}.${month}.${year}`; }
function transitValue(value: string): string { return `${formatDate(value)} 12.00.00`; }
function transitMatches(value: string, transitDatetime: string) { return transitDatetime.startsWith(formatDate(value)); }
function download(filename: string, content: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
function csvCell(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }

export default function DashaEventList({ planets, ascendant, birthDatetime, dashaSettings, transitPlanets = [], transitDatetime = '', onSetTransitDatetime, onOpenVargaMatrix }: Props) {
  const storageKey = useMemo(() => `bhrigu:dasha-events:${birthDatetime.trim()}`, [birthDatetime]);
  const normalizedDashas = useMemo(() => ({ ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas }), [dashaSettings.dashas]);
  const enabledKeys = useMemo(() => (Object.keys(KEY_TO_SETTING) as SnapshotKey[]).filter(key => normalizedDashas[KEY_TO_SETTING[key]]), [normalizedDashas]);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [hiddenKeys, setHiddenKeys] = useState<SnapshotKey[]>([]);
  const [patternCategory, setPatternCategory] = useState<Category | 'all'>('all');
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [importPreview, setImportPreview] = useState<{ events: ImportedEvent[]; rejected: number; duplicates: number; format: string } | null>(null);
  const [importMessage, setImportMessage] = useState('');
  const [name, setName] = useState(''); const [date, setDate] = useState(today); const [category, setCategory] = useState<Category>('work'); const [varga, setVarga] = useState<Varga>('D1');
  const birthDate = parseDateTime(birthDatetime);
  const charaOptions = dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions;
  const rasiOptions = { ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...dashaSettings.rasiOptions };

  useEffect(() => { queueMicrotask(() => { try { const stored = localStorage.getItem(storageKey); const parsed: unknown = stored ? JSON.parse(stored) : []; setEvents(Array.isArray(parsed) ? parsed.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).id === 'string' && typeof (item as Record<string, unknown>).name === 'string' && typeof (item as Record<string, unknown>).date === 'string')).map(item => ({ id: String(item.id), name: String(item.name), date: String(item.date), category: (item.category as Category) || 'other', varga: (item.varga as Varga) || 'D1' })) : []); } catch { setEvents([]); } setStorageLoaded(true); }); }, [storageKey]);
  useEffect(() => { if (storageLoaded) localStorage.setItem(storageKey, JSON.stringify(events)); }, [events, storageKey, storageLoaded]);
  useEffect(() => { const select = (event: Event) => setDate((event as CustomEvent<string>).detail); window.addEventListener('bcp:dasha-date-selected', select); return () => window.removeEventListener('bcp:dasha-date-selected', select); }, []);

  const visibleKeys = enabledKeys.filter(key => !hiddenKeys.includes(key));
  function snapshotsFor(item: StoredEvent) { const eventDate = parseEventDate(item.date); return birthDate && eventDate ? calculateDashaEventSnapshots({ eventDate, birthDate, planets, ascendant, charaOptions, rasiOptions }).filter(snapshot => visibleKeys.includes(snapshot.key)) : []; }
  function addEvent(event: FormEvent) { event.preventDefault(); if (!name.trim() || !parseEventDate(date)) return; setEvents(current => [...current, { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, name: name.trim(), date, category, varga }].sort((a, b) => a.date.localeCompare(b.date))); setName(''); }
  function updateEvent(id: string, update: Partial<StoredEvent>) { setEvents(current => current.map(item => item.id === id ? { ...item, ...update } : item)); }
  function toggleKey(key: SnapshotKey) { setHiddenKeys(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]); }
  function openVarga() { if (onOpenVargaMatrix) onOpenVargaMatrix(); else window.dispatchEvent(new CustomEvent('bcp:show-varga-matrix')); }
  async function previewImport(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) { setImportMessage('File is larger than the 2 MB limit.'); return; }
    try {
      const result = parseDashaEventImport(await file.text(), file.name);
      const existing = new Set(events.map(eventIdentity));
      const fresh = result.events.filter(item => !existing.has(eventIdentity(item)));
      setImportPreview({ events: fresh, rejected: result.rejected, duplicates: result.events.length - fresh.length, format: result.format });
      setImportMessage(result.events.length ? '' : 'No valid events found.');
    } catch { setImportPreview(null); setImportMessage('Could not read this file. Use a BCP CSV or JSON export.'); }
  }
  function confirmImport() {
    if (!importPreview?.events.length) return;
    setEvents(current => [...current, ...importPreview.events.map(item => ({ ...item, id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}` }))].sort((a, b) => a.date.localeCompare(b.date)));
    setImportMessage(`Imported ${importPreview.events.length} events.`); setImportPreview(null);
  }

  const patternRecords = events.flatMap(item => snapshotsFor(item).map(snapshot => ({ eventId: item.id, category: item.category, snapshot })));
  const patterns = analyzeDashaEventPatterns(patternRecords, patternCategory).slice(0, 12);
  const usedCategories = (Object.keys(CATEGORY_LABELS) as Category[]).filter(item => events.some(event => event.category === item));

  const exportRows = () => events.flatMap(item => snapshotsFor(item).map(snapshot => ({ event: item.name, category: CATEGORY_LABELS[item.category], date: item.date, varga: item.varga, dasha: snapshot.label, MD: snapshot.levels.find(level => level.level === 'MD')?.value ?? '', AD: snapshot.levels.find(level => level.level === 'AD')?.value ?? '', PD: snapshot.levels.find(level => level.level === 'PD')?.value ?? '', note: snapshot.note ?? '' })));
  function exportCsv() { const rows = exportRows(); const headers = ['event', 'category', 'date', 'varga', 'dasha', 'MD', 'AD', 'PD', 'note']; download('bhrigu-dasha-events.csv', [headers.map(csvCell).join(','), ...rows.map(row => headers.map(header => csvCell(row[header as keyof typeof row])).join(','))].join('\n'), 'text/csv;charset=utf-8'); }
  function exportJson() { download('bhrigu-dasha-events.json', JSON.stringify({ version: 1, birthDatetime, visibleDashas: visibleKeys, events: events.map(item => ({ ...item, dashas: snapshotsFor(item) })) }, null, 2), 'application/json'); }

  return <section className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-950/40">
    <div className="flex flex-wrap items-start gap-2"><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Event List 2.0</h3><p className="text-[11px] text-zinc-500 dark:text-zinc-400">Classify events, compare enabled Dashas, connect transits and import or export the data.</p></div><label className="cursor-pointer rounded border border-cyan-300 px-2 py-1 text-[10px] font-mono text-cyan-700 dark:border-cyan-700 dark:text-cyan-300">Import<input type="file" accept=".csv,.json,text/csv,application/json" onChange={event => { void previewImport(event.target.files?.[0]); event.target.value = ''; }} className="hidden"/></label><button type="button" onClick={exportCsv} disabled={!events.length} className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-mono disabled:opacity-30 dark:border-zinc-700">CSV</button><button type="button" onClick={exportJson} disabled={!events.length} className="rounded border border-zinc-300 px-2 py-1 text-[10px] font-mono disabled:opacity-30 dark:border-zinc-700">JSON</button></div>
    {(importPreview || importMessage) && <div className="rounded-md border border-cyan-200 bg-cyan-50/50 p-2 text-[10px] dark:border-cyan-900 dark:bg-cyan-950/10">{importPreview ? <div className="flex flex-wrap items-center gap-2"><span className="min-w-0 flex-1">{importPreview.format}: <strong>{importPreview.events.length}</strong> new · {importPreview.duplicates} duplicates skipped · {importPreview.rejected} invalid rejected</span><button type="button" onClick={() => setImportPreview(null)} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700">Cancel</button><button type="button" disabled={!importPreview.events.length} onClick={confirmImport} className="rounded bg-cyan-700 px-2 py-1 font-semibold text-white disabled:opacity-40">Import events</button></div> : <div className="flex items-center gap-2"><span className="flex-1">{importMessage}</span><button type="button" onClick={() => setImportMessage('')} className="text-zinc-400">×</button></div>}</div>}
    <form onSubmit={addEvent} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(150px,1fr)_140px_130px_80px_auto]"><input value={name} onChange={event => setName(event.target.value)} placeholder="Event name" aria-label="Event name" className="min-w-0 rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"/><input type="date" value={date} onChange={event => setDate(event.target.value)} aria-label="Event date" className="rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"/><select value={category} onChange={event => setCategory(event.target.value as Category)} aria-label="Event category" className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">{Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select value={varga} onChange={event => setVarga(event.target.value as Varga)} aria-label="Event varga" className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">{VARGAS.map(item => <option key={item}>{item}</option>)}</select><button type="submit" disabled={!name.trim() || !date} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Add</button></form>
    <div><div className="mb-1 text-[9px] font-mono uppercase tracking-widest text-zinc-400">Visible enabled Dashas</div><div className="flex flex-wrap gap-1">{enabledKeys.map(key => <button type="button" key={key} onClick={() => toggleKey(key)} className={`rounded border px-1.5 py-0.5 text-[9px] font-mono ${visibleKeys.includes(key) ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-zinc-300 text-zinc-400 dark:border-zinc-700'}`}>{key}</button>)}</div></div>
    {events.length >= 2 && <details className="rounded-md border border-cyan-200 bg-cyan-50/40 dark:border-cyan-900 dark:bg-cyan-950/10">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-cyan-800 dark:text-cyan-300">Recurring Dasha patterns · {patterns.length}</summary>
      <div className="space-y-2 border-t border-cyan-100 px-3 py-2 dark:border-cyan-900"><div className="flex flex-wrap gap-1"><button type="button" onClick={() => setPatternCategory('all')} className={`rounded border px-1.5 py-0.5 text-[9px] font-mono ${patternCategory === 'all' ? 'border-cyan-500 text-cyan-700 dark:text-cyan-300' : 'border-zinc-300 text-zinc-400 dark:border-zinc-700'}`}>All</button>{usedCategories.map(item => <button type="button" key={item} onClick={() => setPatternCategory(item)} className={`rounded border px-1.5 py-0.5 text-[9px] font-mono ${patternCategory === item ? 'border-cyan-500 text-cyan-700 dark:text-cyan-300' : 'border-zinc-300 text-zinc-400 dark:border-zinc-700'}`}>{CATEGORY_LABELS[item]}</button>)}</div>
      {patterns.length ? <div className="grid gap-1 sm:grid-cols-2">{patterns.map(pattern => <div key={pattern.key} className="flex items-center gap-2 rounded border border-cyan-100 bg-white px-2 py-1.5 text-[10px] dark:border-cyan-900 dark:bg-zinc-900"><span className="min-w-0 flex-1 truncate"><span className="text-zinc-500">{pattern.dasha} · {pattern.level}</span> <span className="font-semibold text-zinc-800 dark:text-zinc-100">{pattern.value}</span></span><span className="rounded bg-cyan-100 px-1.5 py-0.5 font-mono text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">{pattern.count} events</span></div>)}</div> : <p className="text-[10px] italic text-zinc-400">No period repeats in this category yet. At least two matching events are required.</p>}
      <p className="text-[9px] text-zinc-400">Counts repeated MD, AD and PD rulers within each enabled Dasha system. Repetition is descriptive, not proof of causation.</p></div>
    </details>}
    {!events.length ? <p className="py-3 text-center text-xs italic text-zinc-400">No saved events yet.</p> : <div className="space-y-2">{events.map((item, index) => { const snapshots = snapshotsFor(item); const matchingTransit = transitMatches(item.date, transitDatetime); const division = Number(item.varga.slice(1)); return <details key={item.id} open={index === 0} className="group rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"><summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2"><span className="text-zinc-400 transition-transform group-open:rotate-90">›</span><span className="min-w-0 flex-1 truncate text-xs font-semibold">{item.name}</span><span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-500 dark:bg-zinc-800">{CATEGORY_LABELS[item.category]}</span><span className="font-mono text-[11px] text-zinc-500">{formatDate(item.date)}</span><button type="button" onClick={event => { event.preventDefault(); setEvents(current => current.filter(stored => stored.id !== item.id)); }} className="rounded px-1.5 py-0.5 text-[11px] text-red-600" aria-label={`Delete ${item.name}`}>Delete</button></summary>
      <div className="space-y-3 border-t border-zinc-100 px-3 py-2 dark:border-zinc-800"><div className="flex flex-wrap items-center gap-2"><label className="text-[10px] text-zinc-500">Category <select value={item.category} onChange={event => updateEvent(item.id, { category: event.target.value as Category })} className="ml-1 rounded border border-zinc-300 bg-white px-1.5 py-1 dark:border-zinc-700 dark:bg-zinc-900">{Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="text-[10px] text-zinc-500">Varga <select value={item.varga} onChange={event => updateEvent(item.id, { varga: event.target.value as Varga })} className="ml-1 rounded border border-zinc-300 bg-white px-1.5 py-1 dark:border-zinc-700 dark:bg-zinc-900">{VARGAS.map(value => <option key={value}>{value}</option>)}</select></label><button type="button" onClick={openVarga} className="rounded border border-zinc-300 px-2 py-1 text-[10px] dark:border-zinc-700">Open Varga Matrix</button>{onSetTransitDatetime && <button type="button" onClick={() => onSetTransitDatetime(transitValue(item.date))} className="rounded border border-violet-300 px-2 py-1 text-[10px] text-violet-700 dark:border-violet-700 dark:text-violet-300">Set as transit</button>}</div>
      <div className="text-[9px] font-mono text-zinc-400">{item.varga}: {planets.map(planet => `${planet.name.slice(0, 2)} ${SIGN_ABBR[getVargaSignIndex(planet.longitude, division)]}`).join(' · ')}</div>
      {matchingTransit && <div className="rounded border border-violet-200 bg-violet-50/50 p-2 text-[9px] font-mono text-violet-700 dark:border-violet-900 dark:bg-violet-950/20 dark:text-violet-300">Transit {transitDatetime}: {transitPlanets.length ? transitPlanets.map(planet => `${planet.name.slice(0, 2)} ${SIGN_ABBR[planet.sign - 1]}`).join(' · ') : 'calculating or unavailable'}</div>}
      {snapshots.length ? <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{snapshots.map(snapshot => <div key={snapshot.key} className="grid grid-cols-[minmax(105px,0.8fr)_minmax(0,1.4fr)] gap-2 py-1.5 text-[11px]"><span className="font-medium text-zinc-600 dark:text-zinc-300">{snapshot.label}</span>{snapshot.levels.length ? <span className="flex flex-wrap gap-x-2 gap-y-1 font-mono">{snapshot.levels.map(level => <span key={level.level}><span className="text-zinc-400">{level.level}</span> <span className="font-semibold text-emerald-700 dark:text-green-400">{level.value}</span></span>)}</span> : <span className="italic text-zinc-400">{snapshot.note ?? 'Unavailable'}</span>}</div>)}</div> : <p className="text-xs italic text-zinc-400">No visible Dasha systems or invalid date.</p>}</div></details>; })}</div>}
  </section>;
}
