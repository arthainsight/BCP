'use client';

import { useMemo, useState } from 'react';
import type { DashaEventSnapshot } from '@/lib/dashaEvents';
import { analyzeDashaEventPatterns } from '@/lib/dashaEventPatterns';
import { DASHA_EVENT_CATEGORIES, DASHA_EVENT_CATEGORY_LABELS, type DashaEventCategory, type StoredDashaEvent } from '@/lib/dashaEventStore';
import { fill, useT } from '@/lib/i18n';

const chip = (active: boolean) => `min-h-10 rounded border px-2 py-1 text-[9px] font-mono ${active ? 'border-cyan-500 text-cyan-700 dark:text-cyan-300' : 'border-zinc-300 text-zinc-400 dark:border-zinc-700'}`;

/** The Dasha periods that repeat across the saved events, for all of them or for one category. */
export default function DashaEventPatterns({ events, snapshotsFor }: { events: StoredDashaEvent[]; snapshotsFor: (item: StoredDashaEvent) => DashaEventSnapshot[] }) {
  const t = useT();
  const [category, setCategory] = useState<DashaEventCategory | 'all'>('all');
  const patterns = useMemo(() => {
    const records = events.flatMap(item => snapshotsFor(item).map(snapshot => ({ eventId: item.id, category: item.category, snapshot })));
    return analyzeDashaEventPatterns(records, category).slice(0, 12);
  }, [events, snapshotsFor, category]);
  const usedCategories = DASHA_EVENT_CATEGORIES.filter(item => events.some(event => event.category === item));

  return (
    <>
      <div>
        <h3 className="text-sm font-semibold">{t('Pattern Analysis 2.0')}</h3>
        <p className="text-[10px] text-zinc-500">{t('Repeated levels, level combinations and derived sign rulers across saved events.')}</p>
      </div>
      {events.length < 2 ? (
        <p className="py-4 text-center text-xs italic text-zinc-400">{t('Add at least two events before comparing recurring patterns.')}</p>
      ) : (
        <details open className="rounded-md border border-cyan-200 bg-cyan-50/40 dark:border-cyan-900 dark:bg-cyan-950/10">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-cyan-800 dark:text-cyan-300">{fill(t('Recurring Dasha patterns · {count}'), { count: patterns.length })}</summary>
          <div className="space-y-2 border-t border-cyan-100 px-3 py-2 dark:border-cyan-900">
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setCategory('all')} className={chip(category === 'all')}>{t('All')}</button>
              {usedCategories.map(item => <button type="button" key={item} onClick={() => setCategory(item)} className={chip(category === item)}>{t(DASHA_EVENT_CATEGORY_LABELS[item])}</button>)}
            </div>
            {patterns[0]?.sampleSize < 5 && (
              <p className="rounded border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">{fill(t('Small sample ({count} events): patterns are exploratory.'), { count: patterns[0]?.sampleSize ?? 0 })}</p>
            )}
            {patterns.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {patterns.map(pattern => (
                  <div key={pattern.key} className="flex min-w-0 flex-col items-start gap-2 rounded border border-cyan-100 bg-white p-2.5 text-[10px] dark:border-cyan-900 dark:bg-zinc-900">
                    <div className="w-full min-w-0 leading-relaxed">
                      <div className="break-words text-zinc-500">{pattern.dasha} · {pattern.level}</div>
                      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="break-words font-semibold text-zinc-800 dark:text-zinc-100">{pattern.value}</span>
                        <span className="text-[8px] uppercase text-zinc-400">{pattern.kind}</span>
                      </div>
                    </div>
                    <span className="max-w-full whitespace-normal rounded bg-cyan-100 px-1.5 py-0.5 font-mono leading-relaxed text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">{pattern.count}/{pattern.sampleSize} · {Math.round(pattern.support * 100)}% · {pattern.confidence}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-[10px] italic text-zinc-400">{t('No period repeats in this category yet. At least two matching events are required.')}</p>}
            <p className="text-[9px] text-zinc-400">{t('Counts repeated MD, AD and PD rulers within each enabled Dasha system. Repetition is descriptive, not proof of causation.')}</p>
          </div>
        </details>
      )}
    </>
  );
}
