import assert from 'node:assert/strict';
import type { StoredDashaEvent } from './dashaEventStore';
import { CLASSIFY_PRESETS, classifyEvents } from './dashaEventClassify';

const event = (id: string, name: string, category: StoredDashaEvent['category'] = 'other', tags: string[] = [], notes = ''): StoredDashaEvent => ({
  id, name, date: '2015-06-15', category, varga: 'D1', notes, tags, significance: 3,
});
const list = [
  event('1', 'Muutto Ouluun'),
  event('2', 'Moved to Berlin', 'work'),
  event('3', 'Uusi työ'),
  event('4', 'Kolari', 'other', ['tapaturma']),
  event('5', 'Muutin Helsinkiin', 'home', ['move']),
  event('6', 'Putosin pyörältä', 'other', [], 'tapaturma, käsi murtui'),
];

// --- The words find the events; the rule gives them a category and a tag ------------------------------------------------------------------------------------
{
  const result = classifyEvents(list, { words: 'muutto, muutin, moved', category: 'home', tag: 'move', onlyOther: false });
  assert.deepEqual(result.matched.map(item => item.id), ['1', '2', '5']);
  assert.equal(result.changed, 2, 'the fifth has the category and the tag already');
  const byId = new Map(result.events.map(item => [item.id, item]));
  assert.deepEqual([byId.get('1')!.category, byId.get('1')!.tags], ['home', ['move']]);
  assert.deepEqual([byId.get('2')!.category, byId.get('2')!.tags], ['home', ['move']], 'an event in another category is moved when the rule is for all');
  assert.equal(byId.get('5'), list[4], 'an event that needs no change is the very same object');
  assert.equal(byId.get('3'), list[2], 'an event that does not fit is left as it is');
  assert.equal(result.events.length, list.length);
  assert.deepEqual(list[0].tags, [], 'the list given is not changed');
}

// --- Only the events still in "other" --------------------------------------------------------------------------------------------------------------------------
{
  const result = classifyEvents(list, { words: 'muutto, muutin, moved', category: 'home', tag: 'move', onlyOther: true });
  assert.deepEqual(result.matched.map(item => item.id), ['1'], 'the ones sorted by hand are left alone');
  assert.equal(result.events.find(item => item.id === '2')!.category, 'work');
}

// --- A tag alone, a category alone, and the tag not twice --------------------------------------------------------------------------------------------------------
{
  const tagged = classifyEvents(list, { words: 'tapaturma', tag: 'accident', onlyOther: false });
  assert.deepEqual(tagged.matched.map(item => item.id), ['4', '6'], 'a word in a tag and a word in the notes');
  assert.deepEqual(tagged.events.find(item => item.id === '4')!.tags, ['tapaturma', 'accident']);
  assert.equal(tagged.events.find(item => item.id === '4')!.category, 'other', 'the category is left when none is given');
  const again = classifyEvents(tagged.events, { words: 'tapaturma', tag: 'ACCIDENT', onlyOther: false });
  assert.equal(again.changed, 0, 'the tag is not added twice, in any case');
  const categoryOnly = classifyEvents(list, { words: 'kolari', category: 'health', onlyOther: false });
  assert.equal(categoryOnly.events.find(item => item.id === '4')!.category, 'health');
  assert.deepEqual(categoryOnly.events.find(item => item.id === '4')!.tags, ['tapaturma']);
  assert.equal(classifyEvents(list, { words: 'kolari', onlyOther: false }).changed, 0, 'no category and no tag: nothing to change');
}

// --- No words, no events: never everything ---------------------------------------------------------------------------------------------------------------------------
{
  const result = classifyEvents(list, { words: '  , ', category: 'home', tag: 'x', onlyOther: false });
  assert.deepEqual([result.matched.length, result.changed], [0, 0]);
  assert.deepEqual(result.events, list);
  assert.deepEqual(classifyEvents([], { words: 'muutto', category: 'home', onlyOther: false }).events, []);
}

// --- The sets of words ------------------------------------------------------------------------------------------------------------------------------------------------
{
  assert.equal(new Set(CLASSIFY_PRESETS.map(preset => preset.key)).size, CLASSIFY_PRESETS.length);
  assert.ok(CLASSIFY_PRESETS.every(preset => preset.words.split(',').length >= 3 && preset.tag && preset.label));
  const preset = (key: string) => CLASSIFY_PRESETS.find(item => item.key === key)!;
  const found = (key: string, text: string[]) => classifyEvents(text.map((name, i) => event(String(i), name)), { words: preset(key).words, onlyOther: false }).matched.length;
  assert.equal(found('move', ['Muutto Ouluun', 'We moved to Berlin', 'Relocated for work', 'Muutin pois', 'Uusi työ', 'Maanantai']), 4);
  assert.equal(found('marriage', ['Häät', 'Got married', 'Naimisiin 2010', 'Avioliitto', 'Uusi työ']), 4);
  assert.equal(found('accident', ['Kolari', 'Car accident', 'Murtui jalka', 'Loukkaantui', 'Muutto']), 4);
  assert.equal(found('death', ['Isä kuoli', 'Funeral', 'Hautajaiset', 'Muutto']), 3);
  assert.equal(found('job', ['New job at the bank', 'Uusi työ', 'Ylennys', 'Muutto']), 3);
  // A set gives a category and a tag that fit it.
  assert.deepEqual([preset('move').category, preset('marriage').category, preset('accident').category, preset('child').category], ['home', 'relationship', 'health', 'family']);
}

console.log('Event classification tests passed');
