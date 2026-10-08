import assert from 'node:assert/strict';
import { NAKSHATRAS, TARAS, buildNavatara, nakshatraIndex, taraNumber } from './navatara';

// --- Nakṣatra of a longitude ----------------------------------------------------
assert.equal(nakshatraIndex(0), 0, '0° is Ashwini');
assert.equal(nakshatraIndex(13.4), 1, 'just past 13°20′ is Bharani');
assert.equal(nakshatraIndex(359.9), 26, 'the end of the zodiac is Revati');
assert.equal(nakshatraIndex(-1), 26, 'a negative longitude wraps');
assert.equal(nakshatraIndex(10, 5), 1, 'the adjustment moves the boundary');

// --- Tara numbers: nine in turn, three rounds of the 27 --------------------------
assert.equal(taraNumber(3, 3), 1, 'the reference nakṣatra is Janma');
assert.equal(taraNumber(3, 4), 2, 'the next is Sampat');
assert.equal(taraNumber(3, 11), 9, 'the ninth is Ati-Mitra');
assert.equal(taraNumber(3, 12), 1, 'the tenth is Janma again');
assert.equal(taraNumber(3, 21), 1, 'and the nineteenth');
assert.equal(taraNumber(26, 0), 2, 'counting wraps past Revati');
assert.equal(taraNumber(5, 4), 9, 'one back is the 27th, Ati-Mitra');

// --- The chakra: nine groups of three, every nakṣatra once ------------------------
const natal = [{ name: 'Moon', longitude: 40 }, { name: 'Sun', longitude: 100 }];
const { reference, groups } = buildNavatara(40, natal, [{ name: 'Jupiter', longitude: 41 }]);
assert.equal(reference, 3, 'Moon at 40° is in Rohini');
assert.equal(groups.length, 9);
assert.deepEqual(groups.map(g => g.tara.name), TARAS.map(t => t.name));
const all = groups.flatMap(g => g.nakshatras.map(n => n.index)).sort((a, b) => a - b);
assert.deepEqual(all, Array.from({ length: 27 }, (_, i) => i), 'all 27 nakṣatras appear exactly once');
assert.deepEqual(groups[0].nakshatras.map(n => n.name), ['Rohini', 'Hasta', 'Shravana'], 'Janma tara: 1st, 10th and 19th');
assert.deepEqual(groups[0].nakshatras.map(n => n.count), [1, 10, 19]);
assert.deepEqual(groups[0].nakshatras[0].natal, ['Moon']);
assert.deepEqual(groups[0].nakshatras[0].transit, ['Jupiter']);
for (const group of groups) {
  for (const nak of group.nakshatras) assert.equal(taraNumber(reference, nak.index), group.tara.number, `${NAKSHATRAS[nak.index]} in ${group.tara.name}`);
}
const sunNak = groups.flatMap(g => g.nakshatras).find(n => n.natal.includes('Sun'));
assert.equal(sunNak?.name, 'Pushya', 'Sun at 100° is in Pushya');

console.log('Nava-Tara tests passed');
