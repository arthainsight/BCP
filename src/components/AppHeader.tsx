'use client';

import type { ComponentProps } from 'react';
import FileActions from './FileActions';
import ThemeToggle from './ThemeToggle';
import { RecordButton } from './ScreenRecorder';
import { useT } from '@/lib/i18n';

type Props = {
  activeChartName: string | null;
  displayChartName: string;
  fileActions: Omit<ComponentProps<typeof FileActions>, 'compact'>;
};

/** The sticky top bar: the chart's name, its file actions and the theme, in one row. */
export default function AppHeader({ activeChartName, displayChartName, fileActions }: Props) {
  const t = useT();
  return (
    <>
      {/* Desktop header: the chart's name on the left, the actions on the right. The app's name is in the footer. */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 hidden lg:flex items-center justify-between px-4 py-3">
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
          <span className="text-zinc-300 dark:text-zinc-600">{t('chart:')}</span>{' '}
          <span className={activeChartName ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-600 italic'}>
            {activeChartName ?? t(displayChartName)}
          </span>
        </span>
        <div className="flex items-center gap-3">
          <FileActions {...fileActions} />
          <RecordButton />
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile header: one row, the chart's name, the actions and the theme */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
        <div className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
          {displayChartName !== 'None' && (
            <span className="min-w-0 max-w-[calc(100vw-150px)] truncate text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mr-0.5">
              {activeChartName ?? t(displayChartName)}
            </span>
          )}
          <FileActions {...fileActions} compact />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RecordButton />
          <ThemeToggle icon />
        </div>
      </header>
    </>
  );
}
