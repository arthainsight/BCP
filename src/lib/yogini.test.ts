import assert from 'node:assert/strict';
import { calculateYogini, calculateYoginiSubDashas } from './yogini';

const birth = new Date(2000, 0, 1);
const ashwini = calculateYogini(0, birth);
assert.equal(ashwini.startYogini, 'Bhramari');
assert.equal(ashwini.entries[0].durationYears, 4);

const rohini = calculateYogini(40, birth);
assert.equal(rohini.startYogini, 'Siddha');

const children = calculateYoginiSubDashas(ashwini.entries[0]);
assert.equal(children.length, 8);
assert.equal(children[0].name, 'Bhramari');
assert.ok(Math.abs(children.reduce((sum, entry) => sum + entry.durationYears, 0) - 4) < 1e-10);
assert.ok(ashwini.entries.at(-1)!.endDate.getFullYear() >= 2120);

console.log('Yoginī Daśā tests passed');
