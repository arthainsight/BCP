// The twelve signs, in zodiac order from Aries (index 0). The one place these lists are written; counting from 1
// (house or sign numbers) is `SIGN_NAMES[sign - 1]`.

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const SIGN_ABBR = [
  'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi',
  'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi',
] as const;

/** The graha that rules each sign, by its English name (Rahu and Ketu rule none). */
export const SIGN_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
] as const;

/** The name, the abbreviation and the lord of a sign counted from 1 (Aries) to 12. */
export const signName = (sign: number) => SIGN_NAMES[sign - 1];
export const signAbbr = (sign: number) => SIGN_ABBR[sign - 1];
export const signLord = (sign: number) => SIGN_LORDS[sign - 1];
