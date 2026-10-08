import assert from 'node:assert/strict';
import type { DashaEventSnapshot } from './dashaEvents';
import { DAY_MS, enabledSnapshots, levelValue, mdChangeFlag, periodChanges } from './dashaView';

const snap = (key: string, md: string, ad: string, end?: Date): DashaEventSnapshot => ({
  key, label: key, levels: [{ level: 'MD', value: md }, { level: 'AD', value: ad }],
  mdRange: end ? { startDate: new Date(2000, 0, 1), endDate: end } : undefined,
} as DashaEventSnapshot);

// --- Level values ------------------------------------------------------------------------------
assert.equal(levelValue(snap('a', 'Ve', 'Su'), 'MD'), 'Ve');
assert.equal(levelValue(snap('a', 'Ve', 'Su'), 'AD'), 'Su');
assert.equal(levelValue(snap('a', 'Ve', 'Su'), 'PD'), '', 'a missing level is empty');
assert.equal(levelValue(undefined, 'MD'), '');

// --- A column of snapshots: where the MD and the AD change ------------------------------------------
const column = [snap('a', 'Ve', 'Su'), snap('a', 'Ve', 'Mo'), snap('a', 'Ve', 'Mo'), snap('a', 'Su', 'Su')];
assert.deepEqual(periodChanges(column), [
  { md: false, ad: false },
  { md: false, ad: true },
  { md: false, ad: false },
  { md: true, ad: true },
]);

// --- Only the systems that are switched on ------------------------------------------------------------
const enabled = { vimshottari: true, chara: false } as never;
assert.deepEqual(enabledSnapshots([snap('vimshottari', 'Ve', 'Su'), snap('chara', 'Ar', 'Ta')], enabled).map(s => s.key), ['vimshottari']);

// --- The MD change flag: within a year of the date, not before it and not later -------------------------
const from = new Date(2026, 9, 8, 12);
const inDays = (days: number) => new Date(from.getTime() + days * DAY_MS);
assert.equal(mdChangeFlag(snap('a', 'Ve', 'Su', inDays(200)), from, 'MD changes'), `MD changes ${String(inDays(200).getMonth() + 1).padStart(2, '0')}.${inDays(200).getFullYear()}`);
assert.equal(mdChangeFlag(snap('a', 'Ve', 'Su', inDays(400)), from, 'MD changes'), undefined, 'more than a year away');
assert.equal(mdChangeFlag(snap('a', 'Ve', 'Su', inDays(-5)), from, 'MD changes'), undefined, 'already past');
assert.equal(mdChangeFlag(snap('a', 'Ve', 'Su'), from, 'MD changes'), undefined, 'no range, no flag');
assert.equal(mdChangeFlag(undefined, from, 'MD changes'), undefined);

console.log('Dasha view tests passed');
