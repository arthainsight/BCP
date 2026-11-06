// Splitting a daśā period into its sub-periods (mahādaśā → antardaśā → pratyantardaśā) when the period may be cut short.
//
// The first mahādaśā of a nakṣatra daśā is only the balance of the Moon's nakṣatra, not the lord's whole period.
// Its sub-periods are not the nine parts of the balance: they are the nine parts of the whole period, begun at the
// moment the whole period would have begun, and the ones that were over before birth are not shown (the antardaśā
// the birth falls in is cut at birth). This is how Kālachakra already treats its first period (`elapsedYears`) and how
// PyJHora lists the Vimśottarī antardaśās of the balance daśā.
//
// A period that is cut short carries `fullDurationYears`, the length it has when whole; a period that is whole
// carries none.

import { addDashaYears, dashaYearMs } from './time';

export interface DashaSpan {
  startDate: Date;
  endDate: Date;
  durationYears: number;
  /** The length of the period when whole, only when the period begins part of the way into it. */
  fullDurationYears?: number;
}

export interface DashaPart<T> {
  /** The share of the parent this part takes; the parts divide the parent in proportion to their weights. */
  weight: number;
  /** The entry of this part, given its dates and lengths. */
  build: (span: DashaSpan) => T;
}

/** Divides a period among its parts in proportion to their weights, counting from where the whole period would have begun. */
export function splitDashaPeriod<T>(parent: DashaSpan, parts: readonly DashaPart<T>[]): T[] {
  const full = parent.fullDurationYears ?? parent.durationYears;
  const elapsed = full - parent.durationYears;
  const total = parts.reduce((sum, part) => sum + part.weight, 0);
  let cursor = elapsed > 0 ? addDashaYears(parent.startDate, -elapsed) : parent.startDate;
  const entries: T[] = [];
  for (const part of parts) {
    const fullYears = (full * part.weight) / total;
    const endDate = addDashaYears(cursor, fullYears);
    const periodStart = cursor;
    cursor = endDate;
    // Over before the period given begins: not part of it.
    if (elapsed > 0 && endDate <= parent.startDate) continue;
    if (periodStart < parent.startDate) {
      const durationYears = (endDate.getTime() - parent.startDate.getTime()) / dashaYearMs();
      entries.push(part.build({ startDate: parent.startDate, endDate, durationYears, fullDurationYears: fullYears }));
    } else {
      entries.push(part.build({ startDate: periodStart, endDate, durationYears: fullYears }));
    }
  }
  return entries;
}
