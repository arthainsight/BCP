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
