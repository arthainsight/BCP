import assert from 'node:assert/strict';
import {
  DEFAULT_VARGA_GRID,
  VARGA_GRID_PRESETS,
  readVargaGridSelection,
  toggleCustomDivision,
  vargaGridDivisions,
} from './vargaGrid';

// The classical groups (BPHS 6): six and seven charts.
assert.deepEqual(VARGA_GRID_PRESETS.shadvarga.divisions, [1, 2, 3, 9, 12, 30]);
assert.deepEqual(VARGA_GRID_PRESETS.saptavarga.divisions, [1, 2, 3, 7, 9, 12, 30]);

// Ṣaḍvarga is the default.
assert.equal(DEFAULT_VARGA_GRID.preset, 'shadvarga');
assert.deepEqual(vargaGridDivisions(DEFAULT_VARGA_GRID), [1, 2, 3, 9, 12, 30]);
assert.deepEqual(vargaGridDivisions({ preset: 'custom', custom: [1, 9, 10, 60] }), [1, 9, 10, 60]);

// Custom selections stay between four and eight, in order.
assert.deepEqual(toggleCustomDivision([1, 9, 12, 30], 10), [1, 9, 10, 12, 30]);
assert.deepEqual(toggleCustomDivision([1, 9, 10, 12, 30], 10), [1, 9, 12, 30]);
assert.deepEqual(toggleCustomDivision([1, 9, 12, 30], 9), [1, 9, 12, 30], 'no fewer than four');
const eight = [1, 2, 3, 7, 9, 10, 12, 30];
assert.deepEqual(toggleCustomDivision(eight, 60), eight, 'no more than eight');

// Stored selections.
assert.deepEqual(readVargaGridSelection(null), DEFAULT_VARGA_GRID);
assert.deepEqual(readVargaGridSelection({ preset: 'saptavarga', custom: [1, 9, 10, 60] }), { preset: 'saptavarga', custom: [1, 9, 10, 60] });
assert.deepEqual(readVargaGridSelection({ preset: 'custom', custom: [60, 9, 1, 10, 9] }), { preset: 'custom', custom: [1, 9, 10, 60] }, 'sorted, duplicates removed');
assert.deepEqual(readVargaGridSelection({ preset: 'custom', custom: [1, 9, 11] }), DEFAULT_VARGA_GRID, 'an invalid custom set falls back');
assert.deepEqual(readVargaGridSelection({ preset: 'dashavarga', custom: [1, 2, 3, 9] }), { preset: 'shadvarga', custom: [1, 2, 3, 9] });
