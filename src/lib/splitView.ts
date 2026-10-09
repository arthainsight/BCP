// Split view: on a wide screen several of the workspaces side by side instead of one
// at a time. These are the workspaces that can be shown together (Settings is always
// a screen of its own), which of them are on, and how the panes are laid out.

export const SPLIT_WORKSPACES = ['chart', 'timing', 'analysis', 'palm'] as const;
export type SplitWorkspace = (typeof SPLIT_WORKSPACES)[number];

export interface SplitView {
  on: boolean;
  /** The workspaces shown, always at least one and always in the order of SPLIT_WORKSPACES. */
  panes: SplitWorkspace[];
}

export const DEFAULT_SPLIT: SplitView = { on: false, panes: ['chart', 'analysis'] };

export const isSplitWorkspace = (value: unknown): value is SplitWorkspace =>
  (SPLIT_WORKSPACES as readonly unknown[]).includes(value);

/** The panes in their usual order, without repeats, and never none. */
export function normalizePanes(panes: readonly unknown[], fallback: SplitWorkspace[] = DEFAULT_SPLIT.panes): SplitWorkspace[] {
  const kept = SPLIT_WORKSPACES.filter(workspace => panes.includes(workspace));
  return kept.length > 0 ? kept : [...fallback];
}

/** The stored split view; anything that is not a split view is the default. */
export function readSplit(stored: unknown): SplitView {
  if (!stored || typeof stored !== 'object') return { ...DEFAULT_SPLIT, panes: [...DEFAULT_SPLIT.panes] };
  const { on, panes } = stored as Record<string, unknown>;
  return {
    on: on === true,
    panes: Array.isArray(panes) ? normalizePanes(panes) : [...DEFAULT_SPLIT.panes],
  };
}

/** The panes with one switched on or off; the last pane cannot be switched off. */
export function togglePane(panes: readonly SplitWorkspace[], workspace: SplitWorkspace): SplitWorkspace[] {
  if (!panes.includes(workspace)) return normalizePanes([...panes, workspace]);
  if (panes.length <= 1) return [...panes];
  return panes.filter(pane => pane !== workspace);
}

/**
 * The columns of the pane grid: one, or two side by side. Three panes are three columns and four panes
 * four on a very wide screen; on a narrower one the third takes the whole second row, and four are two
 * rows of two.
 */
export function paneGridClass(count: number): string {
  if (count <= 1) return 'lg:grid-cols-1';
  if (count === 3) return 'lg:grid-cols-2 2xl:grid-cols-3';
  if (count >= 4) return 'lg:grid-cols-2 2xl:grid-cols-4';
  return 'lg:grid-cols-2';
}

/** With three panes on a screen that has room for two columns only, the last one takes the whole second row. */
export function paneSpanClass(index: number, count: number): string {
  return count === 3 && index === 2 ? 'lg:col-span-2 2xl:col-span-1' : '';
}

/**
 * How tall a pane may be before it scrolls by itself: the height of the screen, or half of it
 * where there are two rows, so that every pane is on the screen at once.
 */
export function paneHeightClass(count: number): string {
  return count >= 3
    ? 'lg:max-h-[calc((100dvh-10rem)/2)] 2xl:max-h-[calc(100dvh-8rem)]'
    : 'lg:max-h-[calc(100dvh-8rem)]';
}
