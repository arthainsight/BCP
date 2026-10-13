import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { calculateYogas } from './yogas';
import { translateYogaText } from './yogaText';

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
