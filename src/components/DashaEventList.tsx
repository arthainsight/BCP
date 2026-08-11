'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type { DashaSettings, PlanetData } from '@/types';
import { DEFAULT_DASHA_SETTINGS } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateDashaEventSnapshots } from '@/lib/dashaEvents';

interface Props { planets: PlanetData[]; ascendant: { longitude: number; sign: number; degree: number }; birthDatetime: string; dashaSettings: DashaSettings; }
interface StoredEvent { id: string; name: string; date: string; }
function today(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function parseEventDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatDate(value: string): string { const [year, month, day] = value.split('-'); return `${day}.${month}.${year}`; }

export default function DashaEventList({ planets, ascendant, birthDatetime, dashaSettings }: Props) {
  const storageKey = useMemo(() => `bhrigu:dasha-events:${birthDatetime.trim()}`, [birthDatetime]);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(today);
  const birthDate = parseDateTime(birthDatetime);
  const charaOptions = dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions;

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(storageKey);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        setEvents(Array.isArray(parsed) ? parsed.filter((item): item is StoredEvent => Boolean(item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.date === 'string')) : []);
      } catch { setEvents([]); }
      setStorageLoaded(true);
    });
  }, [storageKey]);
  useEffect(() => { if (storageLoaded) localStorage.setItem(storageKey, JSON.stringify(events)); }, [events, storageKey, storageLoaded]);

  function addEvent(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !parseEventDate(date)) return;
    setEvents((current) => [...current, { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, name: name.trim(), date }].sort((a, b) => a.date.localeCompare(b.date)));
    setName('');
  }

  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-950/40 p-3 space-y-3">
      <div><h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Event List</h3><p className="text-[11px] text-zinc-500 dark:text-zinc-400">Save dated life events and compare the active periods in every calculated Dasha system.</p></div>
      <form onSubmit={addEvent} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_auto] gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name" aria-label="Event name" className="min-w-0 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Event date" className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs" />
        <button type="submit" disabled={!name.trim() || !date} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Add event</button>
      </form>
      {events.length === 0 ? <p className="py-3 text-center text-xs italic text-zinc-400">No saved events yet.</p> : <div className="space-y-2">
        {events.map((item, index) => {
          const eventDate = parseEventDate(item.date);
          const snapshots = birthDate && eventDate ? calculateDashaEventSnapshots({ eventDate, birthDate, planets, ascendant, charaOptions }) : [];
          return <details key={item.id} open={index === 0} className="group rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2">
              <span className="text-zinc-400 transition-transform group-open:rotate-90">›</span><span className="min-w-0 flex-1 truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">{item.name}</span><span className="font-mono text-[11px] text-zinc-500">{formatDate(item.date)}</span>
              <button type="button" onClick={(e) => { e.preventDefault(); setEvents((current) => current.filter((stored) => stored.id !== item.id)); }} className="rounded px-1.5 py-0.5 text-[11px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" aria-label={`Delete ${item.name}`}>Delete</button>
            </summary>
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-3 py-2">
              {snapshots.length ? <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{snapshots.map((snapshot) => <div key={snapshot.key} className="grid grid-cols-[minmax(105px,0.8fr)_minmax(0,1.4fr)] gap-2 py-1.5 text-[11px]">
                <span className="font-medium text-zinc-600 dark:text-zinc-300">{snapshot.label}</span>
                {snapshot.levels.length ? <span className="flex flex-wrap gap-x-2 gap-y-1 font-mono">{snapshot.levels.map((level) => <span key={level.level}><span className="text-zinc-400">{level.level}</span> <span className="font-semibold text-emerald-700 dark:text-green-400">{level.value}</span></span>)}</span> : <span className="italic text-zinc-400">{snapshot.note ?? 'Unavailable'}</span>}
              </div>)}</div> : <p className="text-xs italic text-zinc-400">Invalid birth or event date.</p>}
            </div>
          </details>;
        })}
      </div>}
    </section>
  );
}
