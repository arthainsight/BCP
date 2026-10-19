import { runStudy, testFeature, type StudyChart, type StudyData, type StudyOptions } from './eventStudy';
import { parseFeatureId, type Feature } from './features';
import { hashText, seededRandom } from './random';
import { splitStudy, type SplitBy } from './validation';

// The study tests one feature at a time, but the traditional rules are made of several that work together. A joint model asks what a few features explain together:
// from the best features of the training part (the data split as in the check on a part not looked at) a logistic model is built step by step, adding the feature that
// improves the fit most for as long as the improvement is worth more than a penalty for choosing among so many, and then the model, as it stands, is tried on the test
// part, which it was not built from. How well it tells the events from the ordinary moments of the same chart is the area under the curve (AUC): the chance that an
// event scores higher than a random moment of its own chart, 0.5 for no better than chance. A permutation test on the test part, which the model was not fitted to,
// says whether that is more than chance gives, and the AUC after each step shows what each added feature brought.

export interface ModelStep {
  id: string;
  feature: Feature;
  /** The coefficient of the feature in the whole model, and e to it: how many times the odds of being an event rise where the feature is there, the others being the same. */
  coefficient: number;
  oddsRatio: number;
  /** How much the fit (the weighted log-likelihood of the training part) improved by adding it. */
  gain: number;
  /** The AUC on the test part of the model up to and including this step. */
  testAuc: number | null;
}

export interface JointModelResult {
  trainingEvents: number;
  testEvents: number;
  trainingCharts: number;
  testCharts: number;
  /** The features that were candidates for the model. */
  candidates: number;
  steps: ModelStep[];
  /** The AUC of the whole model on the test part, and the chance of one as high by chance; null when the model has no features or the test part no events. */
  testAuc: number | null;
  testP: number | null;
}

export interface JointModelConfig {
  by: SplitBy;
  share: number;
  seed: number;
  /** How many of the best features of the training part are candidates, and how many the model may have. */
  candidates?: number;
  maxFeatures?: number;
  /** How many times the events of the test part are moved to random moments for the p-value. */
  permutations?: number;
}

/** One kind of row the model is fitted to: the candidates present (as a bit mask over the chosen features), and how much of the weight is events and how much ordinary moments. */
type Cells = Map<number, { events: number; others: number }>;

interface Row { present: Int32Array; event: boolean; weight: number }

const RIDGE = 0.5;
const ITERATIONS = 25;

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

/** Solves a small linear system by Gaussian elimination with pivoting; the matrix is symmetric and positive definite here. */
function solve(matrix: number[][], vector: number[]): number[] {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let column = 0; column < n; column++) {
    let pivot = column;
    for (let row = column + 1; row < n; row++) if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
    [a[column], a[pivot]] = [a[pivot], a[column]];
    const divisor = a[column][column] || 1e-12;
    for (let row = column + 1; row < n; row++) {
      const factor = a[row][column] / divisor;
      for (let k = column; k <= n; k++) a[row][k] -= factor * a[column][k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let row = n - 1; row >= 0; row--) {
    let sum = a[row][n];
    for (let k = row + 1; k < n; k++) sum -= a[row][k] * x[k];
    x[row] = sum / (a[row][row] || 1e-12);
  }
  return x;
}

/** The logistic model of the chosen candidate positions on the rows: the intercept, a coefficient for each, and the weighted log-likelihood (the ridge penalty left out of it). */
function fit(rows: readonly Row[], chosen: readonly number[]): { intercept: number; coefficients: number[]; logLikelihood: number } {
  const cells: Cells = new Map();
  for (const row of rows) {
    let mask = 0;
    for (let j = 0; j < chosen.length; j++) if (row.present.includes(chosen[j])) mask |= 1 << j;
    const cell = cells.get(mask) ?? { events: 0, others: 0 };
    if (row.event) cell.events += row.weight; else cell.others += row.weight;
    cells.set(mask, cell);
  }
  const k = chosen.length + 1;
  let beta = new Array<number>(k).fill(0);
  const eta = (mask: number, b: readonly number[]) => b[0] + chosen.reduce((sum, _, j) => sum + ((mask >> j) & 1) * b[j + 1], 0);
  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    const matrix = Array.from({ length: k }, () => new Array<number>(k).fill(0));
    const vector = new Array<number>(k).fill(0);
    for (const [mask, cell] of cells) {
      const n = cell.events + cell.others;
      if (n <= 0) continue;
      const linear = eta(mask, beta);
      const mu = Math.min(1 - 1e-9, Math.max(1e-9, sigmoid(linear)));
      const weight = n * mu * (1 - mu);
      const z = linear + (cell.events / n - mu) / (mu * (1 - mu));
      const x = [1, ...chosen.map((_, j) => (mask >> j) & 1)];
      for (let i = 0; i < k; i++) {
        vector[i] += weight * x[i] * z;
        for (let j = 0; j < k; j++) matrix[i][j] += weight * x[i] * x[j];
      }
    }
    for (let i = 1; i < k; i++) matrix[i][i] += RIDGE;
    const next = solve(matrix, vector);
    const change = next.reduce((largest, value, i) => Math.max(largest, Math.abs(value - beta[i])), 0);
    beta = next;
    if (change < 1e-7) break;
  }
  let logLikelihood = 0;
  for (const [mask, cell] of cells) {
    const mu = Math.min(1 - 1e-12, Math.max(1e-12, sigmoid(eta(mask, beta))));
    logLikelihood += cell.events * Math.log(mu) + cell.others * Math.log(1 - mu);
  }
  return { intercept: beta[0], coefficients: beta.slice(1), logLikelihood };
}

/** For each pool (chart and window) its events and its random moments, as rows over the candidates (positions in `candidatePosition`). */
function rowsOf(data: StudyData, candidatePosition: ReadonlyMap<number, number>): Row[] {
  const keep = (features: Int32Array) => Int32Array.from([...features].filter(f => candidatePosition.has(f)).map(f => candidatePosition.get(f)!));
  const rows: Row[] = [];
  const eventsIn = new Map<string, number>();
  for (const item of data.events) {
    const key = item.poolKey ?? `${item.chartId}|${item.windowDays}`;
    eventsIn.set(key, (eventsIn.get(key) ?? 0) + 1);
    rows.push({ present: keep(item.features), event: true, weight: 1 });
  }
  for (const [key, pool] of data.moments ?? []) {
    const count = eventsIn.get(key) ?? 0;
    if (count === 0 || pool.length === 0) continue;
    // The ordinary moments of a pool weigh as much as its events together, so no chart weighs more for having been sampled more.
    for (const features of pool) rows.push({ present: keep(features), event: false, weight: count / pool.length });
  }
  return rows;
}

interface Scorer { intercept: number; positions: ReadonlyMap<number, number>; coefficients: readonly number[] }

/** The AUC of a model on a study's events (mean over events of the share of the ordinary moments of the event's pool that score lower, a tie counting half), and the chance of one as high by chance. */
function evaluate(data: StudyData, scorer: Scorer | null, seed: number, permutations: number): { auc: number | null; p: number | null } {
  if (!scorer || !data.moments || data.events.length === 0) return { auc: null, p: null };
  const score = (features: Int32Array) => {
    let total = scorer.intercept;
    for (const f of features) { const at = scorer.positions.get(f); if (at !== undefined) total += scorer.coefficients[at]; }
    return total;
  };
  // For each pool the scores of its moments, sorted, and the position of each moment in them (its own AUC if it were an event).
  const sortedOf = new Map<string, Float64Array>();
  const percentiles = new Map<string, Float64Array>();
  const rank = (sorted: Float64Array, value: number) => {
    let low = 0; let high = sorted.length;
    while (low < high) { const middle = (low + high) >> 1; if (sorted[middle] < value - 1e-12) low = middle + 1; else high = middle; }
    let upper = low;
    while (upper < sorted.length && sorted[upper] <= value + 1e-12) upper++;
    return (low + 0.5 * (upper - low)) / sorted.length;
  };
  for (const [key, pool] of data.moments) {
    const scores = Float64Array.from(pool.map(score));
    const sorted = Float64Array.from(scores).sort();
    sortedOf.set(key, sorted);
    percentiles.set(key, Float64Array.from(scores, value => rank(sorted, value)));
  }
  const usable = data.events.filter(item => sortedOf.has(item.poolKey ?? `${item.chartId}|${item.windowDays}`));
  if (usable.length === 0) return { auc: null, p: null };
  const keys = usable.map(item => item.poolKey ?? `${item.chartId}|${item.windowDays}`);
  const auc = usable.reduce((sum, item, i) => sum + rank(sortedOf.get(keys[i])!, score(item.features)), 0) / usable.length;
  const random = seededRandom(seed ^ 0x51ed270b);
  let atLeast = 0;
  for (let round = 0; round < permutations; round++) {
    let total = 0;
    for (const key of keys) { const list = percentiles.get(key)!; total += list[Math.floor(random() * list.length)]; }
    if (total / usable.length >= auc - 1e-12) atLeast++;
  }
  return { auc, p: permutations > 0 ? (atLeast + 1) / (permutations + 1) : null };
}

/**
 * Builds a joint model on the training part of a split and tries it on the test part. Null when a part is empty (too few charts or events to split). The model may
 * have no features at all when nothing in the training part improves the fit enough, which is a finding too.
 */
export function fitJointModel(charts: readonly StudyChart[], options: StudyOptions, config: JointModelConfig): JointModelResult | null {
  const { training, test } = splitStudy(charts, config.by, config.share, config.seed);
  if (training.length === 0 || test.length === 0) return null;
  const maxFeatures = Math.min(config.maxFeatures ?? 5, 8);
  const wanted = config.candidates ?? 30;
  const trained = runStudy(training, { ...options, permutations: 0, keepMoments: true });
  // The candidates: more often than chance and in more than one event, the smallest exact p first.
  const tests = trained.results.filter(result => result.lift !== null && result.lift > 1 && result.observed >= 2).map(result => testFeature(trained.data, result.id)).sort((a, b) => a.p - b.p || b.observed - a.observed);
  const candidateIds = tests.slice(0, wanted).map(item => item.id);
  const positions = new Map(candidateIds.map((id, i) => [trained.data.index.get(id)!, i]));
  const rows = rowsOf(trained.data, positions);
  const eventCount = trained.events;

  // Forward selection: add the candidate that improves the fit most, while it is worth more than the penalty for choosing among so many.
  const penalty = 0.5 * Math.log(Math.max(2, eventCount)) + Math.log(Math.max(2, candidateIds.length));
  const chosen: number[] = [];
  const history: { chosen: number[]; intercept: number; coefficients: number[]; gain: number }[] = [];
  let current = fit(rows, chosen);
  while (chosen.length < maxFeatures && candidateIds.length > 0) {
    let best: { position: number; model: ReturnType<typeof fit> } | null = null;
    for (let position = 0; position < candidateIds.length; position++) {
      if (chosen.includes(position)) continue;
      const model = fit(rows, [...chosen, position]);
      if (!best || model.logLikelihood > best.model.logLikelihood) best = { position, model };
    }
    if (!best || best.model.logLikelihood - current.logLikelihood < penalty) break;
    chosen.push(best.position);
    history.push({ chosen: [...chosen], intercept: best.model.intercept, coefficients: best.model.coefficients, gain: best.model.logLikelihood - current.logLikelihood });
    current = best.model;
  }

  // The test part, as the model sees it: the features by their ids.
  const tested = runStudy(test, { ...options, permutations: 0, keepMoments: true });
  const scorerAt = (step: number): Scorer | null => {
    if (step < 0) return null;
    const entry = history[step];
    const used = new Map<number, number>();
    entry.chosen.forEach((position, j) => { const at = tested.data.index.get(candidateIds[position]); if (at !== undefined) used.set(at, j); });
    return { intercept: entry.intercept, positions: used, coefficients: entry.coefficients };
  };
  const seed = config.seed ^ hashText('model');
  const permutations = config.permutations ?? 2000;
  // The coefficients are those of the whole model (each step refits them all); the gain and the test AUC are those of the step.
  const finalCoefficients = history.length > 0 ? history[history.length - 1].coefficients : [];
  const steps: ModelStep[] = history.map((entry, i) => {
    const id = candidateIds[entry.chosen[entry.chosen.length - 1]];
    return { id, feature: parseFeatureId(id), coefficient: finalCoefficients[i], oddsRatio: Math.exp(finalCoefficients[i]), gain: entry.gain, testAuc: evaluate(tested.data, scorerAt(i), seed, 0).auc };
  });
  const whole = history.length > 0 ? evaluate(tested.data, scorerAt(history.length - 1), seed, permutations) : { auc: null, p: null };
  return {
    trainingEvents: trained.events, testEvents: tested.events, trainingCharts: trained.charts, testCharts: tested.charts,
    candidates: candidateIds.length, steps, testAuc: whole.auc, testP: whole.p,
  };
}
