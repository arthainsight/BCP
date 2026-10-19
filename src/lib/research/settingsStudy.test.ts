import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import type { StudyChart } from './eventStudy';
import { PARAYA_SETTING_COMBINATIONS, compareParayaSettings, settingsMatter, strengthOf } from './settingsStudy';
import { seededRandom } from './random';
import { JULIAN_YEAR_MS } from '@/lib/time';

const planet = (name: string, sign: number, degree: number, isRetrograde = false): PlanetData => ({ name, sign, degree, longitude: (sign - 1) * 30 + degree, house: 1, isRetrograde });
const natal = (jupiterRetrograde: boolean): ChartData => ({
  ascendant: { sign: 1, degree: 2, longitude: 2 },
  planets: [planet('Jupiter', 1, 5, jupiterRetrograde), planet('Saturn', 6, 10), planet('Rahu', 4, 20), planet('Ketu', 10, 20), planet('Sun', 1, 15), planet('Moon', 9, 27)],
} as unknown as ChartData);
const birth = Date.UTC(1980, 0, 1);
const untilTime = Date.UTC(2030, 0, 1);
const para = (...families: ('house' | 'aspectHouse' | 'aspectNatal' | 'exact')[]) => families.map(family => ({ source: 'paraya' as const, family }));
const event = (id: string, time: number) => ({ id, name: id, time, category: 'home', tags: [] as string[] });

// --- The eight combinations ------------------------------------------------------------------------------------------------------------------------------------
assert.equal(PARAYA_SETTING_COMBINATIONS.length, 8);
assert.equal(new Set(PARAYA_SETTING_COMBINATIONS.map(setting => `${setting.retro}|${setting.saturn}|${setting.rahu}`)).size, 8);

// --- The strength of a result: the mean of −log10 p of the best five ---------------------------------------------------------------------------------------
assert.equal(strengthOf([]), 0);
assert.ok(Math.abs(strengthOf([{ p: 0.1 }]) - 1) < 1e-12);
assert.ok(Math.abs(strengthOf([{ p: 0.01 }, { p: 0.1 }, { p: 1 }]) - 1) < 1e-12, '(2 + 1 + 0) / 3');
assert.ok(Math.abs(strengthOf([{ p: 0.001 }, { p: 0.5 }, { p: 0.5 }, { p: 0.5 }, { p: 0.5 }, { p: 0.0000001 }], 2) - 5) < 1e-9, 'the best two only: (7 + 3) / 2');

async function main() {
  // --- Events made to fit "one sign back" are found there and not in the natal sign ---------------------------------------------------------------------------
  // Half of the charts have natal Jupiter retrograde at 5° Aries, so that it begins in Pisces; the others have it direct. The events of the retrograde charts are a year
  // later (age 5 + 12 n against 4 + 12 n): one sign back they stand in the same sign as the direct charts at age 4 (Leo); in the natal sign they stand in two different ones.
  {
    const at = (n: number, retrograde: boolean) => birth + ((retrograde ? 5 : 4) + 12 * n) * JULIAN_YEAR_MS;
    const charts: StudyChart[] = Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, name: `C${i}`, chart: natal(i % 2 === 1), birthTime: birth, events: [0, 1, 2, 3].map(n => event(`e${i}${n}`, at(n, i % 2 === 1))) }));
    const steps: [number, number][] = [];
    const rows = await compareParayaSettings(charts, { bodies: ['Jupiter'], kinds: para('house'), untilTime, baselineSamples: 150 }, (done, total) => { steps.push([done, total]); });
    assert.equal(rows.length, 8);
    assert.deepEqual(steps.map(step => step[0]), [0, 1, 2, 3, 4, 5, 6, 7]);
    assert.ok(steps.every(step => step[1] === 8));
    assert.ok(rows.slice(0, 4).every(row => row.options.retro === 'previous'), 'one sign back is the strongest four');
    assert.ok(rows.slice(4).every(row => row.options.retro === 'same'));
    assert.ok(rows[0].score > rows[7].score + 0.3, `a clear difference (${rows[0].score} against ${rows[7].score})`);
    assert.ok(rows[0].best!.observed === 16 && rows[7].best!.observed < 16, 'every event in one house against the events split between two');
    assert.ok(rows[0].best!.p < rows[7].best!.p, 'a smaller p, told apart even though a permutation test would stop at the same floor');
    assert.ok(Math.abs(rows[0].correctedBestP! - Math.min(1, rows[0].best!.p * 8)) < 1e-12);
    // Only Jupiter is looked at, so Saturn and Rahu make no difference: within one retro choice the four rows found exactly the same.
    assert.equal(new Set(rows.slice(0, 4).map(row => row.fingerprint)).size, 1);
    assert.equal(new Set(rows.slice(4).map(row => row.fingerprint)).size, 1);
    assert.equal(settingsMatter(rows), true);
  }

  // --- No difference at all when no graha was retrograde and only Jupiter is looked at ------------------------------------------------------------------------
  {
    const random = seededRandom(9);
    const charts: StudyChart[] = Array.from({ length: 3 }, (_, i) => ({ id: `d${i}`, name: `D${i}`, chart: natal(false), birthTime: birth, events: Array.from({ length: 4 }, (_, n) => event(`x${i}${n}`, birth + random() * (untilTime - birth))) }));
    const rows = await compareParayaSettings(charts, { bodies: ['Jupiter'], kinds: para('house'), untilTime, baselineSamples: 60 });
    assert.equal(settingsMatter(rows), false, 'the settings make no difference to events of charts with no retrograde graha, and only Jupiter');
  }

  // --- Only the features of the progressions depend on the settings ---------------------------------------------------------------------------------------------
  assert.deepEqual(await compareParayaSettings([], { bodies: ['Jupiter'], kinds: [{ source: 'dasha', family: 'mdGraha' }], untilTime }), []);

  console.log('Paraya settings tests passed');
}

main().catch(error => { console.error(error); process.exit(1); });
