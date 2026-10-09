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
 * One workspace of the split view. It scrolls by itself, so a long list in one pane
 * does not carry the others away.
 */
export function SplitPane({ id, label, className = '', children }: { id: string; label: string; className?: string; children: ReactNode }) {
  const t = useT();
  return (
    <section
      data-pane={id}
      aria-label={t(label)}
      className={`min-w-0 space-y-3 lg:overflow-y-auto ${className}`}
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
