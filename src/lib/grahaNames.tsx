'use client';

import { createContext, useContext, useMemo } from 'react';
import type { GrahaNameStyle } from '@/types';

// How the grahas are named on screen: the English names (Sun, Moon, Mars …) or
// the Sanskrit ones (Sūrya, Candra, Maṅgala …), with the short codes that go
// with them. The names inside the calculations are always the English ones;
// only what is shown changes.

export const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;

const NAMES: Record<GrahaNameStyle, Record<string, string>> = {
  english: {
    Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mercury', Jupiter: 'Jupiter', Venus: 'Venus', Saturn: 'Saturn',
    Rahu: 'Rahu', Ketu: 'Ketu', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto', Asc: 'Ascendant',
  },
  sanskrit: {
    Sun: 'Sūrya', Moon: 'Candra', Mars: 'Maṅgala', Mercury: 'Budha', Jupiter: 'Guru', Venus: 'Śukra', Saturn: 'Śani',
    Rahu: 'Rāhu', Ketu: 'Ketu', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto', Asc: 'Lagna',
  },
};

const CODES: Record<GrahaNameStyle, Record<string, string>> = {
  english: {
    Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
    Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl', Asc: 'Asc',
  },
  sanskrit: {
    Sun: 'Su', Moon: 'Ch', Mars: 'Ma', Mercury: 'Bu', Jupiter: 'Gu', Venus: 'Sk', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
    Uranus: 'Ur', Neptune: 'Ne', Pluto: 'Pl', Asc: 'La',
  },
};

/** Full name of a graha (or "Asc") in the chosen style; unknown names are returned as they are. */
export function grahaName(name: string, style: GrahaNameStyle = 'english'): string {
  return NAMES[style][name] ?? name;
}

/** Short code of a graha (or "Asc") in the chosen style; unknown names fall back to their first two letters. */
export function grahaCode(name: string, style: GrahaNameStyle = 'english'): string {
  return CODES[style][name] ?? name.slice(0, 2);
}

/** Converts an English short code (as in a nakṣatra's lord) into the code of the chosen style: "Mo" becomes "Ch" in Sanskrit. */
export function grahaCodeFromEnglishCode(englishCode: string, style: GrahaNameStyle = 'english'): string {
  const graha = Object.keys(CODES.english).find(name => CODES.english[name] === englishCode);
  return graha ? grahaCode(graha, style) : englishCode;
}

const GRAHA_WORDS = /\b(Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)\b/g;

/** Replaces every graha name inside a text, for example "Bhadrika (Mercury)" becomes "Bhadrika (Budha)". */
export function translateGrahas(text: string, style: GrahaNameStyle = 'english'): string {
  return style === 'english' ? text : text.replace(GRAHA_WORDS, word => NAMES[style][word] ?? word);
}

export const GrahaNamesContext = createContext<GrahaNameStyle>('english');

/** The graha naming functions for the style chosen in Settings. */
export function useGrahaNames() {
  const style = useContext(GrahaNamesContext);
  return useMemo(() => ({
    style,
    name: (name: string) => grahaName(name, style),
    code: (name: string) => grahaCode(name, style),
    translate: (text: string) => translateGrahas(text, style),
  }), [style]);
}
