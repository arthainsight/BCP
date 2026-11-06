
import { addDashaYears } from './time';
import { splitDashaPeriod } from './dashaSplit';

export type NakshatraDashaEntry = {
  key: string;
  name: string;
  lord: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  /** The length of the period when whole; only the balance at birth, which is cut short, carries it. */
  fullDurationYears?: number;
};

export type NakshatraDashaDefinition = {
  key: string;
  name: string;
  lord: string;
  years: number;
};

export function buildDashaTimeline(
  definitions: readonly NakshatraDashaDefinition[],
  startIndex: number,
  firstBalanceYears: number,
  birthDate: Date,
  minimumYears = 120,
): NakshatraDashaEntry[] {
  const entries: NakshatraDashaEntry[] = [];
  const endTarget = addDashaYears(birthDate, minimumYears);
  let cursor = birthDate;
  let offset = 0;

  while (cursor < endTarget) {
    const definition = definitions[(startIndex + offset) % definitions.length];
    const durationYears = offset === 0 ? firstBalanceYears : definition.years;
    const endDate = addDashaYears(cursor, durationYears);
    const cutShort = offset === 0 && durationYears < definition.years;
    entries.push({ ...definition, startDate: cursor, endDate, durationYears, ...(cutShort ? { fullDurationYears: definition.years } : {}) });
    cursor = endDate;
    offset += 1;
  }

  return entries;
}

/**
 * The sub-periods of a daśā in the proportion of the years of the system. A parent that is the balance at birth is
 * cut short: its sub-periods are those of the whole period, without the ones over before birth (see dashaSplit.ts).
 */
export function buildDashaSubPeriods(
  parent: NakshatraDashaEntry,
  definitions: readonly NakshatraDashaDefinition[],
): NakshatraDashaEntry[] {
  const startIndex = definitions.findIndex(definition => definition.key === parent.key);
  return splitDashaPeriod(parent, definitions.map((_, offset) => {
    const definition = definitions[(startIndex + offset) % definitions.length];
    return {
      weight: definition.years,
      build: ({ startDate, endDate, durationYears, fullDurationYears }): NakshatraDashaEntry =>
        ({ ...definition, startDate, endDate, durationYears, ...(fullDurationYears !== undefined ? { fullDurationYears } : {}) }),
    };
  }));
}
