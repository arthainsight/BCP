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

// ---------------------------------------------------------------------------
// The BPHS yogas (yogasBphs.ts): worked examples on an Aries Lagna (house = sign), every classical planet placed. The nodes
// stand in Pisces unless a case says so; the Moon is a benefic when it is 180° from the Sun.
// ---------------------------------------------------------------------------
const full = (placements: Record<string, number>) => {
  const planets = chartOf({ Sun: 3, Moon: 9, Mars: 3, Mercury: 3, Jupiter: 3, Venus: 3, Saturn: 3, ...placements });
  return planets;
};
const has = (placements: Record<string, number>, id: string) => active(full(placements)).has(id);

// Lagna yogas: a benefic (Subha) or a malefic (Asubha) in the Lagna, or benefics (or malefics) in both the 12th and the 2nd.
assert.ok(has({ Jupiter: 1 }, 'subha') && !has({ Jupiter: 1 }, 'asubha'));
assert.ok(has({ Saturn: 1 }, 'asubha') && !has({ Saturn: 1 }, 'subha'));
assert.ok(has({ Jupiter: 12, Venus: 2 }, 'subha-kartari') && has({ Jupiter: 12, Venus: 2 }, 'subha'), 'benefics on both sides are Subha too (BPHS 36.2)');
assert.ok(has({ Saturn: 12, Mars: 2 }, 'papa-kartari') && has({ Saturn: 12, Mars: 2 }, 'asubha'));
assert.ok(has({ Jupiter: 1, Saturn: 12, Mars: 2 }, 'subha') && has({ Jupiter: 1, Saturn: 12, Mars: 2 }, 'asubha'), 'Subha and Asubha can both hold');
assert.ok(!has({ Jupiter: 12, Venus: 5 }, 'subha-kartari'), 'both flanks are needed');
assert.ok(has({ Saturn: 12, Mars: 2 }, 'papa-kartari'));

// Vasumati: how many of Jupiter, Venus and Mercury stand in the 3rd, 6th, 10th or 11th from the Moon (here the Moon is in Aries).
const upachaya = (placements: Record<string, number>) => ({ Moon: 1, Sun: 7, ...placements });
assert.ok(has(upachaya({ Jupiter: 3, Venus: 6, Mercury: 10 }), 'vasumati-all'));
assert.ok(has(upachaya({ Jupiter: 3, Venus: 6, Mercury: 2 }), 'vasumati-two') && !has(upachaya({ Jupiter: 3, Venus: 6, Mercury: 2 }), 'vasumati-all'));
assert.ok(has(upachaya({ Jupiter: 3, Venus: 2, Mercury: 2 }), 'vasumati-one'));
assert.ok(!has(upachaya({ Jupiter: 2, Venus: 2, Mercury: 2 }), 'vasumati-one'), 'none: no Vasumati of any kind');

// Kemadruma (BPHS 37.11-13): nothing with the Moon or in the 2nd or 12th from it. A planet in a Kendra from the Lagna or from the
// Moon cancels it: then Kemadruma Bhanga holds instead and Kemadruma does not; a planet with the Moon, or next to it, means none
// at all.
const alone = { Moon: 1, Sun: 1, Mars: 3, Mercury: 3, Jupiter: 3, Venus: 3, Saturn: 3 };
assert.ok(has(alone, 'kemadruma') && !has(alone, 'kemadruma-bhanga'));
assert.ok(!has({ ...alone, Jupiter: 4 }, 'kemadruma') && has({ ...alone, Jupiter: 4 }, 'kemadruma-bhanga'), 'Jupiter in a Kendra from the Lagna cancels it');
assert.ok(has({ ...alone, Jupiter: 6 }, 'kemadruma-bhanga') === false, 'the 6th from the Moon is no Kendra');
// Lagna Aries, Moon in Taurus, the five planets in Leo: the 4th from the Moon (a Kendra) and the 5th from the Lagna (not one).
const kendraFromMoonOnly = active(chartOf({ Moon: 2, Sun: 2, Mars: 5, Mercury: 5, Jupiter: 5, Venus: 5, Saturn: 5 }), 1);
assert.ok(!kendraFromMoonOnly.has('kemadruma') && kendraFromMoonOnly.has('kemadruma-bhanga'), 'a planet in a Kendra from the Moon alone cancels it too');
assert.ok(!has({ ...alone, Jupiter: 1 }, 'kemadruma') && !has({ ...alone, Jupiter: 1 }, 'kemadruma-bhanga'), 'Jupiter with the Moon: no Kemadruma at all');
assert.ok(!has({ ...alone, Venus: 2 }, 'kemadruma'), 'Venus in the 2nd from the Moon');
assert.ok(has({ ...alone, Sun: 2 }, 'kemadruma'), 'the Sun next to the Moon does not count');

// Varishta, Sama and Adhama: the Moon in an Apoklima, a Panaphara or a Kendra from the Sun; exactly one holds.
const fromSun = (moon: number) => active(full({ Sun: 1, Moon: moon }));
assert.ok(fromSun(3).has('varishta') && !fromSun(3).has('sama') && !fromSun(3).has('adhama'));
assert.ok(fromSun(6).has('sama') === false && fromSun(6).has('varishta'), 'the 6th from the Sun is an Apoklima');
assert.ok(fromSun(2).has('sama') && fromSun(11).has('sama'));
assert.ok(fromSun(4).has('adhama') && fromSun(1).has('adhama') && fromSun(10).has('adhama'));

// The Navamsa the strength scoring uses is the Navamsa of the divisional charts: the Moon at 1° of Cancer is in Cancer in the
// Navamsa too (Vargottama), which a count that began every movable sign at Aries missed.
const strength = qualifyYogas(
  [{ id: 'z', name: 'Z', category: 'general', status: 'active', referencePlanet: 'Moon', planetsInvolved: ['Moon'], rule: 'r', resultText: 't' }],
  [{ name: 'Moon', sign: 4, degree: 1, longitude: 91, house: 4 }],
)[0];
assert.equal(strength.breakdown!.vargottama, 60, 'Cancer in Cancer');
assert.equal(strength.breakdown!.navamsa, 30, 'a benefic sign');
// Every sign is its own Navamsa sign in one of its nine parts: the 1st for a movable sign (Aries, Cancer, Libra, Capricorn), the 5th
// for a fixed one (Taurus, Leo, Scorpio, Aquarius: the count begins at the 9th sign) and the 9th for a dual one (Gemini, Virgo,
// Sagittarius, Pisces: it begins at the 5th). The old count began movable signs at Aries, fixed ones at Capricorn and dual ones at
// Libra whatever the sign, which is right only for Aries, Taurus and Gemini.
const vargottamaAt = (sign: number, degree: number) =>
  qualifyYogas(
    [{ id: 'z', name: 'Z', category: 'general', status: 'active', referencePlanet: 'Moon', planetsInvolved: ['Moon'], rule: 'r', resultText: 't' }],
    [{ name: 'Moon', sign, degree, longitude: (sign - 1) * 30 + degree, house: sign }],
  )[0].breakdown!.vargottama === 60;
for (let sign = 1; sign <= 12; sign++) {
  const part = [1, 5, 9][(sign - 1) % 3 === 0 ? 0 : (sign - 1) % 3 === 1 ? 1 : 2]; // movable, fixed, dual
  const inside = (part - 1) * (30 / 9) + 0.5;
  assert.ok(vargottamaAt(sign, inside), `sign ${sign} is its own Navamsa in part ${part}`);
  assert.ok(!vargottamaAt(sign, (((part % 9) + 1) - 1) * (30 / 9) + 0.5), `sign ${sign} is not its own Navamsa in the part after`);
}

// Parvata: only benefics in the Kendras, at least one, and the 8th empty or with benefics only.
assert.ok(has({ Jupiter: 1, Venus: 7, Sun: 3, Mars: 3, Mercury: 3, Saturn: 3, Moon: 5, Rahu: 6, Ketu: 12 }, 'parvata'));
assert.ok(!has({ Jupiter: 1, Venus: 7, Saturn: 4, Sun: 3, Mars: 3, Mercury: 3, Moon: 5, Rahu: 6, Ketu: 12 }, 'parvata'), 'Saturn in a Kendra');
assert.ok(!has({ Jupiter: 1, Venus: 7, Mars: 8, Sun: 3, Mercury: 3, Saturn: 3, Moon: 5, Rahu: 6, Ketu: 12 }, 'parvata'), 'Mars in the 8th');

// Kahala: the 4th lord (the Moon) and Jupiter in Kendras from each other, the Lagna lord (Mars) strong.
assert.ok(has({ Moon: 1, Jupiter: 4, Mars: 1, Sun: 3, Mercury: 3, Venus: 3, Saturn: 3 }, 'kahala'));
assert.ok(!has({ Moon: 1, Jupiter: 3, Mars: 1, Sun: 3, Mercury: 3, Venus: 3, Saturn: 3 }, 'kahala'), 'Jupiter in the 3rd from the Moon');
// Chamara: the Lagna lord Mars exalted in Capricorn (a Kendra) and aspected by Jupiter (Jupiter in Cancer, its 7th); or two benefics together in the 7th.
assert.ok(has({ Mars: 10, Jupiter: 4, Sun: 3, Mercury: 3, Venus: 3, Saturn: 3 }, 'chamara'));
assert.ok(has({ Jupiter: 7, Venus: 7, Mars: 3, Sun: 3, Mercury: 3, Saturn: 3 }, 'chamara'), 'two benefics in the 7th');
// Shankha: the Lagna lord strong and the 5th lord (Sun) and 6th lord (Mercury) in Kendras from each other.
assert.ok(has({ Mars: 8, Sun: 1, Mercury: 4, Jupiter: 3, Venus: 3, Saturn: 3 }, 'shankha'));
assert.ok(!has({ Mars: 8, Sun: 1, Mercury: 3, Jupiter: 3, Venus: 3, Saturn: 3 }, 'shankha'), 'Mercury in the 3rd from the Sun');
// Bheri: the 9th lord (Jupiter) strong and the 12th, 1st, 2nd and 7th houses occupied.
assert.ok(has({ Jupiter: 9, Mars: 1, Venus: 2, Saturn: 12, Sun: 7, Mercury: 3, Moon: 3 }, 'bheri'));
assert.ok(!has({ Jupiter: 9, Mars: 1, Venus: 2, Saturn: 12, Sun: 6, Mercury: 3, Moon: 3 }, 'bheri'), 'the 7th is empty');
// Srinatha: the 7th lord (Venus) in the 10th, the 10th lord (Saturn) exalted in Libra with the 9th lord (Jupiter).
assert.ok(has({ Venus: 10, Saturn: 7, Jupiter: 7, Sun: 3, Mars: 3, Mercury: 3 }, 'srinatha'));
assert.ok(!has({ Venus: 10, Saturn: 7, Jupiter: 5, Sun: 3, Mars: 3, Mercury: 3 }, 'srinatha'), 'Jupiter is not with Saturn');
// Sharada: the 10th lord (Saturn) in the 5th, Mercury in a Kendra, the Sun in Leo.
assert.ok(has({ Saturn: 5, Mercury: 4, Sun: 5, Mars: 3, Jupiter: 3, Venus: 3 }, 'sharada'));
// Kalanidhi: Jupiter in the 2nd with Venus (joined) and Mercury (aspecting from Scorpio, the 7th from Taurus).
assert.ok(has({ Jupiter: 2, Venus: 2, Mercury: 8, Sun: 3, Mars: 3, Saturn: 3 }, 'kalanidhi'));
assert.ok(!has({ Jupiter: 2, Venus: 2, Mercury: 7, Sun: 3, Mars: 3, Saturn: 3 }, 'kalanidhi'), 'Mercury in Libra does not aspect Taurus');
// Hari, Hara, Brahma: benefics in three houses counted from the sign of a lord. The Moon is full (the Sun six signs away).
assert.ok(has({ Venus: 3, Jupiter: 4, Mercury: 2, Moon: 10, Sun: 4, Mars: 5, Saturn: 5 }, 'hari'), 'the 2nd, 12th and 8th from the 2nd lord Venus in Gemini');
assert.ok(has({ Venus: 3, Mercury: 6, Jupiter: 11, Moon: 10, Sun: 4, Mars: 5, Saturn: 5 }, 'hara'), 'the 4th, 9th and 8th from the 7th lord Venus in Gemini');
assert.ok(has({ Mars: 1, Jupiter: 4, Mercury: 10, Venus: 11, Sun: 3, Saturn: 3, Moon: 9 }, 'brahma'), 'the 4th, 10th and 11th from the Lagna lord Mars in Aries');
// Lagnaadhi: benefics in the 7th and 8th with no malefic joining or aspecting them.
assert.ok(has({ Jupiter: 7, Venus: 8, Saturn: 3, Mars: 3, Sun: 3, Mercury: 3, Rahu: 3, Ketu: 9 }, 'lagnaadhi'));
assert.ok(!has({ Jupiter: 7, Venus: 8, Saturn: 2, Mars: 3, Sun: 3, Mercury: 3, Rahu: 3, Ketu: 9 }, 'lagnaadhi'), 'Saturn in Taurus aspects Scorpio by its 7th');
// Parijata: the dispositors of the Lagna lord (Mars in Leo: the Sun, then the lord of the Sun\'s sign) in Kendras or Trikonas.
assert.ok(has({ Mars: 5, Sun: 1, Jupiter: 3, Venus: 3, Mercury: 3, Saturn: 3 }, 'parijata'));
assert.ok(!has({ Mars: 5, Sun: 3, Jupiter: 3, Venus: 3, Mercury: 3, Saturn: 3 }, 'parijata'), 'the Sun in Gemini is no Kendra or Trikona');
// Kalpadruma: the Lagna lord Mars in Aries at 7° (the 3rd Navamsa, which is Gemini), so the chain Mars, Mars, Mars ends with the lord of
// Gemini, Mercury, who has to be in a Kendra, a Trikona or exaltation too.
assert.ok(has({ Mars: 1, Mercury: 4, Sun: 3, Jupiter: 3, Venus: 3, Saturn: 3 }, 'kalpadruma'));
assert.ok(!has({ Mars: 1, Mercury: 3, Sun: 3, Jupiter: 3, Venus: 3, Saturn: 3 }, 'kalpadruma'), 'Mercury in Gemini, the 3rd house');
assert.ok(!has({ Jupiter: 5, Venus: 6, Mercury: 7, Sun: 1, Mars: 1, Saturn: 7 }, 'kurma'));
// Kurma is extremely rare but not impossible: Lagna Aries; the Sun exalted in the Lagna; Mercury in Gemini, made a malefic by Rahu
// there; Saturn in Aquarius (the 11th); Jupiter in Leo (a friend's sign), the Moon in Virgo (waxing, in Mercury's sign) and Venus in
// Libra (its own), the 5th, 6th and 7th.
const kurma = chartOf({ Sun: 1, Mercury: 3, Rahu: 3, Ketu: 9, Saturn: 11, Jupiter: 5, Moon: 6, Venus: 7, Mars: 10 });
assert.ok(active(kurma).has('kurma'), 'Kurma on a contrived chart');
assert.ok(!active(chartOf({ Sun: 1, Mercury: 3, Rahu: 9, Ketu: 12, Saturn: 11, Jupiter: 5, Moon: 6, Venus: 7, Mars: 10 })).has('kurma'), 'Mercury alone in Gemini is a benefic, so the 3rd house has no malefic');

// A strong lord is not debilitated: Mars (the Lagna lord of Aries) in Cancer is in a Kendra but debilitated, in Leo it is in a friend\'s
// sign and a Trikona. Kahala needs the 4th lord (the Moon in Cancer) and Jupiter in Kendras from each other and a strong Lagna lord.
const kahalaBase = { Moon: 4, Jupiter: 7, Sun: 3, Mercury: 3, Venus: 3, Saturn: 3 };
assert.ok(has({ ...kahalaBase, Mars: 5 }, 'kahala'));
assert.ok(!has({ ...kahalaBase, Mars: 4 }, 'kahala'), 'a debilitated Lagna lord is not strong, Kendra or not');

// The reasons say which condition failed, and the Planets of a yoga with two forms are those of the form that holds.
const yogaOf = (placements: Record<string, number>, id: string) => calculateYogas(full(placements), 1).find(y => y.id === id)!;
const involved = (placements: Record<string, number>, id: string) => [...yogaOf(placements, id).planetsInvolved].sort();
assert.ok(yogaOf({ ...kahalaBase, Mars: 4 }, 'kahala').resultText.includes('Lagna lord is debilitated'));
assert.ok(!yogaOf({ ...kahalaBase, Mars: 5 }, 'kahala').resultText.includes('debilitated'));
assert.deepEqual(involved({ ...kahalaBase, Mars: 5 }, 'kahala'), ['Jupiter', 'Mars', 'Moon'], 'first form: the 4th lord, Jupiter and the Lagna lord, not the 10th lord');
// Lakshmi: Aries, the 9th lord Jupiter exalted in Cancer, a Kendra; the Lagna lord Mars strong at home or debilitated in Cancer.
assert.ok(has({ Jupiter: 4, Mars: 1 }, 'lakshmi'));
assert.ok(!has({ Jupiter: 4, Mars: 4 }, 'lakshmi') && yogaOf({ Jupiter: 4, Mars: 4 }, 'lakshmi').resultText.includes('Lagna lord is debilitated'));
// A Lagna lord in an enemy sign in no Kendra or Trikona (Mars in Gemini, the 3rd) is not strong either, and the reason says that.
assert.ok(yogaOf({ Jupiter: 4, Mars: 3 }, 'lakshmi').resultText.includes('Lagna lord is neither in its own, exaltation or friendly sign nor in a Kendra or Trikona'));
// Bheri: the 9th lord Jupiter debilitated in Capricorn (a Kendra) is not strong, however full the 12th, 1st, 2nd and 7th are.
const bheri = { Mars: 1, Venus: 2, Saturn: 12, Sun: 7, Mercury: 3, Moon: 3 };
assert.ok(has({ ...bheri, Jupiter: 9 }, 'bheri'));
assert.deepEqual(involved({ ...bheri, Jupiter: 9 }, 'bheri').filter(name => ['Mars', 'Venus', 'Saturn', 'Sun', 'Jupiter'].includes(name)), ['Jupiter', 'Mars', 'Saturn', 'Sun', 'Venus'], 'first form: the 9th lord and those in the 12th, 1st, 2nd and 7th');
assert.ok(!has({ ...bheri, Jupiter: 10 }, 'bheri') && yogaOf({ ...bheri, Jupiter: 10 }, 'bheri').resultText.includes('9th lord is debilitated'));
// Shankha: the Lagna lord Mars debilitated in Cancer, the 5th lord (Sun) and 6th lord (Mercury) in Kendras from each other.
assert.ok(!has({ Mars: 4, Sun: 1, Mercury: 4, Jupiter: 3, Venus: 3, Saturn: 3 }, 'shankha'));
assert.ok(yogaOf({ Mars: 4, Sun: 1, Mercury: 4, Jupiter: 3, Venus: 3, Saturn: 3 }, 'shankha').resultText.includes('Lagna lord is debilitated'));
// Chamara has the Lagna in its second form, and the Planets are the two benefics.
assert.deepEqual(involved({ Jupiter: 1, Venus: 1, Mars: 3, Sun: 3, Mercury: 3, Saturn: 3, Moon: 3 }, 'chamara'), ['Jupiter', 'Venus']);

// Mridanga: a strong Lagna lord, a planet in its own or exaltation sign in a Kendra and one in a Trikona (the Lagna is both).
assert.ok(has({ Mars: 5, Sun: 5, Moon: 4 }, 'mridanga'), 'Mars in Leo (a friend, a Trikona), the Sun at home in Leo and the Moon at home in Cancer, a Kendra');
assert.ok(!has({ Mars: 5, Sun: 5 }, 'mridanga') && yogaOf({ Mars: 5, Sun: 5 }, 'mridanga').resultText.includes('No planet in its own or exaltation sign in a Kendra'));
assert.ok(has({ Mars: 1 }, 'mridanga'), 'Mars at home in the Lagna is both a Kendra and a Trikona');
assert.ok(!has({ Mars: 4, Sun: 5, Moon: 4 }, 'mridanga'), 'Mars debilitated in Cancer: the Lagna lord is not strong');

console.log('Yoga tests passed');
