import assert from 'node:assert/strict';
import { calculateKalachakra, calculateKalachakraAntardashas, calculateKalachakraSubDashas } from './kalachakra';

const birth = new Date(2000, 0, 1);
const ashwiniStart = calculateKalachakra(0, birth);
assert.equal(ashwiniStart.nakshatra, 'Ashwini');
assert.equal(ashwiniStart.pada, 1);
assert.equal(ashwiniStart.motion, 'savya');
assert.deepEqual(ashwiniStart.cycle, [0,1,2,3,4,5,6,7,8]);
assert.deepEqual(ashwiniStart.entries.map((entry) => entry.durationYears), [7,16,9,21,5,9,16,7,10]);

const rohiniStart = calculateKalachakra(40, birth);
assert.equal(rohiniStart.nakshatra, 'Rohini');
assert.equal(rohiniStart.motion, 'apasavya');
assert.deepEqual(rohiniStart.cycle, [8,9,10,11,0,1,2,4,3]);

const halfway = calculateKalachakra(5 / 3, birth); // halfway through Ashwini pada 1
assert.equal(halfway.entries[0].signName, 'Aries');
assert.ok(Math.abs(halfway.entries[0].durationYears - 3.5) < 1e-10);
assert.equal(halfway.entries.length, 9);
assert.ok(Math.abs(halfway.entries.reduce((sum, item) => sum + item.durationYears, 0) - 96.5) < 1e-10);

const children = calculateKalachakraAntardashas(ashwiniStart.entries[0], ashwiniStart.cycle);
assert.equal(children.length, 9);
assert.ok(Math.abs(children.reduce((sum, item) => sum + item.durationYears, 0) - 7) < 1e-10);

const grandchildren = calculateKalachakraSubDashas(children[1], ashwiniStart.cycle);
assert.equal(grandchildren.length, 9);
assert.equal(grandchildren[0].signName, children[1].signName);
assert.equal(grandchildren[0].startDate.getTime(), children[1].startDate.getTime());
assert.equal(grandchildren.at(-1)!.endDate.getTime(), children[1].endDate.getTime());
assert.ok(Math.abs(grandchildren.reduce((sum, item) => sum + item.durationYears, 0) - children[1].durationYears) < 1e-10);

const halfwayChildren = calculateKalachakraAntardashas(halfway.entries[0], halfway.cycle);
assert.ok(halfwayChildren[0].startDate.getTime() === birth.getTime());
assert.ok(Math.abs(halfwayChildren.reduce((sum, item) => sum + item.durationYears, 0) - 3.5) < 1e-10);

const lateMrigashira = calculateKalachakra(66 + 1 / 3 - 0.01, birth);
assert.equal(lateMrigashira.nakshatra, 'Mrigashira');
assert.equal(lateMrigashira.pada, 4);
assert.equal(lateMrigashira.entries.length, 9);
assert.ok(lateMrigashira.entries.at(-1)!.endDate.getFullYear() > 2080);

console.log('Kālachakra Daśā tests passed');
