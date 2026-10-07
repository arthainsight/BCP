'use client';

import { useT } from '@/lib/i18n';

// The three primary workspaces plus the global Settings gear. This is the
// single top-level navigation: CHART / TIMING / ANALYSIS, with Settings kept
// apart as a separate global control (not a fourth workspace).
export type Workspace = 'chart' | 'timing' | 'analysis' | 'settings';

type Item = { id: Workspace; label: string; gear?: boolean };

const ITEMS: Item[] = [
  { id: 'chart', label: 'CHART' },
  { id: 'timing', label: 'TIMING' },
  { id: 'analysis', label: 'ANALYSIS' },
  { id: 'settings', label: '⚙', gear: true },
];

interface Props {
  active: Workspace;
  onChange: (workspace: Workspace) => void;
  /** Bottom-nav mode (fixed to the bottom on small screens). */
  variant?: 'top' | 'bottom';
}

export default function PrimaryNav({ active, onChange, variant = 'top' }: Props) {
  const t = useT();

  return (
    <nav
      aria-label="Primary"
      className={
        variant === 'bottom'
          ? 'fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 safe-bottom'
          : 'sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800'
      }
    >
      <div className={variant === 'bottom' ? 'flex' : 'flex items-center gap-1 px-4 py-2'}>
        {ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            className={
              item.gear
                ? `${variant === 'bottom' ? 'flex-1' : 'ml-auto'} min-w-[44px] py-1.5 px-2 text-sm font-mono transition-colors ${
                    active === item.id
                      ? 'text-emerald-700 dark:text-green-400 font-semibold'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`
                : `flex-1 min-w-[44px] py-1.5 text-xs font-mono tracking-wider transition-colors ${
                    active === item.id
                      ? 'text-emerald-700 dark:text-green-400 font-semibold'
                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`
            }
          >
            {item.gear ? item.label : t(item.label)}
          </button>
        ))}
      </div>
    </nav>
  );
}
