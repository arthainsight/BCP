import { normalizeDegrees } from './angles';
import { NAKSHATRA_NAMES, NAKSHATRA_SIZE } from './nakshatras';

// The Sarvatobhadra Chakra: nine rows of nine squares. The nakṣatras (28, with Abhijit) go round the edge, the
// vowels, the consonants and the twelve rāśis inside it, and the five groups of tithis with the days of the week
// in the middle. The grahas are placed in the square of the nakṣatra they are in. The squares are the ones of the
// JHora chart this was made from; two squares hold the same vowel (a), as they do there.

export type SbcKind = 'nakshatra' | 'vowel' | 'consonant' | 'sign' | 'tithi';

export interface SbcCell {
  kind: SbcKind;
  /** What the square shows. */
  label: string;
  /** Nakṣatra: its name, one of NAKSHATRA_NAMES or 'Abhijit'. */
  nakshatra?: string;
  /** Rāśi: 1 (Aries) to 12 (Pisces). */
  sign?: number;
  /** Tithi group: its name, and the days of the week it goes with (0 is Sunday). */
  group?: TithiGroup;
  weekdays?: number[];
}

export type TithiGroup = 'Nanda' | 'Bhadra' | 'Jaya' | 'Rikta' | 'Poorna';

const n = (label: string, nakshatra: string): SbcCell => ({ kind: 'nakshatra', label, nakshatra });
const v = (label: string): SbcCell => ({ kind: 'vowel', label });
const c = (label: string): SbcCell => ({ kind: 'consonant', label });
const s = (label: string, sign: number): SbcCell => ({ kind: 'sign', label, sign });
const t = (group: TithiGroup, weekdays: number[]): SbcCell => ({ kind: 'tithi', label: group, group, weekdays });

/** The 9 × 9 squares, the top row first, the left square first. */
export const SBC_GRID: readonly (readonly SbcCell[])[] = [
  [v('ii'), n('Dhan', 'Dhanishtha'), n('Sata', 'Shatabhisha'), n('PBha', 'Purva Bhadrapada'), n('UBha', 'Uttara Bhadrapada'), n('Reva', 'Revati'), n('Aswi', 'Ashwini'), n('Bhar', 'Bharani'), v('a')],
  [n('Srav', 'Shravana'), v('rii'), c('g'), c('s'), c('d'), c('ch'), c('l'), v('u'), n('Krit', 'Krittika')],
  [n('Abhi', 'Abhijit'), c('kh'), v('ai'), s('Aq', 11), s('Pi', 12), s('Ar', 1), v('lu'), v('a'), n('Rohi', 'Rohini')],
  [n('USha', 'Uttara Ashadha'), c('j'), s('Cp', 10), v('ah'), t('Rikta', [5]), v('o'), s('Ta', 2), c('v'), n('Mrig', 'Mrigashira')],
  [n('PSha', 'Purva Ashadha'), c('bh'), s('Sg', 9), t('Jaya', [4]), t('Poorna', [6]), t('Nanda', [0, 2]), s('Ge', 3), c('k'), n('Ardr', 'Ardra')],
  [n('Mool', 'Mula'), c('y'), s('Sc', 8), v('am'), t('Bhadra', [1, 3]), v('au'), s('Cn', 4), c('h'), n('Puna', 'Punarvasu')],
  [n('Jye', 'Jyeshtha'), c('n'), v('e'), s('Li', 7), s('Vi', 6), s('Le', 5), v('luu'), c('d'), n('Push', 'Pushya')],
  [n('Anu', 'Anuradha'), v('ri'), c('t'), c('r'), c('p'), c('t~'), c('m'), v('uu'), n('Asre', 'Ashlesha')],
  [v('i'), n('Visa', 'Vishakha'), n('Swat', 'Swati'), n('Chit', 'Chitra'), n('Hast', 'Hasta'), n('UPha', 'Uttara Phalguni'), n('PPha', 'Purva Phalguni'), n('Magh', 'Magha'), v('aa')],
];

export type SbcPosition = readonly [row: number, column: number];

/** The square (row, column, from 0) of every nakṣatra. */
export const SBC_NAKSHATRA_CELLS: Readonly<Record<string, SbcPosition>> = Object.fromEntries(
  SBC_GRID.flatMap((row, r) => row.flatMap((cell, col) => (cell.nakshatra ? [[cell.nakshatra, [r, col] as SbcPosition]] : []))),
);

/** The square of each rāśi (1 to 12). */
export const SBC_SIGN_CELLS: Readonly<Record<number, SbcPosition>> = Object.fromEntries(
  SBC_GRID.flatMap((row, r) => row.flatMap((cell, col) => (cell.sign ? [[cell.sign, [r, col] as SbcPosition]] : []))),
);

/** The square of each group of tithis. */
export const SBC_TITHI_CELLS: Readonly<Record<TithiGroup, SbcPosition>> = Object.fromEntries(
  SBC_GRID.flatMap((row, r) => row.flatMap((cell, col) => (cell.group ? [[cell.group, [r, col] as SbcPosition]] : []))),
) as Record<TithiGroup, SbcPosition>;

// --- Abhijit -----------------------------------------------------------------------------------------------------
// Abhijit is the stretch from 6°40' to 10°53'20" of Capricorn (276°40' to 280°53'20"): the last part of
// Uttara Ashadha and the first part of Shravana, which are shortened by it.

export const ABHIJIT_START = 276 + 40 / 60;
export const ABHIJIT_END = 280 + 53 / 60 + 20 / 3600;

/** The nakṣatra of a longitude among the 28: one of NAKSHATRA_NAMES, or 'Abhijit'. */
export function sbcNakshatra(longitude: number): string {
  const lon = normalizeDegrees(longitude);
  if (lon >= ABHIJIT_START && lon < ABHIJIT_END) return 'Abhijit';
  return NAKSHATRA_NAMES[Math.min(Math.floor(lon / NAKSHATRA_SIZE), 26)];
}

/** The square a longitude is in, by its nakṣatra; `adjust` is the nakṣatra zodiac's offset from the grahas' own. */
export function sbcCellOf(longitude: number, adjust = 0): SbcPosition {
  return SBC_NAKSHATRA_CELLS[sbcNakshatra(longitude + adjust)];
}

// --- Tithi and weekday -----------------------------------------------------------------------------------------

export const TITHI_GROUPS: readonly TithiGroup[] = ['Nanda', 'Bhadra', 'Jaya', 'Rikta', 'Poorna'];

/** The tithi (1 to 30) of the Moon and the Sun's longitudes, and the group it belongs to: 1, 6, 11 … are Nanda, 2, 7, 12 … Bhadra, and so on. */
export function tithiOf(sunLongitude: number, moonLongitude: number): { tithi: number; group: TithiGroup } {
  const tithi = Math.min(30, Math.floor(normalizeDegrees(moonLongitude - sunLongitude) / 12) + 1);
  return { tithi, group: TITHI_GROUPS[(tithi - 1) % 5] };
}

/** The group of a day of the week (0 is Sunday): Sunday and Tuesday Nanda, Monday and Wednesday Bhadra, Thursday Jaya, Friday Rikta, Saturday Poorna. */
export function weekdayGroup(weekday: number): TithiGroup {
  const day = ((weekday % 7) + 7) % 7;
  return (Object.entries(SBC_TITHI_CELLS) as [TithiGroup, SbcPosition][])
    .map(([group]) => group)
    .find(group => SBC_GRID[SBC_TITHI_CELLS[group][0]][SBC_TITHI_CELLS[group][1]].weekdays?.includes(day))!;
}

/**
 * The weekday (0 is Sunday) of a birth as the Vedic day counts it: the day begins at sunrise, so a birth before
 * sunrise belongs to the day before. `date` is the local date and `localHours` and `sunriseHours` are local decimal hours.
 */
export function vedicWeekday(date: { year: number; month: number; day: number }, localHours: number, sunriseHours: number | undefined): number {
  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  return sunriseHours !== undefined && localHours < sunriseHours ? (weekday + 6) % 7 : weekday;
}

// --- The grahas inside a square ---------------------------------------------------------------------------------

/** The room a square leaves for its grahas below the name, in the 100 × 100 of a square. */
const MARKS_WIDTH = 92;
const MARKS_HEIGHT = 56;
/** A letter of the chart's font is about this wide as a fraction of its size. */
const LETTER_WIDTH = 0.62;

/**
 * How the grahas of one square are laid out inside it: how many to a line, the size of the letters and the
 * height of a line. The letters shrink and the rows wrap as more grahas stand together, so that they stay in the
 * square. `longest` is the number of characters of the longest one.
 */
export function sbcMarkLayout(count: number, longest: number): { perLine: number; size: number; lineHeight: number } {
  const perLine = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
  const lines = Math.max(1, Math.ceil(count / perLine));
  const byCount = count <= 1 ? 26 : count <= 4 ? 21 : count <= 6 ? 18 : count <= 9 ? 15 : 13;
  const byWidth = Math.floor(MARKS_WIDTH / (perLine * Math.max(2, longest) * LETTER_WIDTH));
  const byHeight = Math.floor(MARKS_HEIGHT / (lines * 1.15));
  const size = Math.max(6, Math.min(byCount, byWidth, byHeight));
  return { perLine, size, lineHeight: size * 1.15 };
}

// --- Vedha ---------------------------------------------------------------------------------------------------------
// A graha has vedha on the nakṣatra directly across the chart from the one it stands in, and on the two nakṣatras
// on the diagonals from it: three lines run from its square into the chart, one straight and two at 45°, and each
// ends on the nakṣatra at the edge where it leaves the chart.

export type VedhaDirection = 'across' | 'diagonal';

export interface VedhaLine {
  direction: VedhaDirection;
  /** The squares the line crosses, from the one next to the graha's to the nakṣatra at its end. */
  path: SbcPosition[];
  /** The nakṣatra at the end of the line, which has the vedha. */
  target: SbcPosition;
}

/** The three lines of vedha from a nakṣatra square on the edge of the chart; null for a square that is not a nakṣatra's. */
export function sbcVedha(from: SbcPosition): VedhaLine[] | null {
  const [row, column] = from;
  if (!SBC_GRID[row]?.[column]?.nakshatra) return null;
  // Into the chart from the edge the square is on.
  const inward: readonly [number, number] = row === 0 ? [1, 0] : row === 8 ? [-1, 0] : column === 0 ? [0, 1] : [0, -1];
  const side: readonly [number, number] = [inward[1], inward[0]];
  const directions: [VedhaDirection, number, number][] = [
    ['across', inward[0], inward[1]],
    ['diagonal', inward[0] + side[0], inward[1] + side[1]],
    ['diagonal', inward[0] - side[0], inward[1] - side[1]],
  ];
  return directions.map(([direction, stepRow, stepColumn]) => {
    const path: SbcPosition[] = [];
    let r = row + stepRow;
    let c = column + stepColumn;
    while (r >= 0 && r < 9 && c >= 0 && c < 9) {
      path.push([r, c]);
      r += stepRow;
      c += stepColumn;
    }
    return { direction, path, target: path[path.length - 1] };
  });
}

// --- The name, and what a graha pierces ---------------------------------------------------------------------------

/** The squares of the chart that a letter or syllable of a name stands for (vowels and consonants), ignoring case: 'ch' is one square, 'd' two. */
export function sbcLetterSquares(text: string): SbcPosition[] {
  const wanted = text.trim().toLowerCase();
  if (!wanted) return [];
  return SBC_GRID.flatMap((row, r) => row.flatMap((cell, column) => ((cell.kind === 'vowel' || cell.kind === 'consonant') && cell.label.toLowerCase() === wanted ? [[r, column] as SbcPosition] : [])));
}

/** The points of a birth that the chakra is read for. */
export type SbcPointId = 'janma' | 'moonSign' | 'lagnaSign' | 'tithi' | 'vara' | 'name';

export interface SbcPoint {
  id: SbcPointId;
  position: SbcPosition;
}

export interface SbcPierce {
  point: SbcPoint;
  direction: VedhaDirection;
  /** 'end' when the point is the nakṣatra a line ends on, 'line' when the line only crosses its square. */
  at: 'end' | 'line';
}

/** Which of the points a graha's lines reach: the points whose square lies on one of its three lines, in the order of `points`. */
export function sbcPierces(lines: readonly VedhaLine[], points: readonly SbcPoint[]): SbcPierce[] {
  const hits: SbcPierce[] = [];
  for (const point of points) {
    for (const line of lines) {
      if (line.path.some(([r, column]) => r === point.position[0] && column === point.position[1])) {
        hits.push({ point, direction: line.direction, at: line.target[0] === point.position[0] && line.target[1] === point.position[1] ? 'end' : 'line' });
        break;
      }
    }
  }
  return hits;
}
