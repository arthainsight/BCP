'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_SPLIT, normalizePanes, readSplit, type SplitRows, type SplitView, type SplitWorkspace } from '@/lib/splitView';

// The split view is one for the whole page and is remembered in the browser.

const KEY = 'splitView';
let current: SplitView = DEFAULT_SPLIT;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    current = readSplit(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function getSnapshot() {
  load();
  return current;
}

/** Changes the split view; `panes` are put in their usual order and cannot be none. */
export function setSplitView(next: { on?: boolean; panes?: readonly SplitWorkspace[]; rows?: SplitRows }) {
  load();
  current = {
    on: next.on ?? current.on,
    panes: next.panes ? normalizePanes(next.panes, current.panes) : current.panes,
    rows: next.rows ?? current.rows,
  };
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch {}
  listeners.forEach(listener => listener());
}

/** Whether the workspaces are shown side by side, and which of them. */
export function useSplitView(): SplitView {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_SPLIT);
}
