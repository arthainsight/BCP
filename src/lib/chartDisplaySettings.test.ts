import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_CHART_DISPLAY } from '@/types';
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
