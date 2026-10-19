import assert from 'node:assert/strict';
import { adjustedQValues, fisherExactTwoSided, poissonBinomialTail } from './stats';

const near = (a: number, b: number, tolerance = 1e-9) => Math.abs(a - b) <= tolerance;

// --- Poisson-binomial: the chance of at least k successes when each trial has its own chance --------------------------------------------------
{
  assert.ok(near(poissonBinomialTail([0.5, 0.5, 0.5], 2), 0.5), 'at least two of three fair coins');
  assert.ok(near(poissonBinomialTail([0.5, 0.5, 0.5], 3), 0.125));
  assert.equal(poissonBinomialTail([0.5, 0.5, 0.5], 0), 1);
  assert.equal(poissonBinomialTail([0.5, 0.5, 0.5], 4), 0, 'more successes than trials');
  // 0.1 and 0.2: at least one is 1 − 0.9 · 0.8 = 0.28; both is 0.02.
  assert.ok(near(poissonBinomialTail([0.1, 0.2], 1), 0.28));
  assert.ok(near(poissonBinomialTail([0.1, 0.2], 2), 0.02));
  // A trial that cannot succeed, and one that always does.
  assert.ok(near(poissonBinomialTail([0, 0.5], 1), 0.5));
  assert.ok(near(poissonBinomialTail([1, 0.5], 2), 0.5));
  // With equal chances it is the binomial: ten trials at 0.3, at least five: 0.1502683…
  assert.ok(near(poissonBinomialTail(Array(10).fill(0.3), 5), 0.1502683, 1e-6));
  // Chances outside [0, 1] are held to it.
  assert.ok(near(poissonBinomialTail([2, -1], 1), 1));
}

// --- Fisher's exact test: the tea-tasting table (3, 1 / 1, 3) has a two-sided p of 34/70 = 0.4857 --------------------------------------------------
{
  assert.ok(near(fisherExactTwoSided(3, 4, 1, 4), 34 / 70, 1e-12));
  assert.ok(near(fisherExactTwoSided(4, 4, 0, 4), 2 / 70, 1e-12), 'all of one group and none of the other');
  assert.ok(near(fisherExactTwoSided(2, 4, 2, 4), 1), 'the same share in both');
  assert.ok(near(fisherExactTwoSided(1, 4, 3, 4), fisherExactTwoSided(3, 4, 1, 4)), 'symmetric between the groups');
  // Unequal groups: 8 of 10 against 2 of 10 is p = 0.02301 (two-sided).
  assert.ok(near(fisherExactTwoSided(8, 10, 2, 10), 0.02301, 1e-4));
  // Nothing to compare in an empty group, or a table that is not one.
  assert.equal(fisherExactTwoSided(0, 0, 1, 3), 1);
  assert.equal(fisherExactTwoSided(5, 4, 1, 3), 1);
  // No one has the feature: certain.
  assert.equal(fisherExactTwoSided(0, 5, 0, 6), 1);
}

// --- The false discovery rate: p = 0.01, 0.04, 0.03, 0.2 → q = 0.04, 0.0533…, 0.0533…, 0.2 --------------------------------------------------------
{
  const q = adjustedQValues([0.01, 0.04, 0.03, 0.2]);
  assert.ok(near(q[0], 0.04) && near(q[1], 0.16 / 3) && near(q[2], 0.16 / 3) && near(q[3], 0.2));
  assert.deepEqual(adjustedQValues([]), []);
  assert.deepEqual(adjustedQValues([0.5]), [0.5]);
  assert.ok(adjustedQValues([0.9, 0.95]).every(value => value <= 1), 'never above one');
}

console.log('Statistics tests passed');
