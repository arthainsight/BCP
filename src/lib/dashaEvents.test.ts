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
});

assert.deepEqual(snapshots.map((snapshot) => snapshot.key), ['vimshottari', 'vds', 'chara', 'kalaChakra']);
assert.equal(snapshots[0].levels.length, 3);
assert.equal(snapshots[2].levels.length, 3);
assert.equal(snapshots[3].levels.length, 2);

const beforeBirth = calculateDashaEventSnapshots({
  birthDate: new Date(2000, 0, 1),
  eventDate: new Date(1999, 0, 1),
  planets,
  ascendant: { longitude: 90, sign: 4, degree: 0 },
  charaOptions: DEFAULT_DASHA_SETTINGS.charaOptions,
});
assert.ok(beforeBirth.every((snapshot) => snapshot.levels.length === 0 && snapshot.note === 'Date is before birth'));

console.log('Dasha Event List tests passed');
