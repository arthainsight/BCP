import assert from 'node:assert/strict';
import { SE_MOON, SE_SUN, sweCalcUt, sweGetAyanamsa } from './ephemerisAdapter';
import { normalizeDegrees } from './angles';
import {
  calculateTithiPravesa,
  jdFromLocal,
  localPartsFromJd,
  newMoonBefore,
  tithiPravesaYearAt,
  vedicDayAt,
} from './tithiPravesha';

async function elongation(jd: number) {
  const sun = await sweCalcUt(jd, SE_SUN);
  const moon = await sweCalcUt(jd, SE_MOON);
  return normalizeDegrees(moon.longitude - sun.longitude);
}

async function siderealSunSign(jd: number) {
  const { longitude } = await sweCalcUt(jd, SE_SUN);
  return Math.floor(normalizeDegrees(longitude - (await sweGetAyanamsa(jd, 'lahiri'))) / 30);
}

async function main() {
  // --- New moon: the total solar eclipse of 8 April 2024 ------------------
  // Published conjunction 18:21 UT. The finder must land on it to the minute.
  const eclipse = await newMoonBefore(await jdFromLocal(2024, 4, 9, 0, 0, 0, 0));
  const e = localPartsFromJd(eclipse, 0);
  assert.deepEqual([e.year, e.month, e.day, e.hour], [2024, 4, 8, 18], 'new moon on the eclipse date');
  assert.ok(Math.abs(e.minute - 21) <= 1, `new moon at 18:21 UT, got 18:${e.minute}`);
  assert.ok(eclipse <= await jdFromLocal(2024, 4, 9, 0, 0, 0, 0), 'new moon lies before the search instant');

  // --- Tithi Praveśa repeats the natal Sun–Moon distance -----------------
  // Helsinki, 15 March 1985 10:30 EET.
  const birthJd = await jdFromLocal(1985, 3, 15, 10, 30, 0, 2);
  const natal = await elongation(birthJd);
  let previous: number | null = null;
  for (let year = 2018; year <= 2030; year++) {
    const tp = await calculateTithiPravesa({ birthJd, year });
    assert.ok(Math.abs(normalizeDegrees(tp.elongation - natal + 180) - 180) < 1e-5, `${year}: elongation repeats`);
    assert.ok(Math.abs(normalizeDegrees((await elongation(tp.jd)) - natal + 180) - 180) < 1e-5, `${year}: checked independently`);

    // It falls inside the lunar month that opens with the Sun in the birth month's sign.
    assert.ok(tp.monthStartJd !== undefined && tp.jd > tp.monthStartJd && tp.jd < tp.monthStartJd + 29.9, `${year}: inside its lunar month`);
    assert.equal(((await siderealSunSign(tp.monthStartJd)) + 1) % 12, tp.masaIndex, `${year}: month carries the birth month's name`);

    // Lunar years are twelve or thirteen synodic months long.
    if (previous !== null) {
      const length = tp.jd - previous;
      const months = Math.round(length / 29.530588853);
      assert.ok(months === 12 || months === 13, `${year}: year is 12 or 13 lunations, got ${length.toFixed(1)} days`);
    }
    previous = tp.jd;

    // The near-solar-return variant stays within half a lunation of the Sun's return.
    const sr = await calculateTithiPravesa({ birthJd, year, method: 'solar-return' });
    assert.ok(Math.abs(sr.jd - tp.jd) < 0.01 || Math.abs(Math.abs(sr.jd - tp.jd) - 29.53) < 1.5, `${year}: methods agree or differ by one lunation`);
    const sunAtBirth = (await sweCalcUt(birthJd, SE_SUN)).longitude;
    const sunAtReturn = (await sweCalcUt(sr.jd, SE_SUN)).longitude;
    assert.ok(Math.abs(normalizeDegrees(sunAtReturn - sunAtBirth + 180) - 180) < 16, `${year}: near the solar return`);
  }

  // --- Adhika māsa: 2023 had an intercalary Śrāvaṇa ----------------------
  // A Śrāvaṇa birth celebrates in the nija month (16 Aug – 15 Sep 2023), not
  // in the adhika month that preceded it (18 Jul – 16 Aug).
  const shravanaBirth = await jdFromLocal(2010, 8, 20, 12, 0, 0, 5.5);
  const shravana = await calculateTithiPravesa({ birthJd: shravanaBirth, year: 2023 });
  assert.equal(shravana.masaIndex, 4, 'born in Śrāvaṇa');
  assert.equal(shravana.birthInAdhikaMasa, false);
  assert.ok(shravana.jd > await jdFromLocal(2023, 8, 16, 0, 0, 0, 5.5), 'Tithi Praveśa falls after the adhika month');
  assert.ok(shravana.jd < await jdFromLocal(2023, 9, 16, 0, 0, 0, 5.5), 'and inside nija Śrāvaṇa');

  // --- The year in force at a date --------------------------------------
  const target = await jdFromLocal(2026, 10, 4, 12, 0, 0, 3);
  const { current, next } = await tithiPravesaYearAt({ birthJd, targetJd: target });
  assert.ok(current.jd <= target && next.jd > target, 'the year in force brackets the target');
  assert.equal(next.year, current.year + 1);

  // A birthday at New Year must still bracket correctly when the Tithi
  // Praveśa slips into the neighbouring Gregorian year.
  const newYearBirth = await jdFromLocal(1990, 1, 1, 6, 0, 0, 0);
  for (const [y, m, d] of [[2025, 12, 31], [2026, 1, 1], [2026, 1, 25], [2025, 12, 5]]) {
    const t = await jdFromLocal(y, m, d, 12, 0, 0, 0);
    const span = await tithiPravesaYearAt({ birthJd: newYearBirth, targetJd: t });
    assert.ok(span.current.jd <= t && span.next.jd > t, `New Year birth brackets ${y}-${m}-${d}`);
  }

  // --- PyJHora / JHora reference ------------------------------------------
  // PyJHora's tithi_pravesha_tests: born 7 Dec 1996 10:34 IST in Chennai.
  // Expected 27 Nov 2024 ≈ 11:22 and 9 Dec 2023 ≈ 13:38 IST. PyJHora
  // interpolates the tithi linearly while this solves the elongation exactly,
  // so a couple of minutes' difference is expected.
  const chennaiBirth = await jdFromLocal(1996, 12, 7, 10, 34, 0, 5.5);
  for (const [year, month, day, minutes] of [[2024, 11, 27, 11 * 60 + 22], [2023, 12, 9, 13 * 60 + 38]]) {
    const tp = await calculateTithiPravesa({ birthJd: chennaiBirth, year });
    const p = localPartsFromJd(tp.jd, 5.5);
    assert.deepEqual([p.year, p.month, p.day], [year, month, day], `${year}: same date as PyJHora`);
    const delta = Math.abs(p.hour * 60 + p.minute - minutes);
    assert.ok(delta <= 3, `${year}: within three minutes of PyJHora, off by ${delta}`);
  }

  // --- Vāra and horā -----------------------------------------------------
  // Monday 8 April 2024 in Delhi. Sunrise is about 06:03 IST.
  const delhi = { lat: 28.6139, lng: 77.209 };
  const beforeSunrise = await vedicDayAt(await jdFromLocal(2024, 4, 8, 4, 0, 0, 5.5), delhi.lat, delhi.lng, 5.5);
  assert.equal(beforeSunrise.vara, 'Sunday', 'before sunrise the previous day still runs');
  const afterSunrise = await vedicDayAt(await jdFromLocal(2024, 4, 8, 6, 30, 0, 5.5), delhi.lat, delhi.lng, 5.5);
  assert.equal(afterSunrise.vara, 'Monday');
  assert.equal(afterSunrise.horaLord, 'Moon', 'the first horā belongs to the lord of the day');
  const secondHora = await vedicDayAt(await jdFromLocal(2024, 4, 8, 7, 40, 0, 5.5), delhi.lat, delhi.lng, 5.5);
  assert.equal(secondHora.horaLord, 'Saturn', 'then Saturn, in descending orbital order');

  // Local parts round to the second without ever printing 60.
  const parts = localPartsFromJd(await jdFromLocal(2024, 1, 1, 0, 0, 59.9999, 0), 0);
  assert.deepEqual([parts.minute, parts.second], [1, 0]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
