import type { EventFeatures } from './eventStudy';
import { parseFeatureId, type Feature } from './features';
import { adjustedQValues, fisherExactTwoSided } from './stats';

// Two sets of events side by side (moves and weddings, say): which features does one have more often than the other? Each feature is counted in both sets and
// compared with Fisher's exact test; with many features, q (false discovery rate) corrects p for how many were looked at. No chance level is needed, as the
// two sets are compared with each other.

export interface GroupRow extends Feature {
  id: string;
  /** How many of the events of each group have the feature. */
  a: number;
  b: number;
  /** The share of each group, 0–1, and the first minus the second. */
  shareA: number;
  shareB: number;
  difference: number;
  /** The chance of a difference this large or larger if the two groups were alike (two-sided). */
  p: number;
  q: number;
  eventsA: { chartId: string; eventId: string }[];
  eventsB: { chartId: string; eventId: string }[];
}

export interface GroupComparison {
  totalA: number;
  totalB: number;
  /** The features that at least one event has, which the correction counts. */
  tested: number;
  rows: GroupRow[];
}

/** The comparison of two sets of events, the features that either has, the most different first. */
export function compareGroups(groupA: readonly EventFeatures[], groupB: readonly EventFeatures[]): GroupComparison {
  const counts = new Map<string, { a: { chartId: string; eventId: string }[]; b: { chartId: string; eventId: string }[] }>();
  const add = (group: readonly EventFeatures[], side: 'a' | 'b') => {
    for (const item of group) {
      for (const id of item.features) {
        const entry = counts.get(id) ?? { a: [], b: [] };
        entry[side].push({ chartId: item.chartId, eventId: item.event.id });
        counts.set(id, entry);
      }
    }
  };
  add(groupA, 'a');
  add(groupB, 'b');
  const totalA = groupA.length;
  const totalB = groupB.length;
  const ids = [...counts.keys()];
  const p = ids.map(id => fisherExactTwoSided(counts.get(id)!.a.length, totalA, counts.get(id)!.b.length, totalB));
  const q = adjustedQValues(p);
  const rows = ids.map((id, i): GroupRow => {
    const entry = counts.get(id)!;
    const shareA = totalA > 0 ? entry.a.length / totalA : 0;
    const shareB = totalB > 0 ? entry.b.length / totalB : 0;
    return { ...parseFeatureId(id), id, a: entry.a.length, b: entry.b.length, shareA, shareB, difference: shareA - shareB, p: p[i], q: q[i], eventsA: entry.a, eventsB: entry.b };
  });
  rows.sort((x, y) => x.p - y.p || Math.abs(y.difference) - Math.abs(x.difference) || x.id.localeCompare(y.id));
  return { totalA, totalB, tested: ids.length, rows };
}
