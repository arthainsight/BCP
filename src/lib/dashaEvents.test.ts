import assert from 'node:assert/strict';
import { DEFAULT_DASHA_SETTINGS, type PlanetData } from '@/types';
import { calculateDashaEventSnapshots } from './dashaEvents';

const planets: PlanetData[] = [
  { name: 'Sun', sign: 6, house: 3, degree: 20, longitude: 170 },
  { name: 'Moon', sign: 3, house: 12, degree: 6, longitude: 66 },
  { name: 'Mars', sign: 6, house: 3, degree: 10, longitude: 160 },
  { name: 'Mercury', sign: 7, house: 4, degree: 20, longitude: 200 },
  { name: 'Jupiter', sign: 1, house: 10, degree: 3, longitude: 3 },
  { name: 'Venus', sign: 7, house: 4, degree: 10, longitude: 190 },
  { name: 'Saturn', sign: 8, house: 5, degree: 24, longitude: 234 },
  { name: 'Rahu', sign: 12, house: 9, degree: 8, longitude: 338 },
  { name: 'Ketu', sign: 6, house: 3, degree: 8, longitude: 158 },
];

const snapshots = calculateDashaEventSnapshots({
  birthDate: new Date(2000, 0, 1, 10),
  eventDate: new Date(2001, 0, 1, 12),
  planets,
  ascendant: { longitude: 90, sign: 4, degree: 0 },
  charaOptions: DEFAULT_DASHA_SETTINGS.charaOptions,
  rasiOptions: DEFAULT_DASHA_SETTINGS.rasiOptions,
});

assert.deepEqual(snapshots.map((snapshot) => snapshot.key), ['vimshottari', 'vimshottariVariant', 'vds', 'chara', 'yogini', 'ashtottari', 'kalaChakra', 'narayana', 'moola', 'sthira']);
assert.equal(snapshots[0].levels.length, 3);
assert.equal(snapshots[1].levels.length, 3);
assert.equal(snapshots[3].levels.length, 3);
assert.equal(snapshots[4].levels.length, 3);
assert.equal(snapshots[6].levels.length, 2);
assert.ok(snapshots.slice(7).every((snapshot) => snapshot.levels.length === 3));
assert.ok(snapshots.filter(snapshot => snapshot.levels.length).every(snapshot => snapshot.mdRange && snapshot.mdRange.startDate < snapshot.mdRange.endDate));
assert.ok(snapshots.filter(snapshot => snapshot.mdRange).every(snapshot => snapshot.mdRange!.startDate <= new Date(2001, 0, 1, 12) && snapshot.mdRange!.endDate > new Date(2001, 0, 1, 12)));

// The variant Vimsottari starts from the Utpanna, Kshema or Adhana nakshatra of the Moon. The Moon at 66° is in
// Mrigashira (Mars); the 4th, 5th and 8th from it are Pushya (Saturn), Ashlesha (Mercury) and Uttara Phalguni (Sun).
const startLord = (variantChoice: 'auto' | 'utpanna' | 'kshema' | 'adhana') => calculateDashaEventSnapshots({
  birthDate: new Date(2000, 0, 1, 10), eventDate: new Date(2000, 0, 2, 12), planets, ascendant: { longitude: 90, sign: 4, degree: 0 },
  charaOptions: DEFAULT_DASHA_SETTINGS.charaOptions, rasiOptions: DEFAULT_DASHA_SETTINGS.rasiOptions, variantChoice,
});
const variantOf = (list: ReturnType<typeof startLord>) => list.find(snapshot => snapshot.key === 'vimshottariVariant')!;
assert.equal(variantOf(startLord('auto')).levels.length, 3);
assert.equal(startLord('auto')[0].levels[0].value, 'Mars');
assert.equal(variantOf(startLord('utpanna')).levels[0].value, 'Mercury');
assert.equal(variantOf(startLord('kshema')).levels[0].value, 'Saturn');
assert.equal(variantOf(startLord('adhana')).levels[0].value, 'Sun');
assert.match(variantOf(startLord('utpanna')).label, /Utpanna/);
// Auto follows the house of the Moon: here Gemini with the Lagna in Cancer is the 12th house, which gives Adhana.
assert.equal(variantOf(startLord('auto')).label, 'Vimsottari Adhana');
assert.equal(variantOf(startLord('auto')).levels[0].value, 'Sun');

// With the Moon in a house that calls for none of the three the daśā is not used: here Gemini with the Lagna in Gemini is the 1st house.
const noRule = (variantChoice?: 'kshema') => calculateDashaEventSnapshots({
  birthDate: new Date(2000, 0, 1, 10), eventDate: new Date(2000, 0, 2, 12), planets, ascendant: { longitude: 70, sign: 3, degree: 10 },
  charaOptions: DEFAULT_DASHA_SETTINGS.charaOptions, rasiOptions: DEFAULT_DASHA_SETTINGS.rasiOptions, variantChoice,
}).find(snapshot => snapshot.key === 'vimshottariVariant')!;
assert.equal(noRule().levels.length, 0);
assert.match(noRule().note ?? '', /^Conditional: not applicable \(Moon in 1H/);
// …unless one is fixed by hand.
assert.equal(noRule('kshema').levels[0].value, 'Saturn');

const beforeBirth = calculateDashaEventSnapshots({
  birthDate: new Date(2000, 0, 1),
  eventDate: new Date(1999, 0, 1),
  planets,
  ascendant: { longitude: 90, sign: 4, degree: 0 },
  charaOptions: DEFAULT_DASHA_SETTINGS.charaOptions,
  rasiOptions: DEFAULT_DASHA_SETTINGS.rasiOptions,
});
assert.ok(beforeBirth.every((snapshot) => snapshot.levels.length === 0 && snapshot.note === 'Date is before birth'));

console.log('Dasha Event List tests passed');
