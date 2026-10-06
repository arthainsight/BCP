import assert from 'node:assert/strict';
import { DEFAULT_DASHA_SETTINGS, type PlanetData } from '@/types';
import { calculateDashaEventSnapshots, runningGrahaDashaLords, GRAHA_DASHA_SYSTEMS } from './dashaEvents';
import { runningVimshottariLords } from './vimshottari';

// runningGrahaDashaLords must agree with the Event List's own snapshots, which
// are the reference for every system, at many dates.
const planet = (name: string, longitude: number): PlanetData =>
  ({ name, longitude, sign: Math.floor(longitude / 30) + 1, degree: longitude % 30, house: 0 });
const planets = [
  planet('Sun', 118.4), planet('Moon', 93.7), planet('Mars', 70.2), planet('Mercury', 105.1),
  planet('Jupiter', 186.9), planet('Venus', 112.6), planet('Saturn', 98.3), planet('Rahu', 35.4), planet('Ketu', 215.4),
];
const ascendant = { longitude: 162.3, sign: 6, degree: 12.3 };
const birthDate = new Date(1947, 7, 15, 9, 15);
const lordOf = (value: string) => value.match(/\(([^)]+)\)$/)?.[1] ?? value;

for (let year = 1948; year <= 2040; year += 3) {
  const eventDate = new Date(year, 5, 15, 12);
  const snapshots = calculateDashaEventSnapshots({
    eventDate, birthDate, planets, ascendant,
    charaOptions: DEFAULT_DASHA_SETTINGS.charaOptions, rasiOptions: DEFAULT_DASHA_SETTINGS.rasiOptions,
  });
  for (const { key } of GRAHA_DASHA_SYSTEMS) {
    const levels = snapshots.find(s => s.key === key)?.levels ?? [];
    const md = levels.find(l => l.level === 'MD');
    const ad = levels.find(l => l.level === 'AD');
    const expected = md && ad ? { md: lordOf(md.value), ad: lordOf(ad.value) } : null;
    assert.deepEqual(runningGrahaDashaLords(key, { eventDate, birthDate, planets, ascendant }), expected, `${key} in ${year}`);
  }
  assert.deepEqual(
    runningGrahaDashaLords('vimshottari', { eventDate, birthDate, planets, ascendant }),
    runningVimshottariLords(93.7, birthDate, eventDate),
  );
}

assert.equal(runningGrahaDashaLords('yogini', { eventDate: new Date(1940, 0, 1), birthDate, planets, ascendant }), null, 'before birth');
