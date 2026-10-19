import type { ParayaOptions } from '@/lib/bnn/nadiParaya';
import type { ParayaRetro } from '@/types';
import { runStudy, testFeature, type FeatureTest, type StudyChart, type StudyOptions } from './eventStudy';
import { adjustedQValues } from './stats';

// Which setting of the Paraya progressions fits the events best? The progressions can begin one sign back or in the natal sign for a graha that was retrograde at birth,
// and Saturn and Rahu can stay by turns or evenly. The same study is run under each of the eight combinations, and the strength of what it finds is set side by side.
// The p-values here are the exact ones (each event has the chance its own chart gives it), which keep telling a strong result from a stronger one where a permutation
// test runs out of resolution. Trying eight settings and keeping the strongest is itself a choice among several, so the best p-value of the best setting is shown
// corrected for the eight.

const RETRO: readonly ParayaRetro[] = ['previous', 'same'];
const STAYS = ['alternating', 'even'] as const;

/** The eight combinations of the Paraya settings. */
export const PARAYA_SETTING_COMBINATIONS: readonly ParayaOptions[] = RETRO.flatMap(retro => STAYS.flatMap(saturn => STAYS.map(rahu => ({ saturn, rahu, retro }))));

export interface SettingsRow {
  options: ParayaOptions;
  events: number;
  /** The features that at least one event has (what the correction counts), and how many of them hold up at q of 0.1. */
  tested: number;
  significant: number;
  /** The feature with the smallest p (exact), with its test. */
  best: FeatureTest | null;
  /** The strength of the top of the table: the mean of −log10 p of the five features with the smallest p (0 when there are none). */
  score: number;
  /** The smallest p corrected for the eight settings tried (the smaller of one and p times eight). */
  correctedBestP: number | null;
  /** What the study found, as one text: rows with the same one found exactly the same, so the setting made no difference to these events. */
  fingerprint: string;
}

/** The strength of a result: the mean of −log10 p of its best `count` features. */
export function strengthOf(results: readonly { p: number }[], count = 5): number {
  const best = [...results].sort((a, b) => a.p - b.p).slice(0, count);
  if (best.length === 0) return 0;
  return best.reduce((sum, result) => sum - Math.log10(Math.max(result.p, 1e-12)), 0) / best.length;
}

/**
 * The study under each combination of the Paraya settings, the strongest first. `onStep` is called before each run (with its number and the total), so that a screen
 * can show progress and breathe between the runs. Only the features of the progressions depend on the settings: any others in the options are left out.
 */
export async function compareParayaSettings(
  charts: readonly StudyChart[],
  options: StudyOptions,
  onStep?: (done: number, total: number) => Promise<void> | void,
): Promise<SettingsRow[]> {
  const kinds = options.kinds.filter(kind => kind.source === 'paraya');
  if (kinds.length === 0) return [];
  const rows: SettingsRow[] = [];
  for (const [index, setting] of PARAYA_SETTING_COMBINATIONS.entries()) {
    await onStep?.(index, PARAYA_SETTING_COMBINATIONS.length);
    // No permutation test is needed: each feature the events have is tested exactly.
    const study = runStudy(charts, { ...options, kinds, paraya: setting, permutations: 0 });
    const tests = study.results.map(result => testFeature(study.data, result.id)).filter(test => test.lift !== null && test.lift > 1).sort((a, b) => a.p - b.p || b.observed - a.observed);
    const q = adjustedQValues(tests.map(test => test.p));
    const best = tests[0] ?? null;
    rows.push({
      options: setting,
      events: study.events,
      tested: study.tested,
      significant: q.filter(value => value <= 0.1).length,
      best,
      score: strengthOf(tests),
      correctedBestP: best ? Math.min(1, best.p * PARAYA_SETTING_COMBINATIONS.length) : null,
      fingerprint: study.results.map(result => `${result.id}:${result.observed}`).sort().join(','),
    });
  }
  return rows.sort((a, b) => b.score - a.score || b.significant - a.significant);
}

/** Whether the settings made any difference at all: false when every combination found exactly the same. */
export const settingsMatter = (rows: readonly SettingsRow[]) => new Set(rows.map(row => row.fingerprint)).size > 1;
