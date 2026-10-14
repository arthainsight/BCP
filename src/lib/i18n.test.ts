import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FI, translate, translateMessage } from './i18n';
import { CHART_LAYER_LABELS } from '@/components/chartLayers';

// --- Translation falls back to English ------------------------------------------
assert.equal(translate('en', 'Chart'), 'Chart');
assert.equal(translate('fi', 'Chart'), 'Kartta');
assert.equal(translate('fi', 'not a known string'), 'not a known string');

// --- Every translated string has a Finnish entry ----------------------------------
// Literal t('…') calls, and the label lists that are passed through t() at render.
const files: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(path);
  }
};
walk(join(process.cwd(), 'src'));

const wanted = new Set<string>(Object.values(CHART_LAYER_LABELS));
for (const path of files) {
  const source = readFileSync(path, 'utf8');
  for (const match of source.matchAll(/\bt\('((?:[^'\\]|\\.)*)'\)/g)) wanted.add(match[1]);
  // Messages the page shows through setError() and alert(). A message with a detail after it
  // ('Chart calculation error: ' + …) is looked up by its start, trimmed of the trailing space.
  if (path.endsWith('page.tsx') || path.endsWith('FileActions.tsx')) {
    for (const match of source.matchAll(/(?:setError|alert)\((?:t\()?'((?:[^'\\]|\\.)+)'/g)) wanted.add(match[1].trimEnd());
  }
  if (path.endsWith('SettingsPanel.tsx')) {
    for (const match of source.matchAll(/label: '([^']+)'/g)) wanted.add(match[1]);
  }
}
for (const tab of ['data', 'grahas', 'dasha', 'settings', 'Off']) wanted.add(tab);

const missing = [...wanted].filter(text => !(text in FI));
assert.deepEqual(missing, [], `strings without a Finnish translation: ${missing.join(' | ')}`);
assert.ok(wanted.size > 100, 'the scan found the translated strings');

// --- Messages with a detail keep the detail and translate the start ------------------
assert.equal(translateMessage('fi', 'Chart calculation error: boom'), 'Kartan laskennan virhe: boom');
assert.equal(translateMessage('fi', 'Failed to calculate chart. TypeError: x'), 'Kartan laskenta epäonnistui. TypeError: x');
assert.equal(translateMessage('en', 'Chart calculation error: boom'), 'Chart calculation error: boom');
assert.equal(translateMessage('fi', 'Unknown thing: x'), 'Unknown thing: x');
