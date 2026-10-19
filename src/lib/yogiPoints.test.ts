import assert from 'node:assert/strict';
import { calculateYogi, yogiRoles } from './yogiPoints';

// Sun 0° Aries and Moon 1° Aries: the Yogi point is 94°20' = 4°20' Cancer. Nakṣatras are 13°20' wide, so 93°20' is the end of Punarvasu
// and the point is 1° into Pushya (the 8th, from Aśvinī), pada 1.
const a = calculateYogi(0, 1);
assert.ok(Math.abs(a.yogi.longitude - (94 + 20 / 60)) < 1e-9);
assert.equal(a.yogi.sign, 4, 'Cancer');
assert.equal(a.yogi.nakshatra, 'Pushya');
assert.equal(a.yogi.pada, 1);
assert.equal(a.yogi.nakshatraLord, 'Saturn', 'Pushya is Saturn\'s');
assert.equal(a.sahayogi, 'Moon', 'the lord of Cancer');
// The Avayogi point: 94°20' + 186°40' = 281°, 11° Capricorn, 1° into Shravana (280°–293°20', the 22nd), pada 1.
assert.ok(Math.abs(a.avayogi.longitude - 281) < 1e-9);
assert.equal(a.avayogi.sign, 10);
assert.equal(a.avayogi.nakshatra, 'Shravana');
assert.equal(a.avayogi.pada, 1);
assert.equal(a.avayogi.nakshatraLord, 'Moon');

// A sum that goes round: Sun 200°, Moon 101°, 301° + 93°20' = 34°20' (Taurus 4°20').
const b = calculateYogi(200, 101);
assert.ok(Math.abs(b.yogi.longitude - (34 + 20 / 60)) < 1e-9);
assert.equal(b.yogi.sign, 2);
assert.equal(b.yogi.nakshatra, 'Krittika', '26°40\'–40° is the 3rd nakṣatra');
assert.equal(b.yogi.pada, 3, '33°20\'–36°40\'');
assert.equal(b.yogi.nakshatraLord, 'Sun');
assert.equal(b.sahayogi, 'Venus');
// The Avayogi point: 34°20' + 186°40' = 221° (Scorpio 11°), Anuradha 213°20'–226°40', pada 3; Saturn's.
assert.equal(b.avayogi.sign, 8);
assert.equal(b.avayogi.nakshatra, 'Anuradha');
assert.equal(b.avayogi.pada, 3);
assert.equal(b.avayogi.nakshatraLord, 'Saturn');

// The nakṣatra offset moves the nakṣatra and its lord but not the sign or the Sahayogi.
const c = calculateYogi(0, 1, 13 + 20 / 60);
assert.equal(c.yogi.sign, 4);
assert.equal(c.sahayogi, 'Moon');
assert.equal(c.yogi.nakshatra, 'Ashlesha', '94°20\' + 13°20\' = 107°40\', in Ashlesha (106°40\'–120°)');
assert.equal(c.yogi.nakshatraLord, 'Mercury');

// The roles of the grahas: Sun 0° and Moon 1° give Saturn the Yogi (Pushya), the Moon the Sahayogi (Cancer) and, as the lord of Shravana, the Avayogi too.
const roles = yogiRoles(0, 1);
assert.deepEqual(roles, { Saturn: ['Yogi'], Moon: ['Sahayogi', 'Avayogi'] }, 'a graha can hold two roles: the Moon is the Sahayogi, and the lord of Shravana');
assert.deepEqual(yogiRoles(200, 101), { Sun: ['Yogi'], Venus: ['Sahayogi'], Saturn: ['Avayogi'] });

console.log('Yogi tests passed');
