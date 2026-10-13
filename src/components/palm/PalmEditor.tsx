'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AGE_DEFAULT, AGE_LIMIT, AGE_STEP_MAX, AGE_STEP_MIN, COLORS, DEFAULT_COLOR, RULER_DEFAULT_PARTS, RULER_MAX_PARTS, RULER_MIN_PARTS, STROKE_DEFAULT, STROKE_MAX, STROKE_MIN, STROKE_STEP, clampParts, clampStroke,
  distance, noteList, pushHistory, redoHistory, startHistory, undoHistory, unitOf, validAgeScale,
  type AgeScale, type Annotation, type History,
} from '@/lib/palm/annotations';
import type { PalmRecord } from '@/lib/palm/storage';
import { renderAnnotated } from '@/lib/palm/image';
import { useT } from '@/lib/i18n';
import RangeField from '../RangeField';
import PalmCanvas, { type PalmTool } from './PalmCanvas';
import { saveFile } from '@/lib/download';

type Props = {
  record: PalmRecord;
  imageUrl: string;
  /** The drawing changed; called on every step so it can be saved. */
  onChange: (annotations: Annotation[]) => void;
  onClientView: () => void;
  /** Pixels of the photograph to a centimetre, once a ruler has been given a known length. */
  scale?: number;
  onScaleChange?: (scale: number | undefined) => void;
};

const TOOLS: { id: PalmTool; glyph: string; label: string }[] = [
  { id: 'view', glyph: '✋', label: 'Move' },
  { id: 'select', glyph: '↖', label: 'Select' },
  { id: 'pen', glyph: '✎', label: 'Pen' },
  { id: 'line', glyph: '╱', label: 'Line' },
  { id: 'arrow', glyph: '➚', label: 'Arrow' },
  { id: 'circle', glyph: '○', label: 'Circle' },
  { id: 'ellipse', glyph: '⬭', label: 'Ellipse' },
  { id: 'ruler', glyph: '📏', label: 'Ruler' },
  { id: 'pin', glyph: '①', label: 'Pin' },
  { id: 'text', glyph: 'T', label: 'Text' },
  { id: 'eraser', glyph: '⌫', label: 'Eraser' },
];

/** The eraser's radius on offer, in units. */
const ERASER_MIN = 2;
const ERASER_MAX = 60;
const ERASER_DEFAULT = 14;

const KIND_LABEL: Record<Annotation['kind'], string> = {
  pen: 'Pen', line: 'Line', arrow: 'Arrow', ellipse: 'Ellipse', circle: 'Circle', ruler: 'Ruler', pin: 'Pin', text: 'Text',
};

/** A number that is written in, and taken in when the field is left; a value that will not do puts the old one back. */
function NumberField({ label, value, min, max, step, onCommit }: { label: string; value: number; min: number; max: number; step: number; onCommit: (value: number) => boolean }) {
  return (
    <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
      {label}
      <input
        key={value}
        type="number"
        inputMode="decimal"
        aria-label={label}
        defaultValue={value}
        min={min}
        max={max}
        step={step}
        onBlur={event => {
          const text = event.currentTarget.value.trim();
          if (text === '' || !onCommit(Number(text))) event.currentTarget.value = String(value);
        }}
        onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
        className="mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
      />
    </label>
  );
}

/** The real length of a ruler, which gives the photograph its scale: rulers then speak in centimetres. */
function ScaleField({ lengthPx, onSet }: { lengthPx: number; onSet: (scale: number) => void }) {
  const t = useT();
  const [text, setText] = useState('');
  const centimetres = Number(text.replace(',', '.'));
  const usable = lengthPx > 0 && Number.isFinite(centimetres) && centimetres > 0;
  return (
    <div className="space-y-1.5 border-t border-zinc-200 pt-2 dark:border-zinc-700" data-palm="scale-field">
      <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        {t('real length of this ruler, in cm')}
        <input
          value={text}
          onChange={event => setText(event.target.value)}
          inputMode="decimal"
          aria-label={t('real length of this ruler, in cm')}
          className="mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </label>
      <button
        type="button"
        disabled={!usable}
        onClick={() => { onSet(lengthPx / centimetres); setText(''); }}
        className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-mono text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {t('use as the scale of the photograph')}
      </button>
    </div>
  );
}

const button = (on: boolean) =>
  `min-h-9 min-w-9 rounded-md border px-2 py-1 text-sm font-mono ${on
    ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
    : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'}`;

/**
 * Draws on one palm photograph: the tools, colours and stroke sizes, undo and
 * redo, the properties of the selected annotation and the numbered notes. The
 * drawing is reported on every step; the photograph itself is never changed.
 */
export default function PalmEditor({ record, imageUrl, onChange, onClientView, scale, onScaleChange }: Props) {
  const t = useT();
  const [history, setHistory] = useState<History<Annotation[]>>(() => startHistory(record.annotations));
  const [tool, setTool] = useState<PalmTool>('pen');
  const [color, setColor] = useState<string>(DEFAULT_COLOR);
  const [strokeUnits, setStrokeUnits] = useState(STROKE_DEFAULT);
  const [eraserUnits, setEraserUnits] = useState(ERASER_DEFAULT);
  const [rulerParts, setRulerParts] = useState(RULER_DEFAULT_PARTS);
  const [snap, setSnap] = useState(true);
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
  const edit = (patch: Partial<Pick<Annotation, 'label' | 'note' | 'color' | 'width' | 'ages'>>) => {
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

  // A change of the ages along the selected line; one that is not a sensible scale is not taken.
  const changeAges = (current: AgeScale, patch: Partial<AgeScale>) => {
    const next = validAgeScale({ ...current, ...patch });
    if (!next) return false;
    edit({ ages: next });
    return true;
  };

  // The number of parts sets the next rulers, and the selected ruler.
  const ruler = selected?.kind === 'ruler' ? selected : null;
  const shownParts = ruler ? ruler.parts : rulerParts;
  const chooseParts = (value: number) => {
    const parts = clampParts(value);
    setRulerParts(parts);
    if (ruler) step(annotations.map(annotation => (annotation.id === ruler.id ? { ...ruler, parts } : annotation)));
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
      const blob = await renderAnnotated(record.image, record.width, record.height, annotations, withNotes, scale);
      saveFile(`${(record.name || 'palm').replace(/[^\p{L}\p{N}_ -]+/gu, '').trim() || 'palm'}.png`, blob, 'image/png');
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
        {tool === 'eraser' ? (
          <RangeField
            className="w-40"
            label={t('Eraser')}
            value={eraserUnits}
            min={ERASER_MIN}
            max={ERASER_MAX}
            step={1}
            format={value => String(value)}
            onChange={setEraserUnits}
          />
        ) : (
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
        )}
        {(tool === 'ruler' || ruler) && (
          <label className="flex items-center gap-1 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
            {t('divide into')}
            <select
              aria-label={t('Parts')}
              value={shownParts}
              onChange={event => chooseParts(Number(event.target.value))}
              className="rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {Array.from({ length: RULER_MAX_PARTS - RULER_MIN_PARTS + 1 }, (_, index) => RULER_MIN_PARTS + index).map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          onClick={() => setSnap(on => !on)}
          aria-pressed={snap}
          title={t('New drawings catch on the marks of a ruler, the middle of a line and the centre of a circle')}
          className={button(snap)}
        >
          {t('snap')}
        </button>
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
              eraserUnits={eraserUnits}
              rulerParts={rulerParts}
              snap={snap}
              scale={scale}
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
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t(KIND_LABEL[selected.kind])}</div>
                  {tool !== 'select' && (
                    <button type="button" onClick={() => setTool('select')} className="rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-mono text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      ↖ {t('Move or reshape')}
                    </button>
                  )}
                </div>
                {selected.kind === 'ruler' && (
                  <>
                    <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
                      {scale ? t('Lengths are in centimetres, by the scale of the photograph.') : t('Lengths are in pixels of the photograph.')}
                    </p>
                    <ScaleField lengthPx={distance(selected.from, selected.to)} onSet={value => onScaleChange?.(value)} />
                  </>
                )}
                {(selected.kind === 'pen' || selected.kind === 'line' || selected.kind === 'arrow') && (
                  <div className="space-y-2 border-t border-zinc-200 pt-2 dark:border-zinc-700" data-palm="ages">
                    <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                      <input type="checkbox" checked={Boolean(selected.ages)} onChange={event => edit({ ages: event.target.checked ? AGE_DEFAULT : undefined })} />
                      {t('ages along the line')}
                    </label>
                    {selected.ages && (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <NumberField label={t('age at the start')} value={selected.ages.from} min={0} max={AGE_LIMIT} step={1} onCommit={value => changeAges(selected.ages!, { from: value })} />
                          <NumberField label={t('age at the end')} value={selected.ages.to} min={0} max={AGE_LIMIT} step={1} onCommit={value => changeAges(selected.ages!, { to: value })} />
                          <NumberField label={t('a mark every')} value={selected.ages.step} min={AGE_STEP_MIN} max={AGE_STEP_MAX} step={0.5} onCommit={value => changeAges(selected.ages!, { step: value })} />
                        </div>
                        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{t('The ages are spread evenly along the length of the line, from the start of the stroke to its end.')}</p>
                      </>
                    )}
                  </div>
                )}
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
                {t('Draw with the tools above. Pins are numbered; give any drawing a note and it is numbered too. Use Select to move a drawing, and drag its dots to change it.')}
              </p>
            )}

            {scale && (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-2 py-1.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:text-zinc-300" data-palm="scale">
                <span>{t('Scale')}: 1 cm = {Math.round(scale * 10) / 10} px</span>
                <button type="button" onClick={() => onScaleChange?.(undefined)} className="rounded-sm border border-zinc-200 px-1.5 py-0.5 text-[9px] text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100">{t('clear')}</button>
              </div>
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
