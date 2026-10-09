import assert from 'node:assert/strict';
import { DEFAULT_SPLIT, normalizePanes, paneGridClass, paneHeightClass, paneSpanClass, readSplit, togglePane } from './splitView';

// --- Reading what is stored -------------------------------------------------------
assert.deepEqual(readSplit(null), DEFAULT_SPLIT, 'nothing stored is the default');
assert.deepEqual(readSplit('split'), DEFAULT_SPLIT, 'a value of the wrong type is the default');
assert.deepEqual(readSplit({ on: true, panes: ['palm', 'chart'] }), { on: true, panes: ['chart', 'palm'] }, 'in the usual order');
assert.deepEqual(readSplit({ on: 'yes', panes: ['timing'] }), { on: false, panes: ['timing'] }, 'only true is on');
assert.deepEqual(readSplit({ on: true, panes: ['settings', 'chart', 'chart', 7] }).panes, ['chart'], 'only the workspaces that can be shown together, once each');
assert.deepEqual(readSplit({ on: true, panes: [] }).panes, DEFAULT_SPLIT.panes, 'never none');
assert.deepEqual(readSplit({ on: true, panes: 'chart' }).panes, DEFAULT_SPLIT.panes, 'panes of the wrong type are the default');
assert.notEqual(readSplit(null).panes, DEFAULT_SPLIT.panes, 'the default is not shared');

// --- Switching a pane on and off ---------------------------------------------------
assert.deepEqual(togglePane(['chart'], 'palm'), ['chart', 'palm']);
assert.deepEqual(togglePane(['chart', 'analysis'], 'timing'), ['chart', 'timing', 'analysis'], 'a pane goes in its usual place');
assert.deepEqual(togglePane(['chart', 'timing', 'analysis', 'palm'], 'timing'), ['chart', 'analysis', 'palm']);
assert.deepEqual(togglePane(['chart'], 'chart'), ['chart'], 'the last pane stays');
assert.deepEqual(normalizePanes(['palm', 'palm', 'timing']), ['timing', 'palm']);

// --- The grid -----------------------------------------------------------------------
assert.equal(paneGridClass(1), 'lg:grid-cols-1');
assert.equal(paneGridClass(2), 'lg:grid-cols-2');
assert.equal(paneGridClass(3), 'lg:grid-cols-2 2xl:grid-cols-3');
assert.equal(paneGridClass(4), 'lg:grid-cols-2 2xl:grid-cols-4', 'four panes are two rows of two, or one row on a very wide screen');
assert.equal(paneSpanClass(2, 3), 'lg:col-span-2 2xl:col-span-1', 'the third of three takes the second row');
assert.equal(paneSpanClass(0, 3), '');
assert.equal(paneSpanClass(2, 4), '');
assert.equal(paneHeightClass(1), 'lg:max-h-[calc(100dvh-8rem)]', 'one row: the height of the screen');
assert.equal(paneHeightClass(2), 'lg:max-h-[calc(100dvh-8rem)]');
assert.match(paneHeightClass(4), /calc\(\(100dvh-10rem\)\/2\)/, 'two rows: half of it');
assert.match(paneHeightClass(4), /2xl:max-h-\[calc\(100dvh-8rem\)\]/, 'one row again on a very wide screen');
