import assert from 'node:assert/strict';
import { pairFor } from './compare';

const record = (id: string, side: 'left' | 'right' | 'other') => ({ id, side });

// A right hand is put beside a left one, wherever it is in the list.
assert.equal(pairFor([record('r1', 'right'), record('x', 'other'), record('l1', 'left')], 'r1'), 'l1');
assert.equal(pairFor([record('l1', 'left'), record('r1', 'right'), record('r2', 'right')], 'r2'), 'l1');
assert.equal(pairFor([record('r1', 'right'), record('l1', 'left'), record('l2', 'left')], 'r1'), 'l1', 'the first of the other hand');
// Without the other hand, the next photograph.
assert.equal(pairFor([record('r1', 'right'), record('r2', 'right'), record('x', 'other')], 'r1'), 'r2');
assert.equal(pairFor([record('x', 'other'), record('l1', 'left')], 'x'), 'l1', 'a photograph of no hand has no opposite');
// With only one photograph, it is beside itself.
assert.equal(pairFor([record('only', 'right')], 'only'), 'only');

console.log('Palm compare tests passed');
