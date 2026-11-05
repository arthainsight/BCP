export type IncomeObservation = {
  year: number;
  amount: number;
  isPartial?: boolean;
};

export type IncomeYearStatus =
  | 'excellent'
  | 'good'
  | 'normal'
  | 'weak'
  | 'very-weak'
  | 'partial'
  | 'insufficient';

export type IncomeYearAnalysis = {
  year: number;
  amount: number;
  status: IncomeYearStatus;
  baseline: number | null;
  ratio: number | null;
  changeFromPrevious: number | null;
  baselineSampleSize: number;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Classifies each complete year against the median of complete observations
 * in the preceding five calendar years. At least three prior observations are
 * required. Partial years are deliberately excluded from both sides.
 */
export function analyzeIncomeYears(rows: readonly IncomeObservation[]): IncomeYearAnalysis[] {
  const sorted = [...rows].sort((a, b) => a.year - b.year);
  return sorted.map((row, index) => {
    const previousComplete = sorted.slice(0, index).filter(item => !item.isPartial);
    const priorWindow = previousComplete.filter(item => item.year >= row.year - 5 && item.year < row.year);
    const baselineSampleSize = priorWindow.length;
    const baseline = baselineSampleSize >= 3
      ? median(priorWindow.map(item => item.amount))
      : null;
    const ratio = baseline !== null && baseline > 0 && !row.isPartial
      ? row.amount / baseline
      : null;
    const previous = [...previousComplete].reverse().find(item => item.year < row.year);
    const changeFromPrevious = previous && previous.amount > 0 && !row.isPartial
      ? (row.amount - previous.amount) / previous.amount
      : null;

    let status: IncomeYearStatus;
    if (row.isPartial) status = 'partial';
    else if (ratio === null) status = 'insufficient';
    else if (ratio >= 1.5) status = 'excellent';
    else if (ratio >= 1.15) status = 'good';
    else if (ratio >= 0.85) status = 'normal';
    else if (ratio >= 0.5) status = 'weak';
    else status = 'very-weak';

    return {
      year: row.year,
      amount: row.amount,
      status,
      baseline,
      ratio,
      changeFromPrevious,
      baselineSampleSize,
    };
  });
}

export type AnnualProgressionFeatureRow = {
  year: number;
  body: string;
  house: number;
  houseFromNatal: number;
  dictums: number[];
};

export type IncomePattern = {
  key: string;
  label: string;
  goodCount: number;
  goodTotal: number;
  goodRate: number;
  badCount: number;
  badTotal: number;
  badRate: number;
  difference: number;
};

/**
 * Compares how often a progression feature occurs in classified good versus
 * bad income years. A feature is counted at most once per calendar year.
 * This is descriptive research, not a significance test or causal inference.
 */
export function compareIncomeYearPatterns(
  years: readonly IncomeYearAnalysis[],
  progressions: readonly AnnualProgressionFeatureRow[],
  keyLordRoles: Readonly<Record<string, readonly string[]>> = {},
): IncomePattern[] {
  const good = new Set(years.filter(row => row.status === 'excellent' || row.status === 'good').map(row => row.year));
  const bad = new Set(years.filter(row => row.status === 'weak' || row.status === 'very-weak').map(row => row.year));
  if (good.size === 0 || bad.size === 0) return [];

  const featuresByYear = new Map<number, Set<string>>();
  const labels = new Map<string, string>();
  const add = (year: number, key: string, label: string) => {
    const features = featuresByYear.get(year) ?? new Set<string>();
    features.add(key);
    featuresByYear.set(year, features);
    labels.set(key, label);
  };

  for (const row of progressions) {
    if (!good.has(row.year) && !bad.has(row.year)) continue;
    if (row.house === 2 || row.house === 11) {
      add(row.year, `lagna-house:${row.body}:${row.house}`, `${row.body} in house ${row.house} from Lagna`);
    }
    if (row.houseFromNatal === 2 || row.houseFromNatal === 11) {
      add(row.year, `natal-house:${row.body}:${row.houseFromNatal}`, `${row.body} in house ${row.houseFromNatal} from natal sign`);
    }
    for (const dictum of row.dictums) {
      add(row.year, `dictum:${dictum}`, `Nāḍī Praveśikā D${dictum}`);
    }
    const roles = keyLordRoles[row.body] ?? [];
    if ([1, 4, 7, 10].includes(row.house)) {
      for (const role of roles) {
        add(row.year, `key-lord-kendra:${role}`, `${role} in kendra`);
      }
    }
  }

  const patterns: IncomePattern[] = [];
  for (const [key, label] of labels) {
    const goodCount = [...good].filter(year => featuresByYear.get(year)?.has(key)).length;
    const badCount = [...bad].filter(year => featuresByYear.get(year)?.has(key)).length;
    const goodRate = goodCount / good.size;
    const badRate = badCount / bad.size;
    patterns.push({
      key,
      label,
      goodCount,
      goodTotal: good.size,
      goodRate,
      badCount,
      badTotal: bad.size,
      badRate,
      difference: goodRate - badRate,
    });
  }
  return patterns.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference) || a.label.localeCompare(b.label));
}
