'use client';

import { useT } from '@/lib/i18n';

const COLOURS = {
  amber: 'border-amber-500 bg-amber-500 text-white dark:border-amber-600 dark:bg-amber-600',
  violet: 'border-violet-500 bg-violet-500 text-white dark:border-violet-600 dark:bg-violet-600',
} as const;

interface Props<T extends string | number> {
  /** The heading, which is also the name of the group (already translated). */
  title: string;
  items: readonly T[];
  selected: readonly T[];
  onChange: (selected: T[]) => void;
  /** What a chip says, and what it is when pointed at. */
  label: (item: T) => string;
  hint?: (item: T) => string;
  colour: keyof typeof COLOURS;
}

/** A row of chips to switch things on and off one by one, with "all" and "none" for the whole row. */
export default function ChipPicker<T extends string | number>({ title, items, selected, onChange, label, hint, colour }: Props<T>) {
  const t = useT();
  const link = 'text-[9px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200';
  return (
    <>
      <div className="flex items-baseline justify-between">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{title}</div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onChange([...items])} disabled={selected.length === items.length} className={link}>{t('all')}</button>
          <button type="button" onClick={() => onChange([])} disabled={selected.length === 0} className={link}>{t('none')}</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label={title}>
        {items.map(item => {
          const on = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              aria-pressed={on}
              title={hint?.(item)}
              onClick={() => onChange(on ? selected.filter(other => other !== item) : [...selected, item])}
              className={`rounded-sm border px-2 py-1.5 text-[10px] font-mono sm:px-1.5 sm:py-0.5 sm:text-[9px] ${on
                ? COLOURS[colour]
                : 'border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}
            >
              {label(item)}
            </button>
          );
        })}
      </div>
    </>
  );
}
