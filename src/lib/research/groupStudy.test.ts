import assert from 'node:assert/strict';
import type { EventFeatures } from './eventStudy';
import { compareGroups } from './groupStudy';

const item = (chartId: string, id: string, features: string[]): EventFeatures => ({
  chartId, chartName: chartId, event: { id, name: id, time: 0, category: 'home', tags: [] }, features,
});

// --- Two sets that differ in one feature: ten moves with Saturn in the 4th house, ten weddings with Venus in the 7th, and some in common -------------------
{
  const moves = Array.from({ length: 10 }, (_, i) => item('c1', `m${i}`, ['paraya|house|Saturn|4', 'paraya|house|Jupiter|1', ...(i < 5 ? ['paraya|house|Rahu|2'] : [])]));
  const weddings = Array.from({ length: 10 }, (_, i) => item('c2', `w${i}`, ['paraya|house|Venus|7', 'paraya|house|Jupiter|1', ...(i < 5 ? ['paraya|house|Rahu|2'] : [])]));
  const comparison = compareGroups(moves, weddings);
  assert.deepEqual([comparison.totalA, comparison.totalB, comparison.tested], [10, 10, 4]);
  const byId = new Map(comparison.rows.map(row => [row.id, row]));
  // Saturn only in the moves, Venus only in the weddings: 10 of 10 against 0 of 10, p = 2 / C(20, 10) = 1.08e-5.
  const saturn = byId.get('paraya|house|Saturn|4')!;
  assert.deepEqual([saturn.a, saturn.b, saturn.difference], [10, 0, 1]);
  assert.ok(Math.abs(saturn.p - 2 / 184756) < 1e-12);
  assert.equal(byId.get('paraya|house|Venus|7')!.difference, -1, 'more in the second group is a negative difference');
  assert.ok(byId.get('paraya|house|Jupiter|1')!.p > 0.999, 'in all of both');
  assert.ok(byId.get('paraya|house|Rahu|2')!.p > 0.999, 'in half of each');
  // The two that differ come first, and survive the correction; the others do not.
  assert.deepEqual(comparison.rows.slice(0, 2).map(row => row.id).sort(), ['paraya|house|Saturn|4', 'paraya|house|Venus|7']);
  assert.ok(comparison.rows.slice(0, 2).every(row => row.q < 0.001));
  assert.ok(comparison.rows.slice(2).every(row => row.q > 0.999));
  assert.equal(saturn.eventsA.length, 10);
  assert.equal(saturn.eventsB.length, 0);
  assert.deepEqual(saturn.eventsA[0], { chartId: 'c1', eventId: 'm0' });
}

// --- Alike groups find nothing --------------------------------------------------------------------------------------------------------------------
{
  const make = (prefix: string) => Array.from({ length: 12 }, (_, i) => item(prefix, `${prefix}${i}`, [`paraya|house|Saturn|${(i % 4) + 1}`, i % 2 ? 'paraya|house|Jupiter|1' : 'paraya|house|Jupiter|2']));
  const comparison = compareGroups(make('a'), make('b'));
  assert.ok(comparison.rows.every(row => row.p > 0.999 && row.q > 0.999 && row.difference === 0));
}

// --- Empty groups ----------------------------------------------------------------------------------------------------------------------------------
{
  const only = compareGroups([item('c', 'e', ['paraya|house|Saturn|4'])], []);
  assert.deepEqual([only.totalA, only.totalB, only.tested], [1, 0, 1]);
  assert.ok(only.rows[0].p > 0.999, 'nothing to compare with');
  const none = compareGroups([], []);
  assert.deepEqual([none.tested, none.rows], [0, []]);
}

console.log('Group comparison tests passed');
