import { TOPIC_VERSES, type TopicVerse } from './topicVerses';
import { PHALA_VERSES } from './phalaVerses';
import { SPIRITUALITY_RULES, PRAVRAJYA_TYPES } from './topicSpirituality';
import { MARRIAGE_RULES } from './topicMarriage';
import { LONGEVITY_RULES } from './topicLongevity';
import { WEALTH_RULES } from './topicWealth';
import { ILLNESS_RULES } from './topicIllness';
import { HOUSES_RULES } from './topicHouses';
import { PHALA_HOUSES_RULES } from './topicPhalaHouses';
import { PHALA_CHILDREN_RULES } from './topicPhalaChildren';
import { PHALA_AYUR_RULES } from './topicPhalaAyur';
import { PHALA_ROGA_RULES } from './topicPhalaRoga';
import { WOMAN_RULES } from './topicWoman';
import { CHILDREN_RULES } from './topicChildren';
import type { RuleOutcome, TopicContext, TopicKey, TopicYogaRule } from './topicCore';

/**
 * Yogas by topic, from the classics in their own words. A rule carries the chapter and verses it comes from and decides from the chart whether it is met (true), not met (false) or cannot be judged (null).
 * "Strong" (bali) is the Ṣaḍbala of the graha at or over the strength it needs (the ratio of the Ṣaḍbala panel is 1 or more); the text does not define it, and this is the measure of the app itself.
 */
export { SEVEN, type SevenGraha, type TopicContext, type TopicKey, type TopicPlanet, type TopicYogaRule, type RuleOutcome } from './topicCore';
export type { TopicVerse };
export { PRAVRAJYA_TYPES };

export const TOPICS: { key: TopicKey; label: string; source: string; chapters: number[]; caution?: string; text?: 'phala' }[] = [
  { key: 'spirituality', label: 'Renunciation and spirituality', source: 'BPHS 79 (Pravrajyā-yoga)', chapters: [79] },
  { key: 'marriage', label: 'Marriage', source: 'BPHS 18 (the 7th house)', chapters: [18] },
  {
    key: 'longevity', label: 'Longevity and death', source: 'BPHS 19 (the 8th house), 44 (the māraka)', chapters: [19, 44],
    caution: 'The classical statements about the length of life and about death are shown as the text has them. They are a reading of the text and not a prediction.',
  },
  { key: 'wealth', label: 'Royal yogas, wealth and poverty', source: 'BPHS 39 (rāja yogas), 40 (the minister), 41 (dhana yogas), 42 (daridra yogas)', chapters: [39, 40, 41, 42] },
  {
    key: 'illness', label: 'Illness and ariṣṭa', source: 'BPHS 17 (the 6th house), 9 (ariṣṭa), 10 (its cancelling)', chapters: [17, 9, 10],
    caution: 'The classical statements about disease, the dangers of birth and the death of the child or of the parents are shown as the text has them. They are a reading of the text and not a prediction, and nothing here is medical advice.',
  },
  {
    key: 'houses', label: 'The houses (bhāva-phala)', source: 'BPHS 12 (lagna), 13 (2nd), 14 (3rd), 15 (4th), 16 (5th), 20 (9th), 21 (10th), 22 (11th), 23 (12th); the 6th, 7th and 8th are in the illness, marriage and longevity topics', chapters: [12, 13, 14, 15, 16, 20, 21, 22, 23],
    caution: 'The classical statements about the death of the father, the loss of children and the years of life are shown as the text has them. They are a reading of the text and not a prediction.',
  },
  {
    key: 'woman', label: 'The woman\'s chart', source: 'BPHS 80 (strījātaka)', chapters: [80],
    caution: 'The classical statements about the husband, widowhood, children and the character of a woman are shown as the text has them. They are a reading of the text and not a prediction. The rules are read for a woman\'s chart; the app does not ask whether a chart is one.',
  },
  {
    key: 'children', label: 'Loss of children and its causes', source: 'BPHS 83 (the curses and their remedies)', chapters: [83],
    caution: 'The text names a curse (of a serpent, the father, the mother, a brother, a maternal uncle, a Brahmin, the wife or a departed spirit) as the cause of the loss of children, and gives a remedy for each. A chart does not show a curse: the rules show only that the yoga of the text is in the chart. They are a reading of the text and not a prediction, and the remedies are the text\'s.',
  },
  {
    key: 'phalaHouses', label: 'Phaladīpikā: the houses', text: 'phala',
    source: 'Phaladīpikā 10 (the 7th house), 11 (the woman\'s chart), 12 (children), 13 (the span of life), 14 (illness and death); the later chapters follow',
    chapters: [10, 11, 12, 13, 14],
    caution: 'The classical statements about the wife, the husband and children are shown as the text has them. They are a reading of the text and not a prediction.',
  },
];

export const TOPIC_RULES: TopicYogaRule[] = [...SPIRITUALITY_RULES, ...MARRIAGE_RULES, ...LONGEVITY_RULES, ...WEALTH_RULES, ...ILLNESS_RULES, ...HOUSES_RULES, ...PHALA_HOUSES_RULES, ...PHALA_CHILDREN_RULES, ...PHALA_AYUR_RULES, ...PHALA_ROGA_RULES, ...WOMAN_RULES, ...CHILDREN_RULES];

export interface TopicYogaResult { rule: TopicYogaRule; outcome: RuleOutcome; verses: TopicVerse[] }

/** Every rule of a topic against a chart, with the verses it comes from. */
export function evaluateTopic(topic: TopicKey, context: TopicContext): TopicYogaResult[] {
  return TOPIC_RULES.filter(rule => rule.topic === topic).map(rule => ({
    rule,
    outcome: rule.evaluate(context),
    verses: ((rule.text === 'phala' ? PHALA_VERSES : TOPIC_VERSES)[rule.chapter] ?? []).filter(verse => rule.verses.includes(verse.verse)),
  }));
}

/** Verses of a topic that no rule judges (they need the war of the grahas, the daśā, the Māndi or a reading the text does not settle). */
export function notEvaluatedVerses(topic: TopicKey): TopicVerse[] {
  const entry = TOPICS.find(item => item.key === topic);
  const chapters = entry?.chapters ?? [];
  const store = entry?.text === 'phala' ? PHALA_VERSES : TOPIC_VERSES;
  const used = new Set(TOPIC_RULES.filter(rule => rule.topic === topic).flatMap(rule => rule.verses.map(verse => `${rule.chapter}.${verse}`)));
  return chapters.flatMap(chapter => (store[chapter] ?? []).filter(verse => !used.has(`${chapter}.${verse.verse}`)));
}
