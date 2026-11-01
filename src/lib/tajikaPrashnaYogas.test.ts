import assert from 'node:assert/strict';
import { durupphaMarks, duttotthaDavira, kutthaMarks, moonVoid, padaOf, readPrashna, weakReasons, type PrashnaBody } from './tajikaPrashna';

const body = (name: string, sign: number, degree: number, speed?: number): PrashnaBody => ({ name, sign, degree, speed });
const chart = (moved: PrashnaBody[]): PrashnaBody[] => {
  const base: PrashnaBody[] = [body('Sun', 12, 3), body('Moon', 2, 20), body('Mars', 9, 5), body('Mercury', 11, 25), body('Jupiter', 6, 3), body('Venus', 3, 25), body('Saturn', 8, 20)];
  return base.map(item => moved.find(m => m.name === item.name) ?? item);
};

// The pada: Mars at 12° of Aries is in its own sign; the Sun at 5° of Aries is in its exaltation.
assert.ok(padaOf(body('Mars', 1, 12)).includes('own sign'));
assert.ok(padaOf(body('Sun', 1, 5)).includes('exaltation'));
// The Moon at 15° of Gemini holds no pada (the hadda of Venus, the Libra decanate, the Sagittarius navāṁśa) and is not in its fall: void.
assert.deepEqual(padaOf(body('Moon', 3, 15)), []);
assert.equal(moonVoid(body('Moon', 3, 15)), true);
assert.equal(moonVoid(body('Moon', 4, 15)), false);
assert.equal(moonVoid(body('Moon', 8, 15)), false);
// Weak: retrograde Mars, Venus in its fall.
assert.deepEqual(weakReasons(body('Mars', 1, 12, -0.2), undefined), ['retrograde']);
assert.ok(weakReasons(body('Venus', 6, 20), undefined).includes('in its fall'));

// 57-60, the example: the Leo lagna, the 4th Scorpio, the lords the Sun (Aries 8°) and Mars (Aquarius 12°) in Ithasāla; the Moon at 29°30' of Virgo, void; in Libra Saturn at 5°, in its exaltation.
const gairi = readPrashna(5, chart([body('Sun', 1, 8), body('Mars', 11, 12), body('Moon', 6, 29.5), body('Saturn', 7, 5)]), 4)!;
assert.equal(gairi.pair?.kind, 'ithasala');
assert.equal(gairi.gairikambula.length, 1);
assert.equal(gairi.gairikambula[0].graha, 'Saturn');
assert.equal(gairi.gairikambula[0].favourable, true);
assert.equal(gairi.gairikambula[0].distance, 5.5);
assert.equal(gairi.khallasara, false);
// 61: the same without a graha in Libra: the Moon is void and makes no Ithasāla: Khallāsara.
const khalla = readPrashna(5, chart([body('Sun', 1, 8), body('Mars', 11, 12), body('Moon', 6, 29.5)]), 4)!;
assert.equal(khalla.gairikambula.length, 0);
assert.equal(khalla.khallasara, true);
// No Ithasāla of the lords: neither.
const none = readPrashna(5, chart([body('Sun', 1, 8), body('Mars', 11, 28), body('Moon', 6, 29.5)]), 4)!;
assert.equal(none.khallasara, false);

// 62: Mars retrograde in Ithasāla with the Sun: Radda.
const radda = readPrashna(5, chart([body('Sun', 1, 8), body('Mars', 11, 12, -0.2), body('Moon', 6, 29.5)]), 4)!;
assert.equal(radda.radda.length, 1);
assert.equal(radda.radda[0].weak, 'Mars');
assert.deepEqual(radda.radda[0].reasons, ['retrograde']);
// 64, the example: the Aries lagna, the 4th Cancer: Mars at 12° of Aries (own sign) and the Moon at 10° of Aquarius (no pada) in Ithasāla.
const duphali = readPrashna(1, chart([body('Mars', 1, 12), body('Moon', 11, 10)]), 4)!;
assert.equal(duphali.duphaliKuttha?.slow, 'Mars');
assert.equal(duphali.duphaliKuttha?.fast, 'Moon');
assert.equal(duphali.duphaliKuttha?.accomplished, true);
// 65: Aries lagna, the 7th Libra: Mars retrograde and Venus in its fall (Virgo) are weak, and Jupiter in Cancer (exalted) has the Ithasāla with Mars.
const all = chart([body('Mars', 1, 12, -0.2), body('Venus', 6, 20), body('Jupiter', 4, 20)]);
const davira = duttotthaDavira(all[2], all[5], all, all[0]);
assert.ok(davira.some(item => item.kind === 'weak-lords'));
// 66: Aries lagna, the 7th Libra: Mars (own sign) at 29°30' of Aries is about to enter Taurus, where Mercury is; Venus at 10° of Capricorn has no Ithasāla with it.
const tambira = readPrashna(1, chart([body('Mars', 1, 29.5), body('Venus', 10, 10), body('Mercury', 2, 5), body('Moon', 12, 3)]), 7)!;
assert.deepEqual(tambira.tambira, [{ giver: 'Mars', receiver: 'Mercury' }]);
// 67-75: the marks. Mars in its own sign in the lagna is strong; Saturn in the 6th, retrograde with a malefic is weak.
const marks = chart([body('Mars', 1, 12), body('Saturn', 6, 10, -0.02), body('Sun', 6, 8)]);
assert.ok(kutthaMarks(1, marks[2], marks).includes('in the lagna'));
assert.ok(kutthaMarks(1, marks[2], marks).includes('holding a pada'));
const weak = durupphaMarks(1, marks[6], marks);
assert.ok(weak.includes('in the 6th, 8th or 12th'));
assert.ok(weak.includes('retrograde'));
assert.ok(weak.includes('with a malefic'));
// The reading names the two lords and the Moon.
assert.deepEqual(gairi.marks.map(item => item.name).sort(), ['Mars', 'Moon', 'Sun']);
