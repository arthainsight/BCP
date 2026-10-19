import assert from 'node:assert/strict';
import { HIT_RELATIONS, TRANSIT_ASPECTS, TRANSIT_RELATIONS, findCrossings, findTransitHits, transitRelationsOf, type LongitudeSeries } from './transitHits';

const DAY = 86_400_000;
const series = (longitudes: number[]): LongitudeSeries => ({ start: 0, step: DAY, longitudes });

// --- Direct motion: one crossing, interpolated within the day -----------------
const direct = findCrossings(series([9, 9.5, 10.25, 11]), 10);
assert.equal(direct.length, 1);
assert.equal(direct[0].retrograde, false);
assert.equal(direct[0].time, DAY * (1 + 0.5 / 0.75));

// --- Across 0° Aries ---------------------------------------------------------
const wrap = findCrossings(series([359, 359.6, 0.2, 0.8]), 0);
assert.equal(wrap.length, 1);
assert.ok(Math.abs(wrap[0].time - DAY * (1 + 0.4 / 0.6)) < 1, '0.4° of a 0.6° step after the second sample');

// --- A retrograde loop passes three times -------------------------------------
const loop = findCrossings(series([9, 10.5, 11, 10.2, 9.5, 9.8, 10.6]), 10);
assert.deepEqual(loop.map(c => c.retrograde), [false, true, false]);

// --- The opposite point is not a crossing -------------------------------------
assert.deepEqual(findCrossings(series([189, 190, 191]), 10), []);

// --- Exactly on the point counts once ------------------------------------------
assert.equal(findCrossings(series([9, 10, 11]), 10).length, 1);

// --- Every body over every point, in time order --------------------------------
const hits = findTransitHits(
  { Saturn: series([9, 10.5, 11]), Jupiter: series([99, 100, 100.5]) },
  [{ name: 'Moon', longitude: 10 }, { name: 'Asc', longitude: 99.5 }],
);
assert.deepEqual(hits.map(h => `${h.transit}-${h.natal}`), ['Jupiter-Asc', 'Saturn-Moon']);

// --- The same degree in the 5th and 9th signs from a natal point -----------------
const natalSun = [{ name: 'Sun', longitude: 10 }];
assert.deepEqual(findTransitHits({ Jupiter: series([129, 130, 131]) }, natalSun).map(h => h.relation), [], 'by default only the point itself');
const fifth = findTransitHits({ Jupiter: series([129, 130, 131]) }, natalSun, HIT_RELATIONS);
assert.deepEqual(fifth.map(h => h.relation), [5], '130° is 120° on from 10°: the 5th');
const ninth = findTransitHits({ Saturn: series([249, 250, 251]) }, natalSun, HIT_RELATIONS);
assert.deepEqual(ninth.map(h => h.relation), [9], '250° is 240° on from 10°: the 9th');
assert.equal(ninth[0].time, DAY, 'the crossing moment is the same as for any other target');
// A natal point near the end of the zodiac puts its trines past 0° Aries.
const wrapTrine = findTransitHits({ Rahu: series([89, 90, 91]) }, [{ name: 'Moon', longitude: 330 }], HIT_RELATIONS);
assert.deepEqual(wrapTrine.map(h => h.relation), [5], '330° + 120° wraps to 90°');
// Each relation is found independently, and the hits come out in time order.
const all = findTransitHits(
  { Jupiter: series([9, 10, 11, 129, 130, 131, 249, 250, 251]) },
  natalSun,
  HIT_RELATIONS,
);
assert.deepEqual(all.map(h => h.relation), [1, 5, 9]);
assert.ok(all.every((h, i) => i === 0 || all[i - 1].time <= h.time));

// --- The aspects of each transiting graha by its own rule, counted from the graha --------------------------------------------------------------------------------
assert.deepEqual(transitRelationsOf('Saturn'), [1, 3, 7, 10]);
assert.deepEqual(transitRelationsOf('Jupiter'), [1, 5, 7, 9]);
assert.deepEqual(transitRelationsOf('Mars'), [1, 4, 7, 8]);
assert.deepEqual(transitRelationsOf('Rahu'), [1, 5, 9]);
assert.deepEqual(transitRelationsOf('Ketu'), [1, 5, 9]);
for (const body of ['Sun', 'Moon', 'Mercury', 'Venus']) assert.deepEqual(transitRelationsOf(body), [1, 7], `${body} aspects the 7th`);
assert.deepEqual(transitRelationsOf('Pluto'), [1, 7], 'a graha that is not known aspects the 7th');
assert.deepEqual([...new Set(Object.values(TRANSIT_ASPECTS).flat())].sort((a, b) => a - b), [...TRANSIT_RELATIONS]);
{
  // The natal Sun at 10° Aries. A graha's own aspects reach forward from it, so it stands that many signs behind the point: the relation is the house of the point from the graha.
  const sun = [{ name: 'Sun', longitude: 10 }];
  const own = (body: string) => transitRelationsOf(body);
  const relationsFrom = (body: string, longitude: number) => findTransitHits({ [body]: series([longitude - 1, longitude, longitude + 1]) }, sun, own).map(hit => hit.relation);
  // Saturn: from 10° Aquarius (310°) Aries is the 3rd sign, from 10° Libra (190°) the 7th, from 10° Cancer (100°) the 10th; from Sagittarius (250°) it is the 5th: no aspect.
  assert.deepEqual([310, 190, 100, 250].map(longitude => relationsFrom('Saturn', longitude)), [[3], [7], [10], []]);
  // Mars: from 10° Capricorn (280°) Aries is the 4th, from 10° Virgo (160°) the 8th; from Scorpio (220°) the 6th: no aspect.
  assert.deepEqual([280, 160, 220].map(longitude => relationsFrom('Mars', longitude)), [[4], [8], []]);
  // Jupiter: from 10° Leo (130°) Aries is the 9th, from 10° Sagittarius (250°) the 5th.
  assert.deepEqual([130, 250].map(longitude => relationsFrom('Jupiter', longitude)), [[9], [5]]);
  // The relation is the same wherever the graha is: the same degree gives the same relation to any body that has it, and none to one that has not.
  assert.deepEqual([relationsFrom('Rahu', 310), relationsFrom('Rahu', 130), relationsFrom('Venus', 190), relationsFrom('Venus', 130)], [[], [9], [7], []]);
  // The old way still gives every graha the same list, counted from the point: the house of the graha from the point.
  assert.deepEqual(findTransitHits({ Saturn: series([129, 130, 131]) }, sun, HIT_RELATIONS).map(hit => hit.relation), [5]);
}

console.log('Transit hit relation tests passed');
