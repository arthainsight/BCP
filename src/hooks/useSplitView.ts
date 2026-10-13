'use client';

import { DEFAULT_SPLIT, normalizePanes, readSplit, type SplitRows, type SplitView, type SplitWorkspace } from '@/lib/splitView';
import { createStoredStore } from './createStoredStore';

// The split view is one for the whole page and is remembered in the browser.

const store = createStoredStore<SplitView>({ key: 'splitView', initial: DEFAULT_SPLIT, read: readSplit });

/** Changes the split view; `panes` are put in their usual order and cannot be none. */
export function setSplitView(next: { on?: boolean; panes?: readonly SplitWorkspace[]; rows?: SplitRows }) {
  const current = store.get();
  store.set({
    on: next.on ?? current.on,
    panes: next.panes ? normalizePanes(next.panes, current.panes) : current.panes,
    rows: next.rows ?? current.rows,
  });
}

/** Whether the workspaces are shown side by side, and which of them. */
export const useSplitView = (): SplitView => store.useValue();
