import type { ReactNode } from 'react';
import { ayanamsaLabel } from '@/lib/ayanamsas';
import { useT } from '@/lib/i18n';

// Small building blocks of the main page layout.

export function EmptyState({ message }: { message: string }) {
  const t = useT();
  return (
    <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">
      {t(message)}
    </div>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
      {children}
    </div>
  );
}

/**
 * The birth data folded into one card, on a phone, once the chart is on the screen:
 * the moment, the place and the UTC offset, with a button to open the form again.
 */
export function DataSummary({ birthDatetime, city, utcOffset, onEdit }: { birthDatetime: string; city: string; utcOffset: number | null; onEdit: () => void }) {
  const t = useT();
  const offset = utcOffset === null ? '' : `${utcOffset >= 0 ? '+' : ''}${utcOffset % 1 === 0 ? utcOffset.toFixed(0) : utcOffset.toFixed(1)}h UTC`;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900" data-data-summary>
      <div className="min-w-0 space-y-0.5 font-mono">
        <div className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{birthDatetime}</div>
        <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{[city, offset].filter(Boolean).join(' · ')}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-mono text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
      >
        {t('edit')}
      </button>
    </div>
  );
}

/**
 * The birth data as one thin line over the chart in the split view: the moment, the place and the UTC
 * offset, and a toggle for the form. The form takes the room the chart needs, so it stays shut.
 */
export function DataLine({ birthDatetime, city, utcOffset, open, onToggle }: { birthDatetime: string; city: string; utcOffset: number | null; open: boolean; onToggle: () => void }) {
  const t = useT();
  const offset = utcOffset === null ? '' : `${utcOffset >= 0 ? '+' : ''}${utcOffset % 1 === 0 ? utcOffset.toFixed(0) : utcOffset.toFixed(1)}h UTC`;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      title={open ? t('▲ hide') : t('edit')}
      data-data-line
      className="flex w-full min-w-0 items-center gap-2 rounded-md px-1 py-0.5 text-left text-[10px] font-mono text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      <span className="min-w-0 truncate">{[birthDatetime, city, offset].filter(Boolean).join(' · ')}</span>
    </button>
  );
}

/** One workspace of the split view, shown in full: the page scrolls, not the pane. */
export function SplitPane({ id, label, className = '', mobile = false, children }: { id: string; label: string; className?: string; mobile?: boolean; children: ReactNode }) {
  const t = useT();
  // The wide layout and the phone layout are both in the page (one of them hidden), so each marks its own panes.
  const marker = mobile ? { 'data-mobile-pane': id } : { 'data-pane': id };
  return (
    <section
      {...marker}
      aria-label={t(label)}
      className={`min-w-0 space-y-3 ${className}`}
    >
      {children}
    </section>
  );
}

export function CalcSummaryBar({ ayanamsa, ayanamsaOffsetDegrees, nodeMode, ianaTimezone }: {
  ayanamsa: string;
  ayanamsaOffsetDegrees: number;
  nodeMode: string;
  ianaTimezone?: string;
}) {
  const t = useT();
  return (
    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
      <span>{ayanamsaLabel(ayanamsa, true)}{ayanamsa === 'custom-lahiri' ? ` (${ayanamsaOffsetDegrees >= 0 ? '+' : ''}${ayanamsaOffsetDegrees}°)` : ''} {t('ayanamsa')}</span>
      <span>{nodeMode === 'true' ? t('true node') : t('mean node')}</span>
      {ianaTimezone && <span>{ianaTimezone}</span>}
    </div>
  );
}
