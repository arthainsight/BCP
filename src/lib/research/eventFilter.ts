// Which of the saved events a study takes: those of a category and a tag, and those whose name, tags or notes contain some words. Many events come in with no
// category or tag (pasted, imported), so the words are how "the moves" or "the accidents" are picked out of them.

export interface EventFilter {
  /** A category, or 'all'. */
  category: string;
  /** A tag the event must have, or ''. */
  tag: string;
  /** Words the name, a tag or the notes must contain, one of them at least: "move, moved, relocation" ('' for no condition). */
  text: string;
}

export interface FilterableEvent {
  name: string;
  category: string;
  tags: readonly string[];
  notes?: string;
}

/** The words of a search text: separated by commas, semicolons or line breaks, trimmed, in lower case; nothing for an empty one. */
export function textTerms(text: string): string[] {
  return text.split(/[,;\n]/).map(term => term.trim().toLocaleLowerCase('fi')).filter(Boolean);
}

/** Whether the name, the tags or the notes of an event contain one of the words (always true for no words). */
export function matchesText(event: FilterableEvent, text: string): boolean {
  const terms = textTerms(text);
  if (terms.length === 0) return true;
  const haystack = [event.name, ...event.tags, event.notes ?? ''].join('\n').toLocaleLowerCase('fi');
  return terms.some(term => haystack.includes(term));
}

/** Whether an event is in the set the filter describes: its category, its tag and its words, all three. */
export function eventMatches(event: FilterableEvent, filter: EventFilter): boolean {
  return (filter.category === 'all' || event.category === filter.category)
    && (!filter.tag || event.tags.includes(filter.tag))
    && matchesText(event, filter.text);
}

/** A set of events in words, for a heading: the category, the tag and the words (leaving out what is not asked), or null for no condition at all. */
export function filterWords(filter: EventFilter): string[] {
  return [filter.category === 'all' ? '' : filter.category, filter.tag, ...textTerms(filter.text)].filter(Boolean);
}
