import assert from 'node:assert/strict';
import type { PlanetData } from '@/types';
import { annotatePlanets, favourableCount, markIcons, marksOf, weakeningCount } from './planetMarks';
import { boundText, markLines, markTexts } from './planetMarksText';

const planet = (name: string, longitude: number, isRetrograde = false): PlanetData => ({
  name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, house: 1, isRetrograde,
});
const t = (text: string) => text;

// --- A chart with the Sun at 28°21' of Cancer (in the Gandanta) and grahas near it -----------------------------------------------------
const sun = planet('Sun', 118.35); // 1.65° (1°39') before the end of Ashlesha
const mercury = planet('Mercury', 130, false); // 11.65° from the Sun: combust when direct (orb 14°)
const venus = planet('Venus', 126.5, true); // 8.15° from the Sun: not combust when retrograde (orb 8°), would be when direct (orb 10°)
const moon = planet('Moon', 20.2); // 20°12' of Aries: nowhere near the Sun
const uranus = planet('Uranus', 119);
const planets = [sun, moon, mercury, venus, uranus];

const rasi = annotatePlanets(planets, 1);
const byName = (list: PlanetData[], name: string) => list.find(item => item.name === name)!;
assert.ok(byName(rasi, 'Sun').marks!.sensitive.gandanta, 'the Sun is in the last pada of Ashlesha');
assert.equal(byName(rasi, 'Sun').marks!.combust, null, 'the Sun is never combust');
assert.ok(byName(rasi, 'Mercury').marks!.combust, '11.65° from the Sun');
assert.equal(byName(rasi, 'Mercury').marks!.combust!.orb, 14);
assert.equal(byName(rasi, 'Venus').marks!.combust, null, 'retrograde Venus has the orb of 8°');
assert.equal(annotatePlanets([sun, planet('Venus', 126.5, false)], 1)[1].marks!.combust!.orb, 10);
assert.equal(byName(rasi, 'Uranus').marks, undefined, 'the outer planets are not marked');
// The Moon at 20°12' of Aries: the Mṛtyu Bhāga of the Moon is 26°, so no; the Puṣkara Bhāga (the 21st degree) is 20°–21°.
assert.ok(byName(rasi, 'Moon').marks!.sensitive.pushkaraBhaga);
assert.equal(byName(rasi, 'Moon').marks!.sensitive.mrityu, null);
// The planets that are given are not changed.
assert.equal(sun.marks, undefined);

// In a varga only the sensitive degrees are tested, at the longitudes of that chart, and nothing is combust.
const navamsa = annotatePlanets([planet('Sun', 5), planet('Mercury', 6)], 9);
assert.equal(navamsa[1].marks!.combust, null, 'combustion is a thing of the rāśi chart');
assert.ok(navamsa[0].marks!.sensitive.sandhi === null);
const edge = annotatePlanets([planet('Sun', 0.4)], 9);
assert.ok(edge[0].marks!.sensitive.sandhi, 'within 1° of the start of a navāṁśa sign');
// The nakṣatra offset moves the Gandanta in the rāśi chart only.
assert.equal(annotatePlanets([planet('Sun', 105)], 1, 13 + 20 / 60)[0].marks!.sensitive.gandanta!.nakshatra, 'Ashlesha');
assert.equal(annotatePlanets([planet('Sun', 105)], 9, 13 + 20 / 60)[0].marks!.sensitive.gandanta, null);

// --- The counts and the icons ----------------------------------------------------------------------------------------------------
const nothing = marksOf('Sun', 15);
assert.equal(weakeningCount(nothing), 0);
assert.equal(favourableCount(nothing), 0);
assert.equal(markIcons(nothing), '');
assert.equal(markIcons(null), '');
assert.equal(markIcons(byName(rasi, 'Sun').marks), '⚠');
assert.equal(markIcons(byName(rasi, 'Moon').marks), '✦');
assert.equal(markIcons(byName(rasi, 'Mercury').marks), '☼');
// All three together, in the order ⚠ ✦ ☼: Mṛtyu Bhāga of the Sun at 20°12' of Aries (the 20th degree, ⅓° orb: 20°12' is 0.2° off), the same degrees give
// the Puṣkara Bhāga (20°–21°) and the Puṣkara Navāṁśa (20°–23°20'); Mercury close by makes it combust.
const all = annotatePlanets([planet('Sun', 20.2), planet('Mercury', 25)], 1);
assert.equal(markIcons(all[0].marks), '⚠ ✦');
assert.equal(markIcons(all[1].marks), '☼', 'Mercury at 25° of Aries: only combust');
assert.equal(markIcons({ ...all[0].marks!, combust: { orb: 14, distance: 3, retrograde: false } }), '⚠ ✦ ☼');

// --- The words --------------------------------------------------------------------------------------------------------------------
assert.equal(boundText(20 + 10 / 3), "23°20'", 'a hair under 23°20\' is still 23°20\'');
assert.equal(boundText(10), '10°');
const texts = markTexts(byName(rasi, 'Sun').marks, t, 'en');
assert.equal(texts.gandanta, "Ashlesha → Magha, 1°39' from the junction");
const moonTexts = markTexts(byName(rasi, 'Moon').marks, t, 'en');
assert.equal(moonTexts.pushkaraBhaga, '21st degree');
assert.equal(moonTexts.pushkaraNavamsa, "7th navamsa (20°–23°20'), Libra");
assert.equal(markTexts(byName(rasi, 'Mercury').marks, t, 'en').combust, "11°39' from the Sun (orb 14°)");
assert.equal(markTexts(byName(rasi, 'Mercury').marks, t, 'fi').pushkaraBhaga, undefined);
assert.deepEqual(markLines(nothing, t, 'en'), []);
assert.deepEqual(markLines(byName(rasi, 'Sun').marks, t, 'en'), ["⚠ Gandanta: Ashlesha → Magha, 1°39' from the junction"]);
assert.deepEqual(markLines(byName(rasi, 'Mercury').marks, t, 'en'), ["☼ Combust: 11°39' from the Sun (orb 14°)"]);
// A retrograde graha says so.
assert.equal(markTexts(marksOf('Mercury', 130, { sunLongitude: 120, retrograde: true }), t, 'en').combust, "10°0' from the Sun (orb 12°, retrograde)");
// Finnish writes ordinals with a full stop.
assert.equal(markTexts(byName(rasi, 'Moon').marks, t, 'fi').pushkaraBhaga, '21. degree');

console.log('Planet marks tests passed');
