import { TOPIC_VERSES, type TopicVerse } from './topicVerses';
import { SPIRITUALITY_RULES, PRAVRAJYA_TYPES } from './topicSpirituality';
import { MARRIAGE_RULES } from './topicMarriage';
import { LONGEVITY_RULES } from './topicLongevity';
import type { RuleOutcome, TopicContext, TopicKey, TopicYogaRule } from './topicCore';

/**
 * Yogas by topic, from the classics in their own words. A rule carries the chapter and verses it comes from and decides from the chart whether it is met (true), not met (false) or cannot be judged (null).
 * "Strong" (bali) is the Ṣaḍbala of the graha at or over the strength it needs (the ratio of the Ṣaḍbala panel is 1 or more); the text does not define it, and this is the measure of the app itself.
 */
export { SEVEN, type SevenGraha, type TopicContext, type TopicKey, type TopicPlanet, type TopicYogaRule, type RuleOutcome } from './topicCore';
export type { TopicVerse };
export { PRAVRAJYA_TYPES };

export const TOPICS: { key: TopicKey; label: string; source: string; chapters: number[]; caution?: string }[] = [
  { key: 'spirituality', label: 'Renunciation and spirituality', source: 'BPHS 79 (Pravrajyā-yoga)', chapters: [79] },
  { key: 'marriage', label: 'Marriage', source: 'BPHS 18 (the 7th house)', chapters: [18] },
  {
    key: 'longevity', label: 'Longevity and death', source: 'BPHS 19 (the 8th house), 44 (the māraka)', chapters: [19, 44],
    caution: 'The classical statements about the length of life and about death are shown as the text has them. They are a reading of the text and not a prediction.',
  },
];

export const TOPIC_RULES: TopicYogaRule[] = [...SPIRITUALITY_RULES, ...MARRIAGE_RULES, ...LONGEVITY_RULES];

export interface TopicYogaResult { rule: TopicYogaRule; outcome: RuleOutcome; verses: TopicVerse[] }

/** Every rule of a topic against a chart, with the verses it comes from. */
export function evaluateTopic(topic: TopicKey, context: TopicContext): TopicYogaResult[] {
  return TOPIC_RULES.filter(rule => rule.topic === topic).map(rule => ({
    rule,
    outcome: rule.evaluate(context),
    verses: (TOPIC_VERSES[rule.chapter] ?? []).filter(verse => rule.verses.includes(verse.verse)),
  }));
}

/** Verses of a topic that no rule judges (they need the war of the grahas, the daśā, the Māndi or a reading the text does not settle). */
export function notEvaluatedVerses(topic: TopicKey): TopicVerse[] {
  const chapters = TOPICS.find(item => item.key === topic)?.chapters ?? [];
  const used = new Set(TOPIC_RULES.filter(rule => rule.topic === topic).flatMap(rule => rule.verses.map(verse => `${rule.chapter}.${verse}`)));
  return chapters.flatMap(chapter => (TOPIC_VERSES[chapter] ?? []).filter(verse => !used.has(`${chapter}.${verse.verse}`)));
}
