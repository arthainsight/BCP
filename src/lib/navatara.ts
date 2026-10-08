// Nava-Tara chakra: the 27 nakṣatras counted in nine groups of three from a
// reference nakṣatra (the Moon's, the Janma nakṣatra). Each group is a Tara
// with its own nature: the nakṣatras 1, 10 and 19 from Janma are Janma tara,
// 2, 11 and 20 are Sampat, and so on round to Ati-Mitra.

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanistha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

export type TaraQuality = 'good' | 'mixed' | 'bad';

export interface Tara {
  number: number;
  name: string;
  meaning: string;
  quality: TaraQuality;
}

export const TARAS: Tara[] = [
  { number: 1, name: 'Janma', meaning: 'birth, the body', quality: 'mixed' },
  { number: 2, name: 'Sampat', meaning: 'wealth', quality: 'good' },
  { number: 3, name: 'Vipat', meaning: 'danger, setbacks', quality: 'bad' },
  { number: 4, name: 'Kshema', meaning: 'well-being', quality: 'good' },
  { number: 5, name: 'Pratyari', meaning: 'obstacles', quality: 'bad' },
  { number: 6, name: 'Sadhaka', meaning: 'achievement', quality: 'good' },
  { number: 7, name: 'Vadha', meaning: 'harm, destruction', quality: 'bad' },
  { number: 8, name: 'Mitra', meaning: 'friendship', quality: 'good' },
  { number: 9, name: 'Ati-Mitra', meaning: 'close friendship', quality: 'good' },
];

const NAKSHATRA_SIZE = 360 / 27;

/** Index 0–26 of the nakṣatra a longitude falls in; the adjustment is the chart's nakṣatra offset. */
export function nakshatraIndex(longitude: number, adjust = 0): number {
  const normalized = (((longitude + adjust) % 360) + 360) % 360;
  return Math.min(26, Math.floor(normalized / NAKSHATRA_SIZE));
}

/** Tara number 1–9 of a nakṣatra, counted from the reference one. */
export function taraNumber(reference: number, target: number): number {
  return ((((target - reference) % 27) + 27) % 27) % 9 + 1;
}

export interface NavataraNakshatra {
  index: number;
  name: string;
  /** Count from the reference nakṣatra, 1–27. */
  count: number;
  natal: string[];
  transit: string[];
}

export interface NavataraGroup {
  tara: Tara;
  nakshatras: NavataraNakshatra[];
}

export interface BodyPosition {
  name: string;
  longitude: number;
}

/** The nine Taras with their three nakṣatras each, and the grahas standing in them. */
export function buildNavatara(
  referenceLongitude: number,
  natal: BodyPosition[],
  transit: BodyPosition[] = [],
  adjust = 0,
): { reference: number; groups: NavataraGroup[] } {
  const reference = nakshatraIndex(referenceLongitude, adjust);
  const inNakshatra = (bodies: BodyPosition[], index: number) =>
    bodies.filter(body => nakshatraIndex(body.longitude, adjust) === index).map(body => body.name);
  const groups = TARAS.map(tara => ({
    tara,
    nakshatras: [0, 9, 18].map(step => {
      const index = (reference + tara.number - 1 + step) % 27;
      return {
        index,
        name: NAKSHATRAS[index],
        count: tara.number + step,
        natal: inNakshatra(natal, index),
        transit: inNakshatra(transit, index),
      };
    }),
  }));
  return { reference, groups };
}
