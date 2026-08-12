import assert from 'node:assert/strict';
import { groupDailyMatches, snapshotMatches } from './dashaDateFinder';

const snapshot = { key: 'vimshottari' as const, label: 'Vimsottari', levels: [{ level: 'MD', value: 'Saturn' }, { level: 'AD', value: 'Mercury' }, { level: 'PD', value: 'Jupiter' }] };
assert.equal(snapshotMatches(snapshot, { md: 'sat', ad: 'Merc', pd: '' }), true);
assert.equal(snapshotMatches(snapshot, { md: 'Venus', ad: '', pd: '' }), false);
const groups = groupDailyMatches([
  { date: new Date(2026, 0, 1, 12), snapshots: [snapshot] },
  { date: new Date(2026, 0, 2, 12), snapshots: [snapshot] },
  { date: new Date(2026, 0, 4, 12), snapshots: [snapshot] },
]);
assert.equal(groups.length, 2);
assert.equal(groups[0].end.getDate(), 2);
console.log('Dasha Date Finder tests passed');
