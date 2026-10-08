'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * One daśā system in the Systems tab. Closed to start with; the system is only
 * drawn once opened. A link to its anchor (#dasha-<key>) opens it.
 */
export default function DashaSystemCard({ id, title, summary, children }: { id: string; title: string; summary?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openIfLinked = () => { if (window.location.hash === `#${id}`) setOpen(true); };
    openIfLinked();
    window.addEventListener('hashchange', openIfLinked);
    return () => window.removeEventListener('hashchange', openIfLinked);
  }, [id]);

  return (
    <div id={id} className="min-w-0 scroll-mt-4 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg bg-zinc-50 px-4 py-2 text-left hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800"
      >
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-200">{title}</span>
          {summary && <span className="break-words text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{summary}</span>}
        </span>
        <span className="shrink-0 text-[9px] text-zinc-400 dark:text-zinc-500">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="min-w-0 border-t border-zinc-200 p-3 dark:border-zinc-700">{children}</div>}
    </div>
  );
}
