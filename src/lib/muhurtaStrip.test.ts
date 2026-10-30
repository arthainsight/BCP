// The month strip: the states of the sky checked against the panchāṅga of the app at their middles, and the rows that
// colour them against the choices (worked by hand).
import assert from 'node:assert/strict';
import { calculateChart } from './ephemeris';
import { calculatePanchang } from './panchang';
import { NAKSHATRA_NAMES } from './nakshatras';
import { YOGA_NAMES } from './panchang';
import { runMuhurtaStrip, type StripState } from './muhurtaStrip';
import { stripRows, vtnOfState, type StripChoices } from './muhurtaStripView';

const PLACE = { lat: 60.46667, lng: 26.94583, zone: 'Europe/Helsinki', tz: 2 };
const all = (size: number, first = 0) => Array.from({ length: size }, (_, index) => first + index);

async function main() {
  const strip = await runMuhurtaStrip({ start: '2027-01-01', days: 31, ...PLACE, ayanamsa: 'lahiri', ayanamsaOffset: 0 });
  assert.equal(strip.days.length, 31);
  assert.deepEqual(strip.days.slice(0, 3).map(day => [day.date, day.weekday]), [[1, 5], [2, 6], [3, 0]], '1 January 2027 is a Friday');
  assert.equal(strip.states[0].start, strip.start);
  assert.equal(strip.states[strip.states.length - 1].end, strip.end);
  strip.states.forEach((state, index) => {
    assert.ok(state.end > state.start);
    if (index > 0) assert.equal(state.start, strip.states[index - 1].end, 'the states follow one another');
  });
  // The month: about 27 nakṣatras and 30 tithis; the vāra changes every day.
  const count = (key: 'nakshatra' | 'tithi' | 'yoga' | 'vara') => strip.states.filter((state, index) => index === 0 || state[key] !== strip.states[index - 1][key]).length;
  assert.ok(count('nakshatra') >= 28 && count('nakshatra') <= 32, `${count('nakshatra')} nakṣatras in 31 days`);
  assert.ok(count('tithi') >= 30 && count('tithi') <= 33);
  assert.equal(count('vara'), 32, 'a vāra a day, and the end of the one before the first sunrise');

  // Against the app's panchāṅga at the middle of eight states.
  const middleStates = strip.states.filter((_, index) => index % 17 === 3).slice(0, 8);
  for (const state of middleStates) {
    const middle = new Date((state.start + state.end) / 2);
    const local = new Date(middle.getTime() + 2 * 3_600_000);
    const chart = await calculateChart(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate(), local.getUTCHours(), local.getUTCMinutes(), 0, PLACE.lat, PLACE.lng, 2, 'lahiri');
    const pad = (value: number) => String(value).padStart(2, '0');
    const panchang = calculatePanchang(chart, `${pad(local.getUTCDate())}.${pad(local.getUTCMonth() + 1)}.${local.getUTCFullYear()} ${pad(local.getUTCHours())}.${pad(local.getUTCMinutes())}.00`, 2, 'lahiri');
    assert.equal(panchang.tithiNumber, ((state.tithi - 1) % 15) + 1, `tithi at ${middle.toISOString()}`);
    assert.equal(panchang.paksha, state.tithi <= 15 ? 'Shukla' : 'Krishna');
    assert.equal(YOGA_NAMES[state.yoga], panchang.yoga);
    assert.equal(NAKSHATRA_NAMES[state.nakshatra], panchang.nakshatra);
  }

  // The rows against the choices. Two states: Friday in Hasta (12) on the 6th tithi, then Saturday in Chitra (13) on the 7th.
  const states: StripState[] = [
    { start: 0, end: 100, vara: 5, tithi: 6, nakshatra: 12, karana: 3, yoga: 4, moonSign: 5 },
    { start: 100, end: 200, vara: 6, tithi: 7, nakshatra: 13, karana: 4, yoga: 4, moonSign: 6 },
  ];
  const openChoices: StripChoices = { vara: all(7), tithi: all(30, 1), nakshatra: all(27), karana: all(11), yoga: all(27) };
  const rowsOpen = stripRows(states, openChoices);
  assert.deepEqual(rowsOpen.map(row => row.id), ['vara', 'nakshatra', 'tithi', 'karana', 'yoga', 'vtn'], 'no natal chart: no Tarabala or Chandrabala');
  for (const row of rowsOpen.filter(entry => entry.id !== 'vtn')) assert.ok(row.segments.every(segment => segment.tone === 'good'), `${row.id}: nothing chosen away, nothing red`);
  assert.equal(rowsOpen.find(row => row.id === 'yoga')!.segments.length, 1, 'two states of the same yoga are one stretch');

  const chosen: StripChoices = {
    ...openChoices, vara: [1, 3, 4, 5], nakshatra: [12], middling: { nakshatra: [13], tithi: [7] }, tithi: [2, 3, 5, 6],
    tara: { nakshatra: 12, taras: [2, 4, 6, 8, 9] }, chandra: { moonSign: 5, houses: [1, 3, 6, 7, 10, 11] },
  };
  const rows = Object.fromEntries(stripRows(states, chosen).map(row => [row.id, row.segments]));
  assert.deepEqual(rows.vara.map(segment => segment.tone), ['good', 'bad'], 'Saturday is not chosen');
  assert.deepEqual(rows.nakshatra.map(segment => segment.tone), ['good', 'middling'], 'Hasta chosen, Chitra middling');
  assert.deepEqual(rows.tithi.map(segment => segment.tone), ['good', 'middling'], 'the 6th chosen, the 7th middling');
  assert.deepEqual(rows.tara.map(segment => [segment.label, segment.tone]), [['1', 'bad'], ['2', 'good']], 'Hasta is the Janma nakṣatra of a native born in it; Chitra is the next, Sampat');
  // Moon in Virgo (5) for a native with the Moon in Virgo: the 1st house; in Libra (6): the 2nd, which is not chosen.
  assert.deepEqual(rows.chandra.map(segment => [segment.label, segment.tone]), [['1', 'good'], ['2', 'bad']]);

  // The yogas: Friday and Hasta are Siddha (Vāra/Nakṣatra, Venus), Friday and the 6th (a Nanda) Siddha of Vāra/Tithi: good.
  assert.equal(rows.vtn[0].tone, 'good');
  assert.match(rows.vtn[0].title, /Siddha/);
  // Saturday and Chitra: Saturn's Mrityu-3 has Chitra, and nothing auspicious holds it: bad.
  assert.equal(rows.vtn[1].tone, 'bad');
  // The exceptions of a marriage: Asvini on Tuesday is a Sarvārtha Siddhi that does not count for it.
  const asvini: StripState = { start: 0, end: 1, vara: 2, tithi: 3, nakshatra: 0, karana: 0, yoga: 0, moonSign: 0 };
  assert.ok(vtnOfState(asvini, {}).some(yoga => yoga.id === 'vn-sarvartha-siddhi'));
  assert.ok(!vtnOfState(asvini, { sarvarthaExceptions: true }).some(yoga => yoga.id === 'vn-sarvartha-siddhi'));
}
main();
