'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { getTodayString } from '@/lib/dateInput';
import { useT } from '@/lib/i18n';
import { DASHA_EVENT_ACCURACIES, DASHA_EVENT_ACCURACY_LABELS, DASHA_EVENT_CATEGORY_LABELS, DASHA_EVENT_VARGAS, parseEventDate, type DashaEventAccuracy, type DashaEventCategory, type DashaEventVarga } from '@/lib/dashaEventStore';

export interface NewEvent {
  name: string;
  date: string;
  endDate?: string;
  category: DashaEventCategory;
  varga: DashaEventVarga;
  /** Only when it is not the day. */
  accuracy?: DashaEventAccuracy;
}

const FIELD = 'min-h-11 min-w-0 rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900';

/** The form that adds one event: a name, a day (and the last day of one that lasted for a while), a category and a varga. */
export default function DashaEventForm({ onAdd }: { onAdd: (event: NewEvent) => void }) {
  const t = useT();
  const [name, setName] = useState('');
  const [date, setDate] = useState(getTodayString);
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState<DashaEventCategory>('work');
  const [varga, setVarga] = useState<DashaEventVarga>('D1');
  const [accuracy, setAccuracy] = useState<DashaEventAccuracy>('day');

  // A day chosen elsewhere (in the finder, on the timeline) is the day of the next event.
  useEffect(() => {
    const select = (event: Event) => setDate((event as CustomEvent<string>).detail);
    window.addEventListener('bcp:dasha-date-selected', select);
    return () => window.removeEventListener('bcp:dasha-date-selected', select);
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !parseEventDate(date)) return;
    onAdd({ name: name.trim(), date, ...(endDate && endDate >= date ? { endDate } : {}), category, varga, ...(accuracy !== 'day' ? { accuracy } : {}) });
    setName('');
    setEndDate('');
  }

  return (
    <form onSubmit={submit} className="flex min-w-0 flex-wrap gap-2">
      <input value={name} onChange={event => setName(event.target.value)} placeholder={t('Event name')} aria-label={t('Event name')} className={`${FIELD} flex-[2_1_180px]`} />
      <input type="date" value={date} onChange={event => setDate(event.target.value)} aria-label={t('Event date')} className={`${FIELD} flex-[1_1_130px]`} />
      <input type="date" value={endDate} min={date} onChange={event => setEndDate(event.target.value)} aria-label={t('Event end date (optional)')} title={t('The last day, for an event that lasted for a while')} className={`${FIELD} flex-[1_1_130px]`} />
      <select value={category} onChange={event => setCategory(event.target.value as DashaEventCategory)} aria-label={t('Event category')} className={`${FIELD} flex-[1_1_120px]`}>
        {Object.entries(DASHA_EVENT_CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{t(label)}</option>)}
      </select>
      <select value={varga} onChange={event => setVarga(event.target.value as DashaEventVarga)} aria-label={t('Event varga')} className={`${FIELD} flex-[0_1_80px]`}>
        {DASHA_EVENT_VARGAS.map(item => <option key={item}>{item}</option>)}
      </select>
      <select value={accuracy} onChange={event => setAccuracy(event.target.value as DashaEventAccuracy)} aria-label={t('Event date accuracy')} title={t('How exactly the day is known: Research reads an event to the month or to the year over a window')} className={`${FIELD} flex-[0_1_110px]`}>
        {DASHA_EVENT_ACCURACIES.map(item => <option key={item} value={item}>{t(DASHA_EVENT_ACCURACY_LABELS[item])}</option>)}
      </select>
      <button type="submit" disabled={!name.trim() || !date} className="min-h-11 rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{t('Add')}</button>
    </form>
  );
}
