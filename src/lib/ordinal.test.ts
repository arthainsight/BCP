import assert from 'node:assert/strict';
import { ordinal } from './ordinal';

// English suffixes, including the teens that break the pattern and the 21st / 101st that follow it again.
const english: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 10: '10th', 11: '11th', 12: '12th', 13: '13th', 21: '21st', 22: '22nd', 53: '53rd', 101: '101st', 111: '111th' };
for (const [n, text] of Object.entries(english)) assert.equal(ordinal(Number(n)), text);
// Finnish: the number and a full stop.
assert.equal(ordinal(5, 'fi'), '5.');
assert.equal(ordinal(53, 'fi'), '53.');
