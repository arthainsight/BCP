'use client';

import { Fragment } from 'react';
import { useT } from '@/lib/i18n';
import { SPLIT_ROWS, SPLIT_WORKSPACES, type SplitRows } from '@/lib/splitView';

// The primary workspaces plus the global Settings gear. Research lives in LIBRARY,
// while LIFE keeps the existing palm workspace under a broader workspace label.
export type Workspace = 'chart' | 'timing' | 'analysis' | 'palm' | 'library' | 'settings';

type Item = { id: Workspace; label: string; gear?: boolean };

const ITEMS: Item[] = [
  { id: 'chart', label: 'CHART' },
  { id: 'palm', label: 'LIFE' },
  { id: 'analysis', label: 'ANALYSIS' },
  { id: 'timing', label: 'TIMING' },
  { id: 'library', label: 'LIBRARY' },
  { id: 'settings', label: '⚙', gear: true },
];

interface Props {
  active: Workspace;
  onChange: (workspace: Workspace) => void;
  /**
   * Which screens the navigation is drawn for. The phone and the wide layout keep their own current
   * workspace (a calculation lands on CHART on a phone and on ANALYSIS beside the chart), so each has its own.
   */
  show?: 'mobile' | 'desktop';
  /**
   * Split view, on a wide screen: when it is on the workspaces are switches, and every one that
   * is on is shown side by side. Settings stays a screen of its own.
   */
  split?: {
    on: boolean;
    panes: readonly Workspace[];
    onToggle: () => void;
    /** How many rows the panes are laid out in; left to the screen when `auto`. */
    rows: SplitRows;
    onRowsChange: (rows: SplitRows) => void;
  };
}

export default function PrimaryNav({ active, onChange, show, split }: Props) {
  const t = useT();

  return (
    <nav
      aria-label={t('Primary')}
      className={`sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800${show === 'mobile' ? ' lg:hidden' : show === 'desktop' ? ' hidden lg:block' : ''}`}
    >
      <div data-primary-nav-items className="flex min-w-0 items-center gap-1 overflow-x-auto px-2 py-2 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((item) => {
          // In the split view the workspaces are on or off together; Settings is one screen, so it is "current".
          const asSwitch = split?.on === true && !item.gear && SPLIT_WORKSPACES.includes(item.id as (typeof SPLIT_WORKSPACES)[number]);
          const selected = asSwitch ? active !== 'settings' && split.panes.includes(item.id) : active === item.id;
          const toggle = split && item.gear ? (
            <button
              key="split"
              type="button"
              onClick={split.onToggle}
              aria-pressed={split.on}
              aria-label={t('⊞ split')}
              title={t('Show several workspaces side by side')}
              className={`ml-auto inline-flex shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-mono transition-colors ${
                split.on
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-green-600 dark:bg-green-950/30 dark:text-green-400'
                  : 'border-zinc-200 text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              <span className="lg:hidden" aria-hidden="true">⊞</span>
              <span className="hidden lg:inline" aria-hidden="true">{t('⊞ split')}</span>
            </button>
          ) : null;
          // Rows only make a difference when there is more than one pane.
          const rowsControl = split && item.gear && split.on && split.panes.length > 1 ? (
            <div
              key="rows"
              role="group"
              aria-label={t('rows of panes')}
              title={t('rows of panes')}
              className="ml-1 hidden shrink-0 items-center gap-px rounded-md border border-zinc-200 p-px text-[10px] font-mono dark:border-zinc-700 lg:inline-flex"
            >
              {SPLIT_ROWS.map(rows => (
                <button
                  key={rows}
                  type="button"
                  data-split-rows={rows}
                  aria-pressed={split.rows === rows}
                  onClick={() => split.onRowsChange(rows)}
                  className={`rounded-sm px-2 py-0.5 transition-colors ${
                    split.rows === rows
                      ? 'bg-emerald-500 text-white dark:bg-green-600'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {rows === 'auto' ? t('auto') : rows}
                </button>
              ))}
            </div>
          ) : null;
          return (
            <Fragment key={item.id}>
              {toggle}
              {rowsControl}
              <button
                onClick={() => onChange(item.id)}
                aria-current={!asSwitch && selected ? 'page' : undefined}
                aria-pressed={asSwitch ? selected : undefined}
                data-split-item={asSwitch ? item.id : undefined}
                className={
                  item.gear
                    ? `${split ? 'ml-1' : 'ml-2'} min-w-[44px] shrink-0 py-1.5 px-2 text-sm font-mono transition-colors ${
                        selected
                          ? 'text-emerald-700 dark:text-green-400 font-semibold'
                          : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`
                    : `flex-none whitespace-nowrap px-2 py-1.5 text-xs font-mono tracking-wider transition-colors lg:flex-1 lg:min-w-[44px] lg:px-0 ${asSwitch && selected ? 'rounded-md bg-emerald-50 dark:bg-green-950/30 ' : ''}${
                        selected
                          ? 'text-emerald-700 dark:text-green-400 font-semibold'
                          : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`
                }
              >
                {item.gear ? item.label : t(item.label)}
              </button>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
