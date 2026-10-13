import assert from 'node:assert/strict';
import { readSavedChartsExport } from './savedCharts';

const chart = (extra: Record<string, unknown> = {}) => ({
  id: 'a', name: 'Test', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z',
  chartData: { birthDatetime: '15.08.1947 09.15.00', city: 'New Delhi', manualLat: '28.6', manualLng: '77.2', ianaTimezone: 'Asia/Kolkata', tzOverride: '', targetDate: '2026-10-13', showCoords: true },
  ...extra,
});
const file = (charts: unknown[]) => JSON.stringify({ exportedAt: 'now', charts });

// A good export is read as it is.
const [first] = readSavedChartsExport(file([chart()]));
assert.equal(first.id, 'a'); assert.equal(first.name, 'Test'); assert.equal(first.chartData.city, 'New Delhi'); assert.equal(first.chartData.showCoords, true);

// An id that is taken gets a new one, also twice in the same file.
const taken = readSavedChartsExport(file([chart(), chart(), chart({ id: 'b' })]), new Set(['a']));
assert.equal(taken.length, 3);
assert.notEqual(taken[0].id, 'a'); assert.notEqual(taken[1].id, 'a'); assert.notEqual(taken[0].id, taken[1].id); assert.equal(taken[2].id, 'b');

// What is not a chart is left out, and what a chart lacks is made empty instead of undefined.
const odd = readSavedChartsExport(file([null, 'x', 5, [], { id: 'c' }, { id: 'd', chartData: {} }, { id: 'e', chartData: { birthDatetime: '01.01.2000 12.00.00' } }]));
assert.equal(odd.length, 1);
assert.equal(odd[0].id, 'e'); assert.equal(odd[0].name, ''); assert.equal(odd[0].chartData.city, ''); assert.equal(odd[0].chartData.manualLat, ''); assert.equal(odd[0].chartData.showCoords, false);
assert.ok(odd[0].createdAt.length > 0 && odd[0].updatedAt.length > 0);

// A file that is not an export is refused.
assert.throws(() => readSavedChartsExport('{'));
assert.throws(() => readSavedChartsExport('{"charts": 3}'));
assert.throws(() => readSavedChartsExport('[]'));
console.log('Saved chart export tests passed');
