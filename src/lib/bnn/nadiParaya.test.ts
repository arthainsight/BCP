import assert from 'node:assert/strict';
import { DEFAULT_PARAYA_OPTIONS, buildParayaTimeline, calculateNadiParaya, findParayaAgesForPosition, parayaDurations } from './nadiParaya';

const atBirth = calculateNadiParaya({
  ageYears: 0,
  natalJupiterSignIndex: 0,
  natalSaturnSignIndex: 7,
  natalRahuSignIndex: 11,
});
assert.equal(atBirth.jupiter.signIndex, 0);
assert.equal(atBirth.jupiter.degree, 0);
assert.equal(atBirth.saturn.signIndex, 7);
assert.equal(atBirth.saturn.endAge, 3);
assert.equal(atBirth.rahu.signIndex, 11);
assert.equal(atBirth.rahu.endAge, 2);
assert.ok(atBirth.rahu.degree > 29.99 && atBirth.rahu.degree < 30);
assert.equal(atBirth.ketu.signIndex, 5);

const boundaries = calculateNadiParaya({
  ageYears: 3,
  natalJupiterSignIndex: 0,
  natalSaturnSignIndex: 7,
  natalRahuSignIndex: 11,
});
assert.equal(boundaries.saturn.signIndex, 8);
assert.equal(boundaries.saturn.startAge, 3);
assert.equal(boundaries.saturn.endAge, 5);
assert.equal(boundaries.rahu.signIndex, 9);
assert.equal(boundaries.rahu.startAge, 3);
assert.equal(boundaries.rahu.endAge, 5);

const retrograde = calculateNadiParaya({
  ageYears: 0,
  natalJupiterSignIndex: 0,
  natalSaturnSignIndex: 7,
  natalRahuSignIndex: 11,
  jupiterRetrograde: true,
  saturnRetrograde: true,
});
assert.equal(retrograde.jupiter.signIndex, 11);
assert.equal(retrograde.saturn.signIndex, 6);
assert.equal(retrograde.rahu.signIndex, 11);

const midPeriods = calculateNadiParaya({
  ageYears: 1,
  natalJupiterSignIndex: 0,
  natalSaturnSignIndex: 7,
  natalRahuSignIndex: 11,
});
assert.equal(midPeriods.saturn.degree, 10);
assert.equal(midPeriods.rahu.degree, 15);

const midJupiter = calculateNadiParaya({
  ageYears: 0.5,
  natalJupiterSignIndex: 0,
  natalSaturnSignIndex: 7,
  natalRahuSignIndex: 11,
});
assert.equal(midJupiter.jupiter.degree, 15);

const saturnCycle = buildParayaTimeline({ body: 'Saturn', natalSignIndex: 0, maxAge: 30 });
const rahuCycle = buildParayaTimeline({ body: 'Rahu', natalSignIndex: 0, maxAge: 18 });
assert.equal(saturnCycle.length, 12);
assert.equal(saturnCycle.at(-1)?.endAge, 30);
assert.equal(rahuCycle.length, 12);
assert.equal(rahuCycle.at(-1)?.endAge, 18);

const jupiterMatches = findParayaAgesForPosition({
  body: 'Jupiter', targetSignIndex: 0, degree: 15,
  natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
  maxAge: 30,
});
assert.deepEqual(jupiterMatches.map(match => match.ageYears), [0.5, 12.5, 24.5]);

const rahuMatches = findParayaAgesForPosition({
  body: 'Rahu', targetSignIndex: 11, degree: 15,
  natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
  maxAge: 20,
});
assert.deepEqual(rahuMatches.map(match => match.ageYears), [1, 19]);

const ketuMatches = findParayaAgesForPosition({
  body: 'Ketu', targetSignIndex: 5, degree: 15,
  natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
  maxAge: 20,
});
assert.deepEqual(ketuMatches.map(match => match.ageYears), [1, 19]);

console.log('Nadi paraya tests passed');

// --- Stays in each sign: alternating (the default) or the same in every sign ---------------
assert.deepEqual(parayaDurations('Jupiter'), [1]);
assert.deepEqual(parayaDurations('Saturn'), [3, 2], 'Saturn alternates 3 and 2 years by default');
assert.deepEqual(parayaDurations('Rahu'), [2, 1], 'Rahu alternates 2 and 1 years by default');
assert.deepEqual(parayaDurations('Saturn', { ...DEFAULT_PARAYA_OPTIONS, saturn: 'even' }), [2.5]);
assert.deepEqual(parayaDurations('Rahu', { ...DEFAULT_PARAYA_OPTIONS, rahu: 'even' }), [1.5]);
assert.deepEqual(parayaDurations('Jupiter', { saturn: 'even', rahu: 'even' }), [1], 'Jupiter does not change');

const even = { saturn: 'even', rahu: 'even' } as const;
const evenAt = (ageYears: number) => calculateNadiParaya({ ageYears, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11, options: even });
assert.equal(evenAt(0).saturn.endAge, 2.5, 'Saturn stays 2.5 years in its first sign');
assert.equal(evenAt(2.5).saturn.signIndex, 8);
assert.equal(evenAt(2.5).saturn.endAge, 5, 'and 2.5 in the next');
assert.equal(evenAt(5).saturn.signIndex, 9);
assert.equal(evenAt(30).saturn.signIndex, 7, 'a round of twelve signs takes 30 years');
assert.equal(evenAt(30).saturn.cycleNumber, 2);
assert.equal(evenAt(0).rahu.endAge, 1.5, 'Rahu stays 1.5 years in its first sign');
assert.equal(evenAt(1.5).rahu.signIndex, 10, 'and goes backward');
assert.equal(evenAt(3).rahu.signIndex, 9);
assert.equal(evenAt(18).rahu.signIndex, 11, 'a round takes 18 years');
assert.equal(evenAt(1.5).ketu.signIndex, (10 + 6) % 12, 'Ketu stays opposite Rahu');
assert.equal(evenAt(7.4).jupiter.signIndex, 7, 'Jupiter still moves a sign a year');
// The choices are independent of each other.
const mixed = calculateNadiParaya({ ageYears: 3, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11, options: { saturn: 'alternating', rahu: 'even' } });
assert.equal(mixed.saturn.signIndex, 8, 'alternating Saturn is in its second sign at 3');
assert.equal(mixed.rahu.signIndex, 9, 'even Rahu has moved two signs by 3');

// --- Timelines and the age search follow the choice ----------------------------------------------
const evenTimeline = buildParayaTimeline({ body: 'Saturn', natalSignIndex: 7, maxAge: 10, options: even });
assert.deepEqual(evenTimeline.map(p => p.endAge), [2.5, 5, 7.5, 10]);
const evenMatches = findParayaAgesForPosition({
  body: 'Saturn', targetSignIndex: 9, degree: 15,
  natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11, maxAge: 40, options: even,
});
assert.deepEqual(evenMatches.map(m => m.ageYears), [6.25, 36.25], 'the third sign from 15°: at 5 + half of 2.5 years, and a round of 30 years later');

console.log('Paraya option tests passed');
