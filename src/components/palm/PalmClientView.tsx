'use client';

import { useEffect, useMemo, useState } from 'react';
import { noteList, type Annotation } from '@/lib/palm/annotations';
import type { PalmRecord } from '@/lib/palm/storage';
import { useT } from '@/lib/i18n';
import PalmCanvas from './PalmCanvas';

type Props = {
  record: PalmRecord;
  imageUrl: string;
  annotations: Annotation[];
  onClose: () => void;
};

/**
 * The palm shown to the client: the photograph with its drawing, large, and the
 * numbered notes beside it. A note zooms to its place on the palm; the arrows
 * step through them. Nothing can be changed here.
 */
export default function PalmClientView({ record, imageUrl, annotations, onClose }: Props) {
  const t = useT();
  const notes = useMemo(() => noteList(annotations), [annotations]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string | null; nonce: number }>({ id: null, nonce: 0 });
  const [showNotes, setShowNotes] = useState(true);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const show = (id: string) => {
    setSelectedId(id);
    setFocus(current => ({ id, nonce: current.nonce + 1 }));
  };
  const index = notes.findIndex(entry => entry.id === selectedId);
  const step = (delta: number) => {
    if (notes.length === 0) return;
    const next = index === -1 ? (delta > 0 ? 0 : notes.length - 1) : (index + delta + notes.length) % notes.length;
    show(notes[next].id);
  };
  const overview = () => {
    setSelectedId(null);
    setFocus(current => ({ id: null, nonce: current.nonce + 1 }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-zinc-950 text-zinc-100" role="dialog" aria-modal="true" aria-label={t('Client view')} data-palm="client">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <div className="min-w-0 flex-1 truncate text-sm font-mono">{record.name}</div>
        <button type="button" onClick={() => step(-1)} disabled={notes.length === 0} aria-label={t('Previous note')} className="min-h-9 min-w-9 rounded-md border border-zinc-600 px-2 text-sm disabled:opacity-30">←</button>
        <button type="button" onClick={() => step(1)} disabled={notes.length === 0} aria-label={t('Next note')} className="min-h-9 min-w-9 rounded-md border border-zinc-600 px-2 text-sm disabled:opacity-30">→</button>
        <button type="button" onClick={overview} className="min-h-9 rounded-md border border-zinc-600 px-3 text-xs font-mono">{t('Whole palm')}</button>
        <button type="button" onClick={() => setShowNotes(value => !value)} aria-pressed={showNotes} className="min-h-9 rounded-md border border-zinc-600 px-3 text-xs font-mono">{t('Notes')}</button>
        <button type="button" onClick={onClose} aria-label={t('Close client view')} className="min-h-9 rounded-md border border-zinc-500 bg-zinc-800 px-3 text-sm">✕</button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-3 md:flex-row">
        <div className="min-h-0 flex-1">
          <PalmCanvas
            imageUrl={imageUrl}
            width={record.width}
            height={record.height}
            annotations={annotations}
            tool="view"
            color="#ef4444"
            strokeUnits={4}
            selectedId={selectedId}
            focusId={focus.id}
            focusNonce={focus.nonce}
            readOnly
            onSelect={id => { setSelectedId(id); }}
          />
        </div>
        {showNotes && (
          <ol className="max-h-[34vh] shrink-0 space-y-1.5 overflow-y-auto md:max-h-none md:w-80" data-palm="client-notes">
            {notes.length === 0 && <li className="text-xs font-mono text-zinc-400">{t('No notes yet.')}</li>}
            {notes.map(entry => (
              <li key={entry.id}>
                <button
                  type="button"
                  data-client-note={entry.number}
                  onClick={() => show(entry.id)}
                  className={`flex w-full gap-3 rounded-lg border px-3 py-2 text-left ${entry.id === selectedId ? 'border-cyan-400 bg-cyan-900/30' : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800'}`}
                >
                  <span className="font-mono text-lg font-bold text-emerald-400">{entry.number}</span>
                  <span className="min-w-0 break-words text-base">
                    {entry.label && <b>{entry.label} </b>}
                    {entry.note}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
