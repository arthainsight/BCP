import assert from 'node:assert/strict';
import { brahmaByText } from './brahmaGraha';

// The Brahma graha by Jaimini Sūtras 2.1.49–54 and BPHS 46.171–173. Charts are built from longitudes; the Lagna is Aries 10° (longitude 10), the 7th Libra.
const chart = (list: Record<string, number>) => Object.entries(list).map(([name, longitude]) => ({ name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30 }));
const brahma = (list: Record<string, number>) => brahmaByText(chart(list), 1, 10);
// Two grahas in Aries make it the stronger of Lagna and 7th, so "behind" is the arc from the 7th point to the Lagna point: longitudes 190° to 10°.
const base = { Sun: 5, Moon: 8, Mars: 40, Mercury: 50, Jupiter: 65, Venus: 100, Saturn: 130, Rahu: 235, Ketu: 55 };

// 2.1.49: Mercury, the lord of the 6th, in Libra 20°: an odd sign and behind the Lagna. Jupiter, the lord of the 12th, is in Gemini, odd but not behind.
// The Ātmakāraka is Mercury (20°); the lord of its 8th (Taurus) is Venus and the grahas in it are Mars and Ketu, which give the degrees to compare:
// Mercury 20°, Venus 10°, Mars 10°, and Ketu gives way to the 6th from it (Libra): Mercury and Venus. The most degrees: Mercury (2.1.51).
const mercury = brahma({ ...base, Mercury: 200 });
assert.equal(mercury.graha, 'Mercury');
assert.equal(mercury.sign, 7);
assert.ok(mercury.steps.some(step => step.includes('lord of the 6th, in an odd sign and behind (2.1.49)')));
assert.ok(mercury.steps.some(step => step.includes('Ketu gives way to the 6th from it (Libra)')), '2.1.50');

// The lord of the 12th, Jupiter, in Sagittarius 22°: odd and behind, and the most degrees of Jupiter, the Moon (8th lord from the Ātmakāraka) and Venus.
assert.equal(brahma({ ...base, Jupiter: 262 }).graha, 'Jupiter');

// No lord of the 6th, 8th or 12th qualifies: the lord of the 8th from the Ātmakāraka (2.1.53). The Ātmakāraka is Mercury in Taurus, its 8th Sagittarius.
const alone = brahma(base);
assert.equal(alone.graha, 'Jupiter');
assert.ok(alone.steps.some(step => step.includes('lord of the 8th from the Ātmakāraka (2.1.53)')));
assert.ok(!alone.steps.some(step => step.includes('(2.1.49)')));

// 2.1.50: the Ātmakāraka Venus in Cancer, its 8th Aquarius; Saturn, its lord, stands in Leo and gives way to the 6th from it (Capricorn), whose lord is Saturn itself.
const saturn = brahma({ ...base, Venus: 119 });
assert.equal(saturn.graha, 'Saturn');
assert.ok(saturn.steps.some(step => step.includes('Saturn gives way to the 6th from it (Capricorn)')));
// With Saturn in Aquarius (the 8th from the Ātmakāraka itself) Rāhu is the lord of the sign and both give way to the 6th from them.
const nodes = brahma({ ...base, Venus: 119, Saturn: 310 });
assert.equal(nodes.graha, 'Venus', 'Venus has the most degrees of Sun, Moon, Mars and Venus (the 6th from Rāhu and from Saturn)');

// Where the Lagna is the weaker, "behind" is the arc from the Lagna point to the 7th point: Libra holds two grahas, so the 7th is the stronger.
const seventh = brahmaByText(chart({ Sun: 190, Moon: 195, Mars: 40, Mercury: 100, Jupiter: 65, Venus: 130, Saturn: 130, Rahu: 235, Ketu: 55 }), 1, 10);
assert.ok(seventh.steps[0].includes('Libra (the 7th)') && seventh.steps[0].includes('from the Lagna point to the 7th point'));
console.log('Brahma graha tests passed');
