import assert from 'node:assert/strict';
import { amshaYears, ayurdayaOrder, calculateAyurdayaDasha, calculateAyurdayaSubDashas, pindaYears, PINDA_YEARS } from './ayurdaya';

const chart = (list: Record<string, number>, retrograde: string[] = []) =>
  Object.entries(list).map(([name, longitude]) => ({ name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, isRetrograde: retrograde.includes(name) }));
const at = (list: Record<string, number>, name: string, retrograde: string[] = []) => chart(list, retrograde).find(planet => planet.name === name)!;
const close = (actual: number, expected: number, message: string) => assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} against ${expected}`);
const sky = { Sun: 200, Moon: 31, Mars: 100, Mercury: 190, Jupiter: 5, Venus: 60, Saturn: 130, Rahu: 120, Ketu: 300 };

// --- The Piṇḍāyu (43.6–8): the whole at exaltation, a half at the debilitation point, in between in proportion ---------------------------------
assert.deepEqual(PINDA_YEARS, { Sun: 19, Moon: 25, Mars: 15, Mercury: 12, Jupiter: 15, Venus: 21, Saturn: 20 });
close(pindaYears(at({ ...sky, Moon: 33 }, 'Moon'), 1, null).years, 25, 'the Moon at its exaltation point, Taurus 3°, in the 2nd house');
close(pindaYears(at({ ...sky, Moon: 213 }, 'Moon'), 7, null).years, 12.5, 'the Moon at its debilitation point, Scorpio 3°, in the 2nd house of the Lagna Libra');
close(pindaYears(at({ ...sky, Moon: 123 }, 'Moon'), 1, null).years, 25 * (0.5 + 90 / 360), 'a quarter above the half, 90° from the debilitation point');

// --- The reductions (43.9–10) ---------------------------------------------------------------------------------------------------------------------
// Combust: half is lost, but not for Venus or Saturn. Lagna Libra, so that Libra is the 1st house and loses nothing by the house.
const combustSky = { ...sky, Mercury: 205, Venus: 205 };
const mercury = pindaYears(at(combustSky, 'Mercury'), 7, 200);
assert.ok(mercury.steps.some(step => step.startsWith('combust')));
close(mercury.years, pindaYears(at(combustSky, 'Mercury'), 7, null).years / 2, 'half of the years');
assert.ok(!pindaYears(at(combustSky, 'Venus'), 7, 200).steps.some(step => step.startsWith('combust')), 'Venus is not reduced for combustion');
// An enemy's sign: a third is lost; a retrograde graha is excepted (the Sanskrit of 43.9). Saturn in Leo, the Sun's sign, an enemy's.
const direct = pindaYears(at(sky, 'Saturn'), 1, null);
const retrograde = pindaYears(at(sky, 'Saturn', ['Saturn']), 1, null);
assert.ok(direct.steps.some(step => step.includes('enemy')));
assert.ok(!retrograde.steps.some(step => step.includes('enemy')));
close(retrograde.years * 2 / 3, direct.years, 'a third lost');
// By the house: Mars in the 12th (Pisces from the Lagna Aries) loses all, the Moon, a benefic, half of that.
assert.equal(pindaYears(at({ ...sky, Mars: 335 }, 'Mars'), 1, null).years, 0);
const moon = pindaYears(at({ ...sky, Moon: 335 }, 'Moon'), 1, null);
assert.ok(moon.steps.some(step => step.includes('12th house, a benefic')));
close(moon.years, 25 * (0.5 + 122 / 360) / 2, 'half of the years');
// Two reductions together lose half as much as one after the other (43.22): Mars combust (the Sun 10° off) and in Virgo, an enemy's sign.
const two = pindaYears(at({ ...sky, Mars: 160 }, 'Mars'), 1, 170);
assert.ok(two.steps.some(step => step.includes('two reductions')));
// 42° from the debilitation point: 15 × (½ + 42/360) = 9.25; the two together would lose 1 − ½ × ⅔ = ⅔, half of it is ⅓.
close(two.years, 9.25 * (2 / 3), 'half the loss');

// --- The Aṃśāyu (43.19–22): the navāṁśa number from Aries modulo 12; three times in the own or exaltation sign, twice in the own navāṁśa ---------
close(amshaYears(at({ ...sky, Venus: 190 }, 'Venus'), 7, null).years, 27, 'Venus at navāṁśa 57, remainder 9, three times in its own sign Libra');
close(amshaYears(at({ ...sky, Moon: 31 }, 'Moon'), 1, null).years, 31 / (360 / 108) * 3, 'the Moon in its exaltation sign Taurus: three times 9.3');
close(amshaYears(at({ ...sky, Jupiter: 5 }, 'Jupiter'), 1, null).years, 1.5, 'Jupiter at navāṁśa 1.5 in no place of its own');
// Mars at Aries 24° is in the navāṁśa of Scorpio (its own) and in its own sign Aries: three times, not six (43.22).
const mars = amshaYears(at({ ...sky, Mars: 24 }, 'Mars'), 1, null);
close(mars.years, (24 / (360 / 108)) % 12 * 3, 'in both places: three times');
// Jupiter at Aries 28° is in the last navāṁśa of Aries, Sagittarius, its own, but in no place of its own by sign: twice. (84 per cent of 10 is 8.4.)
const jupiter = amshaYears(at({ ...sky, Jupiter: 28 }, 'Jupiter'), 1, null);
assert.ok(jupiter.steps.some(step => step.includes('own navāṁśa')), 'a graha in its own navāṁśa: twice');
close(jupiter.years, 28 / (360 / 108) * 2, 'twice 8.4');

// --- The order (46.202) and the daśā --------------------------------------------------------------------------------------------------------------
// The Sun and the Moon in Aries with the Lagna Aries: the strongest of the three signs is Aries and the Sun and the Moon come first.
const together = chart({ Sun: 5, Moon: 8, Mars: 100, Mercury: 190, Jupiter: 65, Venus: 120, Saturn: 215, Rahu: 120, Ketu: 300 });
const order = ayurdayaOrder(together, 1);
assert.deepEqual([...order.slice(0, 2)].sort(), ['Moon', 'Sun'], 'the strongest of the three first');
assert.equal(new Set(order).size, 7, 'every graha once');
const dasha = calculateAyurdayaDasha('paindi', together, 1, new Date(2000, 0, 1))!;
assert.equal(dasha.entries[0].startDate.getTime(), new Date(2000, 0, 1).getTime());
for (let i = 1; i < dasha.entries.length; i++) assert.equal(dasha.entries[i - 1].endDate.getTime(), dasha.entries[i].startDate.getTime());
close(dasha.entries.reduce((sum, entry) => sum + entry.durationYears, 0), dasha.totalYears, 'one round');
const children = calculateAyurdayaSubDashas(dasha.entries[0], dasha.definitions);
assert.equal(children.length, dasha.definitions.length);
assert.equal(children[0].lord, dasha.entries[0].lord, 'begins with the lord of the daśā');
close(children.reduce((sum, child) => sum + child.durationYears, 0), dasha.entries[0].durationYears, 'the sub-periods fill the daśā');
assert.notEqual(calculateAyurdayaDasha('amshi', together, 1, new Date(2000, 0, 1)), null);
assert.equal(calculateAyurdayaDasha('paindi', together.filter(planet => planet.name !== 'Saturn'), 1, new Date(2000, 0, 1)), null, 'without a graha there is no daśā');
console.log('Ayurdaya tests passed');
