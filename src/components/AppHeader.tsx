'use client';

import type { ComponentProps } from 'react';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import FileActions from './FileActions';
import ThemeToggle from './ThemeToggle';

type Props = {
  activeChartName: string | null;
  displayChartName: string;
  fileActions: Omit<ComponentProps<typeof FileActions>, 'compact'>;
};

/** The sticky top bar: a one-row desktop header and a two-row mobile one. */
export default function AppHeader({ activeChartName, displayChartName, fileActions }: Props) {
  return (
    <>
      {/* Desktop header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 hidden lg:flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-emerald-700 dark:text-green-400 tracking-tight">{APP_NAME}</span>
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{APP_VERSION}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
            <span className="text-zinc-300 dark:text-zinc-600">chart:</span>{' '}
            <span className={activeChartName ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-600 italic'}>
              {displayChartName}
            </span>
          </span>
          <FileActions {...fileActions} />
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 lg:hidden">
        {/* Row 1: app name + theme icon */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-emerald-700 dark:text-green-400 tracking-tight">{APP_NAME}</span>
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-600">{APP_VERSION}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle icon />
          </div>
        </div>
        {/* Row 2: chart title + actions */}
        <div className="pb-2.5 px-4">
          <div className="inline-flex max-w-full min-w-0 items-center gap-1 whitespace-nowrap">
            {displayChartName !== 'None' && (
              <span className="min-w-0 max-w-[calc(100vw-110px)] truncate text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mr-0.5">
                {displayChartName}
              </span>
            )}
            <FileActions {...fileActions} compact />
          </div>
        </div>
      </header>
    </>
  );
}
