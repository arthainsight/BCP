import assert from 'node:assert/strict';
import { GRAHAS, grahaCode, grahaCodeFromEnglishCode, grahaName, translateGrahas } from './grahaNames';

// --- English is the default and leaves everything as it is ---------------------------------
for (const graha of GRAHAS) assert.equal(grahaName(graha), graha);
assert.deepEqual(GRAHAS.map(g => grahaCode(g)), ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']);
assert.equal(translateGrahas('Rahu – Rahu – Moon'), 'Rahu – Rahu – Moon');
assert.equal(grahaName('Asc'), 'Ascendant');

// --- Sanskrit names and codes --------------------------------------------------------------
assert.deepEqual(GRAHAS.map(g => grahaName(g, 'sanskrit')), ['Sūrya', 'Candra', 'Maṅgala', 'Budha', 'Guru', 'Śukra', 'Śani', 'Rāhu', 'Ketu']);
assert.deepEqual(GRAHAS.map(g => grahaCode(g, 'sanskrit')), ['Su', 'Ch', 'Ma', 'Bu', 'Gu', 'Sk', 'Sa', 'Ra', 'Ke']);
assert.equal(grahaName('Asc', 'sanskrit'), 'Lagna');
assert.equal(grahaCode('Asc', 'sanskrit'), 'La');

// --- Every graha has its own code, in both styles --------------------------------------------
for (const style of ['english', 'sanskrit'] as const) {
  assert.equal(new Set(GRAHAS.map(g => grahaCode(g, style))).size, 9, `${style}: nine different codes`);
}

// --- Names inside a text, whole words only -------------------------------------------------------
assert.equal(translateGrahas('Bhadrika (Mercury) – Siddha (Venus)', 'sanskrit'), 'Bhadrika (Budha) – Siddha (Śukra)');
assert.equal(translateGrahas('Rahu – Rahu – Moon', 'sanskrit'), 'Rāhu – Rāhu – Candra');
assert.equal(translateGrahas('Jupiter Saturn Sunday', 'sanskrit'), 'Guru Śani Sunday', 'Sunday is not the Sun');

// --- Unknown names are not invented ---------------------------------------------------------------
assert.equal(grahaName('Chiron', 'sanskrit'), 'Chiron');
assert.equal(grahaCode('Chiron', 'sanskrit'), 'Ch');

// --- A nakṣatra's lord is given with an English code; it follows the style ------------------------------
assert.equal(grahaCodeFromEnglishCode('Mo'), 'Mo');
assert.equal(grahaCodeFromEnglishCode('Mo', 'sanskrit'), 'Ch');
assert.equal(grahaCodeFromEnglishCode('Ju', 'sanskrit'), 'Gu');
assert.equal(grahaCodeFromEnglishCode('Xx', 'sanskrit'), 'Xx');

console.log('Graha name tests passed');
