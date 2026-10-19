// The few statistics the research needs, worked out exactly.

/** Benjamini–Hochberg q-values (false discovery rate) for p-values in any order. */
export function adjustedQValues(pValues: readonly number[]): number[] {
  const order = pValues.map((p, i) => ({ p, i })).sort((a, b) => a.p - b.p);
  const q = new Array<number>(pValues.length);
  let next = 1;
  for (let rank = order.length; rank >= 1; rank--) {
    const { p, i } = order[rank - 1];
    next = Math.min(next, (p * order.length) / rank);
    q[i] = next;
  }
  return q;
}

/**
 * The chance of at least `atLeast` successes when each of the trials has its own chance of success (the Poisson-binomial distribution), worked out
 * exactly. For events from several charts each has the chance its own chart gives it.
 */
export function poissonBinomialTail(chances: readonly number[], atLeast: number): number {
  if (atLeast <= 0) return 1;
  if (atLeast > chances.length) return 0;
  // probability[j] is the chance of exactly j successes among the trials so far.
  const probability = new Float64Array(chances.length + 1);
  probability[0] = 1;
  for (let trial = 0; trial < chances.length; trial++) {
    const p = Math.min(1, Math.max(0, chances[trial]));
    for (let j = trial + 1; j >= 1; j--) probability[j] = probability[j] * (1 - p) + probability[j - 1] * p;
    probability[0] *= 1 - p;
  }
  let tail = 0;
  for (let j = atLeast; j <= chances.length; j++) tail += probability[j];
  return Math.min(1, tail);
}

/** ln(n!) for 0..n, by running sums. */
function logFactorials(n: number): number[] {
  const table = [0];
  for (let i = 1; i <= n; i++) table.push(table[i - 1] + Math.log(i));
  return table;
}

/**
 * Fisher's exact test, two-sided, for a 2 × 2 table: `a` of `groupA` and `b` of `groupB` have a feature. The chance of a table as unlikely as this one or
 * more, given how many have the feature in all and how large the groups are.
 */
export function fisherExactTwoSided(a: number, groupA: number, b: number, groupB: number): number {
  const total = groupA + groupB;
  const have = a + b;
  if (groupA <= 0 || groupB <= 0 || a < 0 || b < 0 || a > groupA || b > groupB) return 1;
  const ln = logFactorials(total);
  const logChance = (x: number) => ln[groupA] - ln[x] - ln[groupA - x] + ln[groupB] - ln[have - x] - ln[groupB - have + x] - (ln[total] - ln[have] - ln[total - have]);
  const observed = logChance(a);
  let p = 0;
  for (let x = Math.max(0, have - groupB); x <= Math.min(groupA, have); x++) {
    const chance = logChance(x);
    // A tiny allowance for rounding, so that a table as likely as this one is counted.
    if (chance <= observed + 1e-9) p += Math.exp(chance);
  }
  return Math.min(1, p);
}
