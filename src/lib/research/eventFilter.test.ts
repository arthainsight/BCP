import assert from 'node:assert/strict';
import { eventMatches, filterWords, matchesText, textTerms } from './eventFilter';

const event = (name: string, category = 'other', tags: string[] = [], notes = '') => ({ name, category, tags, notes });
const all = { category: 'all', tag: '', text: '' };

// --- The words of a search -----------------------------------------------------------------------------------------------------------------------------
assert.deepEqual(textTerms('Muutto, muutin; Tapaturma\n  kolari  '), ['muutto', 'muutin', 'tapaturma', 'kolari']);
assert.deepEqual(textTerms('  ,; '), []);
assert.deepEqual(textTerms(''), []);
assert.deepEqual(textTerms('ÄÄNI'), ['ääni'], 'Finnish capitals fold to lower case');

// --- Words are found in the name, a tag or the notes, in any case, any one of them being enough ------------------------------------------------------------
assert.equal(matchesText(event('Muutto Ouluun'), 'muutto'), true);
assert.equal(matchesText(event('MUUTTO ouluun'), 'Muutto'), true, 'in any case');
assert.equal(matchesText(event('Uusi työ'), 'muutto'), false);
assert.equal(matchesText(event('Uusi työ'), 'muutto, työ'), true, 'one of the words is enough');
assert.equal(matchesText(event('Kolari', 'other', ['tapaturma']), 'tapaturma'), true, 'in a tag');
assert.equal(matchesText(event('Kolari', 'other', [], 'jalka murtui, tapaturma'), 'tapaturma'), true, 'in the notes');
assert.equal(matchesText(event('Anything'), ''), true, 'no words, no condition');
assert.equal(matchesText(event('Anything'), ' , '), true);
assert.equal(matchesText(event('Muuttopäivä'), 'muutto'), true, 'a word inside a longer one');

// --- The three conditions together --------------------------------------------------------------------------------------------------------------------------
{
  const moved = event('Muutto Ouluun', 'home', ['abroad']);
  assert.equal(eventMatches(moved, all), true);
  assert.equal(eventMatches(moved, { ...all, category: 'home' }), true);
  assert.equal(eventMatches(moved, { ...all, category: 'work' }), false);
  assert.equal(eventMatches(moved, { ...all, tag: 'abroad' }), true);
  assert.equal(eventMatches(moved, { ...all, tag: 'other' }), false);
  assert.equal(eventMatches(moved, { ...all, text: 'muutto' }), true);
  assert.equal(eventMatches(moved, { category: 'home', tag: 'abroad', text: 'muutto' }), true);
  assert.equal(eventMatches(moved, { category: 'home', tag: 'abroad', text: 'kolari' }), false, 'every condition has to hold');
  // Events that came in with no category: the words pick them out.
  assert.equal(eventMatches(event('Muutto Ouluun', 'other'), { ...all, text: 'muutto' }), true);
}

// --- A set in words, for a heading ---------------------------------------------------------------------------------------------------------------------------
assert.deepEqual(filterWords(all), []);
assert.deepEqual(filterWords({ category: 'home', tag: 'abroad', text: 'Muutto, muutin' }), ['home', 'abroad', 'muutto', 'muutin']);

console.log('Event filter tests passed');
