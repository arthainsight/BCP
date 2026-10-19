import type { DashaEventCategory, StoredDashaEvent } from './dashaEventStore';
import { matchesText, textTerms } from './research/eventFilter';

// Sorting many events at once by what is written in them. A list pasted or imported has the events in one category (usually "other") and without tags, which is no use
// for studies that take the moves or the accidents of many charts; a few words ("move, relocated, muutto") find them, and one click gives them a category and a tag.

export interface ClassifyRule {
  /** Words (separated by commas, semicolons or line breaks) of which the name, a tag or the notes of an event contain at least one. No words, no events. */
  words: string;
  /** The category to give them; none to leave it. */
  category?: DashaEventCategory;
  /** A tag to add to them; none to add none. */
  tag?: string;
  /** Only those still in the category "other", so what has been sorted by hand is left alone. */
  onlyOther: boolean;
}

export interface ClassifyResult {
  events: StoredDashaEvent[];
  /** The events that fit the words (and the category "other" when asked), and how many of them the rule changes (the others have the category and the tag already). */
  matched: StoredDashaEvent[];
  changed: number;
}

const hasTag = (event: StoredDashaEvent, tag: string) => event.tags.some(item => item.toLocaleLowerCase() === tag.toLocaleLowerCase());

/** The events a rule would change nothing in, and the list with the rule applied. */
export function classifyEvents(events: readonly StoredDashaEvent[], rule: ClassifyRule): ClassifyResult {
  const tag = rule.tag?.trim() ?? '';
  const words = textTerms(rule.words).length > 0;
  const matched = words ? events.filter(event => matchesText(event, rule.words) && (!rule.onlyOther || event.category === 'other')) : [];
  const ids = new Set(matched.map(event => event.id));
  let changed = 0;
  const next = events.map(event => {
    if (!ids.has(event.id)) return event;
    const category = rule.category ?? event.category;
    const tags = tag && !hasTag(event, tag) ? [...event.tags, tag] : event.tags;
    if (category === event.category && tags === event.tags) return event;
    changed++;
    return { ...event, category, tags };
  });
  return { events: next, matched, changed };
}

export interface ClassifyPreset {
  key: string;
  /** What it is called, and the English word it adds as a tag. */
  label: string;
  /** Words in English and in Finnish. */
  words: string;
  category: DashaEventCategory;
  tag: string;
}

/** Sets of words for the events people most often study. They match parts of words, so they are short; the preview shows what they find before anything is changed. */
export const CLASSIFY_PRESETS: readonly ClassifyPreset[] = [
  { key: 'move', label: 'Moves', words: 'moved, relocat, muutto, muutin, muutimme, muuttanut', category: 'home', tag: 'move' },
  { key: 'marriage', label: 'Marriages', words: 'married, marriage, wedding, engaged, häät, naimisiin, avioliitto, vihittiin, kihlaus', category: 'relationship', tag: 'marriage' },
  { key: 'divorce', label: 'Divorces', words: 'divorce, avioero, erosimme, erosin', category: 'relationship', tag: 'divorce' },
  { key: 'accident', label: 'Accidents', words: 'accident, injur, crash, fracture, tapaturma, onnettomuus, kolari, loukkaan, murtui', category: 'health', tag: 'accident' },
  { key: 'illness', label: 'Illnesses and surgery', words: 'surgery, operation, hospital, illness, leikkaus, sairaala, sairastui', category: 'health', tag: 'illness' },
  { key: 'job', label: 'Jobs', words: 'new job, hired, promotion, resigned, uusi työ, työpaikka, ylennys, irtisano', category: 'work', tag: 'job' },
  { key: 'child', label: 'Births of children', words: 'child born, birth of, syntyi, vauva, lapsi syntyi', category: 'family', tag: 'child' },
  { key: 'death', label: 'Deaths', words: 'died, death, funeral, kuoli, kuolema, hautajaiset', category: 'family', tag: 'death' },
];
