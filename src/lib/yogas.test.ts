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
/** Park every planet in a sign far from the Sun so no yoga fires by accident. */
function quietChart(overrides: Record<string, number> = {}): PlanetData[] {
  return ALL_NAMES.map((name, index) =>
    planet(name, overrides[name] ?? ((index % 2 === 0 ? 5 : 6) + (name === 'Sun' ? -4 : 0))),
  );
}

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

console.log('Yoga tests passed');
