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
// --- The beta grahas begin at their natal degrees: Mercury at 7° and Venus at 18° of Libra are in different places on the way round -----------------
const libra = (ageYears: number) => calculateBetaParaya({
  ageYears,
  natal: { Mercury: { signIndex: 6, degree: 7 }, Venus: { signIndex: 6, degree: 18 } },
});
const [mercury0, venus0] = libra(0);
assert.deepEqual([mercury0.signIndex, mercury0.cycleNumber, venus0.signIndex, venus0.cycleNumber], [6, 1, 6, 1]);
near(mercury0.degree, 7, 'Mercury at birth');
near(venus0.degree, 18, 'Venus at birth');
// A month is 1/12 of a year and 30° of the sign: at 0.02 years (0.24 of a stay) they are 7.2° further on.
near(libra(0.02)[0].degree, 14.2, 'Mercury at 0.02');
near(libra(0.02)[1].degree, 25.2, 'Venus at 0.02');
// Venus reaches Scorpio at 12/30 of a stay, 0.0333 years; Mercury at 23/30 of a stay, 0.0639.
assert.equal(libra(0.05)[1].signIndex, 7);
near(libra(0.05)[1].degree, 6, 'Venus in Scorpio at 0.05');
assert.equal(libra(0.05)[0].signIndex, 6);
near(libra(0.05)[0].degree, 25, 'Mercury is still in Libra at 0.05');
near(libra(0.07)[0].degree, (0.07 - 23 / 360) * 360, 'Mercury in Scorpio at 0.07 (2.2° in)');
assert.equal(libra(0.07)[0].signIndex, 7);
// The first stay began before birth: its start age is negative.
near(calculateBetaParaya({ ageYears: 0, natal: { Mercury: { signIndex: 6, degree: 7 } } })[0].startAge, -7 / 360, 'the stay began 7° before birth');
// A round later (a year on for Mercury) they are where they were.
near(libra(1)[0].degree, 7, 'Mercury a year on');
assert.equal(libra(1)[0].cycleNumber, 2);
// A graha that was retrograde at birth begins one sign back, and at the same degree.
const backwards = calculateBetaParaya({ ageYears: 0, natal: { Mercury: { signIndex: 6, degree: 7, retrograde: true } } })[0];
assert.equal(backwards.signIndex, 5);
near(backwards.degree, 7, 'the degree is kept');
// The ages a position is reached at: Mercury at 15° Aries (6 stays on) after 6.5 stays less its 7° head start, then every year.
const mercuryAt = (targetSignIndex: number, degree: number) => findParayaAgesForPosition({
  body: 'Mercury', targetSignIndex, degree, natalJupiterSignIndex: 0, natalSaturnSignIndex: 0, natalRahuSignIndex: 0,
  natalBeta: { Mercury: { signIndex: 6, degree: 7 } }, maxAge: 3,
}).map(match => Math.round(match.ageYears * 1000) / 1000);
assert.deepEqual(mercuryAt(0, 15), [0.522, 1.522, 2.522]);
// A degree of its natal sign that it has already passed at birth is reached next round, and not at a negative age.
assert.deepEqual(mercuryAt(6, 2), [0.986, 1.986, 2.986]);
assert.deepEqual(mercuryAt(6, 10), [0.008, 1.008, 2.008]);
// Venus 11° ahead of Mercury gets to the same degree earlier by 11 / 360 years.
const venusAt = findParayaAgesForPosition({
  body: 'Venus', targetSignIndex: 0, degree: 15, natalJupiterSignIndex: 0, natalSaturnSignIndex: 0, natalRahuSignIndex: 0,
  natalBeta: { Venus: { signIndex: 6, degree: 18 } }, maxAge: 3,
}).map(match => Math.round(match.ageYears * 1000) / 1000);
assert.deepEqual(venusAt, [0.492, 1.492, 2.492]);
// A timeline of a beta graha begins with the stay that was going on at birth.
const timeline = buildParayaTimeline({ body: 'Mercury', natalSignIndex: 6, startDegree: 7, maxAge: 1 });
near(timeline[0].startAge, -7 / 360, 'the first stay began before birth');
assert.ok(timeline[0].endAge > 0);
assert.equal(timeline.length, 13, 'the stay of birth, eleven whole ones and the stay that the year ends in: thirteen touch the first year');

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
