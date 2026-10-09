import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_CHART_DISPLAY } from '@/types';
import { FONT_SCALE_MAX, FONT_SCALE_MIN, clampFontScale, fontScaleLabel } from '@/lib/chartFont';
import { migrateChartDisplaySettings } from './chartDisplaySettings';

// --- Stored settings ----------------------------------------------------------
assert.deepEqual(migrateChartDisplaySettings(null), DEFAULT_CHART_DISPLAY);
assert.deepEqual(migrateChartDisplaySettings('nonsense'), DEFAULT_CHART_DISPLAY);

const old = migrateChartDisplaySettings({
  showSigns: false,
  showBnnAlpha: true,
  showSanskrit: true,
  showTransitPlanets: false,
  showDegrees: true,
  showNakshatra: 'yes',
});
assert.equal(old.showSigns, false, 'stored values are kept');
assert.equal(old.showNakshatra, DEFAULT_CHART_DISPLAY.showNakshatra, 'a value of the wrong type is ignored');
assert.equal(old.degreePrecision, 'degree', 'the old degrees switch maps to whole degrees');
assert.equal(old.showTransitOverlay, false, 'the transit overlay defaults to off');
for (const removed of ['showBnnAlpha', 'showSanskrit', 'showTransitPlanets', 'showDegrees']) {
  assert.ok(!(removed in old), `${removed} is dropped`);
}
assert.equal(migrateChartDisplaySettings({ showDegrees: true, degreePrecision: 'second' }).degreePrecision, 'second');

// --- The Paraya grahas that are drawn ------------------------------------------
assert.deepEqual(DEFAULT_CHART_DISPLAY.parayaBodies, ['Jupiter', 'Saturn', 'Rahu', 'Ketu'], 'all four by default');
assert.deepEqual(migrateChartDisplaySettings({}).parayaBodies, ['Jupiter', 'Saturn', 'Rahu', 'Ketu'], 'settings from before the choice draw all four');
assert.deepEqual(migrateChartDisplaySettings({ parayaBodies: ['Ketu', 'Saturn'] }).parayaBodies, ['Saturn', 'Ketu'], 'kept, in the usual order');
assert.deepEqual(migrateChartDisplaySettings({ parayaBodies: [] }).parayaBodies, [], 'none is a choice too');
assert.deepEqual(migrateChartDisplaySettings({ parayaBodies: ['Mars', 'Rahu', 7] }).parayaBodies, ['Rahu'], 'only the four known ones');
assert.deepEqual(migrateChartDisplaySettings({ parayaBodies: 'Jupiter' }).parayaBodies, ['Jupiter', 'Saturn', 'Rahu', 'Ketu'], 'a value of the wrong type is ignored');

assert.equal(migrateChartDisplaySettings({ chartStyle: 'both' }).chartStyle, 'both', 'North + South is a style');
assert.equal(migrateChartDisplaySettings({ chartStyle: 'south' }).chartStyle, 'south');
assert.equal(migrateChartDisplaySettings({ chartStyle: 'round' }).chartStyle, 'north', 'an unknown style falls back to North');

assert.equal(DEFAULT_CHART_DISPLAY.chartFontScale, 1, 'the usual text size by default');
assert.equal(migrateChartDisplaySettings({}).chartFontScale, 1, 'settings from before the text size use the usual one');
assert.equal(migrateChartDisplaySettings({ chartFontScale: 1.25 }).chartFontScale, 1.25);
assert.equal(migrateChartDisplaySettings({ chartFontScale: 9 }).chartFontScale, FONT_SCALE_MAX, 'too large is brought into range');
assert.equal(migrateChartDisplaySettings({ chartFontScale: 0.1 }).chartFontScale, FONT_SCALE_MIN, 'too small is brought into range');
assert.equal(migrateChartDisplaySettings({ chartFontScale: 'big' }).chartFontScale, 1, 'a value of the wrong type is ignored');
assert.equal(clampFontScale(Number.NaN), 1);
assert.equal(clampFontScale(1.234), 1.23, 'rounded to whole percents');
assert.equal(fontScaleLabel(1.25), '125%');

// --- Every setting does something ---------------------------------------------
// v2.21 shipped a transit switch that nothing read. Each setting must be read
// somewhere outside its own definition.
const SRC = join(process.cwd(), 'src');
const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.tsx?$/.test(name) && !name.endsWith('.test.ts')) files.push(path);
  }
};
walk(SRC);
const sources = files
  .filter(path => !path.endsWith(join('src', 'types.ts')) && !path.endsWith('chartDisplaySettings.ts'))
  .map(path => readFileSync(path, 'utf8'))
  .join('\n');
for (const key of Object.keys(DEFAULT_CHART_DISPLAY)) {
  assert.ok(new RegExp(`\\b${key}\\b`).test(sources), `chart display setting ${key} is never read`);
}
