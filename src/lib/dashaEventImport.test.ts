import assert from 'node:assert/strict';
import { parseDashaEventImport } from './dashaEventImport';

const csv = 'event,category,date,varga,dasha,MD\n"New job, role",Work,2026-01-02,D10,Vimsottari,Saturn\n"New job, role",Work,2026-01-02,D10,Chara,Cp\nInvalid,Money,no-date,D1,Vimsottari,Mercury';
const csvResult = parseDashaEventImport(csv, 'events.csv');
assert.equal(csvResult.events.length, 1);
assert.equal(csvResult.events[0].name, 'New job, role');
assert.equal(csvResult.events[0].category, 'work');
assert.equal(csvResult.rejected, 1);

const jsonResult = parseDashaEventImport(JSON.stringify({ version: 1, events: [{ name: 'Move', date: '2026-02-03', category: 'home', varga: 'D1', dashas: [] }] }), 'events.json');
assert.deepEqual(jsonResult.events[0], { name: 'Move', date: '2026-02-03', category: 'home', varga: 'D1' });
assert.throws(() => parseDashaEventImport('{', 'broken.json'));
console.log('Dasha event import tests passed');
