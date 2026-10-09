'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  COLORS, DEFAULT_COLOR, STROKE_DEFAULT, STROKE_MAX, STROKE_MIN, STROKE_STEP, clampStroke, noteList, pushHistory, redoHistory, startHistory, undoHistory, unitOf,
  type Annotation, type History,
} from '@/lib/palm/annotations';
import type { PalmRecord } from '@/lib/palm/storage';
import { renderAnnotated } from '@/lib/palm/image';
import { useT } from '@/lib/i18n';
import RangeField from '../RangeField';
import PalmCanvas, { type PalmTool } from './PalmCanvas';

type Props = {
  record: PalmRecord;
  imageUrl: string;
  /** The drawing changed; called on every step so it can be saved. */
  onChange: (annotations: Annotation[]) => void;
  onClientView: () => void;
};

const TOOLS: { id: PalmTool; glyph: string; label: string }[] = [
  { id: 'view', glyph: '✋', label: 'Move' },
  { id: 'select', glyph: '↖', label: 'Select' },
  { id: 'pen', glyph: '✎', label: 'Pen' },
  { id: 'line', glyph: '╱', label: 'Line' },
  { id: 'arrow', glyph: '➚', label: 'Arrow' },
  { id: 'ellipse', glyph: '◯', label: 'Circle' },
  { id: 'pin', glyph: '①', label: 'Pin' },
  { id: 'text', glyph: 'T', label: 'Text' },
];

const KIND_LABEL: Record<Annotation['kind'], string> = {
  pen: 'Pen', line: 'Line', arrow: 'Arrow', ellipse: 'Circle', pin: 'Pin', text: 'Text',
};

const button = (on: boolean) =>
  `min-h-9 min-w-9 rounded-md border px-2 py-1 text-sm font-mono ${on
    ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}`;

/**
 * Draws on one palm photograph: the tools, colours and stroke sizes, undo and
 * redo, the properties of the selected annotation and the numbered notes. The
 * drawing is reported on every step; the photograph itself is never changed.
 */
export default function PalmEditor({ record, imageUrl, onChange, onClientView }: Props) {
  const t = useT();
  const [history, setHistory] = useState<History<Annotation[]>>(() => startHistory(record.annotations));
  const [tool, setTool] = useState<PalmTool>('pen');
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [strokeUnits, setStrokeUnits] = useState(STROKE_DEFAULT);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ id: string | null; nonce: number }>({ id: null, nonce: 0 });
  const [exporting, setExporting] = useState(false);
  const [withNotes, setWithNotes] = useState(true);
  const labelRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [wanted, setWanted] = useState<'label' | 'note' | null>(null);
  const editing = useRef(false);
  const annotations = history.present;
  const unit = unitOf(record.width, record.height);
  const selected = annotations.find(annotation => annotation.id === selectedId) ?? null;
  const notes = useMemo(() => noteList(annotations), [annotations]);

  // Every step is reported so it can be saved; the first render is the stored drawing itself.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    onChange(annotations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations]);

  // A new pin waits for its note, a new text for its words.
  useEffect(() => {
    if (!wanted || !selected) return;
    (wanted === 'note' ? noteRef.current : labelRef.current)?.focus();
    if (wanted === 'label') labelRef.current?.select();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, selectedId]);

  const step = (next: Annotation[]) => setHistory(current => pushHistory(current, next));
  const undo = () => setHistory(undoHistory);
  const redo = () => setHistory(redoHistory);

  const create = (annotation: Annotation) => {
    step([...annotations, annotation]);
    setSelectedId(annotation.id);
    setWanted(annotation.kind === 'pin' ? 'note' : annotation.kind === 'text' ? 'label' : null);
  };

  const remove = () => {
    if (!selectedId) return;
    step(annotations.filter(annotation => annotation.id !== selectedId));
    setSelectedId(null);
  };

  // Typing in a field is one undo step, not one for every key.
  const edit = (patch: Partial<Pick<Annotation, 'label' | 'note' | 'color' | 'width'>>) => {
    if (!selectedId) return;
    const next = annotations.map(annotation => (annotation.id === selectedId ? { ...annotation, ...patch } : annotation)) as Annotation[];
    if (editing.current) setHistory(current => ({ ...current, present: next }));
    else step(next);
  };
  const typing = {
    onFocus: () => { editing.current = false; },
    onBlur: () => { editing.current = false; },
  };
  const type = (patch: Partial<Pick<Annotation, 'label' | 'note'>>) => {
    edit(patch);
    editing.current = true;
  };

  const chooseColor = (value: string) => {
    setColor(value);
    if (selected) edit({ color: value });
  };
  // The slider sets the width of the next drawings, and of the selected one when it is a line or a shape.
  const widthOf = selected && selected.kind !== 'pin' && selected.kind !== 'text' ? selected : null;
  const shownStroke = widthOf ? clampStroke(widthOf.width / unit) : strokeUnits;
  const chooseStroke = (value: number) => {
    const units = clampStroke(value);
    setStrokeUnits(units);
    if (widthOf) {
      // A drag on the slider is one undo step, not one for every notch.
      edit({ width: units * unit });
      editing.current = true;
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setHistory(current => (event.shiftKey ? redoHistory(current) : undoHistory(current)));
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        setHistory(redoHistory);
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        setHistory(current => pushHistory(current, current.present.filter(annotation => annotation.id !== selectedId)));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const download = async () => {
    setExporting(true);
    try {
      const blob = await renderAnnotated(record.image, record.width, record.height, annotations, withNotes);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${(record.name || 'palm').replace(/[^\p{L}\p{N}_ -]+/gu, '').trim() || 'palm'}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    } finally {
      setExporting(false);
    }
  };

  const focusNote = (id: string) => {
    setSelectedId(id);
    setFocus(current => ({ id, nonce: current.nonce + 1 }));
  };

  return (
    <div className="space-y-3" data-palm="editor">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label={t('Tools')}>
          {TOOLS.map(item => (
            <button key={item.id} type="button" aria-label={t(item.label)} title={t(item.label)} aria-pressed={tool === item.id} onClick={() => setTool(item.id)} className={button(tool === item.id)}>
              {item.glyph}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label={t('Colour')}>
          {COLORS.map(value => (
            <button
              key={value}
              type="button"
              aria-label={value}
              aria-pressed={(selected ? selected.color : color) === value}
              onClick={() => chooseColor(value)}
              className={`h-7 w-7 rounded-full border-2 ${(selected ? selected.color : color) === value ? 'border-emerald-500 ring-2 ring-emerald-300 dark:border-green-400' : 'border-zinc-300 dark:border-zinc-600'}`}
              style={{ backgroundColor: value }}
            />
          ))}
        </div>
        <RangeField
          className="w-40"
          label={t('Stroke')}
          value={shownStroke}
          min={STROKE_MIN}
          max={STROKE_MAX}
          step={STROKE_STEP}
          format={value => String(value)}
          onChange={chooseStroke}
          onDone={() => { editing.current = false; }}
        />
        <div className="flex gap-1">
          <button type="button" aria-label={t('Undo')} title={t('Undo')} disabled={history.past.length === 0} onClick={undo} className={`${button(false)} disabled:opacity-30`}>↶</button>
          <button type="button" aria-label={t('Redo')} title={t('Redo')} disabled={history.future.length === 0} onClick={redo} className={`${button(false)} disabled:opacity-30`}>↷</button>
          <button type="button" aria-label={t('Delete')} title={t('Delete')} disabled={!selected} onClick={remove} className={`${button(false)} disabled:opacity-30`}>🗑</button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            <input type="checkbox" checked={withNotes} onChange={event => setWithNotes(event.target.checked)} />
            {t('notes under the picture')}
          </label>
          <button type="button" onClick={download} disabled={exporting} className={`${button(false)} disabled:opacity-50`}>
            {exporting ? '…' : t('Download PNG')}
          </button>
          <button type="button" onClick={onClientView} className="min-h-9 rounded-md border border-emerald-500 bg-emerald-500 px-3 py-1 text-sm font-mono text-white hover:bg-emerald-600 dark:border-green-600 dark:bg-green-600">
            {t('Client view')}
          </button>
        </div>
      </div>

      {/* The notes sit beside the photograph when there is room for both, and under it when there is not. */}
      <div className="@container">
        <div className="grid gap-3 @3xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="h-[62vh] min-h-[320px]">
            <PalmCanvas
              imageUrl={imageUrl}
              width={record.width}
              height={record.height}
              annotations={annotations}
              tool={tool}
              color={color}
              strokeUnits={strokeUnits}
              selectedId={selectedId}
              focusId={focus.id}
              focusNonce={focus.nonce}
              onSelect={setSelectedId}
              onCreate={create}
              onCommit={step}
            />
          </div>

          <aside className="min-w-0 space-y-3" data-palm="side">
            {selected ? (
              <div className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700" data-palm="properties">
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t(KIND_LABEL[selected.kind])}</div>
                <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  {selected.kind === 'text' ? t('Text') : t('Label on the picture')}
                  <input
                    ref={labelRef}
                    value={selected.label ?? ''}
                    onChange={event => type({ label: event.target.value })}
                    {...typing}
                    aria-label={t('Label')}
                    className="mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </label>
                <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                  {t('Note for the client')}
                  <textarea
                    ref={noteRef}
                    value={selected.note ?? ''}
                    onChange={event => type({ note: event.target.value })}
                    {...typing}
                    aria-label={t('Note')}
                    rows={4}
                    className="mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </label>
              </div>
            ) : (
              <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
                {t('Draw with the tools above. Pins are numbered; give any drawing a note and it is numbered too. Use Select to move or edit a drawing.')}
              </p>
            )}

            <div data-palm="notes">
              <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Notes')}</div>
              {notes.length === 0 ? (
                <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('No notes yet.')}</p>
              ) : (
                <ol className="space-y-1">
                  {notes.map(entry => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        data-note={entry.number}
                        onClick={() => focusNote(entry.id)}
                        className={`flex w-full gap-2 rounded-md border px-2 py-1.5 text-left text-xs ${entry.id === selectedId ? 'border-cyan-400 bg-cyan-50 dark:border-cyan-700 dark:bg-cyan-900/20' : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'}`}
                      >
                        <span className="font-mono font-bold text-emerald-700 dark:text-green-400">{entry.number}.</span>
                        <span className="min-w-0 break-words text-zinc-700 dark:text-zinc-200">
                          {entry.label && <b>{entry.label} </b>}
                          {entry.note || (!entry.label && <i className="text-zinc-400">{t('(no note)')}</i>)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
