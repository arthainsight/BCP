'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { newId, type Annotation } from '@/lib/palm/annotations';
import { prepareImage } from '@/lib/palm/image';
import { deletePalm, listPalms, putPalm, storageAvailable, type PalmRecord, type PalmSide } from '@/lib/palm/storage';
import { useT } from '@/lib/i18n';
import PalmEditor from './PalmEditor';
import PalmClientView from './PalmClientView';

const SIDES: PalmSide[] = ['right', 'left', 'other'];

/** An object URL for a blob that is released when the blob changes or the component goes. */
function useObjectUrl(blob: Blob | null): string {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) return;
    const created = URL.createObjectURL(blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [blob]);
  return blob ? url : '';
}

function Thumbnail({ blob, alt }: { blob: Blob; alt: string }) {
  const url = useObjectUrl(blob);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt={alt} className="h-12 w-12 shrink-0 rounded object-cover" /> : <div className="h-12 w-12 shrink-0 rounded bg-zinc-200 dark:bg-zinc-700" />;
}

/**
 * The PALM workspace: photographs of palms, kept on this device, drawn on and
 * explained with numbered notes, then shown to the client or saved as a picture.
 */
export default function PalmWorkspace({ wide = false, onToggleWide }: { wide?: boolean; onToggleWide?: () => void }) {
  const t = useT();
  const [records, setRecords] = useState<PalmRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clientView, setClientView] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragging, setDragging] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const available = storageAvailable();

  useEffect(() => {
    if (!available) return;
    let cancelled = false;
    listPalms()
      .then(found => {
        if (cancelled) return;
        setRecords(found);
        setSelectedId(current => current ?? found[0]?.id ?? null);
      })
      .catch(() => { if (!cancelled) setError(t('The palm photographs could not be read from this browser.')); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
    // The strings are read once; a language change does not reload the photographs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  const selected = records.find(record => record.id === selectedId) ?? null;
  const imageUrl = useObjectUrl(selected?.image ?? null);

  const save = useCallback((record: PalmRecord) => {
    putPalm(record).catch(() => setError(t('Saving to this browser failed.')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((id: string, patch: Partial<PalmRecord>, immediately = false) => {
    setRecords(current => {
      const next = current.map(record => (record.id === id ? { ...record, ...patch, updatedAt: Date.now() } : record));
      const changed = next.find(record => record.id === id);
      if (changed) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (immediately) save(changed);
        else saveTimer.current = setTimeout(() => save(changed), 350);
      }
      return next;
    });
  }, [save]);

  // A pending save is not lost when the workspace is left.
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const addFiles = async (files: FileList | File[]) => {
    const images = [...files].filter(file => file.type.startsWith('image/'));
    if (images.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const added: PalmRecord[] = [];
      for (const file of images) {
        const prepared = await prepareImage(file);
        const now = Date.now();
        const record: PalmRecord = {
          id: newId(),
          name: file.name.replace(/\.[^.]+$/, '') || t('Palm'),
          side: 'other',
          createdAt: now,
          updatedAt: now,
          image: prepared.blob,
          width: prepared.width,
          height: prepared.height,
          annotations: [],
        };
        await putPalm(record);
        added.push(record);
      }
      setRecords(current => [...added.reverse(), ...current]);
      setSelectedId(added[0].id);
    } catch {
      setError(t('The photograph could not be opened.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    const id = selected.id;
    await deletePalm(id);
    setRecords(current => current.filter(record => record.id !== id));
    setSelectedId(null);
    setConfirmDelete(false);
  };

  const rest = useMemo(() => records.filter(record => record.id !== selectedId), [records, selectedId]);

  const pick = 'min-h-9 cursor-pointer rounded-md border px-3 py-1.5 text-sm font-mono';

  if (!available) {
    return <p className="text-xs font-mono text-zinc-400">{t('This browser cannot keep photographs, so the palm view is not available.')}</p>;
  }

  return (
    <div
      className={`min-w-0 space-y-3 ${dragging ? 'rounded-lg ring-2 ring-emerald-400' : ''}`}
      data-palm="workspace"
      onDragOver={event => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={event => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files); }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Palm')}</div>
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('Photographs stay on this device; nothing is sent anywhere.')} {t('Clearing the browser data deletes them, so save the picture to keep a copy.')}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {onToggleWide && (
            <button
              type="button"
              onClick={onToggleWide}
              aria-pressed={wide}
              title={t('Use the whole width, hiding the chart')}
              className={`${pick} hidden border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 lg:inline-flex lg:items-center dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
            >
              {wide ? t('⤡ narrow') : t('⤢ wide')}
            </button>
          )}
          <label className={`${pick} border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 dark:border-green-600 dark:bg-green-600`}>
            {busy ? '…' : t('Upload photos')}
            <input type="file" accept="image/*" multiple className="sr-only" aria-label={t('Upload palm photographs')} onChange={event => { void addFiles(event.target.files ?? []); event.target.value = ''; }} />
          </label>
          <label className={`${pick} border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}>
            {t('Take a photo')}
            <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label={t('Take a palm photograph')} onChange={event => { void addFiles(event.target.files ?? []); event.target.value = ''; }} />
          </label>
        </div>
      </div>

      {error && <p className="text-xs font-mono text-rose-500" role="alert">{error}</p>}

      {loaded && records.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-xs font-mono text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
          {t('Upload or drop a photograph of a palm to begin.')}
        </div>
      )}

      {records.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" data-palm="records">
          {[...(selected ? [selected] : []), ...rest].map(record => (
            <button
              key={record.id}
              type="button"
              data-palm-record={record.id}
              aria-pressed={record.id === selectedId}
              onClick={() => { setSelectedId(record.id); setConfirmDelete(false); }}
              className={`flex w-48 shrink-0 items-center gap-2 rounded-lg border p-1.5 text-left ${record.id === selectedId ? 'border-emerald-500 bg-emerald-50 dark:border-green-600 dark:bg-green-900/20' : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'}`}
            >
              <Thumbnail blob={record.image} alt="" />
              <span className="min-w-0 text-xs">
                <span className="block truncate font-semibold text-zinc-700 dark:text-zinc-200">{record.name}</span>
                <span className="block text-[10px] font-mono text-zinc-400">{t(record.side === 'right' ? 'Right hand' : record.side === 'left' ? 'Left hand' : 'Palm')} · {record.annotations.length}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              {t('Name')}
              <input
                value={selected.name}
                onChange={event => update(selected.id, { name: event.target.value })}
                aria-label={t('Name of the photograph')}
                className="mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </label>
            <label className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              {t('Hand')}
              <select
                value={selected.side}
                onChange={event => update(selected.id, { side: event.target.value as PalmSide }, true)}
                aria-label={t('Hand')}
                className="mt-1 block rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              >
                {SIDES.map(side => <option key={side} value={side}>{t(side === 'right' ? 'Right hand' : side === 'left' ? 'Left hand' : 'Other')}</option>)}
              </select>
            </label>
            {confirmDelete ? (
              <span className="flex items-center gap-1">
                <button type="button" onClick={() => void remove()} className="min-h-9 rounded-md border border-rose-500 bg-rose-500 px-3 text-sm text-white">{t('Delete this photograph?')}</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="min-h-9 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-600">{t('Cancel')}</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} aria-label={t('Delete photograph')} className="min-h-9 rounded-md border border-zinc-300 px-3 text-sm text-zinc-500 hover:text-rose-600 dark:border-zinc-600">🗑</button>
            )}
          </div>

          {imageUrl && (
            <PalmEditor
              key={selected.id}
              record={selected}
              imageUrl={imageUrl}
              onChange={(annotations: Annotation[]) => update(selected.id, { annotations })}
              onClientView={() => setClientView(true)}
            />
          )}

          {clientView && imageUrl && (
            <PalmClientView record={selected} imageUrl={imageUrl} annotations={selected.annotations} onClose={() => setClientView(false)} />
          )}
        </>
      )}
    </div>
  );
}
