import { formatDegree } from './formatDegree';
import { ordinal } from './ordinal';
import { SIGN_NAMES } from './signs';
import type { Language } from './i18n';
import { favourableCount, weakeningCount, type PlanetMarks } from './planetMarks';

// The words for the marks of a point, in the sentences the tables and the hover text of the charts use. The icons are in the callers.

type Translate = (text: string) => string;

const minutes = (degrees: number) => formatDegree(degrees, 'minute');

/** A bound of a range, to the nearest minute: 10° and not 10°0', and 23°20' although 20 + 10/3 is a hair under it. */
export function boundText(degrees: number): string {
  const total = Math.round(degrees * 60);
  return total % 60 === 0 ? `${total / 60}°` : `${Math.floor(total / 60)}°${total % 60}'`;
}

export interface MarkTexts {
  sandhi?: string;
  gandanta?: string;
  mrityu?: string;
  pushkaraNavamsa?: string;
  pushkaraBhaga?: string;
  combust?: string;
}

export function markTexts(marks: PlanetMarks | undefined | null, t: Translate, language: Language): MarkTexts {
  if (!marks) return {};
  const { sandhi, gandanta, mrityu, pushkaraNavamsa, pushkaraBhaga } = marks.sensitive;
  const texts: MarkTexts = {};
  if (sandhi) texts.sandhi = `${minutes(sandhi.distance)} ${sandhi.edge === 'start' ? t('from the start of the sign') : t('from the end of the sign')}`;
  if (gandanta) {
    const path = gandanta.side === 'before' ? `${gandanta.nakshatra} → ${gandanta.across}` : `${gandanta.across} → ${gandanta.nakshatra}`;
    texts.gandanta = `${path}, ${minutes(gandanta.distance)} ${t('from the junction')}${gandanta.core ? ` (${t('core')})` : ''}`;
  }
  if (mrityu) texts.mrityu = `${ordinal(mrityu.degree, language)} ${t('degree')}, ${minutes(mrityu.distance)} ${t('from it')}`;
  if (pushkaraNavamsa) texts.pushkaraNavamsa = `${ordinal(pushkaraNavamsa.navamsa, language)} ${t('navamsa')} (${boundText(pushkaraNavamsa.from)}–${boundText(pushkaraNavamsa.to)}), ${SIGN_NAMES[pushkaraNavamsa.navamsaSign - 1]}`;
  if (pushkaraBhaga) texts.pushkaraBhaga = `${ordinal(pushkaraBhaga.degree, language)} ${t('degree')}`;
  if (marks.combust) texts.combust = `${minutes(marks.combust.distance)} ${t('from the Sun')} (${t('orb')} ${marks.combust.orb}°${marks.combust.retrograde ? `, ${t('retrograde')}` : ''})`;
  return texts;
}

/** The lines of a hover text: one for each mark the point has. */
export function markLines(marks: PlanetMarks | undefined | null, t: Translate, language: Language): string[] {
  if (!marks || weakeningCount(marks) + favourableCount(marks) + (marks.combust ? 1 : 0) === 0) return [];
  const texts = markTexts(marks, t, language);
  return [
    texts.sandhi && `⚠ ${t('Sandhi')}: ${texts.sandhi}`,
    texts.gandanta && `⚠ ${t('Gandanta')}: ${texts.gandanta}`,
    texts.mrityu && `⚠ ${t('Mṛtyu Bhāga')}: ${texts.mrityu}`,
    texts.pushkaraNavamsa && `✦ ${t('Puṣkara Navāṁśa')}: ${texts.pushkaraNavamsa}`,
    texts.pushkaraBhaga && `✦ ${t('Puṣkara Bhāga')}: ${texts.pushkaraBhaga}`,
    texts.combust && `☼ ${t('Combust')}: ${texts.combust}`,
  ].filter((line): line is string => Boolean(line));
}
