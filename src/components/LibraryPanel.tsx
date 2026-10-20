'use client';

import type { CalculationSettings } from '@/types';
import { useT } from '@/lib/i18n';
import ResearchPanel from './ResearchPanel';

interface Props {
  calculationSettings?: CalculationSettings;
}

/** The Library workspace provides a dedicated home for cross-chart research. */
export default function LibraryPanel({ calculationSettings }: Props) {
  const t = useT();

  return (
    <section className="min-w-0 space-y-4" aria-label={t('LIBRARY')} data-library-workspace>
      <header className="space-y-1 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
          {t('LIBRARY')}
        </p>
        <h1 className="text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
          {t('Research')}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
          {t('Study recurring patterns across saved charts and life events.')}
        </p>
      </header>
      <ResearchPanel calculationSettings={calculationSettings} />
    </section>
  );
}
