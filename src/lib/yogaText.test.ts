import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { calculateYogas } from './yogas';
import { translateYogaReference, translateYogaText } from './yogaText';

// ---------------------------------------------------------------------------
// The reasons the yoga engine writes are shown in the Yoga table. In Finnish
// every sentence shape must be recognised — an English sentence left behind
// means a pattern in yogaText.ts has drifted from yogas.ts.
// ---------------------------------------------------------------------------
assert.equal(translateYogaText('Moon in house 4 (Kendra)', 'en'), 'Moon in house 4 (Kendra)', 'English passes through');
assert.equal(translateYogaText('Moon in house 4 (Kendra)', 'fi'), 'Moon talossa 4 (Kendra)');
assert.equal(translateYogaText('Mercury in 2nd from Sun', 'fi'), 'Mercury 2. merkissä Auringosta');
assert.equal(translateYogaText('12th: Venus; 2nd: Mercury, Mars', 'fi'), '12.: Venus; 2.: Mercury, Mars');
assert.equal(translateYogaText('Moon is in the 8th sign from Jupiter', 'fi'), 'Moon on Jupiterista lukien 8. merkissä');
assert.equal(translateYogaText('Sun and Mercury in Aries', 'fi'), 'Sun ja Mercury merkissä Aries');
assert.equal(translateYogaText('Sun and Mercury in Aries — Mercury combust (3.2° from Sun)', 'fi'), 'Sun ja Mercury merkissä Aries — Mercury polttunut (3.2° Auringosta)');
assert.equal(translateYogaText('Nothing like it', 'fi'), 'Nothing like it', 'unknown text stays as it is');
assert.equal(translateYogaReference('Lagna lord, Kendras and Trikonas', 'fi'), 'Lagnan herra, Kendrat ja Trikonat');
assert.equal(translateYogaReference('Sun, Mercury, 10th lord', 'fi'), 'Aurinko, Mercury, 10. herra', 'a label without an entry of its own is translated part by part');
assert.equal(translateYogaReference('9th lord', 'en'), '9th lord');
// The Finnish of Matsya was half English once, because a general pattern for "Benefics in houses …" came first.
assert.equal(translateYogaText('Benefics in houses 1 and 9, benefic and malefic in the 5th, malefics in houses 4 and 8', 'fi'), 'Hyväntekijät taloissa 1 ja 9, hyväntekijä ja pahantekijä 5. talossa, pahantekijät taloissa 4 ja 8');
assert.equal(translateYogaText('Benefics in houses 2, 12, 8 from the sign of the 2nd lord', 'fi'), 'Hyväntekijät taloissa 2, 12 ja 8 (2. herran merkistä lukien)');
assert.equal(translateYogaText('Two or more benefics in house 10: Moon, Jupiter, Venus', 'fi'), 'Vähintään kaksi hyväntekijää talossa 10: Moon, Jupiter, Venus');
assert.equal(translateYogaText('9th lord is debilitated', 'fi'), '9. herra on heikennetty');
assert.equal(translateYogaText('Lagna lord is neither in its own, exaltation or friendly sign nor in a Kendra or Trikona', 'fi'), 'Lagnan herra ei ole omassa, korotus- eikä ystävän merkissään eikä Kendrassa tai Trikonassa');

const planet = (name: string, sign: number, house = sign, degree = 15): PlanetData => ({
  name, sign, degree, longitude: (sign - 1) * 30 + degree, house,
});
const NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
// Several charts so that both the active and the inactive wording of each yoga is produced.
const charts: PlanetData[][] = [
  NAMES.map((name, i) => planet(name, i + 1)),
  NAMES.map((name, i) => planet(name, ((i * 5) % 12) + 1)),
  NAMES.map((name, i) => planet(name, ((i * 7 + 3) % 12) + 1)),
  NAMES.map(name => planet(name, 1)),
  [planet('Sun', 1), planet('Moon', 4), planet('Mars', 10), planet('Mercury', 2), planet('Jupiter', 4), planet('Venus', 12), planet('Saturn', 7), planet('Rahu', 3), planet('Ketu', 9)],
  [planet('Sun', 1), planet('Moon', 2), planet('Mars', 10), planet('Mercury', 12), planet('Jupiter', 8), planet('Venus', 7), planet('Saturn', 7), planet('Rahu', 6), planet('Ketu', 12)],
];
const untranslated = new Set<string>();
let checked = 0;
for (const planets of charts) {
  for (const ascendantSign of [1, 5, 9]) {
    for (const yoga of calculateYogas(planets, ascendantSign)) {
      for (const segment of yoga.resultText.split('; ')) {
        if (translateYogaText(segment, 'fi') === segment) untranslated.add(`${yoga.id}: ${segment}`);
      }
      checked += 1;
    }
  }
}
assert.ok(checked > 100, 'the loop covered many yoga results');
assert.deepEqual([...untranslated], [], 'every reason the yoga engine writes has a Finnish pattern');

// Many random charts, so that every wording of every yoga turns up: each segment has a pattern and nothing of the
// English sentence is left behind (planet and sign names are the same in both languages).
{
  let seed = 7;
  const random = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const ENGLISH_LEFT = /\b(the|not|is|are|and|from|with|aspects|joins|enemy|exchange|No|Not|Planets in|none|benefics?|malefics?|lords?|houses?|signs?|debilitated|friendly|itself|neither|nor|counted|holds?|exalted|dignified|Dignified)\b/;
  const leftBehind = new Set<string>();
  const seen = new Set<string>();
  for (let index = 0; index < 4000; index++) {
    const ascendant = Math.floor(random() * 12) + 1;
    // Some charts crowd the planets into few signs, so the Nabhasa and Sankhya yogas turn up.
    const spread = index % 4 === 0 ? 3 : index % 4 === 1 ? 6 : 12;
    const start = Math.floor(random() * 12);
    const planets = NAMES.map(name => planet(name, ((start + Math.floor(random() * spread)) % 12) + 1, undefined, random() * 30))
      .map(item => ({ ...item, house: ((item.sign - ascendant + 12) % 12) + 1 }));
    for (const yoga of calculateYogas(planets, ascendant)) {
      // The Reference column: no label may keep an English phrase (planet names are the same in both languages).
      const reference = translateYogaReference(yoga.referencePlanet, 'fi');
      if (/\b(lords?|houses?|Houses|Kendras|dispositors|planets?|Exchanging|Debilitated|and its|and 5th|9th|10th|5th|6th|7th|2nd|4th|8th|12th)\b/.test(reference)) leftBehind.add(`${yoga.id} reference: ${yoga.referencePlanet} -> ${reference}`);
      for (const segment of yoga.resultText.split('; ')) {
        seen.add(`${yoga.id}: ${segment}`);
        const finnish = translateYogaText(segment, 'fi');
        if (finnish === segment || ENGLISH_LEFT.test(finnish)) leftBehind.add(`${yoga.id}: ${segment} -> ${finnish}`);
      }
    }
  }
  assert.ok(seen.size > 200, 'the random charts produced many different wordings');
  assert.deepEqual([...leftBehind].slice(0, 20), [], 'every wording is translated, with nothing English left in it');
}
