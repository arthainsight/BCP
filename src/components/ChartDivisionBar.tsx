'use client';

import { VARGA_DIVISIONS, VARGA_NAMES, VARGA_SIGNIFICATIONS } from '@/lib/vargaChart';
import { useT } from '@/lib/i18n';

/** Charts that always have a button; others appear once chosen from the list. */
const QUICK = [1, 9, 10];

/**
 * Which divisional charts the main chart shows. One chart is the full D1 with
 * all its layers; several are drawn side by side, so a chart can be read next
 * to the daśā panel on a wide screen.
 */
export default function ChartDivisionBar({ selected, onChange }: { selected: number[]; onChange: (next: number[]) => void }) {
  const t = useT();
  const shown = [...new Set([...QUICK, ...selected])].sort((a, b) => a - b);
  const others = VARGA_DIVISIONS.filter(division => !shown.includes(division));

  const toggle = (division: number) => {
    if (selected.includes(division)) {
      // The last chart stays; there is always something to show.
      if (selected.length > 1) onChange(selected.filter(d => d !== division));
    } else {
      onChange([...selected, division].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto" role="group" aria-label={t('divisional charts')}>
      {shown.map(division => {
        const on = selected.includes(division);
        return (
          <button
            key={division}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(division)}
            title={`${VARGA_NAMES[division]} — ${VARGA_SIGNIFICATIONS[division]}`}
            className={`shrink-0 rounded-md border px-2.5 py-1.5 text-[10px] font-mono sm:px-2 sm:py-1 ${on
              ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
              : 'border-zinc-200 text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100'}`}
          >
            D{division}
          </button>
        );
      })}
      {others.length > 0 && (
        <select
          value=""
          aria-label={t('more charts')}
          onChange={event => { if (event.target.value) toggle(Number(event.target.value)); }}
          className="shrink-0 rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] font-mono text-zinc-500 sm:py-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
        >
          <option value="">+ {t('more')}</option>
          {others.map(division => (
            <option key={division} value={division}>D{division} {VARGA_NAMES[division]}</option>
          ))}
        </select>
      )}
    </div>
  );
}
