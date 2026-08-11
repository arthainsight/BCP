import assert from 'node:assert/strict';
import { buildParayaTimeline, calculateNadiParaya, findParayaAgesForPosition } from './nadiParaya';

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
