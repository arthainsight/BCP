'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DashaSettings, PlanetData } from '@/types';
import { DEFAULT_DASHA_SETTINGS } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateDashaEventSnapshots, type DashaEventSnapshot } from '@/lib/dashaEvents';
import { DASHA_EVENT_CATEGORIES, DASHA_EVENT_CATEGORY_LABELS, parseStoredDashaEvents, type DashaEventCategory, type StoredDashaEvent } from '@/lib/dashaEventStore';

type SnapshotKey = DashaEventSnapshot['key'];
const KEY_TO_SETTING: Record<SnapshotKey, keyof DashaSettings['dashas']> = { vimshottari: 'vimshottari', vds: 'vds', chara: 'chara', yogini: 'yogini', ashtottari: 'ashtottari', kalaChakra: 'kalaChakra', narayana: 'narayana', moola: 'moola', sthira: 'sthira' };
const SYSTEM_LABELS: Record<SnapshotKey, string> = { vimshottari: 'Vimsottari', vds: 'Vimsottari Original', chara: 'Chara', yogini: 'Yogini', ashtottari: 'Ashtottari', kalaChakra: 'Kalachakra', narayana: 'Narayana', moola: 'Mula', sthira: 'Sthira' };

interface Props { planets: PlanetData[]; ascendant: { longitude: number; sign: number; degree: number }; birthDatetime: string; dashaSettings: DashaSettings; }
interface EventRow { event: StoredDashaEvent; snapshots: DashaEventSnapshot[]; }
interface EventItem { kind: 'event'; id: string; timestamp: number; row: EventRow; }
interface TransitionItem { kind: 'transition'; id: string; timestamp: number; snapshot: DashaEventSnapshot; value: string; }
type TimelineItem = EventItem | TransitionItem;

function parseEventDate(value: string): Date | null { const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? null : date; }
function formatDate(date: Date): string { return new Intl.DateTimeFormat('fi-FI', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date); }

export default function DashaEventTimeline({ planets, ascendant, birthDatetime, dashaSettings }: Props) {
  const storageKey = useMemo(() => `bhrigu:dasha-events:${birthDatetime.trim()}`, [birthDatetime]);
  const [events, setEvents] = useState<StoredDashaEvent[]>([]);
  const [category, setCategory] = useState<DashaEventCategory | 'all'>('all');
  const [tag, setTag] = useState('all');
  const [system, setSystem] = useState<SnapshotKey | 'all'>('all');
  const [showTransitions, setShowTransitions] = useState(true);
  const birthDate = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const normalizedDashas = useMemo(() => ({ ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas }), [dashaSettings.dashas]);
  const enabledKeys = useMemo(() => (Object.keys(KEY_TO_SETTING) as SnapshotKey[]).filter(key => normalizedDashas[KEY_TO_SETTING[key]]), [normalizedDashas]);
  const charaOptions = dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions;
  const rasiOptions = useMemo(() => ({ ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...dashaSettings.rasiOptions }), [dashaSettings.rasiOptions]);

  useEffect(() => { queueMicrotask(() => { try { setEvents(parseStoredDashaEvents(localStorage.getItem(storageKey))); } catch { setEvents([]); } }); }, [storageKey]);

  const rows = useMemo<EventRow[]>(() => events.flatMap(event => {
    const eventDate = parseEventDate(event.date);
    if (!birthDate || !eventDate) return [];
    const snapshots = calculateDashaEventSnapshots({ eventDate, birthDate, planets, ascendant, charaOptions, rasiOptions }).filter(snapshot => enabledKeys.includes(snapshot.key));
    return [{ event, snapshots }];
  }), [ascendant, birthDate, charaOptions, enabledKeys, events, planets, rasiOptions]);
  const tags = useMemo(() => [...new Set(events.flatMap(event => event.tags))].sort((a, b) => a.localeCompare(b)), [events]);
  const usedCategories = useMemo(() => DASHA_EVENT_CATEGORIES.filter(item => events.some(event => event.category === item)), [events]);

  const filteredRows = useMemo(() => rows.filter(row => {
    if (category !== 'all' && row.event.category !== category) return false;
    if (tag !== 'all' && !row.event.tags.includes(tag)) return false;
    return system === 'all' || row.snapshots.some(snapshot => snapshot.key === system && snapshot.levels.length > 0);
  }).map(row => ({ ...row, snapshots: row.snapshots.filter(snapshot => (system === 'all' || snapshot.key === system) && snapshot.levels.length > 0) })), [category, rows, system, tag]);

  const items = useMemo<TimelineItem[]>(() => {
    const result: TimelineItem[] = filteredRows.flatMap(row => {
      const date = parseEventDate(row.event.date);
      return date ? [{ kind: 'event' as const, id: `event-${row.event.id}`, timestamp: date.getTime(), row }] : [];
    });
    if (showTransitions) {
      const transitions = new Map<string, TransitionItem>();
      for (const row of filteredRows) for (const snapshot of row.snapshots) {
        const value = snapshot.levels.find(level => level.level === 'MD')?.value;
        if (!snapshot.mdRange || !value) continue;
        const timestamp = snapshot.mdRange.startDate.getTime(); const id = `transition-${snapshot.key}-${timestamp}-${value}`;
        transitions.set(id, { kind: 'transition', id, timestamp, snapshot, value });
      }
      result.push(...transitions.values());
    }
    return result.sort((a, b) => a.timestamp - b.timestamp || (a.kind === 'transition' ? -1 : 1));
  }, [filteredRows, showTransitions]);

  return <section className="min-w-0 space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/30 p-3 dark:border-emerald-900 dark:bg-emerald-950/10">
    <div><h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Event Timeline</h3><p className="text-[10px] leading-relaxed text-zinc-500">Saved events and the MD changes connected to them in chronological order.</p></div>
    <div className="grid min-w-0 gap-2 sm:grid-cols-3"><label className="min-w-0 text-[10px] text-zinc-500">Category<select value={category} onChange={event => setCategory(event.target.value as DashaEventCategory | 'all')} className="mt-1 min-h-11 w-full min-w-0 rounded border border-zinc-300 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"><option value="all">All categories</option>{usedCategories.map(item => <option key={item} value={item}>{DASHA_EVENT_CATEGORY_LABELS[item]}</option>)}</select></label><label className="min-w-0 text-[10px] text-zinc-500">Tag<select value={tag} onChange={event => setTag(event.target.value)} className="mt-1 min-h-11 w-full min-w-0 rounded border border-zinc-300 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"><option value="all">All tags</option>{tags.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label className="min-w-0 text-[10px] text-zinc-500">Dasha system<select value={system} onChange={event => setSystem(event.target.value as SnapshotKey | 'all')} className="mt-1 min-h-11 w-full min-w-0 rounded border border-zinc-300 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"><option value="all">All enabled systems</option>{enabledKeys.map(key => <option key={key} value={key}>{SYSTEM_LABELS[key]}</option>)}</select></label></div>
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded border border-emerald-200 bg-white px-3 py-2 text-[11px] text-zinc-600 dark:border-emerald-900 dark:bg-zinc-900 dark:text-zinc-300"><input type="checkbox" checked={showTransitions} onChange={event => setShowTransitions(event.target.checked)} className="h-4 w-4 accent-emerald-600"/>Show related MD changes</label>
    {!events.length ? <p className="py-5 text-center text-xs italic text-zinc-400">Add events in the Events tab to build the timeline.</p> : !items.length ? <p className="py-5 text-center text-xs italic text-zinc-400">No events match these filters.</p> : <div className="relative min-w-0 space-y-3 before:absolute before:inset-y-0 before:left-[15px] before:w-px before:bg-emerald-200 dark:before:bg-emerald-900">{items.map((item, index) => item.kind === 'transition' ? <div key={item.id} className="relative min-w-0 pl-9"><span className="absolute left-[10px] top-3 h-3 w-3 rounded-full border-2 border-violet-500 bg-white dark:bg-zinc-950"/><div className="min-w-0 rounded-md border border-violet-200 bg-violet-50/60 px-3 py-2 dark:border-violet-900 dark:bg-violet-950/20"><div className="font-mono text-[9px] text-violet-500">{formatDate(new Date(item.timestamp))} · MD CHANGE</div><div className="mt-0.5 break-words text-[11px]"><span className="text-zinc-500">{item.snapshot.label}</span> <span className="font-semibold text-violet-700 dark:text-violet-300">{item.value}</span></div></div></div> : <div key={item.id} className="relative min-w-0 pl-9"><span className="absolute left-2 top-4 h-4 w-4 rounded-full border-2 border-emerald-600 bg-emerald-100 dark:bg-emerald-950"/><details open={index === 0} className="group min-w-0 rounded-lg border border-emerald-200 bg-white dark:border-emerald-900 dark:bg-zinc-900"><summary className="min-h-11 cursor-pointer list-none px-3 py-2.5"><div className="flex min-w-0 items-start gap-2"><div className="min-w-0 flex-1"><div className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400">{formatDate(new Date(item.timestamp))} · {DASHA_EVENT_CATEGORY_LABELS[item.row.event.category]}</div><div className="mt-0.5 break-words text-xs font-semibold text-zinc-800 dark:text-zinc-100">{item.row.event.name}</div></div><span className="shrink-0 text-[10px] text-amber-500">{'★'.repeat(item.row.event.significance)}</span><span className="text-zinc-400 transition-transform group-open:rotate-90">›</span></div>{item.row.event.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{item.row.event.tags.map(value => <span key={value} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] text-zinc-500 dark:bg-zinc-800">#{value}</span>)}</div>}</summary><div className="min-w-0 space-y-2 border-t border-emerald-100 px-3 py-2.5 dark:border-emerald-900">{item.row.event.notes && <p className="break-words text-[10px] leading-relaxed text-zinc-500">{item.row.event.notes}</p>}{item.row.snapshots.length ? item.row.snapshots.map(snapshot => <div key={snapshot.key} className="grid min-w-0 grid-cols-1 gap-1 border-t border-zinc-100 py-2 first:border-0 first:pt-0 sm:grid-cols-[120px_minmax(0,1fr)] dark:border-zinc-800"><span className="break-words text-[10px] font-medium text-zinc-500">{snapshot.label}</span><span className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 font-mono text-[10px]">{snapshot.levels.map(level => <span key={level.level} className="break-words"><span className="text-zinc-400">{level.level}</span> <span className="font-semibold text-emerald-700 dark:text-emerald-300">{level.value}</span></span>)}</span></div>) : <p className="text-[10px] italic text-zinc-400">No active periods in the selected system.</p>}</div></details></div>)}</div>}
  </section>;
}
