'use client';


import { useT } from '@/lib/i18n';
import type { DashaFamily, DashaStatus } from '@/lib/dashaRegistry';

export interface PickerGroup {
  family: DashaFamily;
  label: string;
  items: { key: string; label: string; status: DashaStatus; active: boolean }[];
}

/** The id of the list, so that the button can point at it. */
export const PICKER_LIST_ID = 'dasha-system-picker';

const counts = (groups: PickerGroup[]) => {
  const shown = groups.filter(group => group.items.length > 0);
  return { shown, total: shown.reduce((sum, group) => sum + group.items.length, 0), active: shown.reduce((sum, group) => sum + group.items.filter(item => item.active).length, 0) };
};

/**
 * The "…" button of the Dasas tab, with the number of active systems. It opens the list below (DashaSystemPickerList): every
 * daśā system, in the three groups of the tab, each with a box for whether it is active.
 */
export function DashaSystemPickerButton({ groups, open, onToggleOpen }: { groups: PickerGroup[]; open: boolean; onToggleOpen: () => void }) {
  const t = useT();
  const { total, active } = counts(groups);
  return (
    <button
      type="button"
      onClick={onToggleOpen}
      aria-expanded={open}
      aria-controls={PICKER_LIST_ID}
      aria-label={t('Choose daśā systems')}
      title={t('Choose daśā systems')}
      className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-mono sm:min-h-0 ${open
        ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
        : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
    >
      <span aria-hidden="true" className="text-base leading-none">…</span>
      <span className="text-[10px]">{active}/{total}</span>
    </button>
  );
}

/**
 * The list the … button opens. The same choice as Settings → dasha systems: an active system is drawn in the tab, and is in the
 * timeline, the finder and the other views that read the active systems.
 */
export function DashaSystemPickerList({ groups, onToggle, onSetGroup }: {
  groups: PickerGroup[];
  onToggle: (key: string) => void;
  onSetGroup: (family: DashaFamily, active: boolean) => void;
}) {
  const t = useT();
  const { shown } = counts(groups);
  return (
    <div id={PICKER_LIST_ID} role="group" aria-label={t('Choose daśā systems')} className="min-w-0 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        {t('A checked system is active: it is drawn here and counted by the other daśā views. The same choice as Settings → dasha systems.')}
      </p>
      {shown.map(group => {
        const allActive = group.items.every(item => item.active);
        const noneActive = group.items.every(item => !item.active);
        return (
          <div key={group.family} role="group" aria-labelledby={`${PICKER_LIST_ID}-${group.family}`} className="min-w-0 space-y-1">
            <div className="flex w-full items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              <span id={`${PICKER_LIST_ID}-${group.family}`}>{t(group.label)}</span>
              <span className="flex gap-1 normal-case tracking-normal">
                <button type="button" disabled={allActive} onClick={() => onSetGroup(group.family, true)} className="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] enabled:hover:bg-white disabled:opacity-40 dark:border-zinc-700 dark:enabled:hover:bg-zinc-800">{t('all')}</button>
                <button type="button" disabled={noneActive} onClick={() => onSetGroup(group.family, false)} className="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] enabled:hover:bg-white disabled:opacity-40 dark:border-zinc-700 dark:enabled:hover:bg-zinc-800">{t('none')}</button>
              </span>
            </div>
            {group.items.map(item => (
              <label key={item.key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-zinc-100 bg-white px-2 py-1.5 text-xs font-mono text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:min-h-0">
                <input type="checkbox" checked={item.active} onChange={() => onToggle(item.key)} className="h-4 w-4 shrink-0 accent-emerald-600" />
                <span className="min-w-0 truncate">{item.label}</span>
                {item.status === 'beta' && <span className="shrink-0 rounded bg-amber-100 px-1 text-[9px] uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">beta</span>}
              </label>
            ))}
          </div>
        );
      })}
    </div>
  );
}
