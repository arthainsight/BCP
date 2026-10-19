import assert from 'node:assert/strict';
import { accuracyOf, parseStoredDashaEvents } from './dashaEventStore';

assert.deepEqual(parseStoredDashaEvents(null), []);
const [legacy] = parseStoredDashaEvents(JSON.stringify([{ id: '1', name: 'Move', date: '2026-08-12', category: 'home', varga: 'D9' }]));
assert.equal(legacy.category, 'home'); assert.equal(legacy.varga, 'D9'); assert.equal(legacy.significance, 3); assert.deepEqual(legacy.tags, []); assert.equal(legacy.notes, '');
const [invalid] = parseStoredDashaEvents(JSON.stringify([{ id: '2', name: 'Test', date: '2026-08-12', category: 'bad', varga: 'D99', significance: 9, tags: [' one ', '', 'two'] }]));
assert.equal(invalid.category, 'other'); assert.equal(invalid.varga, 'D1'); assert.equal(invalid.significance, 5); assert.deepEqual(invalid.tags, ['one', 'two']);

// How exactly the day is known: chosen, or else read from the tags.
const [exact, rough, odd] = parseStoredDashaEvents(JSON.stringify([
  { id: '3', name: 'a', date: '2015-06-15', accuracy: 'year' }, { id: '4', name: 'b', date: '2015-06-15', tags: ['approx. date'] }, { id: '5', name: 'c', date: '2015-06-15', accuracy: 'hour' },
]));
assert.equal(exact.accuracy, 'year'); assert.equal(rough.accuracy, undefined); assert.equal('accuracy' in odd, false, 'a value that is not an accuracy is dropped');
assert.equal(accuracyOf(exact), 'year', 'what was chosen');
assert.equal(accuracyOf(rough), 'month', 'the tag, when nothing was chosen');
assert.equal(accuracyOf({ date: '2015-06-15', tags: ['approx. date'], accuracy: 'day' }), 'day', 'chosen to the day: it outweighs the tag');
console.log('Dasha event store tests passed');
