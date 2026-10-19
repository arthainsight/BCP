import assert from 'node:assert/strict';
import { MAX_ROWS, MAX_RUNS, RUNS_STORAGE_KEY, addRun, compareRuns, readRuns, recordOf, removeRun, type RunSettings } from './researchRuns';

const memory = () => { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); }, data }; };
const settings: RunSettings = { charts: ['Alpha', 'Beta'], events: 'Home / move', window: 'auto', kinds: ['paraya|house'], bodies: ['Saturn'], dashaSystem: 'vimshottari', control: 'life' };
const result = (rows: { id: string; observed: number; expected: number; lift: number | null; p: number; q: number }[], events = 10) => ({ events, charts: 2, tested: rows.length, results: rows });
const row = (id: string, p: number, q: number, lift: number | null = 2) => ({ id, observed: 5, expected: 2, lift, p, q });

// --- A run is kept with its strongest rows, in order ------------------------------------------------------------------------------------------------------------
{
  const many = Array.from({ length: MAX_ROWS + 50 }, (_, i) => row(`f${i}`, (i + 1) / 1000, 1));
  const record = recordOf('  Moves  ', new Date('2026-10-19T12:00:00Z'), settings, result(many));
  assert.equal(record.name, 'Moves');
  assert.equal(record.rows.length, MAX_ROWS, 'only the most unusual are kept');
  assert.equal(record.rows[0].id, 'f0');
  assert.equal(record.tested, MAX_ROWS + 50, 'the number tested is of all');
  assert.equal(recordOf('', new Date('2026-10-19T12:34:00Z'), settings, result([])).name, '2026-10-19 12:34', 'no name, the time');
}

// --- Kept in the browser, the newest first, read back, and removed ----------------------------------------------------------------------------------------------
{
  const store = memory();
  assert.deepEqual(readRuns(store), []);
  const first = recordOf('first', new Date('2026-10-01T00:00:00Z'), settings, result([row('a', 0.01, 0.05)]));
  const second = recordOf('second', new Date('2026-10-02T00:00:00Z'), { ...settings, window: 90, control: 'others' }, result([row('a', 0.2, 0.9, null)]));
  addRun(first, store);
  const list = addRun(second, store);
  assert.deepEqual(list.map(run => run.name), ['second', 'first']);
  const read = readRuns(store);
  assert.deepEqual(read.map(run => run.name), ['second', 'first']);
  assert.deepEqual(read[1].settings, settings);
  assert.equal(read[0].settings.window, 90);
  assert.equal(read[0].settings.control, 'others');
  assert.equal(read[0].rows[0].lift, null);
  assert.deepEqual(removeRun(first.id, store).map(run => run.name), ['second']);
  assert.deepEqual(readRuns(store).map(run => run.name), ['second']);
  // The same run kept again is not doubled.
  assert.equal(addRun(second, store).length, 1);
  // Only the latest ones are kept.
  for (let i = 0; i < MAX_RUNS + 3; i++) addRun(recordOf(`r${i}`, new Date(2026, 0, 1 + i), settings, result([])), store);
  assert.equal(readRuns(store).length, MAX_RUNS);
  assert.equal(readRuns(store)[0].name, `r${MAX_RUNS + 2}`);
}

// --- What cannot be read is left out, not a reason to fail ------------------------------------------------------------------------------------------------------
{
  const store = memory();
  store.setItem(RUNS_STORAGE_KEY, 'not json');
  assert.deepEqual(readRuns(store), []);
  store.setItem(RUNS_STORAGE_KEY, JSON.stringify([{ id: 1 }, null, { id: 'x', name: 'x', savedAt: 'y', settings: {}, rows: [{ id: 'f', observed: 1, expected: 1, p: 0.5, q: 1 }, { id: 'g' }] }]));
  const [only] = readRuns(store);
  assert.equal(only.name, 'x');
  assert.equal(only.rows.length, 1, 'a row without numbers is dropped');
  assert.equal(only.settings.window, 0);
  assert.equal(only.settings.control, 'life');
  assert.deepEqual(readRuns(null), []);
}

// --- Two runs side by side: what held up in the first and holds up in the second --------------------------------------------------------------------------------
{
  const a = recordOf('A', new Date(), settings, result([row('stays', 0.001, 0.01), row('goes', 0.002, 0.02), row('turns', 0.003, 0.03), row('weak', 0.4, 0.9), row('only-a', 0.5, 0.95)]));
  const b = recordOf('B', new Date(), settings, result([row('stays', 0.0001, 0.005), row('goes', 0.3, 0.8, 1.1), row('turns', 0.6, 0.9, 0.5), row('weak', 0.01, 0.05), row('new', 0.02, 0.06)]));
  const comparison = compareRuns(a, b);
  assert.deepEqual([comparison.strongA, comparison.strongB], [3, 3]);
  assert.equal(comparison.kept, 1, 'only "stays" holds up in both');
  assert.equal(comparison.samePattern, 2, '"stays" and "goes" are more than chance in the second too, "turns" is not');
  assert.deepEqual(comparison.rows.slice(0, 5).map(item => item.id), ['stays', 'goes', 'turns', 'weak', 'new'], 'those that hold up in either come first, the most unusual first');
  assert.equal(comparison.rows.length, 6);
  const gone = comparison.rows.find(item => item.id === 'only-a')!;
  assert.equal(gone.b, null, 'a feature that the second run does not have');
  assert.equal(comparison.rows.find(item => item.id === 'new')!.a, null);
}

console.log('Research runs tests passed');
