import { PlanetData } from '@/types';

const KARAKA_ABBR = ['AK', 'AmK', 'BK', 'MK', 'PiK', 'PuK', 'GK', 'DK'];
const KARAKA_FULL = [
  'Ātmakāraka',
  'Amātyakāraka',
  'Bhrātṛkāraka',
  'Mātṛkāraka',
  'Pitṛkāraka',
  'Putrakāraka',
  'Jñātikāraka',
  'Dārakāraka',
];

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

const RELEVANT_PLANETS = new Set([
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu',
]);

export function calculateCharaKarakas(planets: PlanetData[]): CharaKaraka[] {
  const ranked = planets
    .filter((p) => RELEVANT_PLANETS.has(p.name))
    .map((p) => ({
      planet: p.name,
      // Rahu moves retrograde; use distance from 30° end of sign
      effectiveDegree: p.name === 'Rahu' ? 30 - p.degree : p.degree,
    }))
    .sort((a, b) => b.effectiveDegree - a.effectiveDegree);

  return ranked.map((entry, i) => ({
    karaka: KARAKA_ABBR[i],
    karakaFull: KARAKA_FULL[i],
    karakaDesc: KARAKA_DESC[KARAKA_ABBR[i]],
    planet: entry.planet,
    degree: entry.effectiveDegree,
  }));
}
