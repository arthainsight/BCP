import assert from 'node:assert/strict';
import { FAQ_ENTRIES, FAQ_SECTIONS, filterFaq, normalizeSearch } from './faq';

// --- The guide is complete in both languages ---------------------------------------
const ids = FAQ_ENTRIES.map(entry => entry.id);
assert.equal(new Set(ids).size, ids.length, 'every entry has its own id');
for (const id of ids) assert.match(id, /^[a-z]+(-[a-z]+)*$/, `${id} is a plain address`);

const sectionIds = FAQ_SECTIONS.map(section => section.id);
assert.equal(new Set(sectionIds).size, sectionIds.length, 'every section has its own id');
assert.ok(ids.every(id => !sectionIds.map(section => `section-${section}`).includes(id)), 'no entry takes the address of a section');

for (const section of FAQ_SECTIONS) {
  assert.ok(section.title.en.trim() && section.title.fi.trim(), `${section.id} is named in both languages`);
  assert.ok(FAQ_ENTRIES.some(entry => entry.section === section.id), `${section.id} has questions`);
}

for (const entry of FAQ_ENTRIES) {
  assert.ok(sectionIds.includes(entry.section), `${entry.id} is in a section that exists`);
  assert.ok(entry.q.en.trim() && entry.q.fi.trim(), `${entry.id} has a question in both languages`);
  assert.notEqual(entry.q.en, entry.q.fi, `${entry.id}: the Finnish question is translated`);
  assert.ok(entry.a.en.length > 0 && entry.a.en.length === entry.a.fi.length, `${entry.id}: the same number of paragraphs in both languages`);
  for (const paragraph of [...entry.a.en, ...entry.a.fi]) assert.ok(paragraph.trim().length > 20, `${entry.id}: no empty paragraph`);
  entry.a.fi.forEach((paragraph, index) => assert.notEqual(entry.a.en[index], paragraph, `${entry.id}: the Finnish answer is translated`));
}

// --- Search ---------------------------------------------------------------------------
assert.equal(normalizeSearch('Daśā  Nakṣatra'), 'dasa  naksatra');
assert.equal(filterFaq(FAQ_ENTRIES, '', 'en').length, FAQ_ENTRIES.length, 'an empty search shows everything');
assert.equal(filterFaq(FAQ_ENTRIES, '   ', 'fi').length, FAQ_ENTRIES.length);

const recording = filterFaq(FAQ_ENTRIES, 'record screen', 'en').map(entry => entry.id);
assert.ok(recording.includes('recording'), 'every word is looked for, in any order');
assert.ok(filterFaq(FAQ_ENTRIES, 'RECORD', 'en').some(entry => entry.id === 'recording'), 'case does not matter');

assert.ok(filterFaq(FAQ_ENTRIES, 'dasa', 'en').some(entry => entry.id === 'dasha-systems'), 'dasa finds daśā');
assert.ok(filterFaq(FAQ_ENTRIES, 'nakshatra', 'fi').some(entry => entry.id === 'nakshatra-zodiac'), 'nakshatra finds nakṣatra');
assert.ok(filterFaq(FAQ_ENTRIES, 'kamm', 'fi').some(entry => entry.section === 'palm'), 'the Finnish text is searched in Finnish');
assert.deepEqual(filterFaq(FAQ_ENTRIES, 'tallennus', 'en'), [], 'the other language is not searched');
assert.deepEqual(filterFaq(FAQ_ENTRIES, 'zzzqqq', 'en'), [], 'a word that is nowhere finds nothing');
assert.deepEqual(filterFaq(FAQ_ENTRIES, 'record zzzqqq', 'en'), [], 'all the words have to be there');
