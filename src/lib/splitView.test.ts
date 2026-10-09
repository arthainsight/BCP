import assert from 'node:assert/strict';
import { DEFAULT_SPLIT, normalizePanes, paneGridClass, paneSpanClass, readSplit, togglePane } from './splitView';

// --- Reading what is stored -------------------------------------------------------
assert.deepEqual(readSplit(null), DEFAULT_SPLIT, 'nothing stored is the default');
assert.deepEqual(readSplit('split'), DEFAULT_SPLIT, 'a value of the wrong type is the default');
assert.deepEqual(readSplit({ on: true, panes: ['palm', 'chart'] }), { on: true, panes: ['chart', 'palm'], rows: 'auto' }, 'in the usual order');
assert.deepEqual(readSplit({ on: 'yes', panes: ['timing'] }), { on: false, panes: ['timing'], rows: 'auto' }, 'only true is on');
assert.deepEqual(readSplit({ on: true, panes: ['settings', 'chart', 'chart', 7] }).panes, ['chart'], 'only the workspaces that can be shown together, once each');
assert.deepEqual(readSplit({ on: true, panes: [] }).panes, DEFAULT_SPLIT.panes, 'never none');
assert.deepEqual(readSplit({ on: true, panes: 'chart' }).panes, DEFAULT_SPLIT.panes, 'panes of the wrong type are the default');
assert.notEqual(readSplit(null).panes, DEFAULT_SPLIT.panes, 'the default is not shared');
assert.equal(readSplit({ on: true, panes: ['chart'], rows: 2 }).rows, 2, 'two rows');
assert.equal(readSplit({ on: true, panes: ['chart'], rows: 1 }).rows, 1, 'one row');
assert.equal(readSplit({ on: true, panes: ['chart'], rows: 'auto' }).rows, 'auto');
assert.equal(readSplit({ on: true, panes: ['chart'], rows: 3 }).rows, 'auto', 'an unknown number of rows is left to the screen');
assert.equal(readSplit({ on: true, panes: ['chart'], rows: '2' }).rows, 'auto', 'a value of the wrong type is left to the screen');
assert.equal(readSplit({ on: true, panes: ['chart'] }).rows, 'auto', 'a split view from before the rows is left to the screen');

// --- Switching a pane on and off ---------------------------------------------------
assert.deepEqual(togglePane(['chart'], 'palm'), ['chart', 'palm']);
assert.deepEqual(togglePane(['chart', 'analysis'], 'timing'), ['chart', 'timing', 'analysis'], 'a pane goes in its usual place');
assert.deepEqual(togglePane(['chart', 'timing', 'analysis', 'palm'], 'timing'), ['chart', 'analysis', 'palm']);
assert.deepEqual(togglePane(['chart'], 'chart'), ['chart'], 'the last pane stays');
assert.deepEqual(normalizePanes(['palm', 'palm', 'timing']), ['timing', 'palm']);

// --- The grid, left to the width of the screen -----------------------------------------
assert.equal(paneGridClass(1), 'lg:grid-cols-1');
assert.equal(paneGridClass(2), 'lg:grid-cols-2');
assert.equal(paneGridClass(3), 'lg:grid-cols-2 2xl:grid-cols-3');
assert.equal(paneGridClass(4), 'lg:grid-cols-2 2xl:grid-cols-4', 'four panes are two rows of two, or one row on a very wide screen');
assert.equal(paneSpanClass(2, 3), 'lg:col-span-2 2xl:col-span-1', 'the third of three takes the second row');
assert.equal(paneSpanClass(0, 3), '');
assert.equal(paneSpanClass(2, 4), '');

// --- One row ----------------------------------------------------------------------------
assert.equal(paneGridClass(2, 1), 'lg:grid-cols-2');
assert.equal(paneGridClass(3, 1), 'lg:grid-cols-3', 'a column for every pane');
assert.equal(paneGridClass(4, 1), 'lg:grid-cols-4');
assert.equal(paneSpanClass(2, 3, 1), '', 'nothing spans');

// --- Two rows -----------------------------------------------------------------------------
assert.equal(paneGridClass(2, 2), 'lg:grid-cols-1', 'two panes one above the other');
assert.equal(paneGridClass(3, 2), 'lg:grid-cols-2');
assert.equal(paneGridClass(4, 2), 'lg:grid-cols-2', 'two rows of two, whatever the width');
assert.equal(paneSpanClass(2, 3, 2), 'lg:col-span-2', 'the third takes the second row');
assert.equal(paneSpanClass(1, 3, 2), '');
assert.equal(paneGridClass(1, 2), 'lg:grid-cols-1', 'one pane has nothing to arrange');
