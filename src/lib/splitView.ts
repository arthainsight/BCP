// Split view: on a wide screen several of the workspaces side by side instead of one
// at a time. These are the workspaces that can be shown together (Settings is always
// a screen of its own), which of them are on, and how the panes are laid out.

export const SPLIT_WORKSPACES = ['chart', 'timing', 'analysis', 'palm'] as const;
export type SplitWorkspace = (typeof SPLIT_WORKSPACES)[number];

/** How many rows the panes are laid out in: one row, two rows, or whatever fits the width of the screen. */
export type SplitRows = 'auto' | 1 | 2;
export const SPLIT_ROWS: readonly SplitRows[] = ['auto', 1, 2];

export interface SplitView {
  on: boolean;
  /** The workspaces shown, always at least one and always in the order of SPLIT_WORKSPACES. */
  panes: SplitWorkspace[];
  rows: SplitRows;
}

export const DEFAULT_SPLIT: SplitView = { on: false, panes: ['chart', 'analysis'], rows: 'auto' };

export const isSplitWorkspace = (value: unknown): value is SplitWorkspace =>
  (SPLIT_WORKSPACES as readonly unknown[]).includes(value);

/** The panes in their usual order, without repeats, and never none. */
export function normalizePanes(panes: readonly unknown[], fallback: SplitWorkspace[] = DEFAULT_SPLIT.panes): SplitWorkspace[] {
  const kept = SPLIT_WORKSPACES.filter(workspace => panes.includes(workspace));
  return kept.length > 0 ? kept : [...fallback];
}

export const isSplitRows = (value: unknown): value is SplitRows => (SPLIT_ROWS as readonly unknown[]).includes(value);

/** The stored split view; anything that is not a split view is the default. */
export function readSplit(stored: unknown): SplitView {
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_SPLIT, panes: [...DEFAULT_SPLIT.panes] };
  const { on, panes, rows } = stored as Record<string, unknown>;
  return {
    on: on === true,
    panes: Array.isArray(panes) ? normalizePanes(panes) : [...DEFAULT_SPLIT.panes],
    rows: isSplitRows(rows) ? rows : DEFAULT_SPLIT.rows,
  };
}

/** The panes with one switched on or off; the last pane cannot be switched off. */
export function togglePane(panes: readonly SplitWorkspace[], workspace: SplitWorkspace): SplitWorkspace[] {
  if (!panes.includes(workspace)) return normalizePanes([...panes, workspace]);
  if (panes.length <= 1) return [...panes];
  return panes.filter(pane => pane !== workspace);
}

const COLUMNS = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' } as const;
const FULL_HEIGHT = 'lg:max-h-[calc(100dvh-8rem)]';
const HALF_HEIGHT = 'lg:max-h-[calc((100dvh-10rem)/2)]';

/**
 * The columns of the pane grid. In one row there is a column for every pane; in two rows there are two
 * columns (one when there are only two panes, which then sit one above the other). Left to the width of
 * the screen, three panes are three columns and four panes four on a very wide screen, and on a narrower
 * one two columns and two rows.
 */
export function paneGridClass(count: number, rows: SplitRows = 'auto'): string {
  if (count <= 1) return COLUMNS[1];
  if (rows === 1) return COLUMNS[Math.min(count, 4) as 2 | 3 | 4];
  if (rows === 2) return count === 2 ? COLUMNS[1] : COLUMNS[2];
  if (count === 3) return 'lg:grid-cols-2 2xl:grid-cols-3';
  if (count >= 4) return 'lg:grid-cols-2 2xl:grid-cols-4';
  return COLUMNS[2];
}

/** With three panes in two columns, the last one takes the whole second row. */
export function paneSpanClass(index: number, count: number, rows: SplitRows = 'auto'): string {
  if (count !== 3 || index !== 2 || rows === 1) return '';
  return rows === 2 ? 'lg:col-span-2' : 'lg:col-span-2 2xl:col-span-1';
}

/**
 * How tall a pane may be before it scrolls by itself: the height of the screen, or half of it
 * where there are two rows, so that every pane is on the screen at once.
 */
export function paneHeightClass(count: number, rows: SplitRows = 'auto'): string {
  if (count <= 1 || rows === 1) return FULL_HEIGHT;
  if (rows === 2) return HALF_HEIGHT;
  return count >= 3 ? `${HALF_HEIGHT} 2xl:max-h-[calc(100dvh-8rem)]` : FULL_HEIGHT;
}
