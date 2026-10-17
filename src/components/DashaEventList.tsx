'use client';

import { useCallback, useMemo, useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, DashaSettings, PlanetData } from '@/types';
import { DEFAULT_DASHA_SETTINGS } from '@/types';
import type { TransitLocation } from '@/hooks/useEventTransits';
import { useDashaEvents } from '@/hooks/useDashaEvents';
import { parseDateTime } from '@/lib/bcp';
import { applyBulkChange, countByYear, removeEvents, sortEvents, type BulkChange } from '@/lib/dashaEventBulk';
import { calculateDashaEventSnapshots, DASHA_SNAPSHOT_KEYS, DASHA_SYSTEM_LABELS, type DashaEventSnapshot } from '@/lib/dashaEvents';
import { eventIdentity, parseDashaEventImport, type ImportedEvent } from '@/lib/dashaEventImport';
import { DASHA_EVENT_CATEGORY_LABELS, parseEventDate, type StoredDashaEvent } from '@/lib/dashaEventStore';
import { fill, useT } from '@/lib/i18n';
import DashaEventBulkBar from './DashaEventBulkBar';
import DashaEventCard from './DashaEventCard';
import DashaEventForm, { type NewEvent } from './DashaEventForm';
import DashaEventPaste from './DashaEventPaste';
import DashaEventPatterns from './DashaEventPatterns';
import { csvText, saveFile } from '@/lib/download';
import { newId } from '@/lib/ids';

type SnapshotKey = DashaEventSnapshot['key'];

interface Props {
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number; degree: number };
  birthDatetime: string;
  dashaSettings: DashaSettings;
  transitPlanets?: PlanetData[];
  transitDatetime?: string;
  onSetTransitDatetime?: (value: string) => void;
  /** Shows the Matrix of the Varga view in ANALYSIS. */
  onOpenVargaMatrix?: () => void;
  /** Sets the target date and transit moment to a YYYY-MM-DD date and shows the chart. */
  onOpenDateInChart?: (date: string) => void;
  mode?: 'events' | 'patterns';
  /** For the transits of an event's day shown on the charts. */
  chart?: ChartData;
  chartDisplaySettings?: ChartDisplaySettings;
  transitLocation?: TransitLocation;
  calculationSettings?: CalculationSettings;
}

const MAX_IMPORT_BYTES = 2_000_000;
const TOOL = 'min-h-11 rounded border px-2 py-2 text-[10px] font-mono';


/** The saved events of a chart (mode "events"), or the patterns that repeat across them (mode "patterns"). */
export default function DashaEventList({
  planets, ascendant, birthDatetime, dashaSettings, transitPlanets = [], transitDatetime = '', onSetTransitDatetime, onOpenVargaMatrix,
  onOpenDateInChart, mode = 'events', chart, chartDisplaySettings, transitLocation, calculationSettings,
}: Props) {
  const t = useT();
  const [events, setEvents] = useDashaEvents(birthDatetime);
  const normalizedDashas = useMemo(() => ({ ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas }), [dashaSettings.dashas]);
  const enabledKeys = useMemo(() => DASHA_SNAPSHOT_KEYS.filter(key => normalizedDashas[key]), [normalizedDashas]);
  const [hiddenKeys, setHiddenKeys] = useState<SnapshotKey[]>([]);
  const [importPreview, setImportPreview] = useState<{ events: ImportedEvent[]; rejected: number; duplicates: number; format: string } | null>(null);
  const [message, setMessage] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [groupByYear, setGroupByYear] = useState(false);
  /** The list as it was before the last paste, import or bulk change, for Undo. */
  const [undoEvents, setUndoEvents] = useState<StoredDashaEvent[] | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [minimumSignificance, setMinimumSignificance] = useState(1);

  const birthDate = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const { charaOptions: dashaCharaOptions, rasiOptions: dashaRasiOptions, variantChoice } = dashaSettings;
  const charaOptions = dashaCharaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions;
  const rasiOptions = useMemo(() => ({ ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...dashaRasiOptions }), [dashaRasiOptions]);
  const visibleKeys = useMemo(() => enabledKeys.filter(key => !hiddenKeys.includes(key)), [enabledKeys, hiddenKeys]);

  /** The daśā systems shown, on a day of the event (its first one unless another is given). */
  const snapshotsFor = useCallback((item: StoredDashaEvent, day: string = item.date): DashaEventSnapshot[] => {
    const eventDate = parseEventDate(day);
    if (!birthDate || !eventDate) return [];
    return calculateDashaEventSnapshots({ eventDate, birthDate, planets, ascendant, charaOptions, rasiOptions, variantChoice }).filter(snapshot => visibleKeys.includes(snapshot.key));
  }, [birthDate, planets, ascendant, charaOptions, rasiOptions, variantChoice, visibleKeys]);

  /** Puts a new list in place of the old one, keeping the old one for Undo. */
  function commit(text: string, next: StoredDashaEvent[]) { setUndoEvents(events); setEvents(next); setMessage(text); }
  function addEvents(added: ImportedEvent[], text: string) { commit(text, sortEvents([...events, ...added.map(item => ({ ...item, id: newId() }))])); }
  function addOne(event: NewEvent) { setEvents(current => sortEvents([...current, { ...event, id: newId(), notes: '', tags: [], significance: 3 }])); }
  function updateEvent(id: string, update: Partial<StoredDashaEvent>) {
    setEvents(current => {
      const next = current.map(item => {
        if (item.id !== id) return item;
        const merged = { ...item, ...update };
        if (!merged.endDate || merged.endDate < merged.date) delete merged.endDate;
        return merged;
      });
      return 'date' in update ? sortEvents(next) : next;
    });
  }
  function undo() { if (!undoEvents) return; setEvents(undoEvents); setUndoEvents(null); setMessage(t('Undone.')); }
  function toggleKey(key: SnapshotKey) { setHiddenKeys(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]); }

  async function previewImport(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { setMessage(t('File is larger than the 2 MB limit.')); return; }
    try {
      const result = parseDashaEventImport(await file.text(), file.name);
      const known = new Set(events.map(eventIdentity));
      const fresh = result.events.filter(item => !known.has(eventIdentity(item)));
      setImportPreview({ events: fresh, rejected: result.rejected, duplicates: result.events.length - fresh.length, format: result.format });
      setMessage(result.events.length ? '' : t('No valid events found.'));
    } catch { setImportPreview(null); setMessage(t('Could not read this file. Use a BCP CSV or JSON export.')); }
  }
  function confirmImport() {
    if (!importPreview?.events.length) return;
    addEvents(importPreview.events, fill(t('Imported {count} events.'), { count: importPreview.events.length }));
    setImportPreview(null);
  }

  const filteredEvents = events.filter(item => item.significance >= minimumSignificance
    && `${item.name} ${item.notes} ${item.tags.join(' ')} ${t(DASHA_EVENT_CATEGORY_LABELS[item.category])}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  // What a bulk change reaches: the events that are selected and still shown by the filters.
  const shownIds: ReadonlySet<string> = new Set(filteredEvents.map(item => item.id));
  const chosen: ReadonlySet<string> = new Set(filteredEvents.filter(item => selected.has(item.id)).map(item => item.id));
  const allShownSelected = filteredEvents.length > 0 && chosen.size === filteredEvents.length;
  const yearCounts = countByYear(filteredEvents);
  function toggleSelected(id: string) { setSelected(current => { const next = new Set(current); if (!next.delete(id)) next.add(id); return next; }); }
  function toggleAllShown() { setSelected(current => allShownSelected ? new Set([...current].filter(id => !shownIds.has(id))) : new Set([...current, ...shownIds])); }
  function bulkChange(change: BulkChange) { commit(fill(t('Changed {count} events.'), { count: chosen.size }), applyBulkChange(events, chosen, change)); }
  function bulkDelete() { commit(fill(t('Deleted {count} events.'), { count: chosen.size }), removeEvents(events, chosen)); setSelected(new Set()); }

  const exportRows = () => events.flatMap(item => snapshotsFor(item).map(snapshot => ({
    event: item.name, category: DASHA_EVENT_CATEGORY_LABELS[item.category], date: item.date, end_date: item.endDate ?? '', varga: item.varga, notes: item.notes,
    tags: item.tags.join('; '), significance: item.significance, dasha: snapshot.label,
    MD: snapshot.levels.find(level => level.level === 'MD')?.value ?? '', AD: snapshot.levels.find(level => level.level === 'AD')?.value ?? '', PD: snapshot.levels.find(level => level.level === 'PD')?.value ?? '',
    note: snapshot.note ?? '',
  })));
  function exportCsv() {
    const headers = ['event', 'category', 'date', 'end_date', 'varga', 'notes', 'tags', 'significance', 'dasha', 'MD', 'AD', 'PD', 'note'] as const;
    saveFile('bhrigu-dasha-events.csv', csvText([[...headers], ...exportRows().map(row => headers.map(header => row[header]))]), 'text/csv;charset=utf-8');
  }
  function exportJson() {
    saveFile('bhrigu-dasha-events.json', JSON.stringify({ version: 1, birthDatetime, visibleDashas: visibleKeys, events: events.map(item => ({ ...item, dashas: snapshotsFor(item) })) }, null, 2), 'application/json');
  }

  return (
    <section className="min-w-0 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-950/40">
      {mode === 'patterns' ? <DashaEventPatterns events={events} snapshotsFor={snapshotsFor} /> : (
        <>
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-4 min-w-0">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t('Event List 2.0')}</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t('Classify events, compare enabled Dashas, connect transits and import or export the data.')}</p>
            </div>
            <button type="button" onClick={() => setPasteOpen(open => !open)} aria-expanded={pasteOpen} className={`${TOOL} border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300`}>{t('Paste')}</button>
            <label className={`${TOOL} flex cursor-pointer items-center justify-center border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300`}>
              {t('Import')}
              <input type="file" accept=".csv,.json,text/csv,application/json" onChange={event => { void previewImport(event.target.files?.[0]); event.target.value = ''; }} className="hidden" />
            </label>
            <button type="button" onClick={exportCsv} disabled={!events.length} className={`${TOOL} border-zinc-300 disabled:opacity-30 dark:border-zinc-700`}>CSV</button>
            <button type="button" onClick={exportJson} disabled={!events.length} className={`${TOOL} border-zinc-300 disabled:opacity-30 dark:border-zinc-700`}>JSON</button>
          </div>
          {pasteOpen && <DashaEventPaste existing={events} onAdd={added => { addEvents(added, fill(t('Added {count} events.'), { count: added.length })); setPasteOpen(false); }} onClose={() => setPasteOpen(false)} />}
          {(importPreview || message) && (
            <div className="rounded-md border border-cyan-200 bg-cyan-50/50 p-2 text-[10px] dark:border-cyan-900 dark:bg-cyan-950/10">
              {importPreview ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1">{fill(t('{format}: {fresh} new · {duplicates} duplicates skipped · {rejected} invalid rejected'), { format: importPreview.format, fresh: importPreview.events.length, duplicates: importPreview.duplicates, rejected: importPreview.rejected })}</span>
                  <button type="button" onClick={() => setImportPreview(null)} className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700">{t('Cancel')}</button>
                  <button type="button" disabled={!importPreview.events.length} onClick={confirmImport} className="rounded bg-cyan-700 px-2 py-1 font-semibold text-white disabled:opacity-40">{t('Import events')}</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex-1">{message}</span>
                  {undoEvents && <button type="button" onClick={undo} className="rounded border border-cyan-400 px-2 py-1 font-semibold text-cyan-700 dark:text-cyan-300">{t('Undo')}</button>}
                  <button type="button" onClick={() => { setMessage(''); setUndoEvents(null); }} aria-label={t('Dismiss')} className="px-1 text-zinc-400">×</button>
                </div>
              )}
            </div>
          )}
          <DashaEventForm onAdd={addOne} />
          <div>
            <div className="mb-1 text-[9px] font-mono uppercase tracking-widest text-zinc-400">{t('Visible enabled Dashas')}</div>
            <div className="flex flex-wrap gap-1.5">
              {enabledKeys.map(key => (
                <button type="button" key={key} onClick={() => toggleKey(key)} className={`min-h-10 rounded border px-2 py-1 text-[9px] font-mono ${visibleKeys.includes(key) ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-zinc-300 text-zinc-400 dark:border-zinc-700'}`}>{key in DASHA_SYSTEM_LABELS ? DASHA_SYSTEM_LABELS[key as keyof typeof DASHA_SYSTEM_LABELS] : key}</button>
              ))}
            </div>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(220px,1fr)_auto] sm:items-end">
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('Search names, notes or tags')} className="min-h-11 w-full min-w-0 rounded border border-zinc-300 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900" />
            <label className="min-w-0 text-[10px] text-zinc-500">{t('Min. significance')}
              <select value={minimumSignificance} onChange={event => setMinimumSignificance(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded border border-zinc-300 bg-white px-2 py-2 sm:mt-0 sm:ml-1 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900">
                {[1, 2, 3, 4, 5].map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          {events.length > 0 && <DashaEventBulkBar shown={filteredEvents.length} selected={chosen.size} groupByYear={groupByYear} onGroupByYear={setGroupByYear} onToggleAll={toggleAllShown} onChange={bulkChange} onDelete={bulkDelete} />}
          {!events.length ? <p className="py-3 text-center text-xs italic text-zinc-400">{t('No saved events yet.')}</p>
            : !filteredEvents.length ? <p className="py-3 text-center text-xs italic text-zinc-400">{t('No events match the filters.')}</p>
            : (
              <div className="space-y-2">
                {filteredEvents.map((item, index) => {
                  const year = item.date.slice(0, 4);
                  const startsYear = groupByYear && (index === 0 || filteredEvents[index - 1].date.slice(0, 4) !== year);
                  return (
                    <div key={item.id} className="space-y-2">
                      {startsYear && <div role="heading" aria-level={4} className="px-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">{year} · {yearCounts.get(year)}</div>}
                      <DashaEventCard
                        item={item}
                        open={index === 0}
                        selected={selected.has(item.id)}
                        hovered={hoveredId === item.id}
                        onSelect={() => toggleSelected(item.id)}
                        onChange={update => updateEvent(item.id, update)}
                        onDelete={() => commit(fill(t('Deleted {name}.'), { name: item.name }), removeEvents(events, new Set([item.id])))}
                        onHover={hovered => setHoveredId(current => hovered ? item.id : current === item.id ? null : current)}
                        planets={planets}
                        startSnapshots={snapshotsFor(item)}
                        endSnapshots={item.endDate ? snapshotsFor(item, item.endDate) : []}
                        transitDatetime={transitDatetime}
                        transitPlanets={transitPlanets}
                        onSetTransitDatetime={onSetTransitDatetime}
                        onOpenVargaMatrix={onOpenVargaMatrix}
                        onOpenDateInChart={onOpenDateInChart}
                        chart={chart}
                        chartDisplaySettings={chartDisplaySettings}
                        transitLocation={transitLocation}
                        calculationSettings={calculationSettings}
                      />
                    </div>
                  );
                })}
              </div>
            )}
        </>
      )}
    </section>
  );
}
