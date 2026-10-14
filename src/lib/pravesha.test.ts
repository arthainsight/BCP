import assert from 'node:assert/strict';
import { SE_MOON, SE_SUN, sweCalcUt, sweGetAyanamsa } from './ephemerisAdapter';
import { normalizeDegrees } from './angles';
import { jdFromLocal, signedDelta } from './lunisolar';
import {
  PRAVESHA_PERIOD, calculatePravesha, praveshaReturnsBetween, praveshaValueAt, praveshaYearAt, type PraveshaKind, type PraveshaMethod,
} from './pravesha';
import { nakshatraOfLongitude, yogaOfSum } from './praveshaNames';

// The Moon's sidereal longitude, and the sum of the Sun's and the Moon's, worked out here from the ephemeris
// and the Lahiri ayanamsa, independently of the module.
async function independent(kind: PraveshaKind, jd: number) {
  const ay = await sweGetAyanamsa(jd, 'lahiri');
  const moon = (await sweCalcUt(jd, SE_MOON)).longitude;
  if (kind === 'nakshatra') return normalizeDegrees(moon - ay);
  return normalizeDegrees((await sweCalcUt(jd, SE_SUN)).longitude + moon - 2 * ay);
}
const apart = (a: number, b: number) => Math.abs(signedDelta(a, b));

async function main() {
  // Helsinki, 15 March 1985 10:30 EET.
  const birthJd = await jdFromLocal(1985, 3, 15, 10, 30, 0, 2);
  const birthday = (year: number) => jdFromLocal(year, 3, 15, 10, 30, 0, 2);

  for (const kind of ['nakshatra', 'yoga'] as const) {
    const natal = await independent(kind, birthJd);
    assert.ok(apart((await praveshaValueAt(kind, birthJd)).value, natal) < 1e-9, `${kind}: the value at birth`);

    // --- About thirteen returns a year, a period apart ------------------------------------------------------------
    const returns = await praveshaReturnsBetween(kind, natal, await jdFromLocal(2024, 1, 1, 0, 0, 0, 0), await jdFromLocal(2025, 1, 1, 0, 0, 0, 0));
    assert.ok(returns.length >= 13 && returns.length <= 15, `${kind}: ${returns.length} returns in a year`);
    returns.forEach((jd, index) => {
      if (index > 0) assert.ok(Math.abs(jd - returns[index - 1] - PRAVESHA_PERIOD[kind]) < 3, `${kind}: about a period between returns`);
    });

    let previous: number | null = null;
    for (let year = 2018; year <= 2030; year++) {
      for (const method of ['lunar-month', 'before-birthday'] as PraveshaMethod[]) {
        const p = await calculatePravesha({ kind, birthJd, year, method, birthdayJd: birthday });
        const label = `${kind} ${method} ${year}`;

        // The quantity is the natal one, to a hundredth of an arc-second, and checked independently.
        assert.ok(apart(p.value, natal) < 3e-6, `${label}: the quantity repeats (${apart(p.value, natal)})`);
        assert.ok(apart(await independent(kind, p.jd), natal) < 3e-6, `${label}: checked independently`);

        if (method === 'before-birthday') {
          // The last return at or before the birthday: within one round of it, and the next one is after it.
          const day = await birthday(year);
          assert.ok(p.jd <= day + 1e-6, `${label}: at or before the birthday`);
          assert.ok(day - p.jd < PRAVESHA_PERIOD[kind] * 1.1, `${label}: within a round of the birthday`);
          assert.ok(p.jd + PRAVESHA_PERIOD[kind] * 0.9 > day - 3 || (await praveshaReturnsBetween(kind, natal, p.jd + 1, day + 1e-6)).length === 0, `${label}: no later return before the birthday`);
        } else {
          // Inside the lunar month of birth, the last return at or before the lunar birthday, or the first when none is.
          assert.ok(p.monthStartJd !== undefined && p.monthEndJd !== undefined && p.jd >= p.monthStartJd && p.jd < p.monthEndJd, `${label}: inside the lunar month`);
          const inMonth = await praveshaReturnsBetween(kind, natal, p.monthStartJd!, p.monthEndJd!);
          assert.ok(inMonth.length >= 1 && inMonth.length <= 2, `${label}: one or two returns in a month`);
          const before = inMonth.filter((jd) => jd <= p.tithiPravesaJd);
          assert.ok(Math.abs(p.jd - (before.length ? before[before.length - 1] : inMonth[0])) < 1e-6, `${label}: the rule's return`);
          // Years are twelve or thirteen lunations long, give or take the choice of return inside the month.
          if (previous !== null) {
            const length = p.jd - previous;
            assert.ok(length > 330 && length < 400, `${label}: a year long, got ${length.toFixed(1)} days`);
          }
          previous = p.jd;
        }
      }
    }

    // --- The year in force at a date ---------------------------------------------------------------------------
    const target = await jdFromLocal(2026, 10, 13, 12, 0, 0, 3);
    const { current, next } = await praveshaYearAt({ kind, birthJd, targetJd: target, birthdayJd: birthday });
    assert.ok(current.jd <= target && target < next.jd, `${kind}: the target lies in the year in force`);
    assert.ok(next.jd - current.jd > 330 && next.jd - current.jd < 400);
    const { current: viaBirthday } = await praveshaYearAt({ kind, birthJd, targetJd: target, method: 'before-birthday', birthdayJd: birthday });
    assert.ok(viaBirthday.jd <= target);
  }

  // --- The ayanamsa: the tropical zodiac repeats the tropical Moon ------------------------------------------------
  const tropicalMoon = (await sweCalcUt(birthJd, SE_MOON)).longitude;
  const tropical = await calculatePravesha({ kind: 'nakshatra', birthJd, year: 2026, ayanamsa: 'tropical' });
  assert.ok(apart((await sweCalcUt(tropical.jd, SE_MOON)).longitude, tropicalMoon) < 3e-6, 'tropical: the tropical Moon repeats');

  // --- What a Praveśa shows ---------------------------------------------------------------------------------------
  assert.deepEqual(nakshatraOfLongitude(0), { name: 'Ashwini', number: 1, pada: 1 });
  assert.deepEqual(nakshatraOfLongitude(13.34), { name: 'Bharani', number: 2, pada: 1 });
  assert.equal(nakshatraOfLongitude(359.99).name, 'Revati');
  assert.equal(nakshatraOfLongitude(359.99).pada, 4);
  assert.equal(nakshatraOfLongitude(3.4).pada, 2);
  assert.equal(nakshatraOfLongitude(-0.01).name, 'Revati');
  assert.equal(yogaOfSum(0).name, 'Vishkambha');
  assert.equal(yogaOfSum(360 / 27 * 26 + 1).name, 'Vaidhriti');
  assert.ok(Math.abs(yogaOfSum(360 / 27 * 3 + 360 / 27 / 4).spent - 0.25) < 1e-9);
  assert.equal(yogaOfSum(360).name, 'Vishkambha');

  console.log('pravesha tests passed');
}
void main();
