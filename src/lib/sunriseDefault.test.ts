import assert from 'node:assert/strict';
import { calculateChart } from './ephemeris';
import { DEFAULT_CALCULATION_SETTINGS } from '../types';

// v2.87: the special lagnas count from the true sunrise unless the mean-time sunrise is chosen.
async function main() {
  assert.equal(DEFAULT_CALCULATION_SETTINGS.sunriseMode, 'true');

  // Porvoo, 13 October 2026, 10:00 (UTC+3).
  const cast = (sunrise?: 'true' | 'mean') => calculateChart(2026, 10, 13, 10, 0, 0, 60.3923, 25.6651, 3, 'lahiri', 'mean', 0, sunrise);
  const byDefault = await cast();
  const trueSunrise = await cast('true');
  const meanSunrise = await cast('mean');

  assert.deepEqual(byDefault.specialLagnas, trueSunrise.specialLagnas, 'no choice means the true sunrise');
  assert.notDeepEqual(byDefault.specialLagnas, meanSunrise.specialLagnas, 'the mean-time sunrise is about 14 minutes off in October');
  // The sunrise itself is the almanac's (Deva Guru: 07:52:11, 18:13:37), within seconds.
  const rise = byDefault.debug?.sunriseLocalHours; const set = byDefault.debug?.sunsetLocalHours;
  assert.ok(rise !== undefined && set !== undefined);
  assert.ok(Math.abs(rise * 3600 - (7 * 3600 + 52 * 60 + 11)) < 15, `sunrise ${rise}`);
  assert.ok(Math.abs(set * 3600 - (18 * 3600 + 13 * 60 + 37)) < 15, `sunset ${set}`);
  console.log('Sunrise default tests passed');
}

main().catch((error) => { console.error(error); process.exit(1); });
