import assert from 'node:assert/strict';
import { applyBulkChange, countByYear, parseTagInput, removeEvents, sortEvents } from './dashaEventBulk';
import type { StoredDashaEvent } from './dashaEventStore';

const make = (id: string, date: string, extra: Partial<StoredDashaEvent> = {}): StoredDashaEvent => ({ id, name: `Event ${id}`, date, category: 'other', varga: 'D1', notes: '', tags: [], significance: 3, ...extra });
const events = [make('a', '2015-06-15', { endDate: '2017-08-20', tags: ['Move'] }), make('b', '2018-01-02'), make('c', '2018-05-05', { tags: ['job', 'bank'] })];

assert.deepEqual(parseTagInput(' a, B ;a,, b ,c '), ['a', 'B', 'c'], 'tags are trimmed and not repeated, whatever their case');
assert.deepEqual(parseTagInput(''), []);

// Only the chosen events change, and only what is given.
const changed = applyBulkChange(events, new Set(['a', 'c']), { category: 'work', significance: 9, addTags: ['move', 'new'], removeTags: ['BANK'], clearEnd: true });
assert.equal(changed[0].category, 'work'); assert.equal(changed[2].category, 'work'); assert.equal(changed[1].category, 'other');
assert.equal(changed[0].significance, 5, 'the significance stays between 1 and 5');
assert.deepEqual(changed[0].tags, ['Move', 'new'], 'a tag that is there in other letters is not added again');
assert.deepEqual(changed[2].tags, ['job', 'move', 'new'], 'a tag is removed whatever its case, and the new ones follow');
assert.equal(changed[0].endDate, undefined); assert.equal('endDate' in changed[0], false);
assert.equal(changed[1], events[1], 'an event that was not chosen is the same object');
assert.equal(events[0].endDate, '2017-08-20', 'the list that was given is not changed');
assert.equal(applyBulkChange(events, new Set(['b']), { varga: 'D9' })[1].varga, 'D9');

assert.deepEqual(removeEvents(events, new Set(['a', 'c'])).map(item => item.id), ['b']);
assert.deepEqual(sortEvents([make('x', '2020-01-01'), make('y', '2010-01-01'), make('z', '2020-01-01')]).map(item => item.id), ['y', 'x', 'z']);
assert.deepEqual([...countByYear(events)], [['2015', 1], ['2018', 2]]);
console.log('Dasha event bulk tests passed');
