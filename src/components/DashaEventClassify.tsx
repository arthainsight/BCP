'use client';

import { useMemo, useState } from 'react';
import { DASHA_EVENT_CATEGORY_LABELS, type DashaEventCategory, type StoredDashaEvent } from '@/lib/dashaEventStore';
import { CLASSIFY_PRESETS, classifyEvents } from '@/lib/dashaEventClassify';
import { fill, useT } from '@/lib/i18n';

interface Props {
  events: readonly StoredDashaEvent[];
  /** Puts the sorted list in place of the old one, with a message, keeping the old one for Undo. */
  onApply: (text: string, next: StoredDashaEvent[]) => void;
}

const FIELD = 'min-h-10 rounded border border-zinc-300 bg-white px-1.5 py-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-900';
const PREVIEW_NAMES = 5;
const CATEGORIES = Object.keys(DASHA_EVENT_CATEGORY_LABELS) as DashaEventCategory[];

/**
 * Sorting many events at once by the words in them: a set of words (or a preset of them for moves, marriages, accidents…), the category and the tag to give, and a preview of
 * what they find before anything is changed. Only the events still in "other" by default, so what was sorted by hand stays as it is; Undo brings the old list back.
 */
export default function DashaEventClassify({ events, onApply }: Props) {
  const t = useT();
  const [words, setWords] = useState('');
  const [category, setCategory] = useState<DashaEventCategory | ''>('');
  const [tag, setTag] = useState('');
  const [onlyOther, setOnlyOther] = useState(true);
  const [open, setOpen] = useState(false);
  const result = useMemo(() => classifyEvents(events, { words, category: category || undefined, tag, onlyOther }), [events, words, category, tag, onlyOther]);
  const names = result.matched.slice(0, PREVIEW_NAMES).map(event => event.name);

  const apply = () => {
    onApply(fill(t('Sorted {count} events.'), { count: result.changed }), result.events);
    setWords('');
  };

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-2 text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300" data-classify>
      <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)} className="min-h-8 select-none text-left">{open ? '▾' : '▸'} {t('Classify events by words')}</button>
      {open && <div className="mt-2 space-y-2" role="group" aria-label={t('Classify events by words')}>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('Sets of words')}>
          {CLASSIFY_PRESETS.map(preset => (
            <button
              key={preset.key}
              type="button"
              onClick={() => { setWords(preset.words); setCategory(preset.category); setTag(preset.tag); }}
              className="min-h-10 rounded border border-zinc-300 px-2 py-1 text-[10px] dark:border-zinc-700"
            >
              {t(preset.label)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <input value={words} onChange={event => setWords(event.target.value)} placeholder={t('words in the name, tags or notes, comma separated')} aria-label={t('Words to look for')} className={`${FIELD} w-full max-w-md text-xs`} />
          <select value={category} onChange={event => setCategory(event.target.value as DashaEventCategory | '')} aria-label={t('Category to give')} className={FIELD}>
            <option value="">{t('Keep the category')}</option>
            {CATEGORIES.map(item => <option key={item} value={item}>{t(DASHA_EVENT_CATEGORY_LABELS[item])}</option>)}
          </select>
          <input value={tag} onChange={event => setTag(event.target.value)} placeholder={t('tag to add')} aria-label={t('Tag to add')} className={`${FIELD} w-32 text-xs`} />
        </div>
        <label className="flex min-h-8 items-center gap-1.5">
          <input type="checkbox" checked={onlyOther} onChange={event => setOnlyOther(event.target.checked)} className="h-4 w-4 accent-emerald-600" />
          {t('Only the events still in the category Other')}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={result.changed === 0} onClick={apply} className="min-h-10 rounded border border-emerald-400 px-2 py-1 text-[10px] text-emerald-700 disabled:opacity-40 dark:text-emerald-300">
            {fill(t('Sort {count} events'), { count: result.changed })}
          </button>
          <span aria-live="polite" data-classify-preview className="text-zinc-500 dark:text-zinc-400">
            {words.trim() === '' ? t('Write some words or choose a set to see which events they find.') : fill(t('{count} events found, {changed} would change.'), { count: result.matched.length, changed: result.changed })}
            {names.length > 0 && ` · ${names.join(', ')}${result.matched.length > names.length ? '…' : ''}`}
          </span>
        </div>
      </div>}
    </div>
  );
}
