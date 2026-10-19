import { DAY_MS } from '@/lib/time';
import { featureExtractor, windowOfEvent, type StudyChart, type StudyOptions } from './eventStudy';
import { parseFeatureId } from './features';
import { hashText, seededRandom } from './random';
import { poissonBinomialTail } from './stats';

// Does a pattern come before the event, with it or after it? The feature of one chart is looked for at the moments around the events, a month at a time, from half a
// year before to half a year after, and each is set against the chance level of the usual study (the same chart at random moments). A pattern that leads the event
// shows before the day of the event; one that follows it, after. The window chosen for the study is kept at each step, so the steps are comparable with its result.

/** The offsets from the day of the event, in days: half a year either side, a month at a time. */
export const PROFILE_OFFSETS: readonly number[] = Array.from({ length: 13 }, (_, i) => (i - 6) * 30);

export interface ProfilePoint {
  offsetDays: number;
  /** The events that could be read at this offset, and those with the feature. */
  total: number;
  observed: number;
  expected: number;
  lift: number | null;
  /** The exact chance of as many events with the feature by chance, for a feature chosen beforehand (without correction). */
  p: number;
}

/**
 * The feature at each offset from the events. Every event is moved by the offset and read over its own window, and its chance is how often its chart has the feature
 * at random moments over that window. An event whose moved moment cannot be read (before the birth, past the sampled sky) is left out of that offset.
 */
export function timeProfile(charts: readonly StudyChart[], options: StudyOptions, featureIdText: string, offsets: readonly number[] = PROFILE_OFFSETS): ProfilePoint[] {
  const feature = parseFeatureId(featureIdText);
  const kinds = [{ source: feature.source, family: feature.family }];
  const settings: StudyOptions = { ...options, kinds, combine: undefined, keepMoments: false };
  const samples = options.baselineSamples ?? 600;
  const seed = options.seed ?? 1;
  const perOffset = offsets.map(() => ({ chances: [] as number[], observed: 0, expected: 0 }));
  for (const item of charts) {
    if (item.events.length === 0 || options.untilTime <= item.birthTime) continue;
    const extract = featureExtractor(item, settings);
    // How often the chart has the feature at random moments, for each window its events are read over (found once).
    const share = new Map<number, { count: number; size: number }>();
    const shareFor = (window: number) => {
      let known = share.get(window);
      if (!known) {
        const random = seededRandom(seed ^ hashText(`${item.id}|${window}`));
        let count = 0; let size = 0;
        for (let i = 0; i < samples; i++) {
          const found = extract(item.birthTime + random() * (options.untilTime - item.birthTime), window);
          if (found) { size++; if (found.includes(featureIdText)) count++; }
        }
        known = { count, size };
        share.set(window, known);
      }
      return known;
    };
    for (const event of item.events) {
      const window = windowOfEvent(event, options.windowDays);
      const { count, size } = shareFor(window);
      if (size === 0) continue;
      offsets.forEach((offset, i) => {
        const found = extract(event.time + offset * DAY_MS, window);
        if (!found) return;
        const slot = perOffset[i];
        slot.chances.push((count + 1) / (size + 2));
        slot.expected += count / size;
        if (found.includes(featureIdText)) slot.observed++;
      });
    }
  }
  return offsets.map((offsetDays, i) => {
    const { chances, observed, expected } = perOffset[i];
    return { offsetDays, total: chances.length, observed, expected, lift: expected > 0 ? observed / expected : null, p: observed > 0 ? poissonBinomialTail(chances, observed) : 1 };
  });
}
