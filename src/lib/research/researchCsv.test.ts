import assert from 'node:assert/strict';
import { compareGroups } from './groupStudy';
import { dayText, eventsCsv, groupsCsv, resultsCsv } from './researchCsv';

// --- A day in local time, whatever the time zone ----------------------------------------------------------------------------------------------------
assert.equal(dayText(new Date(2015, 5, 15, 12).getTime()), '15.06.2015');
assert.equal(dayText(new Date(1999, 0, 1, 0, 30).getTime()), '01.01.1999');

// --- One row for each event, a 0 or 1 for each feature that any event has ---------------------------------------------------------------------------
{
  const csv = eventsCsv([
    { chart: 'Alpha', id: 'a1', time: new Date(2015, 5, 15, 12).getTime(), name: 'Moved "abroad"', category: 'home', tags: ['abroad', 'big'], features: new Set(['house|Saturn|4', 'house|Jupiter|1']) },
    { chart: 'Beta', id: 'b1', time: new Date(2001, 2, 14, 12).getTime(), name: 'Moved, again', category: 'home', tags: [], features: new Set(['house|Saturn|4']) },
  ]);
  const lines = csv.split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], '"chart","event","date","name","category","tags","house|Jupiter|1","house|Saturn|4"');
  assert.equal(lines[1], '"Alpha","a1","15.06.2015","Moved ""abroad""","home","abroad; big","1","1"', 'quotes are doubled');
  assert.equal(lines[2], '"Beta","b1","14.03.2001","Moved, again","home","","0","1"', 'a comma stays inside its cell');
  assert.ok(eventsCsv([]).startsWith('"chart"'), 'no events, only the heading');
  // With groups there is a column for the group.
  assert.ok(eventsCsv([{ chart: 'A', id: 'x', time: 0, name: 'n', category: 'c', tags: [], features: new Set(), group: 'moves' }]).split('\n')[0].includes('"group"'));
}

// --- The tables ---------------------------------------------------------------------------------------------------------------------------------------
{
  const csv = resultsCsv([{ id: 'house|Saturn|4', family: 'house', body: 'Saturn', target: '4', observed: 6, expected: 2.123456, lift: 2.8259, p: 0.0123456, q: 0.1, events: [] }, { id: 'house|Rahu|2', family: 'house', body: 'Rahu', target: '2', observed: 1, expected: 0, lift: null, p: 1, q: 1, events: [] }], 20);
  const lines = csv.split('\n');
  assert.equal(lines[1], '"house|Saturn|4","house","Saturn","4","6","20","2.123","2.826","0.01235","0.10000"');
  assert.equal(lines[2], '"house|Rahu|2","house","Rahu","2","1","20","0.000","","1.00000","1.00000"', 'a ratio that cannot be worked out is empty');
}
{
  const item = (id: string, features: string[]) => ({ chartId: 'c', chartName: 'C', event: { id, name: id, time: 0, category: 'home', tags: [] }, features });
  const csv = groupsCsv(compareGroups([item('a', ['house|Saturn|4']), item('b', ['house|Saturn|4'])], [item('c', [])]), 'moves', 'weddings');
  const lines = csv.split('\n');
  assert.equal(lines[0], '"feature","family","graha","target","moves (2)","weddings (1)","share moves","share weddings","difference","p","q"');
  assert.ok(lines[1].startsWith('"house|Saturn|4","house","Saturn","4","2","0","1.0000","0.0000","1.0000"'));
}

console.log('Research CSV tests passed');
