'use client';

import { useMemo, useState } from 'react';
import { eventIdentity, parseDashaEventText, type ImportedEvent } from '@/lib/dashaEventImport';
import { DASHA_EVENT_CATEGORY_LABELS, DASHA_EVENT_VARGAS, type DashaEventCategory, type DashaEventVarga } from '@/lib/dashaEventStore';

interface Props {
  /** The events already in the list, so that none is added twice. */
  existing: ImportedEvent[];
  onAdd: (events: ImportedEvent[]) => void;
  onClose: () => void;
}

const FIELD = 'rounded border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900';
const MAX_CHARACTERS = 200_000;

/** The box where many events are written or pasted at once, one on each line. */
export default function DashaEventPaste({ existing, onAdd, onClose }: Props) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<DashaEventCategory>('other');
  const [varga, setVarga] = useState<DashaEventVarga>('D1');

  const read = useMemo(() => {
    const result = parseDashaEventText(text, { category, varga });
    const known = new Set(existing.map(eventIdentity));
    const fresh = result.events.filter(item => !known.has(eventIdentity(item)));
    return { fresh, duplicates: result.events.length - fresh.length, invalid: result.invalid, format: result.format };
  }, [text, category, varga, existing]);

  return (
    <div role="group" aria-label="Paste many events" className="space-y-2 rounded-md border border-cyan-200 bg-cyan-50/50 p-2 dark:border-cyan-900 dark:bg-cyan-950/10">
      <p className="text-[10px] text-zinc-600 dark:text-zinc-300">
        One event on each line: the date and the name, for example <span className="font-mono">15.6.2015 Moved abroad</span>. The date can also be <span className="font-mono">2015-06-15</span> or <span className="font-mono">15/6/2015</span>, a month (<span className="font-mono">3/2015</span>) or a year (<span className="font-mono">2015</span>; the middle of it is used and the event is tagged approx. date), and it can be at the end of the line. Two dates make an event that lasted for a while: <span className="font-mono">15.6.2015 - 20.8.2017 Studied abroad</span>. A line separated with semicolons or tabs (as copied from a spreadsheet) can go on with the category, varga, significance 1-5 and notes: <span className="font-mono">15.6.2015; Moved abroad; home; D1; 4; second move</span>. A pasted CSV file or JSON list is read as it is.
      </p>
      <textarea
        value={text}
        onChange={event => setText(event.target.value.slice(0, MAX_CHARACTERS))}
        aria-label="Events to add"
        rows={8}
        spellCheck={false}
        placeholder={'15.6.2015 Moved abroad\n2.1.2018; New job; work; D10; 5\n2015 - 2017 Studied abroad\n2019-03-04 Daughter born'}
        className={`w-full px-2 py-1.5 font-mono text-xs ${FIELD}`}
      />
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[10px] text-zinc-500">Category when not given
          <select value={category} onChange={event => setCategory(event.target.value as DashaEventCategory)} className={`mt-1 block min-h-10 px-2 py-1.5 text-xs ${FIELD}`}>
            {(Object.keys(DASHA_EVENT_CATEGORY_LABELS) as DashaEventCategory[]).map(item => <option key={item} value={item}>{DASHA_EVENT_CATEGORY_LABELS[item]}</option>)}
          </select>
        </label>
        <label className="text-[10px] text-zinc-500">Varga when not given
          <select value={varga} onChange={event => setVarga(event.target.value as DashaEventVarga)} className={`mt-1 block min-h-10 px-2 py-1.5 text-xs ${FIELD}`}>
            {DASHA_EVENT_VARGAS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <span aria-live="polite" className="min-w-0 flex-1 text-[10px]">
          <strong>{read.fresh.length}</strong> new{read.format !== 'lines' ? ` (${read.format})` : ''}{read.duplicates ? ` · ${read.duplicates} already in the list` : ''}{read.invalid.length ? ` · ${read.invalid.length} lines not understood` : ''}
        </span>
        <button type="button" onClick={onClose} className="min-h-10 rounded border border-zinc-300 px-2 py-1 text-[10px] dark:border-zinc-700">Cancel</button>
        <button type="button" disabled={!read.fresh.length} onClick={() => onAdd(read.fresh)} className="min-h-10 rounded bg-cyan-700 px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-40">Add {read.fresh.length || ''} events</button>
      </div>
      {read.invalid.length > 0 && (
        <ul aria-label="Lines not understood" className="max-h-24 space-y-0.5 overflow-auto rounded border border-amber-200 bg-amber-50 p-1.5 font-mono text-[10px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
          {read.invalid.slice(0, 20).map((line, index) => <li key={index} className="break-words">{line}</li>)}
          {read.invalid.length > 20 && <li>… and {read.invalid.length - 20} more</li>}
        </ul>
      )}
    </div>
  );
}
