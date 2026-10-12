import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateChart } from './ephemeris';
import { calculateVimshottari } from './vimshottari';

// ---------------------------------------------------------------------------
// The app's calculations checked against another program: thirteen charts (both hemispheres, latitudes from Sydney to
// Oulu, birth years 1899 to 2035) cast by PyJHora 4.8.7, which uses the same Swiss Ephemeris. The values are in
// fixtures/pyjhoraCharts.json, made by scripts/pyjhora_reference.py: Lahiri ayanamsa, apparent positions, the mean node
// (and the true node for Rahu), the Vimsottari mahadasha starts.
//
// One difference of convention is known and is what the "frame offset" below is: the app takes the apparent tropical
// longitude, which includes the nutation, and subtracts the mean ayanamsa, so every longitude of a chart (the
// ascendant, the grahas and the nodes) is moved by the same nutation in longitude, at most about 17 arcseconds, from the
// Swiss Ephemeris's own sidereal positions that PyJHora gives. The programs agree with each other to a fraction of an
// arcsecond once that common offset is taken out.
// ---------------------------------------------------------------------------
type Reference = {
  label: string;
  birth: [number, number, number, number, number, number];
  lat: number;
  lng: number;
  tz: number;
  ascendant: number;
  planets: Record<string, number>;
  rahuTrue: number;
  vimsottari: { lord: string; start: [number, number, number, number] }[];
};
const { charts } = JSON.parse(readFileSync(new URL('./fixtures/pyjhoraCharts.json', import.meta.url), 'utf8')) as { charts: Reference[] };

/** Ours minus theirs, in degrees, brought to between −180 and 180. */
const difference = (ours: number, theirs: number) => ((((ours - theirs) % 360) + 540) % 360) - 180;
const DAY = 86_400_000;

/** The largest nutation in longitude is 17.2 arcseconds; a little over it is allowed for the offset. */
const MAX_FRAME_OFFSET = 0.0055;
/** Bodies of one chart agree with each other once the offset is taken out: 3.6 arcseconds. */
const MAX_SPREAD = 0.001;

async function main() {
  assert.equal(charts.length, 13);
  const offsets: number[] = [];
  let worstSpread = 0;
  let worstDays = 0;

  for (const reference of charts) {
    const [year, month, day, hour, minute, second] = reference.birth;
    const mean = await calculateChart(year, month, day, hour, minute, second, reference.lat, reference.lng, reference.tz, 'lahiri', 'mean', 0, 'mean');
    const label = reference.label;

    // The offset every longitude of this chart shares: the Moon's is the most exact, as it has the greatest weight in the dasha.
    const moon = mean.planets.find(planet => planet.name === 'Moon')!;
    const offset = difference(moon.longitude, reference.planets.Moon);
    offsets.push(offset);
    assert.ok(Math.abs(offset) <= MAX_FRAME_OFFSET, `${label}: the frame offset ${offset.toFixed(5)}° is within the nutation`);

    const compared: [string, number, number][] = [['Ascendant', mean.ascendant.longitude, reference.ascendant]];
    for (const name of Object.keys(reference.planets)) {
      const found = mean.planets.find(planet => planet.name === name);
      assert.ok(found, `${label}: ${name} is in the chart`);
      compared.push([name, found.longitude, reference.planets[name]]);
    }
    for (const [name, ours, theirs] of compared) {
      const spread = Math.abs(difference(ours, theirs) - offset);
      worstSpread = Math.max(worstSpread, spread);
      assert.ok(spread <= MAX_SPREAD, `${label}: ${name} is ${difference(ours, theirs).toFixed(5)}° from PyJHora, the rest of the chart ${offset.toFixed(5)}°`);
    }

    // The true node is worked out from the Moon's osculating orbit and answers to the flags differently, so it follows
    // the offset only roughly: it is within 29 arcseconds of PyJHora's (0.008°), the wider limit of the two.
    const trueNode = await calculateChart(year, month, day, hour, minute, second, reference.lat, reference.lng, reference.tz, 'lahiri', 'true', 0, 'mean');
    const rahu = trueNode.planets.find(planet => planet.name === 'Rahu')!;
    assert.ok(Math.abs(difference(rahu.longitude, reference.rahuTrue)) <= 0.008, `${label}: the true node, ${difference(rahu.longitude, reference.rahuTrue).toFixed(5)}° from PyJHora`);
    assert.ok(Math.abs(difference(trueNode.planets.find(planet => planet.name === 'Ketu')!.longitude, rahu.longitude + 180)) < 1e-9, `${label}: Ketu is opposite Rahu`);

    // The Vimsottari rules, given the Moon of PyJHora, agree with it to within a day or so a hundred years on
    // (the app counts a year as 365.25 days, PyJHora as the sidereal year): the lords in the same order and the
    // end of each mahadasha, which is the start of the next one in PyJHora's list.
    const born = Date.UTC(year, month - 1, day, hour - reference.tz, minute, second);
    const dasha = calculateVimshottari(reference.planets.Moon, new Date(born));
    for (let index = 0; index < 8; index++) {
      assert.equal(dasha.entries[index].lord, reference.vimsottari[index].lord, `${label}: mahadasha ${index + 1}`);
      const [y, m, d, hours] = reference.vimsottari[index + 1].start;
      const theirs = Date.UTC(y, m - 1, d) + hours * 3_600_000 - reference.tz * 3_600_000;
      const days = (dasha.entries[index].endDate.getTime() - theirs) / DAY;
      worstDays = Math.max(worstDays, Math.abs(days));
      assert.ok(Math.abs(days) <= 1.5, `${label}: mahadasha ${index + 1} of ${dasha.entries[index].lord} ends ${days.toFixed(2)} days from PyJHora's date`);
    }
  }

  // Taken out, the offset is the nutation: it swings both ways through the years and is not a drift of the ayanamsa.
  assert.ok(offsets.some(value => value > 0.001) && offsets.some(value => value < -0.001), 'the offset goes both ways, as nutation does');
  console.log(`PyJHora reference tests passed: the frame offset is within ${Math.max(...offsets.map(Math.abs)).toFixed(4)}°, the bodies of a chart agree within ${worstSpread.toFixed(5)}° once it is taken out, the mahadasha dates within ${worstDays.toFixed(2)} days.`);
}

main().catch(error => { console.error(error); process.exit(1); });
