import assert from 'node:assert/strict';
import { parseDashaEventImport, parseDashaEventText } from './dashaEventImport';

const csv = 'event,category,date,varga,dasha,MD\n"New job, role",Work,2026-01-02,D10,Vimsottari,Saturn\n"New job, role",Work,2026-01-02,D10,Chara,Cp\nInvalid,Money,no-date,D1,Vimsottari,Mercury';
const csvResult = parseDashaEventImport(csv, 'events.csv');
assert.equal(csvResult.events.length, 1);
assert.equal(csvResult.events[0].name, 'New job, role');
assert.equal(csvResult.events[0].category, 'work');
assert.equal(csvResult.rejected, 1);

const jsonResult = parseDashaEventImport(JSON.stringify({ version: 1, events: [{ name: 'Move', date: '2026-02-03', category: 'home', varga: 'D1', dashas: [] }] }), 'events.json');
// v2.10 added notes, tags and significance to every imported event.
assert.deepEqual(jsonResult.events[0], {
  name: 'Move',
  date: '2026-02-03',
  category: 'home',
  varga: 'D1',
  notes: '',
  tags: [],
  significance: 3,
});
assert.throws(() => parseDashaEventImport('{', 'broken.json'));

// Many events pasted at once, one on each line (v2.86).
const defaults = { category: 'other', varga: 'D1' } as const;
const pasted = parseDashaEventText([
  '15.6.2015 Moved abroad',
  '  2.1.2018; New job; työ; D10; 5; started at the bank  ',
  '2019-03-04\tDaughter born\tfamily',
  'Surgery 7/11/2020',
  '1.1.2015 – Anne-Marie met',
  '31.2.2016 Not a day',
  'no date at all',
  '',
  '15.6.2015 Moved abroad',
].join('\n'), defaults);
assert.deepEqual(pasted.events.map(item => [item.date, item.name]), [
  ['2015-06-15', 'Moved abroad'],
  ['2018-01-02', 'New job'],
  ['2019-03-04', 'Daughter born'],
  ['2020-11-07', 'Surgery'],
  ['2015-01-01', 'Anne-Marie met'],
]);
assert.deepEqual(pasted.invalid, ['31.2.2016 Not a day', 'no date at all']);
// The extra columns, the Finnish category names and the defaults for what is missing.
assert.deepEqual(pasted.events[1], { name: 'New job', date: '2018-01-02', category: 'work', varga: 'D10', significance: 5, notes: 'started at the bank', tags: [] });
assert.equal(pasted.events[0].category, 'other');
assert.equal(pasted.events[2].category, 'family');
assert.equal(pasted.events[0].significance, 3);
assert.equal(parseDashaEventText('15.6.2015 Move', { category: 'home', varga: 'D9' }).events[0].category, 'home');
assert.equal(parseDashaEventText('15.6.2015 Move', { category: 'home', varga: 'D9' }).events[0].varga, 'D9');
// A date alone is not an event, and a leap day is only real in a leap year.
assert.deepEqual(parseDashaEventText('15.6.2015\n29.2.2016 Leap\n29.2.2015 Not a leap year', defaults).events.map(item => item.name), ['Leap']);
assert.equal(parseDashaEventText('', defaults).events.length, 0);
console.log('Dasha event import tests passed');
