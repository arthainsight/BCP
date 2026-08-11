export const DASHA_YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export type NakshatraDashaEntry = {
  key: string;
  name: string;
  lord: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
};

export type NakshatraDashaDefinition = {
  key: string;
  name: string;
  lord: string;
  years: number;
};

export function addDashaYears(date: Date, years: number) {
  return new Date(date.getTime() + years * DASHA_YEAR_MS);
}

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
    entries.push({ ...definition, startDate: cursor, endDate, durationYears });
    cursor = endDate;
    offset += 1;
  }

  return entries;
}

export function buildDashaSubPeriods(
  parent: NakshatraDashaEntry,
  definitions: readonly NakshatraDashaDefinition[],
): NakshatraDashaEntry[] {
  const cycleYears = definitions.reduce((sum, definition) => sum + definition.years, 0);
  const startIndex = definitions.findIndex(definition => definition.key === parent.key);
  let cursor = parent.startDate;

  return definitions.map((_, offset) => {
    const definition = definitions[(startIndex + offset) % definitions.length];
    const durationYears = parent.durationYears * definition.years / cycleYears;
    const endDate = addDashaYears(cursor, durationYears);
    const entry = { ...definition, startDate: cursor, endDate, durationYears };
    cursor = endDate;
    return entry;
  });
}
