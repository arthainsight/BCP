'use client';

import { useState } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function CollapsibleCard({ title, subtitle, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors"
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs font-mono text-zinc-700 dark:text-zinc-200 truncate">{title}</span>
          {subtitle && (
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{subtitle}</span>
          )}
        </div>
        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 shrink-0">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}
