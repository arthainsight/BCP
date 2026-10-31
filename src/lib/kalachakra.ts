import { normalizeDegrees } from './angles';
import { SIGN_NAMES } from './signs';
import { NAKSHATRA_NAMES } from './nakshatras';
import { addDashaYears, dashaYearMs } from './time';
const SIGN_YEARS = [7, 16, 9, 21, 5, 9, 16, 7, 10, 4, 4, 10] as const;
// The four groups of nakṣatras (BPHS 46.56–58, 65, 71–72, 77): the ten stars of the first savya group (Aśvinī, Kṛttikā, Punarvasu,
// Āśleṣā, Hasta, Svātī, Mūla, Uttara Āṣāḍhā, Pūrva Bhādrapadā and Revatī: "vahnivātādiviśvarkṣarevatyaḥ savyatārakāḥ"), the five of
// the second (Bharaṇī, Puṣya, Citrā, Pūrva Āṣāḍhā, Uttara Bhādrapadā), the four of the first apasavya group (Rohiṇī, Maghā, Viśākhā,
// Śravaṇa) and the eight of the second (Mṛgaśīrṣa, Ārdrā, the two Phalgunīs, Anurādhā, Jyeṣṭhā, Dhaniṣṭhā, Śatabhiṣā). Revatī is
// the 27th star: 1, 3, 7, 9, 13, 15, 19, 21, 25 and 27 are six apart in pairs, as 2, 8, 14, 20 and 26 are six apart.
const STAR_GROUPS = [
  [0, 2, 6, 8, 12, 14, 18, 20, 24, 26],
  [1, 7, 13, 19, 25],
  [3, 9, 15, 21],
  [4, 5, 10, 11, 16, 17, 22, 23],
] as const;

const CYCLES: number[][][] = [
  [[0,1,2,3,4,5,6,7,8], [9,10,11,7,6,5,3,4,2], [1,0,11,10,9,8,0,1,2], [3,4,5,6,7,8,9,10,11]],
  [[7,6,5,3,4,2,1,0,11], [10,9,8,0,1,2,3,4,5], [6,7,8,9,10,11,7,6,5], [3,4,2,1,0,11,10,9,8]],
  [[8,9,10,11,0,1,2,4,3], [5,6,7,11,10,9,8,7,6], [5,4,3,2,1,0,8,9,10], [11,0,1,2,4,3,5,6,7]],
  [[11,10,9,8,7,6,5,4,3], [2,1,0,8,9,10,11,0,1], [2,4,3,5,6,7,11,10,9], [8,7,6,5,4,3,2,1,0]],
];

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
    endDate: addDashaYears(startDate, durationYears),
    durationYears,
    cycleIndex,
    fullDurationYears,
    elapsedYears,
  };
}

export function calculateKalachakra(moonLongitude: number, birthDate: Date): KalachakraResult {
  const longitude = normalizeDegrees(moonLongitude);
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

export function calculateKalachakraSubDashas(parent: KalachakraEntry, cycle: number[]): KalachakraEntry[] {
  const parentIndex = parent.cycleIndex >= 0 ? parent.cycleIndex : cycle.indexOf(parent.sign - 1);
  const indexedCycle = cycle.map((sign, cycleIndex) => ({ sign, cycleIndex }));
  const ordered = parentIndex < 0
    ? indexedCycle
    : [...indexedCycle.slice(parentIndex), ...indexedCycle.slice(0, parentIndex)];
  const totalWeight = ordered.reduce((sum, item) => sum + SIGN_YEARS[item.sign], 0);
  let cursor = addDashaYears(parent.startDate, -parent.elapsedYears);
  const fullEntries = ordered.map(({ sign, cycleIndex }) => {
    const duration = parent.fullDurationYears * SIGN_YEARS[sign] / totalWeight;
    const item = entry(sign, cursor, duration, cycleIndex);
    cursor = item.endDate;
    return item;
  });

  return fullEntries
    .filter((item) => item.endDate > parent.startDate)
    .map((item) => {
      if (item.startDate >= parent.startDate) return item;
      const durationYears = (item.endDate.getTime() - parent.startDate.getTime()) / dashaYearMs();
      return entry(item.sign - 1, parent.startDate, durationYears, item.cycleIndex, item.fullDurationYears, item.fullDurationYears - durationYears);
    });
}

export const calculateKalachakraAntardashas = calculateKalachakraSubDashas;
