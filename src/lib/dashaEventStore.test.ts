import assert from 'node:assert/strict';
import { parseStoredDashaEvents } from './dashaEventStore';

assert.deepEqual(parseStoredDashaEvents(null), []);
const [legacy] = parseStoredDashaEvents(JSON.stringify([{ id: '1', name: 'Move', date: '2026-08-12', category: 'home', varga: 'D9' }]));
assert.equal(legacy.category, 'home'); assert.equal(legacy.varga, 'D9'); assert.equal(legacy.significance, 3); assert.deepEqual(legacy.tags, []); assert.equal(legacy.notes, '');
const [invalid] = parseStoredDashaEvents(JSON.stringify([{ id: '2', name: 'Test', date: '2026-08-12', category: 'bad', varga: 'D99', significance: 9, tags: [' one ', '', 'two'] }]));
assert.equal(invalid.category, 'other'); assert.equal(invalid.varga, 'D1'); assert.equal(invalid.significance, 5); assert.deepEqual(invalid.tags, ['one', 'two']);
console.log('Dasha event store tests passed');
