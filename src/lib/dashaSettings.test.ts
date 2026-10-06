import assert from 'node:assert/strict';
import { DEFAULT_DASHA_SETTINGS } from '@/types';
import { migrateDashaSettings } from './dashaSettings';

assert.deepEqual(migrateDashaSettings(null), DEFAULT_DASHA_SETTINGS);

// Current format: stored toggles and method options survive; removed keys are dropped.
const current = migrateDashaSettings({
  dashas: { yogini: false, tara: true },
  charaOptions: { start: 'ak' },
});
assert.equal(current.dashas.yogini, false);
assert.ok(!('tara' in current.dashas), 'placeholder systems removed in v2.15 are dropped');
assert.equal(current.charaOptions?.start, 'ak');
assert.equal(current.charaOptions?.scorpioLord, DEFAULT_DASHA_SETTINGS.charaOptions.scorpioLord);
assert.deepEqual(current.rasiOptions, DEFAULT_DASHA_SETTINGS.rasiOptions);

// Old format: showBcp / showVimshottari / dashaSystem.
const old = migrateDashaSettings({ showBcp: false, dashaSystem: 'vds' });
assert.equal(old.dashas.bcp, false);
assert.equal(old.dashas.vimshottari, true);
assert.equal(old.dashas.vds, true);
