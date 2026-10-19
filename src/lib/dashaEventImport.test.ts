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

// v2.88: months and years, periods, a header line, and pasted CSV or JSON.
const loose = parseDashaEventText([
  '3/2015 Started the studies',
  '2016 Bought the house',
  'Daughter born 2019-03',
  '15.6.2015 - 20.8.2017 Studied abroad',
  '2018–2020 The long illness',
  '1.1.2021 .. 5.1.2020 Backwards',
  'The year 1500 was long ago',
].join('\n'), defaults);
assert.deepEqual(loose.events.map(item => [item.date, item.endDate, item.name]), [
  ['2015-03-15', undefined, 'Started the studies'],
  ['2016-07-01', undefined, 'Bought the house'],
  ['2019-03-15', undefined, 'Daughter born'],
  ['2015-06-15', '2017-08-20', 'Studied abroad'],
  ['2018-01-01', '2020-12-31', 'The long illness'],
]);
assert.deepEqual(loose.invalid, ['1.1.2021 .. 5.1.2020 Backwards', 'The year 1500 was long ago'], 'a period cannot end before it begins, and only years from 1800 are read');
assert.deepEqual(loose.events[0].tags, ['approx. date'], 'a date that was not exact is marked');
assert.deepEqual(loose.events[3].tags, [], 'a period of exact days is not');
assert.equal('endDate' in loose.events[0], false);
assert.deepEqual(parseDashaEventText('2015-03 Month\n2015-3-4 Day\n2015-13 Not a month', defaults).events.map(item => item.date), ['2015-03-15', '2015-03-04']);
assert.equal(parseDashaEventText('1.1.2015 Early\n2015 Late', defaults).events.length, 2);
assert.deepEqual(parseDashaEventText('2015-06-15 - 2017-08-20 Period', defaults).events[0].endDate, '2017-08-20');
assert.equal(parseDashaEventText('2015-06-155 Too long', defaults).events.length, 0);

// A first line that names the columns is skipped.
const withHeader = parseDashaEventText('Date\tEvent\tCategory\n15.6.2015\tMoved\thome', defaults);
assert.equal(withHeader.format, 'lines'); assert.deepEqual(withHeader.invalid, []); assert.equal(withHeader.events[0].category, 'home');

// A month or a year in a line gives the event its accuracy (a period does not: it has two dates); a column of a file can say it.
const accuracies = parseDashaEventText('3/2015 Month\n2016 Year\n15.6.2017 Day\n2018 - 2019 Period', defaults).events;
assert.deepEqual(accuracies.map(event => event.accuracy), ['month', 'year', undefined, undefined]);
assert.deepEqual(parseDashaEventImport('name,date,accuracy\nA,2015-06-15,Year\nB,2015-06-16,hour', 'x.csv').events.map(event => event.accuracy), ['year', undefined]);

// CSV with a header (quotes and all) and JSON are read as the files are.
const pastedCsv = parseDashaEventText('event,date,end_date,category\n"Move, abroad",2015-06-15,2017-08-20,Home\nBroken,not a date,,Work', defaults);
assert.equal(pastedCsv.format, 'CSV'); assert.equal(pastedCsv.events[0].name, 'Move, abroad'); assert.equal(pastedCsv.events[0].endDate, '2017-08-20'); assert.equal(pastedCsv.events[0].category, 'home');
assert.deepEqual(pastedCsv.invalid, ['Broken, not a date, , Work']);
const pastedJson = parseDashaEventText('[{"name":"Move","date":"2015-06-15","endDate":"2014-01-01"},{"name":"No date"}]', defaults);
assert.equal(pastedJson.format, 'JSON'); assert.equal(pastedJson.events.length, 1); assert.equal(pastedJson.events[0].endDate, undefined, 'an end before the beginning is dropped'); assert.equal(pastedJson.invalid.length, 1);
assert.deepEqual(parseDashaEventText('{ broken', defaults), { events: [], invalid: ['This is not valid JSON.'], format: 'JSON' });
console.log('Dasha event import tests passed');
