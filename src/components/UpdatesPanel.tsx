'use client';

import { useState, useEffect } from 'react';
import { APP_VERSION } from '@/lib/config';
import { CHANGELOG } from '@/lib/changelog';

const STORAGE_KEY = 'lastSeenVersion';

export default function UpdatesPanel() {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    setHasNew(localStorage.getItem(STORAGE_KEY) !== APP_VERSION);
  }, []);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && hasNew) {
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
      setHasNew(false);
    }
  }

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-2">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 w-full text-left"
      >
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex-1">
          &gt; updates
        </span>
        {hasNew && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-green-900/60 text-emerald-700 dark:text-green-400 border border-emerald-400 dark:border-green-700">
            NEW
          </span>
        )}
        <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div className="space-y-3 pt-1">
          {CHANGELOG.map((entry) => (
            <div key={entry.version}>
              <div className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-300 mb-1">
                {entry.version}
              </div>
              <ul className="space-y-0.5">
                {entry.changes.map((change) => (
                  <li key={change} className="flex gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    <span className="text-zinc-300 dark:text-zinc-600 select-none">—</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
