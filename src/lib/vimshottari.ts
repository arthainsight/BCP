// Vimshottari Dasha — standard 120-year cycle from Moon nakshatra

const LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;

const YEARS: Record<string, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanistha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const NAKSHATRA_SIZE = 360 / 27; // 13.333...°

// Julian year: 365.25 days — standard for Vimshottari date arithmetic
function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
}

export interface MahadashaEntry {
  lord: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
}

export interface VimshottariResult {
  nakshatra: string;
  nakshatraLord: string;
  entries: MahadashaEntry[];
}

export function calculateVimshottari(
  moonLongitude: number,
  birthDate: Date,
): VimshottariResult {
  const nakshatraIndex = Math.floor(moonLongitude / NAKSHATRA_SIZE);
  const lordIndex = nakshatraIndex % 9;
  const startLord = LORDS[lordIndex];

  // Fraction of nakshatra already traversed → remaining balance at birth
  const positionInNakshatra = moonLongitude - nakshatraIndex * NAKSHATRA_SIZE;
  const fractionRemaining = 1 - positionInNakshatra / NAKSHATRA_SIZE;

  const entries: MahadashaEntry[] = [];
  let cursor = birthDate;

  for (let i = 0; i < 9; i++) {
    const lord = LORDS[(lordIndex + i) % 9];
    const duration = i === 0 ? YEARS[startLord] * fractionRemaining : YEARS[lord];
    const endDate = addYears(cursor, duration);
    entries.push({ lord, startDate: cursor, endDate, durationYears: duration });
    cursor = endDate;
  }

  return {
    nakshatra: NAKSHATRA_NAMES[nakshatraIndex] ?? `Nakshatra ${nakshatraIndex}`,
    nakshatraLord: startLord,
    entries,
  };
}

// Generic Vimshottari sub-period calculator.
// Next level duration = parent duration * sub-lord years / 120.
// The sub-period sequence starts from the parent lord.
export function calculateSubDashas(parent: MahadashaEntry): MahadashaEntry[] {
  const parentLordIndex = LORDS.findIndex((l) => l === parent.lord);
  let cursor = parent.startDate;

  return LORDS.map((_, i) => {
    const lord = LORDS[(parentLordIndex + i) % 9];
    const duration = (parent.durationYears * YEARS[lord]) / 120;
    const endDate = addYears(cursor, duration);
    const entry: MahadashaEntry = { lord, startDate: cursor, endDate, durationYears: duration };
    cursor = endDate;
    return entry;
  });
}

// AD duration = MD duration * AD lord years / 120
export function calculateAntardashas(md: MahadashaEntry): MahadashaEntry[] {
  return calculateSubDashas(md);
}

// PD duration = AD duration * PD lord years / 120
export function calculatePratyantardashas(ad: MahadashaEntry): MahadashaEntry[] {
  return calculateSubDashas(ad);
}

// Three deeper sub-levels after PD.
export function calculateSookshmaDashas(pd: MahadashaEntry): MahadashaEntry[] {
  return calculateSubDashas(pd);
}

export function calculatePranaDashas(sd: MahadashaEntry): MahadashaEntry[] {
  return calculateSubDashas(sd);
}

export function calculateDehaDashas(prana: MahadashaEntry): MahadashaEntry[] {
  return calculateSubDashas(prana);
}
