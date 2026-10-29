// The reference chart of the Ṣaḍbala and Bhāva Bala tests: 13 October 1987, 00:15 EET, Kotka (60.46667 N,
// 26.94583 E), Lahiri ayanamsa. The positions are the app's own. The expected numbers were worked out
// separately from the Sanskrit rules (the audit notes in docs/shadbala-sources.md and docs/shadbala-manual.md
// give every step), not by the app, with the decisions of the audit: the waning Moon a malefic, the mūlatrikoṇa
// 45 in the rāśi only, the Sun's and the Moon's Cheṣṭā Bala added to the total, and Dṛg Bala a quarter of the
// net aspect.

import type { ShadbalaChartLike, ShadbalaPlanet } from './shadbala';

export const REFERENCE_CHART: ShadbalaChartLike = {
  ascendant: { sign: 4, longitude: 114.54414658026127 },
  midheaven: 359.70649166138884,
  debug: {
    julianDay: 2447081.4270833335,
    ayanamsa: 23.686388896283233,
    siderealAyanamsa: 23.686388896283233,
    inputDateTime: '1987-10-13 00:15:00',
    sunriseLocalHours: 6.764217132702925,
    sunsetLocalHours: 17.168893737718008,
    nextSunriseLocalHours: 30.806000037118338,
    previousSunriseLocalHours: -17.277436288074114,
  },
  planets: [
    { name: 'Sun', longitude: 175.35945018610008, sign: 6, house: 3, speed: 0.9895424227498335, declination: -7.459388811762785 },
    { name: 'Moon', longitude: 65.16355521542967, sign: 3, house: 12, speed: 12.22188189209701, declination: 28.688789056814585 },
    { name: 'Mars', longitude: 158.9588132147914, sign: 6, house: 3, speed: 0.6430602219606304, declination: -0.14504848813216933 },
    { name: 'Mercury', longitude: 198.70672644229387, sign: 7, house: 4, speed: 0.4145030031744527, declination: -18.740312708833574 },
    { name: 'Jupiter', longitude: 1.754213422011535, sign: 1, house: 10, speed: -0.13369810487429085, declination: 8.363950439435337, isRetrograde: true },
    { name: 'Venus', longitude: 188.87826045970806, sign: 7, house: 4, speed: 1.2449938119996466, declination: -11.770605887604804 },
    { name: 'Saturn', longitude: 233.14880397832485, sign: 8, house: 5, speed: 0.07992155076193948, declination: -21.54586845038315 },
    { name: 'Rahu', longitude: 337.72078702269863, sign: 12, house: 9 },
    { name: 'Ketu', longitude: 157.7207870226987, sign: 6, house: 3 },
  ],
};

/** The Ṣaḍbala of the reference chart by part, in virūpa. */
export const EXPECTED_SHADBALA: Record<ShadbalaPlanet, {
  uccha: number; saptavargaja: number; ojhayugma: number; kendradi: number; drekkana: number; sthana: number;
  dig: number; natonnata: number; paksha: number; tribhaga: number; varsheshadi: number; ayana: number; kala: number;
  cheshta: number; naisargika: number; drik: number; total: number;
}> = {
  Sun:     { uccha: 4.88,  saptavargaja: 145, ojhayugma: 15, kendradi: 15, drekkana: 0,  sthana: 179.9, dig: 1.45,  natonnata: 1.42,  paksha: 23.27, tribhaga: 0,  varsheshadi: 0,  ayana: 20.48, kala: 45.2,  cheshta: 20.48, naisargika: 60,    drik: 3.08,   total: 310.0 },
  Moon:    { uccha: 49.28, saptavargaja: 109, ojhayugma: 15, kendradi: 15, drekkana: 0,  sthana: 188.3, dig: 21.82, natonnata: 58.58, paksha: 36.73, tribhaga: 0,  varsheshadi: 45, ayana: 0.15,  kala: 140.5, cheshta: 36.73, naisargika: 51.43, drik: -2.24,  total: 436.5 },
  Mars:    { uccha: 13.65, saptavargaja: 85,  ojhayugma: 0,  kendradi: 15, drekkana: 15, sthana: 128.7, dig: 6.92,  natonnata: 58.58, paksha: 23.27, tribhaga: 0,  varsheshadi: 60, ayana: 28.68, kala: 170.5, cheshta: 7.42,  naisargika: 17.14, drik: -14.27, total: 316.4 },
  Mercury: { uccha: 48.76, saptavargaja: 86,  ojhayugma: 15, kendradi: 60, drekkana: 15, sthana: 224.8, dig: 31.95, natonnata: 60,    paksha: 36.73, tribhaga: 0,  varsheshadi: 30, ayana: 49.54, kala: 176.3, cheshta: 49.05, naisargika: 25.71, drik: 7.55,   total: 515.3 },
  Jupiter: { uccha: 28.92, saptavargaja: 70,  ojhayugma: 30, kendradi: 60, drekkana: 15, sthana: 203.9, dig: 22.40, natonnata: 1.42,  paksha: 36.73, tribhaga: 60, varsheshadi: 0,  ayana: 42.72, kala: 140.9, cheshta: 58.63, naisargika: 34.29, drik: -17.01, total: 443.1 },
  Venus:   { uccha: 3.96,  saptavargaja: 133, ojhayugma: 0,  kendradi: 60, drekkana: 0,  sthana: 197.0, dig: 56.94, natonnata: 1.42,  paksha: 36.73, tribhaga: 60, varsheshadi: 0,  ayana: 14.06, kala: 112.2, cheshta: 9.08,  naisargika: 42.86, drik: 7.54,   total: 425.6 },
  Saturn:  { uccha: 48.95, saptavargaja: 112, ojhayugma: 0,  kendradi: 30, drekkana: 0,  sthana: 191.0, dig: 39.53, natonnata: 58.58, paksha: 23.27, tribhaga: 0,  varsheshadi: 15, ayana: 58.24, kala: 155.1, cheshta: 18.87, naisargika: 8.57,  drik: -5.27,  total: 407.8 },
};

/** The Bhāva Bala of the twelve houses of the reference chart (whole signs from the Cancer Lagna), in virūpa. */
export const EXPECTED_BHAVA: Array<{ house: number; lord: string; bhavesha: number; dig: number; drig: number; occupants: number; kala: number; total: number }> = [
  { house: 1, lord: 'Moon', bhavesha: 436.5, dig: 3.18, drig: 60.42, occupants: 0, kala: 15, total: 515.1 },
  { house: 2, lord: 'Sun', bhavesha: 310.0, dig: 14.90, drig: 29.44, occupants: 0, kala: 0, total: 354.4 },
  { house: 3, lord: 'Mercury', bhavesha: 515.3, dig: 43.18, drig: 12.40, occupants: -120, kala: 0, total: 450.9 },
  { house: 4, lord: 'Venus', bhavesha: 425.6, dig: 33.18, drig: 47.58, occupants: 60, kala: 0, total: 566.4 },
  { house: 5, lord: 'Mars', bhavesha: 316.4, dig: 36.82, drig: 39.00, occupants: -60, kala: 0, total: 332.2 },
  { house: 6, lord: 'Jupiter', bhavesha: 443.1, dig: 25.10, drig: 29.26, occupants: 0, kala: 15, total: 512.5 },
  { house: 7, lord: 'Saturn', bhavesha: 407.8, dig: 24.90, drig: 24.42, occupants: 0, kala: 15, total: 472.1 },
  { house: 8, lord: 'Saturn', bhavesha: 407.8, dig: 6.82, drig: 13.67, occupants: 0, kala: 0, total: 428.2 },
  { house: 9, lord: 'Jupiter', bhavesha: 443.1, dig: 4.90, drig: -29.09, occupants: 0, kala: 0, total: 418.9 },
  { house: 10, lord: 'Mars', bhavesha: 316.4, dig: 54.90, drig: 38.75, occupants: 60, kala: 15, total: 485.0 },
  { house: 11, lord: 'Venus', bhavesha: 425.6, dig: 44.90, drig: 37.50, occupants: 0, kala: 15, total: 523.0 },
  { house: 12, lord: 'Mercury', bhavesha: 515.3, dig: 46.82, drig: 46.53, occupants: 0, kala: 0, total: 608.6 },
];
