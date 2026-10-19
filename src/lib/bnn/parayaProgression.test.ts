import assert from 'node:assert/strict';
import type { ParayaHit } from './parayaHits';
import { PROGRESSION_NATAL, filterHits, formatHitDay, formatHitDayShort, groupByMonth, limitGroups, nextHitOf, overviewOf } from './parayaProgression';
import { HIT_RELATIONS, PROGRESSION_RELATIONS, RELATION_OFFSET } from '@/lib/transitHits';

const hit = (body: ParayaHit['body'], natal: string, relation: ParayaHit['relation'], year: number, month: number, day: number): ParayaHit => {
  const time = new Date(year, month - 1, day, 12).getTime();
  return { body, natal, relation, ageYears: 10, time };
};
const hits: ParayaHit[] = [
  hit('Jupiter', 'Sun', 1, 2026, 11, 5),
  hit('Saturn', 'Moon', 5, 2026, 11, 20),
  hit('Jupiter', 'Sun', 9, 2027, 1, 2),
  hit('Venus', 'Sun', 7, 2026, 12, 24),
  hit('Venus', 'Sun', 1, 2026, 12, 3),
  hit('Rahu', 'Asc', 7, 2027, 1, 30),
];

// The relations: the progressions have the 7th as well, the transits and the old Paraya list have not.
assert.deepEqual(PROGRESSION_RELATIONS, [1, 5, 7, 9]);
assert.deepEqual(HIT_RELATIONS, [1, 5, 9]);
assert.equal(RELATION_OFFSET[7], 180, 'the 7th sign is half a circle on');
assert.deepEqual(PROGRESSION_NATAL, ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Asc']);

// --- The filter -----------------------------------------------------------------------------------------------------------
const all = { bodies: ['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Mars', 'Mercury', 'Venus'] as const, relations: [1, 5, 7, 9] as const };
assert.equal(filterHits(hits, all).length, 6);
assert.equal(filterHits(hits, { ...all, bodies: ['Jupiter', 'Saturn'] }).length, 3, 'the grahas that are chosen');
assert.equal(filterHits(hits, { ...all, relations: [7] }).length, 2, 'only the 7th');
assert.equal(filterHits(hits, { ...all, relations: [] }).length, 0);
assert.equal(filterHits(hits, { ...all, body: 'Venus', natal: 'Sun' }).length, 2, 'a cell of the overview');
assert.equal(filterHits(hits, { ...all, body: 'Venus', natal: 'Moon' }).length, 0);
assert.equal(filterHits(hits, { ...all, natal: 'Sun' }).length, 4);
assert.equal(filterHits(hits, { ...all, body: null, natal: null }).length, 6, 'no cell chosen is no filter');

// --- The overview and the next hit -----------------------------------------------------------------------------------------
const cells = overviewOf(hits);
assert.equal(cells.get('Jupiter|Sun')!.count, 2);
assert.equal(cells.get('Jupiter|Sun')!.first.relation, 1, 'the first of the two is the earlier one');
assert.equal(cells.get('Venus|Sun')!.first.relation, 1, 'the 1st on the 3rd of December comes before the 7th on the 24th, though it is later in the list');
assert.equal(cells.get('Saturn|Moon')!.count, 1);
assert.equal(cells.get('Mars|Sun'), undefined, 'no hit, no cell');
const next = nextHitOf(hits);
assert.equal(next.get('Venus')!.relation, 1);
assert.equal(next.get('Jupiter')!.natal, 'Sun');
assert.equal(next.get('Mars'), undefined);

// --- Months ------------------------------------------------------------------------------------------------------------------
const months = groupByMonth(hits);
assert.deepEqual(months.map(group => [group.key, group.hits.length]), [['2026-11', 2], ['2026-12', 2], ['2027-01', 2]]);
assert.deepEqual(months[1].hits.map(item => item.relation), [1, 7], 'in the order of time inside the month');
assert.equal(months[0].year, 2026);
assert.equal(months[0].month, 10, 'November is 10');
assert.deepEqual(groupByMonth([]), []);
// Hits given out of order come out in order.
assert.deepEqual(groupByMonth([...hits].reverse()).map(group => group.key), ['2026-11', '2026-12', '2027-01']);

// --- The first rows only: a limit cuts in the middle of a month and leaves out the months after it ----------------------------------
assert.deepEqual(limitGroups(months, 3).map(group => [group.key, group.rows.length]), [['2026-11', 2], ['2026-12', 1]]);
assert.deepEqual(limitGroups(months, 2).map(group => group.key), ['2026-11'], 'a month with none of the rows shown is left out');
assert.deepEqual(limitGroups(months, null).map(group => group.rows.length), [2, 2, 2], 'null shows them all');
assert.deepEqual(limitGroups(months, 0), []);
assert.equal(limitGroups(months, 3)[1].hits.length, 2, 'the group still knows how many hits it has');

// --- Dates --------------------------------------------------------------------------------------------------------------------
assert.equal(formatHitDay(new Date(2026, 9, 9, 8).getTime()), '09.10.2026');
assert.equal(formatHitDayShort(new Date(2026, 9, 9, 8).getTime()), '09.10.26');

console.log('Paraya progression tests passed');
