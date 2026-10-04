import assert from 'node:assert/strict';
import { calculateChart } from './ephemeris';
import { jdFromLocal, localPartsFromJd, solarReturnJd } from './lunisolar';
import { MUDDA_CYCLE, muddaFirstLord } from './annualDasha';
import { haddaLord, munthaSign, panchaVargiyaBala, tajikaAspect, yearLord } from './varshaphala';

const close = (a: number, b: number, tolerance: number, label: string) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${label}: expected ${b}, got ${a}`);

// --- Muntha -------------------------------------------------------------------
assert.equal(munthaSign(1, 0), 1, 'Muntha starts in the natal lagna');
assert.equal(munthaSign(1, 1), 2, 'and moves a sign a year');
assert.equal(munthaSign(11, 3), 2, 'wrapping past Pisces');
assert.equal(munthaSign(5, 33), 2, 'PVR Example 120: Leo lagna, 33 years → Taurus');

// --- Tājika aspects -----------------------------------------------------------
assert.equal(tajikaAspect(1, 1), 'conjunction');
assert.equal(tajikaAspect(1, 3), 'sextile');
assert.equal(tajikaAspect(1, 11), 'sextile');
assert.equal(tajikaAspect(1, 4), 'square');
assert.equal(tajikaAspect(1, 10), 'square');
assert.equal(tajikaAspect(1, 5), 'trine');
assert.equal(tajikaAspect(1, 9), 'trine');
assert.equal(tajikaAspect(1, 7), 'opposition');
for (const none of [2, 6, 8, 12]) assert.equal(tajikaAspect(1, none), null, `house ${none} forms no aspect`);
for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) {
  assert.equal(tajikaAspect(a, b) === null, tajikaAspect(b, a) === null, 'aspects are mutual');
}

// --- Hadda (Egyptian terms) ---------------------------------------------------
assert.equal(haddaLord(0), 'Jupiter', 'Aries opens with Jupiter');
assert.equal(haddaLord(6), 'Venus', 'and passes to Venus at 6°');
assert.equal(haddaLord(29.99), 'Saturn', 'Aries closes with Saturn');
assert.equal(haddaLord(30), 'Venus', 'Taurus opens with Venus');
assert.equal(haddaLord(359.9), 'Saturn', 'Pisces closes with Saturn');

// --- Pañcavargīya Bala ----------------------------------------------------------
// PVR's worked answer for Chart 66 Kṣetra Bala: Sun in Aq 7.5, Moon in Pi 15,
// Mars in Ar 30, Mercury in Aq 15, Jupiter in Pi 30, Venus in Cp 22.5, Saturn in Ar 0.
const at = (sign: number, degree = 15) => (sign - 1) * 30 + degree;
assert.equal(panchaVargiyaBala('Sun', at(11)).kshetra, 7.5, 'Sun in an enemy sign');
assert.equal(panchaVargiyaBala('Moon', at(12)).kshetra, 15, 'Moon in a neutral sign');
assert.equal(panchaVargiyaBala('Mars', at(1)).kshetra, 30, 'Mars in its own sign');
assert.equal(panchaVargiyaBala('Mercury', at(11)).kshetra, 15, 'Mercury in a neutral sign');
assert.equal(panchaVargiyaBala('Jupiter', at(12)).kshetra, 30, 'Jupiter in its own sign');
assert.equal(panchaVargiyaBala('Venus', at(10)).kshetra, 22.5, 'Venus in a friend’s sign');
assert.equal(panchaVargiyaBala('Saturn', at(1)).kshetra, 0, 'Saturn debilitated');

// Uccha Bala, PVR's example: Jupiter at 8°30′ Virgo → 12.94.
close(panchaVargiyaBala('Jupiter', 150 + 8.5).uchcha, 12.94, 0.005, 'Jupiter at 8°30′ Virgo');
close(panchaVargiyaBala('Sun', 10).uchcha, 20, 1e-9, 'deep exaltation');
close(panchaVargiyaBala('Sun', 190).uchcha, 0, 1e-9, 'deep debilitation');

for (let lon = 0; lon < 360; lon += 7.3) {
  const b = panchaVargiyaBala('Mercury', lon);
  assert.ok(b.total >= 0 && b.total <= 20, `total stays within 0–20 at ${lon}`);
}

async function main() {
  // --- PVR Example 118 / 120 (Chart 66) -----------------------------------------
  // Born 8 March 1967 17:40 IST at 26°18′N 73°04′E. The 34th year begins on
  // 8 March 2000 at 04:41 IST, and its lord is Mars.
  const lat = 26 + 18 / 60;
  const lng = 73 + 4 / 60;
  const birthJd = await jdFromLocal(1967, 3, 8, 17, 40, 0, 5.5);
  const sr = await solarReturnJd(birthJd, 2000);
  const local = localPartsFromJd(sr, 5.5);
  assert.deepEqual([local.year, local.month, local.day, local.hour], [2000, 3, 8, 4], 'Varṣa Praveśa date and hour');
  assert.ok(Math.abs(local.minute - 41) <= 3, `within a few minutes of 04:41, got 04:${local.minute}`);

  const natal = await calculateChart(1967, 3, 8, 17, 40, 0, lat, lng, 5.5);
  const annual = await calculateChart(local.year, local.month, local.day, local.hour, local.minute, local.second, lat, lng, 5.5);
  assert.equal(natal.ascendant.sign, 5, 'Leo lagna at birth');
  const hours = local.hour + local.minute / 60;
  const dayYear = hours >= annual.debug!.sunriseLocalHours! && hours < annual.debug!.sunsetLocalHours!;
  assert.equal(dayYear, false, 'a pre-dawn year is a night year');
  const lord = yearLord(annual, natal.ascendant.sign, 33, dayYear);
  assert.equal(lord.yearLord, 'Mars', 'PVR Example 120: Mars is lord of the year');
  assert.ok(lord.officeBearers.length >= 1 && lord.officeBearers.length <= 5, 'one to five office bearers');
  assert.equal(lord.officeBearers.find((o) => o.roles.includes('Muntheśa'))?.planet, 'Venus', 'Muntha in Taurus → Venus');
  assert.equal(lord.officeBearers.find((o) => o.roles.includes('Janma lagneśa'))?.planet, 'Sun', 'Leo lagna → Sun');

  // The Sun is back at its natal sidereal longitude.
  const natalSun = natal.planets.find((p) => p.name === 'Sun')!.longitude;
  const annualSun = annual.planets.find((p) => p.name === 'Sun')!.longitude;
  close(annualSun, natalSun, 0.001, 'solar return longitude');

  // --- PVR Example 122 / Chart 67: Mudda daśā entry ---------------------------
  // Born 1 June 1972 04:16 IST at 16°15′N 81°12′E; the 22nd year (21 completed)
  // opens in Rahu's Mudda period.
  const chart67 = await calculateChart(1972, 6, 1, 4, 16, 0, 16.25, 81.2, 5.5);
  const moon = chart67.planets.find((p) => p.name === 'Moon')!;
  const nakshatra = Math.floor(moon.longitude / (360 / 27)) + 1;
  assert.equal(MUDDA_CYCLE[muddaFirstLord(nakshatra, 21)].name, 'Rahu', 'Example 122 opens in Rahu');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
