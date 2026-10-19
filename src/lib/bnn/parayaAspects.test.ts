import assert from 'node:assert/strict';
import type { ParayaBody, ParayaPeriod } from './nadiParaya';
import { aspectPeriodsOf, aspectRelationOf, aspectsAt, convergencesOf, groupBySign, overlapping, type AspectPeriod } from './parayaAspects';

const stay = (body: ParayaBody, signIndex: number, startAge: number, endAge: number): ParayaPeriod =>
  ({ body, signIndex, signName: '', startAge, endAge, durationYears: endAge - startAge, cycleNumber: 1, degree: 0 });
const period = (body: ParayaBody, relation: 1 | 5 | 7 | 9, startAge: number, endAge: number): AspectPeriod => ({ body, natal: 'Moon', relation, startAge, endAge });

// --- The relation of two signs: the same sign, the 5th, 7th and 9th from it ------------------------------------------------------
assert.deepEqual([0, 4, 6, 8].map(sign => aspectRelationOf(sign, 0)), [1, 5, 7, 9]);
assert.deepEqual([1, 2, 3, 5, 7, 9, 10, 11].map(sign => aspectRelationOf(sign, 0)), Array(8).fill(null), 'the other signs are no aspect');
assert.equal(aspectRelationOf(2, 8), 7, 'round the end of the zodiac: Gemini is the 7th from Sagittarius');
assert.equal(aspectRelationOf(0, 8), 5, 'and Aries the 5th');
assert.equal(aspectRelationOf(4, 8), 9);
assert.equal(aspectRelationOf(8, 8), 1);

// --- The periods of one graha ---------------------------------------------------------------------------------------------------
const jupiter = [stay('Jupiter', 0, -0.5, 1), stay('Jupiter', 1, 1, 2), stay('Jupiter', 4, 2, 3), stay('Jupiter', 6, 3, 4), stay('Jupiter', 8, 4, 5), stay('Jupiter', 10, 5, 6)];
const natal = { name: 'Moon', signIndex: 0 };
assert.deepEqual(aspectPeriodsOf(jupiter, natal, [1, 5, 7, 9]).map(item => [item.relation, item.startAge, item.endAge]), [[1, -0.5, 1], [5, 2, 3], [7, 3, 4], [9, 4, 5]]);
assert.deepEqual(aspectPeriodsOf(jupiter, natal, [5, 9]).map(item => item.relation), [5, 9], 'only the relations that are asked for');
assert.deepEqual(aspectPeriodsOf(jupiter, { name: 'Sun', signIndex: 2 }, [1, 5, 7, 9]).map(item => item.relation), [5, 7, 9], 'another natal sign (Gemini): Jupiter in Libra, Sagittarius and Aquarius');
assert.deepEqual(aspectPeriodsOf([], natal, [1]), []);

// --- Several at once ---------------------------------------------------------------------------------------------------------------
const three = [period('Jupiter', 1, 0, 2), period('Saturn', 5, 1, 4), period('Ketu', 7, 3, 5), period('Rahu', 9, 1.5, 3.5)];
const two = convergencesOf(three, 2);
assert.deepEqual(two.map(item => [item.startAge, item.endAge, item.aspects.map(a => a.body).sort().join('+')]), [
  [1, 1.5, 'Jupiter+Saturn'],
  [1.5, 2, 'Jupiter+Rahu+Saturn'],
  [2, 3, 'Rahu+Saturn'],
  [3, 3.5, 'Ketu+Rahu+Saturn'],
  [3.5, 4, 'Ketu+Saturn'],
]);
assert.deepEqual(convergencesOf(three, 3).map(item => [item.startAge, item.endAge]), [[1.5, 2], [3, 3.5]], 'three at once');
assert.deepEqual(convergencesOf(three, 4), [], 'never four at once');
assert.deepEqual(convergencesOf(three, 1).map(item => item.startAge), [0, 1, 1.5, 2, 3, 3.5, 4], 'one is every stretch of time with an aspect');
assert.equal(two[0].natal, 'Moon');
assert.deepEqual(two[0].aspects.map(a => [a.body, a.relation]).sort(), [['Jupiter', 1], ['Saturn', 5]]);
// A stretch is not cut where a graha stays and its next stay is also an aspect of the same kind.
const joined = convergencesOf([period('Jupiter', 1, 0, 1), period('Jupiter', 1, 1, 2), period('Saturn', 5, 0, 2)], 2);
assert.deepEqual(joined.map(item => [item.startAge, item.endAge]), [[0, 2]]);
// Two grahas that change sign at the same moment, to a hair, leave no stretch of their own.
assert.deepEqual(convergencesOf([period('Jupiter', 1, 0, 1), period('Saturn', 5, 1 + 1e-9, 2)], 2), []);
assert.deepEqual(convergencesOf([], 2), []);
assert.deepEqual(convergencesOf(three, 0), []);

// --- Now ---------------------------------------------------------------------------------------------------------------------------
const current = [stay('Jupiter', 4, 0, 1), stay('Saturn', 0, 0, 1), stay('Rahu', 3, 0, 1), stay('Ketu', 9, 0, 1)];
assert.deepEqual(aspectsAt(current, 0, [1, 5, 7, 9]), [{ body: 'Jupiter', relation: 5 }, { body: 'Saturn', relation: 1 }]);
assert.deepEqual(aspectsAt(current, 0, [1]), [{ body: 'Saturn', relation: 1 }]);
assert.deepEqual(aspectsAt(current, 3, [1, 5, 7, 9]), [{ body: 'Rahu', relation: 1 }, { body: 'Ketu', relation: 7 }]);

// --- A range -----------------------------------------------------------------------------------------------------------------------
const items = [period('Jupiter', 1, 0, 1), period('Jupiter', 5, 1, 2), period('Jupiter', 9, 5, 6)];
assert.deepEqual(overlapping(items, 1, 5).map(item => item.relation), [5], 'touching the range is not in it');
assert.deepEqual(overlapping(items, 0.5, 5.5).map(item => item.relation), [1, 5, 9]);

// --- Natal points in one sign share a row ----------------------------------------------------------------------------------------
const signs: Record<string, number> = { Sun: 3, Moon: 3, Mars: 2, Mercury: 3 };
const aspectKey = (c: { aspects: { body: string; relation: number }[] }) => c.aspects.map(a => `${a.body}${a.relation}`).sort().join(',');
const rows = [
  { natal: 'Sun', startAge: 1, endAge: 2, aspects: [{ body: 'Saturn', relation: 9 }, { body: 'Rahu', relation: 5 }] },
  { natal: 'Moon', startAge: 1, endAge: 2, aspects: [{ body: 'Rahu', relation: 5 }, { body: 'Saturn', relation: 9 }] },
  { natal: 'Mars', startAge: 1, endAge: 2, aspects: [{ body: 'Rahu', relation: 5 }, { body: 'Saturn', relation: 9 }] },
  { natal: 'Mercury', startAge: 1, endAge: 3, aspects: [{ body: 'Rahu', relation: 5 }, { body: 'Saturn', relation: 9 }] },
];
const grouped = groupBySign(rows, natal => signs[natal], aspectKey);
assert.deepEqual(grouped.map(group => group.natals), [['Sun', 'Moon'], ['Mars'], ['Mercury']], 'the same sign, time and grahas (in any order) are one row; another sign or another time is not');
assert.deepEqual(grouped.map(group => group.signIndex), [3, 2, 3]);
assert.equal(grouped[0].item.natal, 'Sun', 'the first of the group stands for it');
assert.deepEqual(groupBySign([], () => 0, () => ''), []);

console.log('Paraya aspect tests passed');
