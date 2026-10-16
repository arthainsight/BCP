import assert from 'node:assert/strict';
import { AYANAMSA_OPTIONS } from './ayanamsas';
import { calculateChart } from './ephemeris';
import { DEFAULT_NAKSHATRA_MODE, NAKSHATRA_MODES, nakshatraAdjustFor, readNakshatraMode } from './nakshatraZodiac';

// --- What is stored ----------------------------------------------------------------------------
assert.equal(DEFAULT_NAKSHATRA_MODE, 'same', 'the nakshatras follow the grahas to begin with');
assert.equal(readNakshatraMode(undefined), 'same');
assert.equal(readNakshatraMode('same'), 'same');
assert.equal(readNakshatraMode('lahiri'), 'lahiri', 'the earlier choices are choices of the ayanamsa list and mean what they did');
assert.equal(readNakshatraMode('tropical'), 'tropical');
assert.equal(readNakshatraMode('sidereal'), 'same', 'the old default, "sidereal (Lahiri)", is the same as the grahas now');
assert.equal(readNakshatraMode('no-such-ayanamsa'), 'same', 'an unknown value is the default');
assert.equal(readNakshatraMode(3), 'same');
// Every choice of the ayanamsa list is a nakshatra zodiac, and "same as the grahas" comes first.
assert.deepEqual([...NAKSHATRA_MODES], ['same', ...AYANAMSA_OPTIONS.map(option => option.value)]);
for (const option of AYANAMSA_OPTIONS) assert.equal(readNakshatraMode(option.value), option.value, `${option.value} is kept as it is stored`);
assert.ok(NAKSHATRA_MODES.includes('raman') && NAKSHATRA_MODES.includes('krishnamurti') && NAKSHATRA_MODES.includes('custom-lahiri') && NAKSHATRA_MODES.includes('true-chitra'));

// --- The adjustment, with a chart in the Raman ayanamsa (22.6°) and Lahiri at 24.2° -----------------
const raman = 22.6;
const lahiri = 24.2;
const values = { lahiri, raman, krishnamurti: 24.1, tropical: 0 };
assert.equal(nakshatraAdjustFor('same', raman, values), 0, 'the same ayanamsa as the grahas: no change');
assert.ok(Math.abs(nakshatraAdjustFor('lahiri', raman, values) - (raman - lahiri)) < 1e-12, 'Lahiri is 1.6 degrees further on than Raman');
assert.equal(nakshatraAdjustFor('tropical', raman, values), raman, 'the tropical longitude is the sidereal one plus the ayanamsa');
assert.ok(Math.abs(nakshatraAdjustFor('krishnamurti', raman, values) - (raman - 24.1)) < 1e-12, 'any other choice of the list: the chart\'s ayanamsa less its own');
assert.equal(nakshatraAdjustFor('raman', raman, values), 0, 'the grahas\' own ayanamsa chosen by name changes nothing');

// Custom Lahiri is Lahiri with the adjustment of Settings.
assert.ok(Math.abs(nakshatraAdjustFor('custom-lahiri', raman, values, 0.5) - (raman - (lahiri + 0.5))) < 1e-12);
assert.ok(Math.abs(nakshatraAdjustFor('custom-lahiri', raman, values, -1) - (raman - (lahiri - 1))) < 1e-12);
assert.equal(nakshatraAdjustFor('custom-lahiri', lahiri + 0.5, values, 0.5), 0, 'a chart in Custom Lahiri with the same adjustment');

// A chart in Lahiri itself: Lahiri and the same one agree.
assert.equal(nakshatraAdjustFor('lahiri', lahiri, values), 0);
assert.equal(nakshatraAdjustFor('same', lahiri, values), 0);
// A zodiac whose ayanamsa is not known changes nothing.
assert.equal(nakshatraAdjustFor('lahiri', lahiri), 0, 'without a table of ayanamsas there is nothing to adjust');
assert.equal(nakshatraAdjustFor('mardyks', raman, values), 0);
assert.equal(nakshatraAdjustFor('custom-lahiri', raman, {}, 1), 0);

// A graha at sidereal 10° Aries (Raman) is at tropical 32.6° = 2.6° Taurus; in Lahiri it is 8.4° Aries.
const longitude = 10;
assert.ok(Math.abs(longitude + nakshatraAdjustFor('tropical', raman, values) - 32.6) < 1e-9);
assert.ok(Math.abs(longitude + nakshatraAdjustFor('lahiri', raman, values) - 8.4) < 1e-9);

// --- Against the real ephemeris, for every ayanamsa of the list ---------------------------------------
// The same moment is calculated in each ayanamsa. A graha's longitude in one chart, with the adjustment for any other zodiac of
// the list, must be the longitude that other chart gives it: this holds for every pair, whatever the ayanamsas are.
const normal = (degrees: number) => ((degrees % 360) + 360) % 360;
const apart = (a: number, b: number) => { const d = Math.abs(normal(a) - normal(b)); return Math.min(d, 360 - d); };

async function main() {
  const offset = 0.7;
  const charts = new Map<string, Awaited<ReturnType<typeof calculateChart>>>();
  for (const option of AYANAMSA_OPTIONS) {
    charts.set(option.value, await calculateChart(1990, 6, 15, 10, 30, 0, 60.1699, 24.9384, 3, option.value, 'mean', option.value === 'custom-lahiri' ? offset : 0));
  }
  const lahiriChart = charts.get('lahiri')!;
  const table = lahiriChart.debug!.ayanamsas!;
  assert.ok(table, 'the chart carries the table of ayanamsas');
  assert.deepEqual(Object.keys(table).sort(), AYANAMSA_OPTIONS.map(option => option.value).filter(value => value !== 'custom-lahiri').sort(), 'every choice of the list but Custom Lahiri');
  assert.equal(table.tropical, 0);
  assert.equal(table.lahiri, lahiriChart.debug!.siderealAyanamsa, 'the Lahiri one is the one that was always kept');
  for (const value of Object.values(table)) assert.ok(Number.isFinite(value));
  assert.ok(table.lahiri > 23 && table.lahiri < 25, 'Lahiri in 1990 is about 23.7 degrees');
  assert.ok(new Set(Object.entries(table).filter(([name]) => name !== 'tropical').map(([, value]) => value.toFixed(5))).size > 10, 'the choices differ');
  // The table is the same whichever ayanamsa the chart itself is in.
  for (const [name, chart] of charts) {
    for (const key of Object.keys(table)) assert.ok(Math.abs(chart.debug!.ayanamsas![key] - table[key]) < 1e-9, `${name} chart, ${key}`);
  }

  for (const [chartName, chart] of charts) {
    for (const mode of NAKSHATRA_MODES) {
      if (mode === 'same') continue;
      const target = charts.get(mode)!;
      for (const planet of chart.planets) {
        const read = planet.longitude + nakshatraAdjustFor(mode, chart.debug!.ayanamsa, chart.debug!.ayanamsas!, offset);
        const direct = target.planets.find(item => item.name === planet.name)!.longitude;
        assert.ok(apart(read, direct) < 1e-7, `${planet.name} of a chart in ${chartName}, read in ${mode}: ${normal(read)} against ${direct}`);
      }
    }
  }
  console.log('Nakshatra zodiac tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
