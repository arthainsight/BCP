// Bhāva Bala tests (BPHS 27.26–31). The expected numbers are the verses' own constants and values worked
// out separately from the Sanskrit rules (see shadbala.fixture.ts and docs/shadbala-manual.md), not the
// output of the engine.
import assert from 'node:assert/strict';
import {
  BHAVA_KALA_VIRUPA,
  TWILIGHT_HOURS,
  bhavaDigPoint,
  birthSect,
  buildClassicalBhavaBala,
  calculateBhavaDigBalaVirupa,
  calculateBhavaDrigBala,
  calculateBhavaKalaBalaVirupa,
  type BirthSect,
} from './bhavaBala';
import { buildShadbalaRows, type ShadbalaChartLike } from './shadbala';
import { EXPECTED_BHAVA, REFERENCE_CHART } from './shadbala.fixture';

const close = (actual: number, expected: number, tolerance: number, message: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);

// ---------------------------------------------------------------------------
// The angle each sign is measured from (27.26–27)
// ---------------------------------------------------------------------------
// Aries 0, Taurus 1, Gemini 2, Cancer 3, Leo 4, Virgo 5, Libra 6, Scorpio 7, Sagittarius 8, Capricorn 9, Aquarius 10, Pisces 11.
const SEVENTH = [2, 5, 6, 10]; // Gemini, Virgo, Libra, Aquarius (and the first half of Sagittarius)
const FOURTH = [0, 1, 4]; // Aries, Taurus, Leo (and the first half of Capricorn, the second half of Sagittarius)
for (const sign of SEVENTH) assert.equal(bhavaDigPoint(sign, 15), 'desc', `sign ${sign} is measured from the Descendant`);
for (const sign of FOURTH) assert.equal(bhavaDigPoint(sign, 15), 'ic', `sign ${sign} is measured from the Nadir`);
assert.equal(bhavaDigPoint(8, 14.9), 'desc', 'the first half of Sagittarius');
assert.equal(bhavaDigPoint(8, 15), 'ic', 'the second half of Sagittarius');
assert.equal(bhavaDigPoint(9, 14.9), 'ic', 'the first half of Capricorn');
assert.equal(bhavaDigPoint(9, 15), 'mc', 'the second half of Capricorn');
assert.equal(bhavaDigPoint(11, 15), 'mc', 'Pisces');
assert.equal(bhavaDigPoint(3, 15), 'asc', 'Cancer takes the Lagna (27.27)');
assert.equal(bhavaDigPoint(7, 15), 'asc', 'Scorpio takes the Lagna (27.27)');

// Dig Bala: the distance from that angle in degrees, over three; 60 at the opposite angle.
{
  const angles = { ascendant: 100, midheaven: 10 }; // descendant 280, nadir 190
  // Virgo (sign 5): measured from the descendant (280°). Its middle, 165°, is 115° away: 38.33.
  const virgo = calculateBhavaDigBalaVirupa(5, 15, angles);
  assert.equal(virgo.point, 'desc');
  close(virgo.virupa, 115 / 3, 1e-9, 'Virgo');
  // Aquarius (sign 10) middle 315°, 35° from the descendant 280°.
  close(calculateBhavaDigBalaVirupa(10, 15, angles).virupa, 35 / 3, 1e-9, 'Aquarius');
  // Aries middle 15°, measured from the nadir (190°): 175° away.
  close(calculateBhavaDigBalaVirupa(0, 15, angles).virupa, 175 / 3, 1e-9, 'Aries');
  // A house at the very angle it is measured from is powerless: Cancer middle 105° from the Lagna 100°.
  close(calculateBhavaDigBalaVirupa(3, 15, angles).virupa, 5 / 3, 1e-9, 'Cancer');
  // The most a house can have is 60, at the point opposite to the angle it is measured from.
  close(calculateBhavaDigBalaVirupa(0, 15, { ascendant: 100, midheaven: 15 }).virupa, 60, 1e-9, 'Aries 180 degrees from the nadir, which is at 195');
  assert.equal(calculateBhavaDigBalaVirupa(0, 15, {}).virupa, 0, 'no ascendant, no Dig Bala');
}

// ---------------------------------------------------------------------------
// Kāla Bala of the houses (27.31): 15 virūpa
// ---------------------------------------------------------------------------
assert.equal(BHAVA_KALA_VIRUPA, 15);
const SIRSODAYA = [2, 4, 5, 6, 7, 10];
const PRSTHODAYA = [0, 1, 3, 8, 9];
for (let sign = 0; sign < 12; sign += 1) {
  assert.equal(calculateBhavaKalaBalaVirupa(sign, 'day'), SIRSODAYA.includes(sign) ? 15 : 0, `sign ${sign} by day`);
  assert.equal(calculateBhavaKalaBalaVirupa(sign, 'night'), PRSTHODAYA.includes(sign) ? 15 : 0, `sign ${sign} by night`);
  assert.equal(calculateBhavaKalaBalaVirupa(sign, 'twilight'), sign === 11 ? 15 : 0, `sign ${sign} in the twilight`);
  assert.equal(calculateBhavaKalaBalaVirupa(sign, 'unknown'), 0, `sign ${sign} with no birth time`);
}

// The twilight is five ghatis (two hours) either side of sunrise and sunset (46.44–47).
assert.equal(TWILIGHT_HOURS, 2);
{
  const atHour = (hour: number): ShadbalaChartLike => ({
    debug: {
      inputDateTime: `2000-01-01 ${String(Math.floor(hour)).padStart(2, '0')}:${String(Math.round((hour % 1) * 60)).padStart(2, '0')}:00`,
      sunriseLocalHours: 6.5,
      sunsetLocalHours: 18.25,
    },
  });
  const expected: Array<[number, BirthSect]> = [
    [0, 'night'], [4.4, 'night'], [4.5, 'twilight'], [6.5, 'twilight'], [8.5, 'twilight'], [8.75, 'day'],
    [12, 'day'], [16.0, 'day'], [16.25, 'twilight'], [18.25, 'twilight'], [20.25, 'twilight'], [20.5, 'night'], [23.5, 'night'],
  ];
  for (const [hour, sect] of expected) assert.equal(birthSect(atHour(hour)), sect, `birth at ${hour} h`);
  assert.equal(birthSect({}), 'unknown', 'no data');
  assert.equal(birthSect({ debug: { inputDateTime: '2000-01-01 12:00:00' } }), 'unknown', 'no sunrise');
}

// ---------------------------------------------------------------------------
// Dṛṣṭi Bala of a house (27.28–29): a quarter of each aspect, Mercury's and Jupiter's in full
// ---------------------------------------------------------------------------
{
  const chart = (planets: Array<{ name: string; longitude: number }>): ShadbalaChartLike => ({ planets });
  // Jupiter 180 degrees from the point: the full 60, a benefic, in full: +60.
  close(calculateBhavaDrigBala(chart([{ name: 'Jupiter', longitude: 0 }]), 180).total, 60, 1e-9, 'Jupiter in full');
  // Venus 180 degrees away: a quarter, +15.
  close(calculateBhavaDrigBala(chart([{ name: 'Venus', longitude: 0 }]), 180).total, 15, 1e-9, 'Venus a quarter');
  // Saturn at 60 degrees behind the point casts 60: a malefic quarter, -15.
  close(calculateBhavaDrigBala(chart([{ name: 'Saturn', longitude: 0 }]), 60).total, -15, 1e-9, 'Saturn a quarter');
  // Mercury is a benefic alone and counts in full; with Mars in its sign it is a malefic and counts negative in full.
  close(calculateBhavaDrigBala(chart([{ name: 'Mercury', longitude: 0 }]), 180).total, 60, 1e-9, 'Mercury in full');
  const mercuryWithMars = calculateBhavaDrigBala(chart([{ name: 'Mercury', longitude: 10 }, { name: 'Mars', longitude: 20 }]), 190);
  const detail = mercuryWithMars.details.find((entry) => entry.planet === 'Mercury')!;
  assert.equal(detail.nature, 'malefic', 'Mercury with Mars');
  close(detail.contribution, -60, 1e-9, 'Mercury malefic in full');
  // Nothing is cast within 30 degrees.
  assert.equal(calculateBhavaDrigBala(chart([{ name: 'Jupiter', longitude: 0 }]), 20).details.length, 0, 'a conjunction casts nothing');
  // Benefics and malefics add up to the total.
  const both = calculateBhavaDrigBala(chart([{ name: 'Jupiter', longitude: 0 }, { name: 'Saturn', longitude: 120 }]), 180);
  close(both.total, both.benefic + both.malefic, 1e-9, 'parts of the total');
}

// ---------------------------------------------------------------------------
// The reference chart: 13 October 1987, 00:15 EET, Kotka (Cancer rising)
// ---------------------------------------------------------------------------
{
  const shadbala = buildShadbalaRows(REFERENCE_CHART);
  const rows = buildClassicalBhavaBala(REFERENCE_CHART, shadbala);
  assert.equal(rows.length, 12);
  for (const expected of EXPECTED_BHAVA) {
    const row = rows[expected.house - 1];
    const tag = `house ${expected.house} of the reference chart`;
    assert.equal(row.lord, expected.lord, `${tag}: lord`);
    close(row.bhavesha, expected.bhavesha, 0.5, `${tag}: Bhavesha`);
    close(row.dig, expected.dig, 0.02, `${tag}: Dig`);
    close(row.drig, expected.drig, 0.02, `${tag}: Drig`);
    assert.equal(row.occupantTotal, expected.occupants, `${tag}: occupants`);
    assert.equal(row.kala, expected.kala, `${tag}: Kala`);
    close(row.total, expected.total, 0.6, `${tag}: total`);
    // The parts add up to the total.
    close(row.total, row.bhavesha + row.dig + row.drig + row.occupantTotal + row.kala, 1e-9, `${tag}: parts`);
    close(row.drig, row.drigBenefic + row.drigMalefic, 1e-9, `${tag}: Drig parts`);
  }
  // Cancer rising: the Lagna's own sign takes the Lagna as its powerless angle, 9.5 degrees away.
  assert.equal(rows[0].digPoint, 'asc');
  close(rows[0].dig, (114.54414658026127 - 105) / 3, 1e-9, 'the 1st house');
  // Mars and the Sun stand in Virgo (-60 each), Jupiter in Aries (+60), Mercury and Venus in Libra (+60).
  assert.deepEqual(rows[2].occupants.map((occupant) => occupant.name), ['Sun', 'Mars']);
  assert.equal(rows[2].occupantTotal, -120);
  assert.equal(rows[3].occupantTotal, 60, 'Mercury +60, Venus none');
  assert.equal(rows[9].occupantTotal, 60, 'Jupiter in Aries');
  assert.equal(rows[0].kalaNote, 'night birth');
}

// A chart without its ascendant still calculates, with no Dig Bala.
{
  const rows = buildClassicalBhavaBala({ planets: [] }, []);
  assert.equal(rows.length, 12);
  for (const row of rows) {
    assert.equal(row.total, 0);
    assert.equal(row.lord, '—');
  }
}

console.log('Bhava Bala tests passed');
