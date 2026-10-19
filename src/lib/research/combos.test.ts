import assert from 'node:assert/strict';
import type { ChartData, PlanetData } from '@/types';
import type { StudyChart } from './eventStudy';
import { COMBO_SEPARATOR, comboHook, comboId, comboStudy, parseComboId } from './combos';
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
const inCancer = (n: number) => birth + (3.5 + 12 * n) * JULIAN_YEAR_MS;

// --- The ids of combinations -----------------------------------------------------------------------------------------------------------------------------------
{
  const id = comboId('paraya|house|Jupiter|4', 'gochara|fromMoon|Jupiter|3');
  assert.equal(id, `paraya|house|Jupiter|4${COMBO_SEPARATOR}gochara|fromMoon|Jupiter|3`);
  assert.deepEqual(parseComboId(id), ['paraya|house|Jupiter|4', 'gochara|fromMoon|Jupiter|3']);
  assert.equal(parseComboId('paraya|house|Jupiter|4'), null, 'a feature on its own is no combination');
}

// --- What a moment's combinations are: two kinds, the same graha or any -----------------------------------------------------------------------------------------
{
  const ids = ['dasha|mdGraha|Saturn|*', 'dasha|mdGraha|Venus|*', 'gochara|fromMoon|Saturn|4', 'gochara|fromMoon|Jupiter|3', 'gochara|sav|Saturn|high'];
  const left = { source: 'dasha' as const, family: 'mdGraha' as const };
  const right = { source: 'gochara' as const, family: 'fromMoon' as const };
  assert.deepEqual(comboHook({ left, right, sameGraha: true })(ids), [comboId('dasha|mdGraha|Saturn|*', 'gochara|fromMoon|Saturn|4')], 'the lord with its own transit only');
  assert.equal(comboHook({ left, right, sameGraha: false })(ids).length, 4, 'two lords with two transits');
  assert.deepEqual(comboHook({ left, right, sameGraha: true })(['dasha|mdGraha|Saturn|*']), [], 'nothing without the other half');
  // The same kind with itself: each pair once, never a feature with itself.
  const same = comboHook({ left: right, right, sameGraha: false })(ids);
  assert.deepEqual(same, [comboId('gochara|fromMoon|Jupiter|3', 'gochara|fromMoon|Saturn|4')]);
}

// --- A study of combinations: found with the p of both parts ---------------------------------------------------------------------------------------------------
// Every event is at a moment when Jupiter is in Cancer (the 4th house) and over natal Rahu (20° Cancer), in every chart: both are there at the same moments.
{
  const charts: StudyChart[] = Array.from({ length: 4 }, (_, i) => ({ id: `c${i}`, name: `C${i}`, chart: natal(), birthTime: birth, events: [0, 1, 2, 3].map(n => event(`e${i}${n}`, inCancer(n))) }));
  const options = { bodies: ['Jupiter'] as const, kinds: [], untilTime, baselineSamples: 200 };
  const spec = { left: { source: 'paraya' as const, family: 'house' as const }, right: { source: 'paraya' as const, family: 'aspectNatal' as const }, sameGraha: true };
  const result = comboStudy(charts, options, spec);
  assert.equal(result.events, 16);
  assert.ok(result.tested > 0);
  const id = comboId(featureId('paraya', 'house', 'Jupiter', 4), featureId('paraya', 'aspectNatal', 'Jupiter', 'Rahu'));
  const row = result.rows.find(item => item.id === id)!;
  assert.ok(row, 'the combination is there');
  assert.deepEqual([row.observed, row.parts[0].target, row.parts[1].target], [16, '4', 'Rahu']);
  assert.ok(row.lift! > 3 && row.p < 1e-6, `far more than chance (${row.lift}, ${row.p})`);
  assert.ok(row.q <= row.p * result.tested + 1e-12);
  // Both parts are exactly as common, so the combination is no more unusual than they are.
  assert.ok(Math.abs(row.p - row.partP[0]) < 1e-9 && row.beyondParts === false, 'it does not beat its parts');
  assert.ok(result.rows.every(item => parseComboId(item.id) !== null), 'only combinations are listed');
  assert.ok(result.rows.every((item, i) => i === 0 || item.p >= result.rows[i - 1].p), 'the most unusual first');
  assert.equal(row.events.length, 16);
}

// --- Nothing to combine ------------------------------------------------------------------------------------------------------------------------------------------
assert.deepEqual(comboStudy([], { bodies: ['Jupiter'], kinds: [], untilTime }, { left: { source: 'paraya', family: 'house' }, right: { source: 'paraya', family: 'aspectNatal' }, sameGraha: true }).rows, []);

console.log('Combination tests passed');
