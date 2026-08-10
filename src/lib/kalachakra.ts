const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] as const;
const SIGN_YEARS = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10] as const;
const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanistha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

const STAR_GROUPS = [
  [0, 2, 6, 8, 12, 14, 18, 20, 24],
  [1, 7, 13, 19, 25, 26],
  [3, 9, 15, 21],
  [4, 5, 10, 11, 16, 17, 22, 23],
] as const;

const CYCLES: number[][][] = [
  [[0,1,2,3,4,5,6,7,8], [9,10,11,7,6,5,3,4,2], [1,0,11,10,9,8,0,1,2], [3,4,5,6,7,8,9,10,11]],
  [[7,6,5,3,4,2,1,0,11], [10,9,8,0,1,2,3,4,5], [6,7,8,9,10,11,7,6,5], [3,4,2,1,0,11,10,9,8]],
  [[8,9,10,11,0,1,2,4,3], [5,6,7,11,10,9,8,7,6], [5,4,3,2,1,0,8,9,10], [11,0,1,2,4,3,5,6,7]],
  [[11,10,9,8,7,6,5,4,3], [2,1,0,8,9,10,11,0,1], [2,4,3,5,6,7,11,10,9], [8,7,6,5,4,3,2,1,0]],
];
const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export type KalachakraEntry = {
  sign: number;
  signName: string;
  startDate: Date;
  endDate: Date;
  durationYears: number;
  cycleIndex: number;
  fullDurationYears: number;
  elapsedYears: number;
};
export type KalachakraResult = {
  nakshatra: string;
  pada: number;
  motion: 'savya' | 'apasavya';
  dehaSign: string;
  jeevaSign: string;
  entries: KalachakraEntry[];
  cycle: number[];
};

function addYears(date: Date, years: number) {
  return new Date(date.getTime() + years * YEAR_MS);
}

function groupForNakshatra(index: number): number {
  return STAR_GROUPS.findIndex((group) => group.includes(index as never));
}

function entry(
  sign: number,
  startDate: Date,
  durationYears: number,
  cycleIndex: number,
  fullDurationYears = durationYears,
  elapsedYears = 0,
): KalachakraEntry {
  return {
    sign: sign + 1,
    signName: SIGN_NAMES[sign],
    startDate,
    endDate: addYears(startDate, durationYears),
    durationYears,
    cycleIndex,
    fullDurationYears,
    elapsedYears,
  };
}

export function calculateKalachakra(moonLongitude: number, birthDate: Date): KalachakraResult {
  const longitude = ((moonLongitude % 360) + 360) % 360;
  const nakshatraSpan = 360 / 27;
  const padaSpan = 360 / 108;
  const nakshatraIndex = Math.floor(longitude / nakshatraSpan);
  const positionInNakshatra = longitude - nakshatraIndex * nakshatraSpan;
  const padaIndex = Math.min(3, Math.floor(positionInNakshatra / padaSpan));
  const fractionInPada = (positionInNakshatra - padaIndex * padaSpan) / padaSpan;
  const group = groupForNakshatra(nakshatraIndex);
  const cycle = CYCLES[group][padaIndex];
  const firstSignYears = SIGN_YEARS[cycle[0]];
  const elapsedFirstSignYears = fractionInPada * firstSignYears;

  const entries: KalachakraEntry[] = [];
  let cursor = birthDate;
  for (let i = 0; i < cycle.length; i++) {
    const sign = cycle[i];
    const fullDuration = SIGN_YEARS[sign];
    const elapsed = i === 0 ? elapsedFirstSignYears : 0;
    const duration = fullDuration - elapsed;
    const item = entry(sign, cursor, duration, i, fullDuration, elapsed);
    entries.push(item);
    cursor = item.endDate;
  }

  const motion = group < 2 ? 'savya' : 'apasavya';
  const dehaIndex = motion === 'savya' ? cycle[0] : cycle[cycle.length - 1];
  const jeevaIndex = motion === 'savya' ? cycle[cycle.length - 1] : cycle[0];
  return {
    nakshatra: NAKSHATRA_NAMES[nakshatraIndex],
    pada: padaIndex + 1,
    motion,
    dehaSign: SIGN_NAMES[dehaIndex],
    jeevaSign: SIGN_NAMES[jeevaIndex],
    entries,
    cycle: [...cycle],
  };
}

export function calculateKalachakraAntardashas(parent: KalachakraEntry, cycle: number[]): KalachakraEntry[] {
  const parentIndex = parent.cycleIndex >= 0 ? parent.cycleIndex : cycle.indexOf(parent.sign - 1);
  const ordered = parentIndex < 0 ? cycle : [...cycle.slice(parentIndex), ...cycle.slice(0, parentIndex)];
  const totalWeight = ordered.reduce((sum, sign) => sum + SIGN_YEARS[sign], 0);
  let cursor = addYears(parent.startDate, -parent.elapsedYears);
  const fullEntries = ordered.map((sign, index) => {
    const duration = parent.fullDurationYears * SIGN_YEARS[sign] / totalWeight;
    const item = entry(sign, cursor, duration, index);
    cursor = item.endDate;
    return item;
  });

  return fullEntries
    .filter((item) => item.endDate > parent.startDate)
    .map((item) => {
      if (item.startDate >= parent.startDate) return item;
      const durationYears = (item.endDate.getTime() - parent.startDate.getTime()) / YEAR_MS;
      return entry(item.sign - 1, parent.startDate, durationYears, item.cycleIndex, item.fullDurationYears, item.fullDurationYears - durationYears);
    });
}