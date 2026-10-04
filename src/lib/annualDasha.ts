// Daśās compressed into a single annual chart's year.
//
// Both annual systems here work the same way: a fixed cycle of lords whose
// periods add up to a whole, scaled so the whole fills the year from one
// annual chart to the next. The first period is already partly spent at the
// start of the year, in the same proportion as the natal tithi or nakṣatra
// was spent at birth, so the cycle starts before the year does and ends the
// same amount into the next one.
//
// Pure arithmetic on Julian days; no ephemeris calls.

export interface DashaLord {
  name: string;
  /** Length in the system's own units (days of 360, or years of 108). */
  units: number;
}

export interface AnnualPeriod {
  lord: string;
  startJd: number;
  endJd: number;
}

export interface AnnualMahadasha extends AnnualPeriod {
  antardashas: AnnualPeriod[];
}

/**
 * @param cycle Lords in dasha order.
 * @param firstLord Index into `cycle` of the period running at the year start.
 * @param elapsedFraction Share of the first period already spent, 0 ≤ f < 1.
 * @param yearStartJd Annual chart moment (UT JD).
 * @param yearLengthDays Days until the next annual chart.
 */
export function buildAnnualDasha(
  cycle: DashaLord[],
  firstLord: number,
  elapsedFraction: number,
  yearStartJd: number,
  yearLengthDays: number,
): AnnualMahadasha[] {
  const total = cycle.reduce((sum, lord) => sum + lord.units, 0);
  const daysPerUnit = yearLengthDays / total;
  let start = yearStartJd - elapsedFraction * cycle[firstLord].units * daysPerUnit;

  const result: AnnualMahadasha[] = [];
  for (let i = 0; i < cycle.length; i++) {
    const index = (firstLord + i) % cycle.length;
    const lord = cycle[index];
    const length = lord.units * daysPerUnit;
    const antardashas: AnnualPeriod[] = [];
    let subStart = start;
    // Antardaśās begin with the mahādaśā lord and follow the same order, each
    // taking its share of the mahādaśā in proportion to its own length.
    for (let j = 0; j < cycle.length; j++) {
      const sub = cycle[(index + j) % cycle.length];
      const subLength = (length * sub.units) / total;
      antardashas.push({ lord: sub.name, startJd: subStart, endJd: subStart + subLength });
      subStart += subLength;
    }
    result.push({ lord: lord.name, startJd: start, endJd: start + length, antardashas });
    start += length;
  }
  return result;
}

// ── Mudda (Varṣa Vimśottarī) ─────────────────────────────────────────────
// Vimśottarī's 120 years become 360 days: each lord keeps three days per year.

export const MUDDA_CYCLE: DashaLord[] = [
  { name: 'Sun', units: 18 },
  { name: 'Moon', units: 30 },
  { name: 'Mars', units: 21 },
  { name: 'Rahu', units: 54 },
  { name: 'Jupiter', units: 48 },
  { name: 'Saturn', units: 57 },
  { name: 'Mercury', units: 51 },
  { name: 'Ketu', units: 21 },
  { name: 'Venus', units: 60 },
];

/**
 * First Mudda lord (index into MUDDA_CYCLE): the remainder of
 * (janma nakṣatra number + completed years − 2) ÷ 9, counted from the Sun.
 * At age 0 this is the lord of the natal nakṣatra, and each year moves one
 * step on.
 */
export function muddaFirstLord(janmaNakshatra: number, completedYears: number): number {
  const remainder = (((janmaNakshatra + completedYears - 2) % 9) + 9) % 9;
  return (remainder + 8) % 9;
}

// ── Tithi Aṣṭottarī ─────────────────────────────────────────────────────
// Aṣṭottarī's eight lords and 108 years, entered by the tithi rather than the
// nakṣatra. Tithi lords after PyJHora's tithi_ashtottari.py.

export const ASHTOTTARI_CYCLE: DashaLord[] = [
  { name: 'Sun', units: 6 },
  { name: 'Moon', units: 15 },
  { name: 'Mars', units: 8 },
  { name: 'Mercury', units: 17 },
  { name: 'Saturn', units: 10 },
  { name: 'Jupiter', units: 19 },
  { name: 'Rahu', units: 12 },
  { name: 'Venus', units: 21 },
];

// Tithi 1–30 → lord. The weekday order Sun…Saturn repeats with Rahu taking
// the eighth, the 23rd and Amāvāsyā; Pūrṇimā (15) goes to Saturn.
const TITHI_LORDS: Record<number, string> = {};
const TITHI_GROUPS: [string, number[]][] = [
  ['Sun', [1, 9, 16, 24]],
  ['Moon', [2, 10, 17, 25]],
  ['Mars', [3, 11, 18, 26]],
  ['Mercury', [4, 12, 19, 27]],
  ['Jupiter', [5, 13, 20, 28]],
  ['Venus', [6, 14, 21, 29]],
  ['Saturn', [7, 15, 22]],
  ['Rahu', [8, 23, 30]],
];
for (const [lord, tithis] of TITHI_GROUPS) for (const t of tithis) TITHI_LORDS[t] = lord;

/** Lord of tithi 1–30 (1 = Śukla Pratipadā, 30 = Amāvāsyā). */
export function tithiLord(tithi: number): string {
  return TITHI_LORDS[tithi];
}

/** Index into ASHTOTTARI_CYCLE of the lord of tithi 1–30. */
export function tithiAshtottariFirstLord(tithi: number): number {
  return ASHTOTTARI_CYCLE.findIndex((lord) => lord.name === TITHI_LORDS[tithi]);
}
