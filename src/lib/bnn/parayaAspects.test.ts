import assert from 'node:assert/strict';
import type { ParayaBody, ParayaPeriod } from './nadiParaya';
import { aspectPeriodsOf, aspectRelationOf, aspectsAt, convergencesOf, groupBySign, hitsWithin, overlapping, stripRows, type AspectPeriod, type ExactHit } from './parayaAspects';
import { transitRelationsOf } from '@/lib/transitHits';

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

// --- The transiting grahas have aspects of their own, counted from the graha ------------------------------------------------------------------------
// The sign a graha in Aries (0) aspects, and the relation: the natal point is that house from the graha.
const aspectedFromAries = (body: string) => Array.from({ length: 12 }, (_, natalSign) => [natalSign, aspectRelationOf(0, natalSign, transitRelationsOf, body)] as const).filter(([, relation]) => relation !== null);
assert.deepEqual(aspectedFromAries('Saturn'), [[0, 1], [2, 3], [6, 7], [9, 10]], 'Saturn: Aries itself, the 3rd (Gemini), the 7th (Libra), the 10th (Capricorn)');
assert.deepEqual(aspectedFromAries('Jupiter'), [[0, 1], [4, 5], [6, 7], [8, 9]], 'Jupiter: the 5th (Leo), the 7th, the 9th (Sagittarius)');
assert.deepEqual(aspectedFromAries('Mars'), [[0, 1], [3, 4], [6, 7], [7, 8]], 'Mars: the 4th (Cancer), the 7th, the 8th (Scorpio)');
assert.deepEqual(aspectedFromAries('Rahu'), [[0, 1], [4, 5], [8, 9]]);
assert.deepEqual(aspectedFromAries('Ketu'), [[0, 1], [4, 5], [8, 9]]);
assert.deepEqual(aspectedFromAries('Venus'), [[0, 1], [6, 7]]);
// Round the end of the zodiac: Saturn in Sagittarius (8) aspects Aquarius (10, the 3rd), Gemini (2, the 7th) and Virgo (5, the 10th), and not Pisces (11, the 4th).
assert.equal(aspectRelationOf(8, 10, transitRelationsOf, 'Saturn'), 3, 'Aquarius is the 3rd from Sagittarius');
assert.equal(aspectRelationOf(8, 2, transitRelationsOf, 'Saturn'), 7);
assert.equal(aspectRelationOf(8, 5, transitRelationsOf, 'Saturn'), 10, 'Virgo is the 10th from Sagittarius');
assert.equal(aspectRelationOf(8, 11, transitRelationsOf, 'Saturn'), null, 'Pisces is the 4th, which Saturn does not aspect');
// The periods and the moment, graha by graha: natal Aries is aspected by Saturn from Aquarius (the 3rd from it), Libra (the 7th), Cancer (the 10th) and from Aries itself.
{
  const natalAries = { name: 'Moon', signIndex: 0 };
  const saturnStays = [stay('Saturn', 10, 0, 1), stay('Saturn', 6, 1, 2), stay('Saturn', 3, 2, 3), stay('Saturn', 0, 3, 4), stay('Saturn', 8, 4, 5)];
  assert.deepEqual(aspectPeriodsOf(saturnStays, natalAries, transitRelationsOf).map(item => [item.relation, item.startAge]), [[3, 0], [7, 1], [10, 2], [1, 3]], 'Aquarius (3rd), Libra (7th), Cancer (10th), Aries (itself); Sagittarius is not an aspect');
  // The same stays seen by Jupiter's rule: the signs from which Jupiter aspects Aries are Aries, Sagittarius (5th), Libra, Leo (9th).
  const jupiterStays = saturnStays.map(item => ({ ...item, body: 'Jupiter' as const }));
  assert.deepEqual(aspectPeriodsOf(jupiterStays, natalAries, transitRelationsOf).map(item => [item.relation, item.startAge]), [[7, 1], [1, 3], [5, 4]], 'Libra (7th), Aries (itself), Sagittarius (5th)');
  // Only the relations that are chosen, of the graha's own.
  const onlySeventh = (body: string) => transitRelationsOf(body).filter(item => item === 7);
  assert.deepEqual(aspectPeriodsOf(saturnStays, natalAries, onlySeventh).map(item => item.relation), [7]);
  // At one moment, both grahas by their own rules.
  assert.deepEqual(aspectsAt([{ body: 'Saturn', signIndex: 10 }, { body: 'Jupiter', signIndex: 10 }, { body: 'Mars', signIndex: 9 }], 0, transitRelationsOf).map(item => `${item.body}${item.relation}`), ['Saturn3', 'Mars4']);
}

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

// --- The exact dates inside a stretch ------------------------------------------------------------------------------------------------------
const HOUR = 3_600_000;
const hit = (body: string, natal: string, relation: 1 | 5 | 7 | 9, time: number): ExactHit => ({ body, natal, relation, time });
const hits = [
  hit('Jupiter', 'Sun', 5, 100 * HOUR), hit('Saturn', 'Sun', 9, 400 * HOUR), hit('Jupiter', 'Moon', 5, 200 * HOUR), hit('Jupiter', 'Sun', 1, 300 * HOUR),
  hit('Jupiter', 'Sun', 5, 900 * HOUR), hit('Jupiter', 'Sun', 5, 600 * HOUR),
];
const stretch = { natals: ['Sun', 'Mars'], aspects: [{ body: 'Jupiter', relation: 5 as const }, { body: 'Saturn', relation: 9 as const }], startTime: 50 * HOUR, endTime: 700 * HOUR };
assert.deepEqual(hitsWithin(hits, stretch).map(item => [item.body, item.natal, item.relation, item.time / HOUR]), [['Jupiter', 'Sun', 5, 100], ['Saturn', 'Sun', 9, 400], ['Jupiter', 'Sun', 5, 600]],
  'the natal points and the kinds of aspect of the stretch, within its time, in time order: not Jupiter to the Moon, not the 1st, not the hit after the end');
assert.deepEqual(hitsWithin(hits, { ...stretch, natals: ['Moon'] }).map(item => item.time / HOUR), [200], 'a row of the Moon alone counts Jupiter 5 to the Moon, and nothing of the Sun');
assert.equal(hitsWithin(hits, { ...stretch, startTime: 102 * HOUR }).length, 2, 'a hit two hours before the start is not in the stretch');
assert.equal(hitsWithin(hits, { ...stretch, startTime: 100 * HOUR + 1000 }).length, 3, 'a hit a moment before the start is still counted, so that one at the very edge is not lost');
assert.deepEqual(hitsWithin([], stretch), []);

// --- The timeline: a row for each sign that holds natal points -----------------------------------------------------------------------------
{
  const natalPoints = [{ name: 'Sun', signIndex: 3 }, { name: 'Moon', signIndex: 3 }, { name: 'Mars', signIndex: 0 }, { name: 'Asc', signIndex: 5 }];
  const periods = new Map<string, AspectPeriod[]>([
    ['Sun', [{ body: 'Jupiter', natal: 'Sun', relation: 1, startAge: 0, endAge: 6 }, { body: 'Saturn', natal: 'Sun', relation: 5, startAge: 4, endAge: 10 }]],
    ['Moon', [{ body: 'Jupiter', natal: 'Moon', relation: 1, startAge: 0, endAge: 6 }, { body: 'Saturn', natal: 'Moon', relation: 5, startAge: 4, endAge: 10 }]],
    ['Mars', [{ body: 'Rahu', natal: 'Mars', relation: 9, startAge: -3, endAge: 2 }]],
  ]);
  const rows = stripRows(natalPoints, periods, 1, 8);
  assert.deepEqual(rows.map(row => [row.natals, row.signIndex]), [[['Sun', 'Moon'], 3], [['Mars'], 0], [['Asc'], 5]], 'Sun and Moon share Cancer; the order is that of the natal points');
  assert.deepEqual(rows[0].segments.map(segment => [segment.startAge, segment.endAge, segment.aspects.length]), [[1, 4, 1], [4, 6, 2], [6, 8, 1]], 'the stretches are cut to the range, with the number of grahas in each');
  assert.deepEqual(rows[1].segments.map(segment => [segment.startAge, segment.endAge]), [[1, 2]], 'a stay that began before the range is cut at its start');
  assert.deepEqual(rows[2].segments, [], 'a point nobody aspects has an empty row');
}

console.log('Paraya aspect tests passed');
