import type { GrahaKey, RelationType } from './types';

export const GRAHA_FULL_NAMES: Record<GrahaKey, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
};

export const GRAHA_KARAKAS: Record<GrahaKey, string[]> = {
  Su: ['soul', 'authority', 'father', 'government', 'status', 'visibility'],
  Mo: ['mind', 'mother', 'public', 'emotion', 'nourishment', 'fluids'],
  Ma: ['energy', 'conflict', 'land', 'engineering', 'brothers', 'surgery', 'weapons'],
  Me: ['intellect', 'speech', 'commerce', 'education', 'analysis', 'writing', 'calculation', 'coding'],
  Ju: ['jeeva', 'wisdom', 'children', 'teacher', 'dharma', 'expansion', 'guidance', 'wealth'],
  Ve: ['marriage', 'relationship', 'comfort', 'art', 'vehicle', 'pleasure', 'beauty'],
  Sa: ['karma', 'work', 'delay', 'labor', 'discipline', 'masses', 'old things', 'suffering'],
  Ra: ['foreign', 'technology', 'obsession', 'amplification', 'unconventional', 'illusion'],
  Ke: ['separation', 'moksha', 'past karma', 'cuts', 'detachment', 'spirituality'],
};

// Canonical key: always sort the two graha codes alphabetically
export function pairKey(a: GrahaKey, b: GrahaKey): string {
  return [a as string, b as string].sort().join('+');
}

// Keyed by canonical pairKey; values are thematic keywords in priority order
export const PAIR_THEMES: Record<string, string[]> = {
  [pairKey('Sa', 'Me')]: ['analytical', 'technical', 'commercial', 'coding', 'calculation', 'writing', 'system work'],
  [pairKey('Sa', 'Ma')]: ['labor', 'engineering', 'conflict', 'machinery', 'physical struggle', 'disciplined action'],
  [pairKey('Sa', 'Ju')]: ['teaching', 'responsibility', 'dharma through work', 'delayed wisdom', 'structured guidance'],
  [pairKey('Sa', 'Ve')]: ['relationship delays', 'design work', 'practical art', 'beauty and discipline'],
  [pairKey('Sa', 'Ra')]: ['foreign/tech work', 'unconventional career', 'pressure', 'obsession'],
  [pairKey('Sa', 'Ke')]: ['detachment from worldly work', 'karmic breaks', 'spiritual discipline'],
  [pairKey('Ju', 'Me')]: ['education', 'teaching', 'writing', 'advisory intelligence', 'knowledge business'],
  [pairKey('Ju', 'Ve')]: ['marriage blessing', 'wealth', 'arts', 'guidance through relationships'],
  [pairKey('Ju', 'Ma')]: ['technical knowledge', 'courage with dharma', 'engineering/strategy'],
  [pairKey('Ju', 'Ra')]: ['foreign knowledge', 'unconventional teaching', 'expansion through technology'],
  [pairKey('Ju', 'Ke')]: ['spiritual knowledge', 'detachment', 'moksha orientation'],
  [pairKey('Ve', 'Ma')]: ['passion', 'sexuality', 'design/action', 'relationship heat'],
  [pairKey('Ve', 'Ra')]: ['unconventional relationships', 'glamour', 'attraction', 'foreign influence'],
  [pairKey('Ve', 'Ke')]: ['detachment in love', 'spiritualized relationship', 'separation themes'],
  [pairKey('Me', 'Ra')]: ['technology', 'coding', 'analytics', 'internet', 'unusual intelligence'],
  [pairKey('Me', 'Ke')]: ['sharp analysis', 'research', 'detachment from ordinary communication'],
  [pairKey('Me', 'Ma')]: ['technical skill', 'debate', 'engineering', 'fast speech/action'],
  [pairKey('Mo', 'Sa')]: ['emotional heaviness', 'responsibility', 'public work', 'emotional restraint'],
  [pairKey('Mo', 'Ra')]: ['anxiety', 'public amplification', 'imagination', 'foreign/public influence'],
  [pairKey('Mo', 'Ke')]: ['detachment', 'intuition', 'emotional withdrawal'],
  [pairKey('Mo', 'Ju')]: ['emotional wisdom', 'teaching', 'protection', 'nourishment'],
  [pairKey('Su', 'Sa')]: ['authority versus labor', 'father/authority pressure', 'government/work themes'],
  [pairKey('Su', 'Ju')]: ['status through wisdom', 'father/teacher', 'dharma', 'leadership'],
  [pairKey('Su', 'Ra')]: ['unusual authority', 'foreign/government/visibility distortion'],
  [pairKey('Su', 'Ke')]: ['detachment from ego/status', 'spiritual authority'],
};

export const RELATION_MODIFIER: Record<RelationType, string> = {
  conjunction:  'directly combines with',
  secondFrom:   'feeds resources into',
  fifthFrom:    'creatively continues toward',
  seventhFrom:  'confronts and externalizes through',
  ninthFrom:    'bestows dharmic support upon',
  twelfthFrom:  'drains, releases, or spiritualizes',
};

export const RELATION_LABEL: Record<RelationType, string> = {
  conjunction:  'conjunct',
  secondFrom:   '2nd from',
  fifthFrom:    '5th from',
  seventhFrom:  '7th from',
  ninthFrom:    '9th from',
  twelfthFrom:  '12th from',
};
