import assert from 'node:assert/strict';
import { ALL_PARAYA_BODIES, DEFAULT_PARAYA_OPTIONS, PARAYA_BETA_BODIES, PARAYA_BODIES, buildParayaTimeline, calculateBetaParaya, calculateNadiParaya, findParayaAgesForPosition, parayaDurations } from './nadiParaya';

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


// --- The beta grahas: Mars two months, Mercury and Venus a month in each sign --------------------------------------------
assert.deepEqual(PARAYA_BODIES, ['Jupiter', 'Saturn', 'Rahu', 'Ketu'], 'the four are what there is to begin with');
assert.deepEqual(PARAYA_BETA_BODIES, ['Mars', 'Mercury', 'Venus']);
assert.deepEqual(ALL_PARAYA_BODIES, ['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Mars', 'Mercury', 'Venus']);
assert.deepEqual([parayaDurations('Mars'), parayaDurations('Mercury'), parayaDurations('Venus')], [[1 / 6], [1 / 12], [1 / 12]]);

const near = (a: number, b: number, message: string) => assert.ok(Math.abs(a - b) < 1e-6, `${message}: ${a} ≈ ${b}`);
const beta = (ageYears: number) => calculateBetaParaya({
  ageYears,
  natal: { Mars: { signIndex: 0 }, Mercury: { signIndex: 2 }, Venus: { signIndex: 11, retrograde: true } },
});
// At birth: each on its natal sign at 0°, and Venus, which was going backwards, one sign back (as Jupiter and Saturn are).
const born = beta(0);
assert.deepEqual(born.map(period => [period.body, period.signIndex, period.degree]), [['Mars', 0, 0], ['Mercury', 2, 0], ['Venus', 10, 0]]);
// Mars is in Aries for the first two months: at 0.1 years (1.2 months) it is 0.6 of the way, at 18°.
near(beta(0.1)[0].degree, 18, 'Mars at 0.1');
assert.equal(beta(0.1)[0].signIndex, 0);
// Then Taurus: at 1/6 + 0.05 years it is 0.3 of the way (9°).
assert.equal(beta(1 / 6 + 0.05)[0].signIndex, 1);
near(beta(1 / 6 + 0.05)[0].degree, 9, 'Mars in Taurus');
// A round of Mars is two years, and of Mercury and Venus a year.
const marsAgain = beta(2.1)[0];
assert.equal(marsAgain.signIndex, 0);
assert.equal(marsAgain.cycleNumber, 2);
near(marsAgain.degree, 18, 'Mars a round later');
// Mercury: half a year is six signs on (Gemini to Sagittarius), 0.12 into the sign (3.6°) at 0.51 years; at 1.04 years it is on its second round.
assert.equal(beta(0.51)[1].signIndex, 8);
near(beta(0.51)[1].degree, 3.6, 'Mercury at 0.51');
assert.equal(beta(1.04)[1].signIndex, 2);
assert.equal(beta(1.04)[1].cycleNumber, 2);
// Venus, one sign back to begin with (Aquarius), is in the 3rd sign from there (Aries) at 0.2 years, 0.4 of the way (12°).
assert.equal(beta(0.2)[2].signIndex, 0);
near(beta(0.2)[2].degree, 12, 'Venus at 0.2');
// Only the grahas that are given.
assert.deepEqual(calculateBetaParaya({ ageYears: 1, natal: { Venus: { signIndex: 3 } } }).map(period => period.body), ['Venus']);
assert.deepEqual(calculateBetaParaya({ ageYears: 1, natal: {} }), []);

// A position is reached once a round: Mars from Aries at 15° of Leo (the 5th sign, so 4/6 + a half month = 0.75), and every two years after that.
const marsAt = findParayaAgesForPosition({
  body: 'Mars', targetSignIndex: 4, degree: 15, natalJupiterSignIndex: 0, natalSaturnSignIndex: 0, natalRahuSignIndex: 0,
  natalBeta: { Mars: { signIndex: 0 } }, maxAge: 5,
});
assert.deepEqual(marsAt.map(match => Math.round(match.ageYears * 1000) / 1000), [0.75, 2.75, 4.75]);
assert.deepEqual(marsAt.map(match => match.cycleNumber), [1, 2, 3]);
// Without the natal sign of the beta graha there is nothing to find.
assert.deepEqual(findParayaAgesForPosition({ body: 'Mars', targetSignIndex: 4, degree: 15, natalJupiterSignIndex: 0, natalSaturnSignIndex: 0, natalRahuSignIndex: 0, maxAge: 5 }), []);
// A timeline of Mercury has twelve signs in a year.
assert.equal(buildParayaTimeline({ body: 'Mercury', natalSignIndex: 0, maxAge: 1.01 }).length, 13);
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
