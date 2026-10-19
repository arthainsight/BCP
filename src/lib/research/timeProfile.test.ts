import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import type { StudyChart } from './eventStudy';
import { PROFILE_OFFSETS, timeProfile } from './timeProfile';
import { featureId } from './features';
import { JULIAN_YEAR_MS } from '@/lib/time';

const planet = (name: string, sign: number, degree: number): PlanetData => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 1, isRetrograde: false });
const natal = (): ChartData => ({
  ascendant: { sign: 1, degree: 2, longitude: 2 },
  planets: [planet('Jupiter', 1, 5), planet('Saturn', 6, 10), planet('Rahu', 4, 20), planet('Ketu', 10, 20), planet('Sun', 1, 15), planet('Moon', 9, 27)],
} as unknown as ChartData);
const birth = Date.UTC(1980, 0, 1);
const untilTime = Date.UTC(2030, 0, 1);
const event = (id: string, time: number) => ({ id, name: id, time, category: 'home', tags: [] as string[] });

// Progressing Jupiter walks 30° a year from 5° Aries: it is in Cancer (90°–120°) from age 2.83 to 3.83. Events at age 3.7 + 12 n are late in it: the feature "Jupiter in the 4th
// house" is there from half a year before to a month after, and not from two months after on.
{
  const charts: StudyChart[] = Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, name: `C${i}`, chart: natal(), birthTime: birth, events: [0, 1, 2, 3].map(n => event(`e${i}${n}`, birth + (3.7 + 12 * n) * JULIAN_YEAR_MS)) }));
  const profile = timeProfile(charts, { bodies: ['Jupiter'], kinds: [], untilTime, baselineSamples: 200 }, featureId('paraya', 'house', 'Jupiter', 4));
  assert.deepEqual(profile.map(point => point.offsetDays), [...PROFILE_OFFSETS]);
  assert.equal(PROFILE_OFFSETS.length, 13);
  assert.deepEqual([PROFILE_OFFSETS[0], PROFILE_OFFSETS[6], PROFILE_OFFSETS[12]], [-180, 0, 180]);
  assert.ok(profile.every(point => point.total === 16), 'every event can be read at every offset');
  for (const point of profile) {
    if (point.offsetDays <= 30) {
      assert.equal(point.observed, 16, `at ${point.offsetDays} days`);
      assert.ok(point.lift! > 3 && point.p < 1e-6, `at ${point.offsetDays} days: more than chance`);
    } else {
      assert.equal(point.observed, 0, `at ${point.offsetDays} days`);
      assert.equal(point.p, 1);
    }
  }
}

// --- A window is kept at every offset: ±90 days reaches the 4th house from further out ----------------------------------------------------------------------------
{
  const charts: StudyChart[] = [{ id: 'w', name: 'W', chart: natal(), birthTime: birth, events: [0, 1, 2].map(n => event(`w${n}`, birth + (3.7 + 12 * n) * JULIAN_YEAR_MS)) }];
  const profile = timeProfile(charts, { bodies: ['Jupiter'], kinds: [], untilTime, baselineSamples: 100, windowDays: 90 }, featureId('paraya', 'house', 'Jupiter', 4), [60, 120, 240]);
  assert.deepEqual(profile.map(point => point.observed), [3, 3, 0], 'at +60 and +120 the window still holds late Cancer; at +240 it does not');
}

// --- An event that cannot be read at an offset is left out of that offset -------------------------------------------------------------------------------------------
{
  const charts: StudyChart[] = [{ id: 'b', name: 'B', chart: natal(), birthTime: birth, events: [event('early', birth + 10 * 86400000), event('later', birth + 3.7 * JULIAN_YEAR_MS)] }];
  const profile = timeProfile(charts, { bodies: ['Jupiter'], kinds: [], untilTime, baselineSamples: 50 }, featureId('paraya', 'house', 'Jupiter', 4), [-180, 0]);
  assert.deepEqual(profile.map(point => point.total), [1, 2], 'the event ten days after the birth has no moment half a year before it');
}

console.log('Time profile tests passed');
