import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { calculateYogas, getPlanetsInRelativeSign } from './yogas';
import { classify, qualifyYogas } from './yogaStrength';

// ---------------------------------------------------------------------------
// The yoga engine and its strength scoring had no tests at all. These pin down
// the detection rules and the invariants that hold whatever the chart.
// ---------------------------------------------------------------------------
function planet(name: string, sign: number, degree = 15): PlanetData {
  return { name, sign, degree, longitude: (sign - 1) * 30 + degree, house: sign };
}

const ALL_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

// ---------------------------------------------------------------------------
// Relative-sign helper — the basis of most solar and lunar yogas
// ---------------------------------------------------------------------------
const sample = [planet('Mercury', 2), planet('Venus', 12), planet('Rahu', 2)];
// The 2nd from Aries is Taurus; Rahu is excluded as it is not an eligible planet.
assert.deepEqual(getPlanetsInRelativeSign(1, 2, sample).map((p) => p.name), ['Mercury']);
// The 12th from Aries wraps back to Pisces.
assert.deepEqual(getPlanetsInRelativeSign(1, 12, sample).map((p) => p.name), ['Venus']);
// The 1st from a sign is the sign itself.
assert.deepEqual(getPlanetsInRelativeSign(2, 1, sample).map((p) => p.name), ['Mercury']);
// Counting wraps around the zodiac rather than running off the end.
assert.deepEqual(getPlanetsInRelativeSign(12, 3, sample).map((p) => p.name), ['Mercury']);

// ---------------------------------------------------------------------------
// Solar yogas: Vesi (2nd from Sun), Vosi (12th), Ubhayachari (both)
// ---------------------------------------------------------------------------
const findYoga = (yogas: ReturnType<typeof calculateYogas>, id: string) => yogas.find((y) => y.id === id)!;

// Sun in Aries, Mercury in Taurus → Vesi only.
const vesiOnly = calculateYogas([planet('Sun', 1), planet('Mercury', 2), planet('Moon', 7)], 1);
assert.equal(findYoga(vesiOnly, 'vesi').status, 'active', 'a planet in the 2nd from the Sun makes Vesi');
assert.equal(findYoga(vesiOnly, 'vosi').status, 'inactive', 'nothing in the 12th, so no Vosi');
assert.equal(findYoga(vesiOnly, 'ubhayachari').status, 'inactive', 'Ubhayachari needs both sides');
assert.deepEqual(findYoga(vesiOnly, 'vesi').planetsInvolved, ['Mercury']);

// Sun in Aries, Mercury in Pisces → Vosi only.
const vosiOnly = calculateYogas([planet('Sun', 1), planet('Mercury', 12), planet('Moon', 7)], 1);
assert.equal(findYoga(vosiOnly, 'vosi').status, 'active', 'a planet in the 12th from the Sun makes Vosi');
assert.equal(findYoga(vosiOnly, 'vesi').status, 'inactive');

// Both sides occupied → all three fire.
const both = calculateYogas([planet('Sun', 1), planet('Mercury', 2), planet('Venus', 12), planet('Moon', 7)], 1);
assert.equal(findYoga(both, 'vesi').status, 'active');
assert.equal(findYoga(both, 'vosi').status, 'active');
assert.equal(findYoga(both, 'ubhayachari').status, 'active', 'both sides occupied makes Ubhayachari');
assert.deepEqual(
  [...findYoga(both, 'ubhayachari').planetsInvolved].sort(),
  ['Mercury', 'Venus'],
  'Ubhayachari names the planets from both sides without duplicates',
);

// The Moon and the nodes never count towards the solar yogas.
const moonAdjacent = calculateYogas([planet('Sun', 1), planet('Moon', 2), planet('Rahu', 12)], 1);
assert.equal(findYoga(moonAdjacent, 'vesi').status, 'inactive', 'the Moon does not make Vesi');
assert.equal(findYoga(moonAdjacent, 'vosi').status, 'inactive', 'Rahu does not make Vosi');

// ---------------------------------------------------------------------------
// Structural invariants across many arrangements
// ---------------------------------------------------------------------------
for (let ascendant = 1; ascendant <= 12; ascendant += 1) {
  for (const offset of [0, 3, 7]) {
    const planets = ALL_NAMES.map((name, index) => planet(name, ((index * 2 + offset) % 12) + 1, 10 + index));
    const yogas = calculateYogas(planets, ascendant);
    const label = `asc ${ascendant} offset ${offset}`;

    const ids = yogas.map((yoga) => yoga.id);
    assert.equal(new Set(ids).size, ids.length, `${label}: yoga ids must be unique`);

    for (const yoga of yogas) {
      assert.ok(yoga.name.length > 0, `${label}: ${yoga.id} needs a name`);
      assert.ok(yoga.rule.length > 0, `${label}: ${yoga.id} needs a rule`);
      assert.ok(yoga.resultText.length > 0, `${label}: ${yoga.id} needs result text`);
      assert.ok(['active', 'inactive'].includes(yoga.status), `${label}: ${yoga.id} status`);
      assert.ok(Array.isArray(yoga.planetsInvolved), `${label}: ${yoga.id} planetsInvolved`);
      for (const name of yoga.planetsInvolved) {
        assert.ok(ALL_NAMES.includes(name), `${label}: ${yoga.id} names a real planet, got ${name}`);
      }
    }

    // Strength must be present exactly for the active yogas.
    for (const qualified of qualifyYogas(yogas, planets)) {
      if (qualified.status === 'active') {
        assert.ok(typeof qualified.strength === 'number', `${label}: ${qualified.id} active needs a strength`);
        assert.ok(qualified.classification !== null, `${label}: ${qualified.id} active needs a classification`);
        assert.ok(Number.isFinite(qualified.strength!), `${label}: ${qualified.id} strength must be finite`);
        // The headline strength is the sum of the seven breakdown components.
        const summed = Object.values(qualified.breakdown!).reduce((a, b) => a + b, 0);
        assert.ok(
          Math.abs(qualified.strength! - summed) < 1e-9,
          `${label}: ${qualified.id} strength must equal its breakdown`,
        );
      } else {
        assert.equal(qualified.strength, null, `${label}: ${qualified.id} inactive has no strength`);
        assert.equal(qualified.classification, null, `${label}: ${qualified.id} inactive has no classification`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Classification thresholds
// ---------------------------------------------------------------------------
assert.equal(classify(200), 'Very Strong');
assert.equal(classify(151), 'Very Strong');
assert.equal(classify(150), 'Strong', '150 is the top of Strong, not Very Strong');
assert.equal(classify(75), 'Strong');
assert.equal(classify(74), 'Moderate');
assert.equal(classify(0), 'Moderate', 'zero is Moderate, not Weak');
assert.equal(classify(-1), 'Weak');

// ---------------------------------------------------------------------------
// Classification is judged per planet, not on the raw sum.
//
// Before v2.17 the label came from the sum, so a yoga naming more planets was
// pushed towards the extremes purely by its size. These charts place identical
// planets, so the per-planet quality is identical and the label must agree even
// though the sums differ.
// ---------------------------------------------------------------------------
const twoPlanets = [planet('Sun', 1), planet('Mercury', 2), planet('Venus', 2)];
const twoResult = qualifyYogas(calculateYogas(twoPlanets, 1), twoPlanets);
const vesiTwo = twoResult.find((yoga) => yoga.id === 'vesi')!;
assert.equal(vesiTwo.planetsInvolved.length, 2, 'two planets sit in the 2nd from the Sun');

const onePlanet = [planet('Sun', 1), planet('Mercury', 2)];
const oneResult = qualifyYogas(calculateYogas(onePlanet, 1), onePlanet);
const vesiOne = oneResult.find((yoga) => yoga.id === 'vesi')!;
assert.equal(vesiOne.planetsInvolved.length, 1, 'one planet sits in the 2nd from the Sun');

assert.ok(
  typeof vesiTwo.strengthPerPlanet === 'number' && typeof vesiOne.strengthPerPlanet === 'number',
  'both report a per-planet strength',
);
assert.ok(
  Math.abs(vesiTwo.strengthPerPlanet! - vesiTwo.strength! / 2) < 1e-9,
  'the per-planet strength is the sum over the participating planets',
);
assert.ok(
  Math.abs(vesiOne.strengthPerPlanet! - vesiOne.strength!) < 1e-9,
  'a single-planet yoga reports the same value both ways',
);
assert.equal(
  vesiTwo.classification,
  classify(vesiTwo.strengthPerPlanet!),
  'the classification follows the per-planet strength',
);

// A yoga with no named planets still classifies rather than dividing by zero.
const emptyYoga = qualifyYogas(
  [{ id: 'x', name: 'X', category: 'general', status: 'active', referencePlanet: 'Sun', planetsInvolved: [], rule: 'r', resultText: 't' }],
  [],
);
assert.equal(emptyYoga[0].strength, 0);
assert.equal(emptyYoga[0].strengthPerPlanet, 0);
assert.equal(emptyYoga[0].classification, 'Moderate');

// Naming a planet that is absent from the chart must not skew the average.
const missingPlanet = qualifyYogas(
  [{ id: 'y', name: 'Y', category: 'general', status: 'active', referencePlanet: 'Sun', planetsInvolved: ['Sun', 'Pluto'], rule: 'r', resultText: 't' }],
  [planet('Sun', 1)],
);
assert.ok(
  Math.abs(missingPlanet[0].strengthPerPlanet! - missingPlanet[0].strength!) < 1e-9,
  'only planets actually present count towards the average',
);

// ---------------------------------------------------------------------------
// The classical yogas (yogasClassical.ts): worked examples, house = sign counted from an Aries Lagna unless the chart says
// otherwise. The Moon is put 150° from the Sun where its phase matters (a benefic), and the nodes out of the way.
// ---------------------------------------------------------------------------
const chartOf = (placements: Record<string, number>, lagna = 1, moonDegree = 15): PlanetData[] =>
  ALL_NAMES.map((name) => {
    const sign = placements[name] ?? 12;
    const degree = name === 'Moon' ? moonDegree : name === 'Sun' ? 15 : 7;
    return { name, sign, degree, longitude: (sign - 1) * 30 + degree, house: ((sign - lagna + 12) % 12) + 1 };
  });
const active = (planets: PlanetData[], lagna = 1) => new Set(calculateYogas(planets, lagna).filter((y) => y.status === 'active').map((y) => y.id));

// Vajra: benefics in the 1st and 7th, malefics in the 4th and 10th, the rest anywhere. (Before the review it asked every
// planet to stand in those houses, which no chart in the sky can do.) Yava is the other way round.
const vajra = chartOf({ Jupiter: 1, Venus: 7, Sun: 4, Saturn: 10, Mars: 4, Mercury: 1, Moon: 2, Rahu: 6, Ketu: 12 });
assert.ok(active(vajra).has('nabhasa-vajra'), 'benefics in 1 and 7, malefics in 4 and 10');
assert.ok(!active(vajra).has('nabhasa-yava'));
const yava = chartOf({ Sun: 1, Mars: 7, Jupiter: 4, Venus: 10, Saturn: 1, Mercury: 4, Moon: 2 });
assert.ok(active(yava).has('nabhasa-yava'), 'malefics in 1 and 7, benefics in 4 and 10');
assert.ok(!active(yava).has('nabhasa-vajra'));
// One of the four houses missing its planet is no Vajra.
assert.ok(!active(chartOf({ Jupiter: 1, Venus: 7, Sun: 4, Saturn: 5, Mars: 5, Mercury: 1, Moon: 2 })).has('nabhasa-vajra'));

// Maala: benefics in three Kendras; Sarpa the same with malefics; the two cannot hold together, a Kendra with both counting for neither.
const maala = chartOf({ Jupiter: 1, Venus: 4, Mercury: 7, Sun: 2, Mars: 3, Saturn: 5, Moon: 6 });
assert.ok(active(maala).has('nabhasa-maala'));
assert.ok(!active(maala).has('nabhasa-sarpa'));
const mixedKendras = chartOf({ Jupiter: 1, Saturn: 1, Venus: 4, Sun: 4, Mercury: 7, Mars: 7, Moon: 10 });
assert.ok(!active(mixedKendras).has('nabhasa-maala') && !active(mixedKendras).has('nabhasa-sarpa'), 'every Kendra holds both kinds');

// An Ashraya yoga gives way to a Dala or Akriti yoga (Saravali): all in Aries and Cancer is Gada, and not Rajju; all in
// Aries is Rajju, and Gola with it, for only a Dala or Akriti yoga stops a Sankhya yoga here.
const gada = chartOf({ Sun: 1, Moon: 4, Mars: 1, Mercury: 4, Jupiter: 1, Venus: 4, Saturn: 1 });
assert.ok(active(gada).has('nabhasa-gada'));
assert.ok(!active(gada).has('nabhasa-rajju'), 'Gada stops the Ashraya yoga');
assert.ok(calculateYogas(gada, 1).find((y) => y.id === 'nabhasa-rajju')!.resultText.includes('Not counted'), 'and says so');
const oneSign = chartOf({ Sun: 1, Moon: 1, Mars: 1, Mercury: 1, Jupiter: 1, Venus: 1, Saturn: 1 });
assert.ok(active(oneSign).has('nabhasa-rajju') && active(oneSign).has('nabhasa-gola'), 'all in Aries: Rajju and Gola');

// The other Akriti yogas: the seven planets in the seven houses from the Lagna, one in each, is Nauka; and the Sankhya yoga
// of seven signs is not counted then.
const nauka = chartOf({ Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7 });
assert.ok(active(nauka).has('nabhasa-nauka'));
assert.ok(!active(nauka).has('nabhasa-veena'), 'Veena is not counted when an Akriti yoga holds');
// Planets in only some of the houses of a shape do not make it.
assert.ok(!active(chartOf({ Sun: 1, Moon: 1, Mars: 2, Mercury: 2, Jupiter: 3, Venus: 3, Saturn: 3 })).has('nabhasa-yupa'), 'Yupa needs all four houses 1-4 occupied');

// Neecha Bhanga: Mars is debilitated in Cancer, whose lord is the Moon, and the Moon is "in a Kendra from the Moon" whatever
// it does. That is no cancellation: the chart has to give another reason. (It once did.)
const marsInCancer = chartOf({ Mars: 4, Moon: 6, Sun: 2, Mercury: 2, Jupiter: 2, Venus: 3, Saturn: 5 });
assert.ok(!active(marsInCancer).has('neecha-bhanga'), 'the Moon in the 6th from the Lagna: no cancellation');
// The Moon in a Kendra from the Lagna does cancel it.
assert.ok(active(chartOf({ Mars: 4, Moon: 7, Sun: 2, Mercury: 2, Jupiter: 2, Venus: 3, Saturn: 5 })).has('neecha-bhanga'));
// Jupiter, exalted in Cancer, with the debilitated Mars cancels it too.
assert.ok(active(chartOf({ Mars: 4, Jupiter: 4, Moon: 6, Sun: 2, Mercury: 2, Venus: 3, Saturn: 5 })).has('neecha-bhanga'));
// The lord of the sign of exaltation (Saturn, for Mars) in a Kendra from the Lagna cancels it (Raman).
assert.ok(active(chartOf({ Mars: 4, Saturn: 10, Moon: 6, Sun: 2, Mercury: 2, Jupiter: 2, Venus: 3 })).has('neecha-bhanga'));

// Gajakesari: Jupiter in a Kendra from the Moon, joined by a benefic, not debilitated.
const gajakesari = chartOf({ Moon: 1, Jupiter: 4, Venus: 4, Sun: 8, Mars: 9, Mercury: 8, Saturn: 6 }, 1, 15);
assert.ok(active(gajakesari).has('gajakesari'));
assert.ok(!active(chartOf({ Moon: 1, Jupiter: 4, Sun: 8, Mars: 9, Mercury: 8, Venus: 9, Saturn: 6 })).has('gajakesari'), 'no benefic joins or aspects Jupiter');
assert.ok(!active(chartOf({ Moon: 1, Jupiter: 3, Venus: 3, Sun: 8, Mars: 9, Mercury: 8, Saturn: 6 })).has('gajakesari'), 'Jupiter in the 3rd from the Moon');

// Harsha, Sarala, Vimala; the exchanges and their classes; Dharma-Karmadhipati; Maha Raja.
const aries = (placements: Record<string, number>) => active(chartOf(placements));
assert.ok(aries({ Mercury: 8 }).has('harsha'), 'Aries Lagna: Mercury rules the 6th (Virgo); in the 8th it is Harsha');
assert.ok(!aries({ Mercury: 2 }).has('harsha'));
assert.ok(aries({ Mars: 5, Sun: 1 }).has('maha-raja'), 'the Lagna lord Mars in Leo and the 5th lord Sun in Aries exchange signs');
assert.ok(aries({ Mars: 5, Sun: 1 }).has('maha-parivartana'), 'the 1st and 5th houses are both good ones: also a Maha Parivartana');
assert.ok(aries({ Mars: 6, Mercury: 1 }).has('dainya-parivartana'), 'Mars in Virgo, Mercury (6th lord) in Aries: Dainya');
assert.ok(aries({ Venus: 3, Mercury: 2 }).has('khala-parivartana'), 'Mercury (3rd lord) in Taurus and Venus in Gemini: Khala');
assert.ok(aries({ Saturn: 5, Sun: 11 }).has('maha-parivartana'), 'Saturn (10th and 11th lord) in Leo and the Sun (5th) in Aquarius: Maha');

console.log('Yoga tests passed');
