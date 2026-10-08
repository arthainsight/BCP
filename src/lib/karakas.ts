import { PlanetData } from '@/types';

/** The karakas of the eight-karaka scheme (Rahu included), in rank order. */
const KARAKA_ABBR_8 = ['AK', 'AmK', 'BK', 'MK', 'PiK', 'PuK', 'GK', 'DK'];
const KARAKA_FULL_8 = [
  'Ātmakāraka',
  'Amātyakāraka',
  'Bhrātṛkāraka',
  'Mātṛkāraka',
  'Pitṛkāraka',
  'Putrakāraka',
  'Jñātikāraka',
  'Dārakāraka',
];
/** The seven-karaka scheme has no Pitṛkāraka and leaves Rahu out. */
const KARAKA_ABBR_7 = ['AK', 'AmK', 'BK', 'MK', 'PuK', 'GK', 'DK'];
const KARAKA_FULL_7 = KARAKA_FULL_8.filter(name => name !== 'Pitṛkāraka');

const KARAKA_DESC: Record<string, string> = {
  AK: 'Soul — self, dharma, body',
  AmK: 'Minister — career, intellect, means of livelihood',
  BK: 'Sibling — effort, courage, younger siblings',
  MK: 'Mother — home, emotions, early nurturing',
  PiK: 'Father — ancestors, fortune, teachers',
  PuK: 'Children — intelligence, creativity, progeny',
  GK: 'Kinsmen — disputes, relatives, diseases',
  DK: 'Spouse — relationships, partners, desires',
};

export interface CharaKaraka {
  karaka: string;
  karakaFull: string;
  karakaDesc: string;
  planet: string;
  degree: number;
}

export type CharaKarakaRankMode = 'degree' | 'minute';
/** 8: Sun to Saturn and Rahu; 7: Sun to Saturn only. */
export type CharaKarakaCount = 7 | 8;

/** How the karakas are ranked and how many there are. */
export interface CharaKarakaScheme {
  rankMode: CharaKarakaRankMode;
  count: CharaKarakaCount;
}

export const DEFAULT_KARAKA_SCHEME: CharaKarakaScheme = { rankMode: 'degree', count: 8 };

const RELEVANT_PLANETS = new Set([
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu',
]);

export function calculateCharaKarakas(
  planets: PlanetData[],
  rankMode: CharaKarakaRankMode = 'degree',
  count: CharaKarakaCount = 8,
): CharaKaraka[] {
  const abbreviations = count === 7 ? KARAKA_ABBR_7 : KARAKA_ABBR_8;
  const fullNames = count === 7 ? KARAKA_FULL_7 : KARAKA_FULL_8;
  const ranked = planets
    .filter((p) => RELEVANT_PLANETS.has(p.name) && (count === 8 || p.name !== 'Rahu'))
    .map((p) => {
      // Rahu moves retrograde; use distance from the 30° end of the sign.
      const effectiveDegree = p.name === 'Rahu' ? 30 - p.degree : p.degree;
      const effectiveMinute = (effectiveDegree - Math.floor(effectiveDegree)) * 60;
      return {
        planet: p.name,
        effectiveDegree,
        rankValue: rankMode === 'minute' ? effectiveMinute : effectiveDegree,
      };
    })
    .sort((a, b) =>
      b.rankValue - a.rankValue
      || b.effectiveDegree - a.effectiveDegree
      || a.planet.localeCompare(b.planet)
    );

  return ranked.map((entry, i) => ({
    karaka: abbreviations[i],
    karakaFull: fullNames[i],
    karakaDesc: KARAKA_DESC[abbreviations[i]],
    planet: entry.planet,
    degree: entry.effectiveDegree,
  }));
}
