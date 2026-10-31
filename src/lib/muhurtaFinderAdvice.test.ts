// "Why so few?": which choices limit the search, the criteria without one, and the search run again without each.
import assert from 'node:assert/strict';
import { adviseFinder, finderConstraints, withoutConstraint } from './muhurtaFinderAdvice';
import { runMuhurtaFinder } from './muhurtaFinderRun';
import type { FinderCriteria } from './muhurtaFinder';

const all = (size: number, first = 0) => Array.from({ length: size }, (_, index) => first + index);
const open: FinderCriteria = { vara: all(7), tithi: all(30, 1), nakshatra: all(27), yoga: all(27), karana: all(11), signs: {} };
const PLACE = { lat: 60.46667, lng: 26.94583, zone: 'Europe/Helsinki', tz: 2 };
const request = (criteria: FinderCriteria, days = 14) => ({ start: '2026-11-02', days, ...PLACE, ayanamsa: 'lahiri', nodeMode: 'mean', ayanamsaOffset: 0, criteria });

// Nothing chosen, nothing that limits.
assert.deepEqual(finderConstraints(open), []);

// The choices that limit, in the order of the panel.
const chosen: FinderCriteria = {
  ...open, vara: [1, 3], tithi: [2, 3], nakshatra: [4], signs: { Asc: [0, 1], Moon: [4] },
  rules: [{ kind: 'none', grahas: ['Saturn'], houses: [8] }, { kind: 'any', grahas: [], houses: [1] }],
  chandra: { moonSign: 0, houses: [1, 3] }, tara: { nakshatra: 0, taras: [2] }, avoid: ['panchanga', 'gandanta', 'not-a-dosha'],
  prefer: ['tithi'],
};
assert.deepEqual(finderConstraints(chosen), ['vara', 'nakshatra', 'sign:Asc', 'sign:Moon', 'rule:0', 'chandra', 'tara', 'dosha:panchanga', 'dosha:gandanta'],
  'a wish (the tithi) and a rule with no graha limit nothing; an id that is no doṣa is not looked at');

// Without a choice.
assert.deepEqual(withoutConstraint(chosen, 'vara').vara, all(7));
assert.deepEqual(withoutConstraint({ ...chosen, prefer: [], tithi: [1] }, 'tithi').tithi, all(30, 1), 'the tithis count from 1');
assert.deepEqual(withoutConstraint(chosen, 'sign:Asc').signs, { Moon: [4] });
assert.equal(withoutConstraint(chosen, 'rule:0').rules!.length, 1);
assert.equal(withoutConstraint(chosen, 'chandra').chandra, undefined);
assert.equal(withoutConstraint(chosen, 'tara').tara, undefined);
assert.deepEqual(withoutConstraint(chosen, 'dosha:panchanga').avoid, ['gandanta', 'not-a-dosha']);
assert.equal(withoutConstraint(chosen, 'unknown'), chosen);

async function main() {
  // A search that finds nothing: a Tuesday of the 1st tithi with the Moon in Aśvinī does not come within thirty days.
  const none: FinderCriteria = { ...open, vara: [2], nakshatra: [0], tithi: [1] };
  const empty = await runMuhurtaFinder(request(none, 30));
  assert.equal(empty.windows.length, 0, 'a Tuesday of the 1st tithi in Aśvinī within a month: not found in these thirty days');
  const advice = await adviseFinder(request(none, 30));
  assert.equal(advice.baseline.stretches, 0);
  assert.equal(advice.partial, false);
  assert.deepEqual(advice.items.map(item => item.key).sort(), ['nakshatra', 'tithi', 'vara']);
  // Without the vāra the search finds what the other two give; each answer is the search run without that choice.
  for (const item of advice.items) {
    const direct = await runMuhurtaFinder(request(withoutConstraint(none, item.key), 30));
    assert.equal(item.stretches, direct.windows.length, item.key);
  }
  assert.ok(advice.items[0].days >= advice.items[1].days && advice.items[1].days >= advice.items[2].days, 'the choice that gives back the most is first');
  assert.ok(advice.items[0].days > 0, 'letting one go gives something back');

  // The time runs out: the choices not looked at are left out and it is said.
  let clock = 0;
  const hurried = await adviseFinder(request(none, 30), 1000, () => (clock += 600));
  assert.equal(hurried.partial, true);
  assert.ok(hurried.items.length < 3);
  console.log('Advice tests passed');
}
main();
