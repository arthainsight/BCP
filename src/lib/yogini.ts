import { buildDashaSubPeriods, buildDashaTimeline, type NakshatraDashaEntry } from './nakshatraDasha';

export const YOGINI_DEFINITIONS = [
  { key: 'mangala', name: 'Mangala', lord: 'Moon', years: 1 },
  { key: 'pingala', name: 'Pingala', lord: 'Sun', years: 2 },
  { key: 'dhanya', name: 'Dhanya', lord: 'Jupiter', years: 3 },
  { key: 'bhramari', name: 'Bhramari', lord: 'Mars', years: 4 },
  { key: 'bhadrika', name: 'Bhadrika', lord: 'Mercury', years: 5 },
  { key: 'ulka', name: 'Ulka', lord: 'Saturn', years: 6 },
  { key: 'siddha', name: 'Siddha', lord: 'Venus', years: 7 },
  { key: 'sankata', name: 'Sankata', lord: 'Rahu', years: 8 },
] as const;

const NAKSHATRA_SPAN = 360 / 27;

export function calculateYogini(moonLongitude: number, birthDate: Date) {
  const longitude = ((moonLongitude % 360) + 360) % 360;
  const nakshatraIndex = Math.floor(longitude / NAKSHATRA_SPAN);
  const fractionRemaining = 1 - (longitude - nakshatraIndex * NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
  const startIndex = (nakshatraIndex + 3) % YOGINI_DEFINITIONS.length;
  const firstBalanceYears = YOGINI_DEFINITIONS[startIndex].years * fractionRemaining;
  return {
    startYogini: YOGINI_DEFINITIONS[startIndex].name,
    entries: buildDashaTimeline(YOGINI_DEFINITIONS, startIndex, firstBalanceYears, birthDate),
  };
}

export function calculateYoginiSubDashas(parent: NakshatraDashaEntry) {
  return buildDashaSubPeriods(parent, YOGINI_DEFINITIONS);
}
