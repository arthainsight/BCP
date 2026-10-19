import type { WindowChoice } from './eventStudy';

// A run of the comparison with chance, kept by name: what it was run on (the charts, the events, the window, the kinds of feature) and the strongest of what it found.
// Two runs side by side show whether a finding stays when charts or events are added, or when the window or the settings change.

export const RUNS_STORAGE_KEY = 'bhrigu:research-runs';
/** How many runs are kept, and how many features of each: the most unusual ones. */
export const MAX_RUNS = 30;
export const MAX_ROWS = 300;
/** A feature at or under this q-value (false discovery rate) is one that holds up after the correction. */
export const STRONG_Q = 0.1;

export interface RunSettings {
  /** The names of the charts, and the events as the choice of them is put in words. */
  charts: string[];
  events: string;
  window: WindowChoice;
  /** The kinds of feature (`source|family`), the grahas, the daśā system and where the chance level came from. */
  kinds: string[];
  bodies: string[];
  dashaSystem: string;
  control: 'life' | 'others';
}

export interface RunRow {
  id: string;
  observed: number;
  expected: number;
  lift: number | null;
  p: number;
  q: number;
}

export interface RunRecord {
  id: string;
  name: string;
  /** When it was kept (ISO). */
  savedAt: string;
  settings: RunSettings;
  events: number;
  charts: number;
  tested: number;
  rows: RunRow[];
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** A run as it is kept: the strongest `MAX_ROWS` features of the result. */
export function recordOf(
  name: string,
  savedAt: Date,
  settings: RunSettings,
  result: { events: number; charts: number; tested: number; results: readonly { id: string; observed: number; expected: number; lift: number | null; p: number; q: number }[] },
): RunRecord {
  const rows = [...result.results].sort((a, b) => a.p - b.p || b.observed - a.observed || a.id.localeCompare(b.id)).slice(0, MAX_ROWS).map(row => ({ id: row.id, observed: row.observed, expected: row.expected, lift: row.lift, p: row.p, q: row.q }));
  return { id: `${savedAt.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: name.trim() || savedAt.toISOString().slice(0, 16).replace('T', ' '), savedAt: savedAt.toISOString(), settings, events: result.events, charts: result.charts, tested: result.tested, rows };
}

function readRecord(value: unknown): RunRecord | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const settings = item.settings as Record<string, unknown> | undefined;
  if (typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.savedAt !== 'string' || !settings || !Array.isArray(item.rows)) return null;
  const strings = (list: unknown) => (Array.isArray(list) ? list.map(String) : []);
  const rows = item.rows.flatMap((row): RunRow[] => {
    const r = row as Record<string, unknown>;
    return typeof r?.id === 'string' && finite(r.observed) && finite(r.expected) && finite(r.p) && finite(r.q) ? [{ id: r.id, observed: r.observed, expected: r.expected, lift: finite(r.lift) ? r.lift : null, p: r.p, q: r.q }] : [];
  });
  return {
    id: item.id, name: item.name, savedAt: item.savedAt,
    settings: {
      charts: strings(settings.charts), events: String(settings.events ?? ''), window: settings.window === 'auto' ? 'auto' : finite(settings.window) ? settings.window : 0,
      kinds: strings(settings.kinds), bodies: strings(settings.bodies), dashaSystem: String(settings.dashaSystem ?? ''), control: settings.control === 'others' ? 'others' : 'life',
    },
    events: finite(item.events) ? item.events : 0, charts: finite(item.charts) ? item.charts : 0, tested: finite(item.tested) ? item.tested : 0, rows,
  };
}

/** The runs kept in this browser, the newest first; anything unreadable is left out. */
export function readRuns(store: Store | null = typeof localStorage === 'undefined' ? null : localStorage): RunRecord[] {
  try {
    const parsed: unknown = JSON.parse(store?.getItem(RUNS_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.flatMap(item => { const run = readRecord(item); return run ? [run] : []; }) : [];
  } catch { return []; }
}

function writeRuns(runs: readonly RunRecord[], store: Store | null) {
  try { store?.setItem(RUNS_STORAGE_KEY, JSON.stringify(runs)); } catch { /* storage full or not allowed: the run is not kept */ }
}

/** Keeps a run (the newest first, at most `MAX_RUNS`), and gives the list. */
export function addRun(run: RunRecord, store: Store | null = typeof localStorage === 'undefined' ? null : localStorage): RunRecord[] {
  const runs = [run, ...readRuns(store).filter(item => item.id !== run.id)].slice(0, MAX_RUNS);
  writeRuns(runs, store);
  return runs;
}

export function removeRun(id: string, store: Store | null = typeof localStorage === 'undefined' ? null : localStorage): RunRecord[] {
  const runs = readRuns(store).filter(item => item.id !== id);
  writeRuns(runs, store);
  return runs;
}

export interface RunDifference {
  id: string;
  a: RunRow | null;
  b: RunRow | null;
}

export interface RunComparison {
  /** The features that either run has among its kept rows, those that hold up in either first and then the most unusual. */
  rows: RunDifference[];
  /** How many hold up (q at most 0.1) in each run, how many of the first run's do in the second too, and how many of them are at least more than chance there. */
  strongA: number;
  strongB: number;
  kept: number;
  samePattern: number;
}

/** Two runs side by side: whether what held up in the first holds up in the second. */
export function compareRuns(a: RunRecord, b: RunRecord): RunComparison {
  const inA = new Map(a.rows.map(row => [row.id, row]));
  const inB = new Map(b.rows.map(row => [row.id, row]));
  const ids = [...new Set([...inA.keys(), ...inB.keys()])];
  const smallest = (id: string) => Math.min(inA.get(id)?.p ?? 1, inB.get(id)?.p ?? 1);
  const strong = (row: RunRow | undefined) => row !== undefined && row.q <= STRONG_Q;
  const rows = ids.map((id): RunDifference => ({ id, a: inA.get(id) ?? null, b: inB.get(id) ?? null }))
    .sort((x, y) => Number(strong(inA.get(y.id)) || strong(inB.get(y.id))) - Number(strong(inA.get(x.id)) || strong(inB.get(x.id))) || smallest(x.id) - smallest(y.id) || x.id.localeCompare(y.id));
  const strongIds = a.rows.filter(strong);
  return {
    rows,
    strongA: strongIds.length,
    strongB: b.rows.filter(strong).length,
    kept: strongIds.filter(row => strong(inB.get(row.id))).length,
    samePattern: strongIds.filter(row => (inB.get(row.id)?.lift ?? 0) > 1).length,
  };
}
