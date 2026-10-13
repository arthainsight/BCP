'use client';

import { useState } from 'react';
import { parseTagInput, type BulkChange } from '@/lib/dashaEventBulk';
import { fill, useT } from '@/lib/i18n';
import { DASHA_EVENT_CATEGORY_LABELS, DASHA_EVENT_VARGAS, type DashaEventCategory, type DashaEventVarga } from '@/lib/dashaEventStore';

interface Props {
  /** How many events the list shows, and how many of them are selected. */
  shown: number;
  selected: number;
  groupByYear: boolean;
  onGroupByYear: (value: boolean) => void;
  onToggleAll: () => void;
  onChange: (change: BulkChange) => void;
  onDelete: () => void;
}

const FIELD = 'min-h-10 rounded border border-zinc-300 bg-white px-1.5 py-1.5 text-[11px] dark:border-zinc-700 dark:bg-zinc-900';
const BUTTON = 'min-h-10 rounded border px-2 py-1 text-[10px] disabled:opacity-40';

/** Choosing many events of the list, and changing or deleting them together. */
export default function DashaEventBulkBar({ shown, selected, groupByYear, onGroupByYear, onToggleAll, onChange, onDelete }: Props) {
  const t = useT();
  const [tagText, setTagText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const tags = parseTagInput(tagText);
  const applyTags = (remove: boolean) => { onChange(remove ? { removeTags: tags } : { addTags: tags }); setTagText(''); };

  return (
    <div role="group" aria-label={t('Bulk editing')} className="space-y-2 rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-600 dark:text-zinc-300">
        <label className="flex min-h-8 items-center gap-1.5">
          <input type="checkbox" checked={shown > 0 && selected === shown} onChange={onToggleAll} className="h-4 w-4 accent-emerald-600" />
          {fill(t('Select all shown ({count})'), { count: shown })}
        </label>
        <label className="flex min-h-8 items-center gap-1.5">
          <input type="checkbox" checked={groupByYear} onChange={event => onGroupByYear(event.target.checked)} className="h-4 w-4 accent-emerald-600" />
          {t('Group by year')}
        </label>
        {selected > 0 && <span aria-live="polite">{fill(t('{count} selected'), { count: selected })}</span>}
      </div>
      {selected > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <select value="" onChange={event => event.target.value && onChange({ category: event.target.value as DashaEventCategory })} aria-label={t('Set category of the selected events')} className={FIELD}>
            <option value="">{t('Set category…')}</option>
            {(Object.keys(DASHA_EVENT_CATEGORY_LABELS) as DashaEventCategory[]).map(item => <option key={item} value={item}>{t(DASHA_EVENT_CATEGORY_LABELS[item])}</option>)}
          </select>
          <select value="" onChange={event => event.target.value && onChange({ varga: event.target.value as DashaEventVarga })} aria-label={t('Set varga of the selected events')} className={FIELD}>
            <option value="">{t('Set varga…')}</option>
            {DASHA_EVENT_VARGAS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value="" onChange={event => event.target.value && onChange({ significance: Number(event.target.value) })} aria-label={t('Set significance of the selected events')} className={FIELD}>
            <option value="">{t('Set significance…')}</option>
            {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} / 5</option>)}
          </select>
          <input value={tagText} onChange={event => setTagText(event.target.value)} placeholder={t('tags, comma separated')} aria-label={t('Tags for the selected events')} className={`${FIELD} w-40 text-xs`} />
          <button type="button" disabled={!tags.length} onClick={() => applyTags(false)} className={`${BUTTON} border-emerald-400 text-emerald-700 dark:text-emerald-300`}>{t('Add tags')}</button>
          <button type="button" disabled={!tags.length} onClick={() => applyTags(true)} className={`${BUTTON} border-zinc-300 dark:border-zinc-700`}>{t('Remove tags')}</button>
          <button type="button" onClick={() => onChange({ clearEnd: true })} className={`${BUTTON} border-zinc-300 dark:border-zinc-700`}>{t('Clear end date')}</button>
          {confirming ? (
            <span className="flex items-center gap-1.5 text-[10px] text-red-700 dark:text-red-400">
              {fill(t('Delete {count} events?'), { count: selected })}
              <button type="button" onClick={() => { setConfirming(false); onDelete(); }} className="min-h-10 rounded bg-red-700 px-2 py-1 font-semibold text-white">{t('Yes, delete')}</button>
              <button type="button" onClick={() => setConfirming(false)} className={`${BUTTON} border-zinc-300 dark:border-zinc-700`}>{t('Keep')}</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className={`${BUTTON} border-red-300 text-red-700 dark:border-red-800 dark:text-red-400`}>{fill(t('Delete selected ({count})'), { count: selected })}</button>
          )}
        </div>
      )}
    </div>
  );
}
