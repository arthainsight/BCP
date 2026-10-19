// The 27 nakṣatras, from Aśvinī (index 0), by their plain English spelling. The one place the list is written.

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

/** The width of a nakṣatra in degrees. */
export const NAKSHATRA_SIZE = 360 / 27;

/** The three-letter abbreviations the charts write beside a graha. */
export const NAKSHATRA_ABBR = [
  'Asw', 'Bha', 'Krt', 'Roh', 'Mrg', 'Ard',
  'Pun', 'Pus', 'Asl', 'Mag', 'PFa', 'UFa',
  'Has', 'Cit', 'Swa', 'Vis', 'Anu', 'Jye',
  'Mul', 'PAs', 'UAs', 'Sra', 'Dha', 'Sat',
  'PBh', 'UBh', 'Rev',
] as const;

/** The abbreviation of the nakṣatra a longitude (0-360) falls in. */
export function nakshatraAbbr(longitude: number): string {
  return NAKSHATRA_ABBR[Math.min(Math.floor(longitude / NAKSHATRA_SIZE), 26)] ?? '';
}

/** The Vimshottari lord of each nakṣatra, from Aśvinī: the nine lords in turn, three times round. */
export const NAKSHATRA_LORDS = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'] as const;

/** The Vimshottari lord of the nakṣatra a longitude (0-360) falls in. */
export function nakshatraLordOf(longitude: number): string {
  return NAKSHATRA_LORDS[Math.min(Math.floor(longitude / NAKSHATRA_SIZE), 26) % 9];
}
