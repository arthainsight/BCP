import assert from 'node:assert/strict';
import { calculateChart } from './ephemeris';
import { formatClock, parseClock } from './specialSphutas';

// --- Clock text ------------------------------------------------------------------------
assert.equal(parseClock('06:28:31'), 6 + 28 / 60 + 31 / 3600);
assert.equal(parseClock(' 6:28 '), 6 + 28 / 60);
assert.equal(parseClock(''), null);
assert.equal(parseClock('26:99'), null);
assert.equal(parseClock('24:00'), null);
assert.equal(parseClock('06:60'), null);
assert.equal(parseClock('abc'), null);
assert.equal(formatClock(6 + 28 / 60 + 31 / 3600), '06:28:31');
assert.equal(formatClock(-0.5), '23:30:00');

async function main() {
  const args = [1990, 7, 15, 9, 30, 0, 60.17, 24.94, 3] as const; // Helsinki, a summer morning

  // The chart carries all the special sphuṭas and the time they run on.
  const chart = await calculateChart(...args, 'lahiri', 'mean', 0, 'true');
  assert.equal(chart.specialSphutas?.length, 12);
  assert.ok(chart.specialSphutaTiming && chart.specialSphutaTiming.source === 'true');

  // The special lagnas the charts mark are the same numbers as the sphuṭas of the table, whatever the sunrise.
  const sameNumbers = (c: typeof chart) => {
    for (const lagna of c.specialLagnas ?? []) {
      const sphuta = c.specialSphutas!.find(item => item.key === lagna.name)!;
      assert.equal(lagna.longitude, sphuta.longitude, `${lagna.name} is one value in the charts and in the table`);
    }
  };
  sameNumbers(chart);

  // A sunrise typed in changes both together, and is reported as the source.
  const typed = parseClock('05:00:00')!;
  const manual = await calculateChart(...args, 'lahiri', 'mean', 0, 'true', typed);
  assert.equal(manual.specialSphutaTiming?.source, 'manual');
  assert.equal(manual.specialSphutaTiming?.sunriseUsed, typed);
  sameNumbers(manual);
  const horaOf = (c: typeof chart) => c.specialLagnas!.find(item => item.name === 'HL')!.longitude;
  assert.notEqual(horaOf(manual), horaOf(chart), 'another sunrise moves the Hora Lagna in the charts too');

  // The same sunrise as the calculated one changes nothing.
  const same = await calculateChart(...args, 'lahiri', 'mean', 0, 'true', chart.specialSphutaTiming!.sunriseCalculated);
  assert.ok(Math.abs(horaOf(same) - horaOf(chart)) < 1e-9);

  // The points that do not run on the clock are the same whatever the sunrise.
  const key = (c: typeof chart, name: string) => c.specialSphutas!.find(item => item.key === name)!.longitude;
  for (const name of ['SL', 'BB', 'IL', 'D22', 'N64']) assert.equal(key(manual, name), key(chart, name), `${name} does not depend on the sunrise`);

  // The mean-time sunrise is the true sunrise plus the equation of time.
  const mean = await calculateChart(...args, 'lahiri', 'mean', 0, 'mean');
  assert.equal(mean.specialSphutaTiming?.source, 'mean');
  assert.notEqual(mean.specialSphutaTiming?.sunriseCalculated, chart.specialSphutaTiming?.sunriseCalculated);

  console.log('special sphuta source tests passed');
}
void main();
