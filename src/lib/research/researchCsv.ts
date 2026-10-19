import { csvText } from '@/lib/download';
import { pad2 } from '@/lib/dateFormat';
import type { FeatureResult } from './eventStudy';
import type { GroupComparison } from './groupStudy';

// The research as CSV files, to go on with in a spreadsheet or a statistics program.

/** A day (local time) as DD.MM.YYYY. */
export const dayText = (time: number) => {
  const date = new Date(time);
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
};

export interface EventRow {
  chart: string;
  id: string;
  time: number;
  name: string;
  category: string;
  tags: readonly string[];
  /** The feature ids the event has. */
  features: ReadonlySet<string>;
  /** Which of two groups the event is in, when there are two. */
  group?: string;
}

/** One row for each event and a column for each feature that any of them has, 1 when the event has it and 0 when it does not. */
export function eventsCsv(rows: readonly EventRow[]): string {
  const features = [...new Set(rows.flatMap(row => [...row.features]))].sort();
  const withGroup = rows.some(row => row.group !== undefined);
  return csvText([
    ['chart', 'event', 'date', 'name', 'category', 'tags', ...(withGroup ? ['group'] : []), ...features],
    ...rows.map(row => [row.chart, row.id, dayText(row.time), row.name, row.category, row.tags.join('; '), ...(withGroup ? [row.group ?? ''] : []), ...features.map(id => (row.features.has(id) ? 1 : 0))]),
  ]);
}

const number = (value: number | null, digits: number) => (value === null ? '' : value.toFixed(digits));

/** The table of the comparison with chance: a row for each feature. */
export function resultsCsv(results: readonly FeatureResult[], total: number): string {
  return csvText([
    ['feature', 'family', 'graha', 'target', 'events with it', 'events', 'expected by chance', 'ratio', 'p', 'q'],
    ...results.map(result => [result.id, result.family, result.body, result.target, result.observed, total, number(result.expected, 3), number(result.lift, 3), number(result.p, 5), number(result.q, 5)]),
  ]);
}

/** The table of the comparison of two groups: a row for each feature. */
export function groupsCsv(comparison: GroupComparison, labelA: string, labelB: string): string {
  return csvText([
    ['feature', 'family', 'graha', 'target', `${labelA} (${comparison.totalA})`, `${labelB} (${comparison.totalB})`, `share ${labelA}`, `share ${labelB}`, 'difference', 'p', 'q'],
    ...comparison.rows.map(row => [row.id, row.family, row.body, row.target, row.a, row.b, number(row.shareA, 4), number(row.shareB, 4), number(row.difference, 4), number(row.p, 5), number(row.q, 5)]),
  ]);
}
