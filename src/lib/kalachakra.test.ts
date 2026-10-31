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

// The groups of the nakṣatras (BPHS 46.56–58): Revatī is of the first savya group, with Aśvinī, not of the second.
const groupOf = (nakshatra: number) => calculateKalachakra(nakshatra * (360 / 27) + 0.01, birth).cycle;
const FIRST_SAVYA = [0, 2, 6, 8, 12, 14, 18, 20, 24, 26];
const SECOND_SAVYA = [1, 7, 13, 19, 25];
const FIRST_APASAVYA = [3, 9, 15, 21];
const SECOND_APASAVYA = [4, 5, 10, 11, 16, 17, 22, 23];
assert.equal(new Set([...FIRST_SAVYA, ...SECOND_SAVYA, ...FIRST_APASAVYA, ...SECOND_APASAVYA]).size, 27, 'every nakṣatra is in one group');
assert.deepEqual(groupOf(26), [0, 1, 2, 3, 4, 5, 6, 7, 8], 'Revatī pada 1 runs as Aśvinī pada 1');
assert.equal(calculateKalachakra(26 * (360 / 27) + 0.01, birth).motion, 'savya');
for (const nakshatra of FIRST_SAVYA) assert.deepEqual(groupOf(nakshatra), [0, 1, 2, 3, 4, 5, 6, 7, 8], `nakshatra ${nakshatra}`);
for (const nakshatra of SECOND_SAVYA) assert.deepEqual(groupOf(nakshatra), [7, 6, 5, 3, 4, 2, 1, 0, 11], `nakshatra ${nakshatra}`);
for (const nakshatra of FIRST_APASAVYA) assert.deepEqual(groupOf(nakshatra), [8, 9, 10, 11, 0, 1, 2, 4, 3], `nakshatra ${nakshatra}`);
for (const nakshatra of SECOND_APASAVYA) assert.deepEqual(groupOf(nakshatra), [11, 10, 9, 8, 7, 6, 5, 4, 3], `nakshatra ${nakshatra}`);

// The sixteen sequences of the signs, typed from the numbers of BPHS 46.60–81 (the sign numbers, Aries 1). Two readings are put right by
// the sense of the verses: in 46.68 the last number is "rāma" (3) where Virgo, the Jīva of that pada, is 6, and in 46.74 the first is "aṅka" (9)
// where Virgo (aṅga, 6) is the Jīva. The second pada of the first savya group (46.61) is given in the text only as "from Makara to Mithuna".
const BPHS_CYCLES: Record<string, number[][]> = {
  firstSavya: [[1, 2, 3, 4, 5, 6, 7, 8, 9], [10, 11, 12, 8, 7, 6, 4, 5, 3], [2, 1, 12, 11, 10, 9, 1, 2, 3], [4, 5, 6, 7, 8, 9, 10, 11, 12]],
  secondSavya: [[8, 7, 6, 4, 5, 3, 2, 1, 12], [11, 10, 9, 1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12, 8, 7, 6], [4, 5, 3, 2, 1, 12, 11, 10, 9]],
  firstApasavya: [[9, 10, 11, 12, 1, 2, 3, 5, 4], [6, 7, 8, 12, 11, 10, 9, 8, 7], [6, 5, 4, 3, 2, 1, 9, 10, 11], [12, 1, 2, 3, 5, 4, 6, 7, 8]],
  secondApasavya: [[12, 11, 10, 9, 8, 7, 6, 5, 4], [3, 2, 1, 9, 10, 11, 12, 1, 2], [3, 5, 4, 6, 7, 8, 12, 11, 10], [9, 8, 7, 6, 5, 4, 3, 2, 1]],
};
const REPRESENTATIVE = { firstSavya: 0, secondSavya: 1, firstApasavya: 3, secondApasavya: 4 };
for (const [name, padas] of Object.entries(BPHS_CYCLES)) {
  padas.forEach((expected, pada) => {
    const longitude = REPRESENTATIVE[name as keyof typeof REPRESENTATIVE] * (360 / 27) + pada * (360 / 108) + 0.01;
    assert.deepEqual(calculateKalachakra(longitude, birth).cycle.map(sign => sign + 1), expected, `${name}, pada ${pada + 1}`);
  });
}
// The years of the signs (46.84): the Sun 5, Moon 21, Mars 7, Mercury 9, Jupiter 10, Venus 16, Saturn 4 by the lord of the sign.
assert.deepEqual(calculateKalachakra(0.01, birth).entries.map(entry => entry.fullDurationYears), [7, 16, 9, 21, 5, 9, 16, 7, 10]);

console.log('Kālachakra Daśā tests passed');
