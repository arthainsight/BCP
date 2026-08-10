import assert from 'node:assert/strict';
import { calculateKalachakra, calculateKalachakraAntardashas } from './kalachakra';

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
assert.equal(halfway.entries[0].signName, 'Cancer');
assert.ok(Math.abs(halfway.entries[0].durationYears - 3) < 1e-10);

const children = calculateKalachakraAntardashas(ashwiniStart.entries[0], ashwiniStart.cycle);
assert.equal(children.length, 9);
assert.ok(Math.abs(children.reduce((sum, item) => sum + item.durationYears, 0) - 7) < 1e-10);

console.log('Kālachakra Daśā tests passed');
