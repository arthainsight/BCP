// "Why so few?": what each choice costs. The Muhūrta Finder lists the stretches in which every choice holds at once, and with many
// choices there are none. This runs the search again without one choice at a time and says how much time each would give back,
// so that the user can see which choice is the one that decides, and let it go.

import { isDoshaId } from './mahadosha';
import { FINDER_GRAHAS, FINDER_SIZES, effectiveRules, isLimited, type FinderCriteria, type FinderGraha, type PreferKey } from './muhurtaFinder';
import { runMuhurtaFinder, type FinderRequest, type FinderResult } from './muhurtaFinderRun';

/** The groups of the panchāṅga that are a condition when limited, with the number of items in each. */
const GROUPS = [['vara', FINDER_SIZES.vara], ['tithi', FINDER_SIZES.tithi], ['nakshatra', FINDER_SIZES.nakshatra], ['yoga', FINDER_SIZES.yoga], ['karana', FINDER_SIZES.karana]] as const;

/**
 * The choices that limit the search, by key: `vara`, `tithi`, `nakshatra`, `yoga`, `karana` (a group with something left out that is
 * not a wish), `sign:<graha>` (the signs a graha or the Ascendant may be in), `rule:<n>` (a placement rule, counted from 0),
 * `chandra`, `tara` and `dosha:<id>`.
 */
export function finderConstraints(criteria: FinderCriteria): string[] {
  const wished = new Set<PreferKey>(criteria.prefer ?? []);
  const keys: string[] = [];
  for (const [group, size] of GROUPS) if (!wished.has(group) && isLimited(criteria[group], size)) keys.push(group);
  for (const graha of FINDER_GRAHAS as readonly FinderGraha[]) if (criteria.signs[graha] !== undefined) keys.push(`sign:${graha}`);
  const active = new Set(effectiveRules(criteria));
  (criteria.rules ?? []).forEach((rule, index) => { if (active.has(rule)) keys.push(`rule:${index}`); });
  if (criteria.chandra && !wished.has('chandra')) keys.push('chandra');
  if (criteria.tara && !wished.has('tara')) keys.push('tara');
  for (const id of criteria.avoid ?? []) if (isDoshaId(id)) keys.push(`dosha:${id}`);
  return keys;
}

const everything = (size: number, first = 0) => Array.from({ length: size }, (_, index) => first + index);

/** The criteria without one choice. */
export function withoutConstraint(criteria: FinderCriteria, key: string): FinderCriteria {
  const [kind, rest] = key.split(':');
  if (kind === 'sign') {
    const signs = { ...criteria.signs };
    delete signs[rest as FinderGraha];
    return { ...criteria, signs };
  }
  if (kind === 'rule') return { ...criteria, rules: (criteria.rules ?? []).filter((_, index) => index !== Number(rest)) };
  if (kind === 'dosha') return { ...criteria, avoid: (criteria.avoid ?? []).filter(id => id !== rest) };
  if (kind === 'chandra') return { ...criteria, chandra: undefined };
  if (kind === 'tara') return { ...criteria, tara: undefined };
  const group = GROUPS.find(([name]) => name === kind);
  if (group) return { ...criteria, [kind]: everything(group[1], kind === 'tithi' ? 1 : 0) };
  return criteria;
}

export interface AdviceItem {
  key: string;
  /** The time the search finds without this choice, in days, and the number of stretches. */
  days: number;
  stretches: number;
  truncated: boolean;
}

export interface Advice {
  /** What the search finds as it stands. */
  baseline: { days: number; stretches: number; truncated: boolean };
  /** One entry for each choice, the one that gives back the most first; the choices not looked at (the time ran out) are left out. */
  items: AdviceItem[];
  /** Whether the time ran out before every choice was looked at. */
  partial: boolean;
}

const MS_PER_DAY = 86_400_000;
const summary = (result: FinderResult) => ({
  days: result.windows.reduce((sum, window) => sum + (window.end - window.start), 0) / MS_PER_DAY,
  stretches: result.windows.length,
  truncated: result.truncated,
});

/** Runs the search as it stands and without each choice in turn, within a time of `budgetMs` milliseconds. */
export async function adviseFinder(request: FinderRequest, budgetMs = 25_000, now: () => number = Date.now): Promise<Advice> {
  const started = now();
  const baseline = summary(await runMuhurtaFinder(request));
  const items: AdviceItem[] = [];
  let partial = false;
  for (const key of finderConstraints(request.criteria)) {
    if (now() - started > budgetMs) { partial = true; break; }
    items.push({ key, ...summary(await runMuhurtaFinder({ ...request, criteria: withoutConstraint(request.criteria, key) })) });
  }
  items.sort((a, b) => b.days - a.days || b.stretches - a.stretches);
  return { baseline, items, partial };
}
