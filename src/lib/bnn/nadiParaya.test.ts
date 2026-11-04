import assert from 'node:assert/strict';
import { ALL_PARAYA_BODIES, DEFAULT_PARAYA_OPTIONS, PARAYA_BETA_BODIES, PARAYA_BODIES, PARAYA_TABLE_SIGN_YEARS, buildParayaTimeline, calculateBetaParaya, calculateNadiParaya, findParayaAgesForPosition, parayaDurations } from './nadiParaya';

const near = (a: number, b: number, message: string) => assert.ok(Math.abs(a - b) < 1e-6, `${message}: ${a} ≈ ${b}`);

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
near(atBirth.rahu.endAge, PARAYA_TABLE_SIGN_YEARS, 'Rahu uses 522.5 sāvana days per sign');
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
near(boundaries.rahu.startAge, 2 * PARAYA_TABLE_SIGN_YEARS, 'Rahu enters the third retrograde sign');
near(boundaries.rahu.endAge, 3 * PARAYA_TABLE_SIGN_YEARS, 'Rahu stays 522.5 sāvana days in the sign');

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
near(midPeriods.rahu.degree, 30 * (1 - 1 / PARAYA_TABLE_SIGN_YEARS), 'Rahu moves backwards at the table-derived pace');

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
assert.equal(rahuCycle.length, 13, 'the 17.4167-year round starts again before age 18');
near(rahuCycle.at(-1)!.endAge, 13 * PARAYA_TABLE_SIGN_YEARS, 'the first period of the next round is included');

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
assert.deepEqual(rahuMatches.map(match => Math.round(match.ageYears * 1000) / 1000), [0.726, 18.142]);

const ketuMatches = findParayaAgesForPosition({
  body: 'Ketu', targetSignIndex: 5, degree: 15,
  natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
  maxAge: 20,
});
assert.deepEqual(ketuMatches.map(match => Math.round(match.ageYears * 1000) / 1000), [0.726, 18.142]);


// --- Equal-bhāva cusp progression: keep Rāśi separate from the changing bhāva house -------------------------------
{
  const nearCusp = (a: number, b: number, message: string) => assert.ok(Math.abs(a - b) < 1e-6, `${message}: ${a} ≈ ${b}`);
  const cusp = 24.5;
  const options = { ...DEFAULT_PARAYA_OPTIONS, retro: 'same' as const, bhavaCuspDegree: cusp, bhavaAscendantSignIndex: 3 };
  const jupiterDegree = 1.75;
  const jupiterCuspAge = (cusp - jupiterDegree) / 30;
  const jupiterBefore = calculateNadiParaya({
    ageYears: 0, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalJupiterDegree: jupiterDegree, jupiterRetrograde: true, options,
  }).jupiter;
  assert.equal(jupiterBefore.signIndex, 0, 'Jupiter remains in its physical natal Rāśi, Aries');
  assert.equal(jupiterBefore.house, 9, 'before the Aries cusp Jupiter is still in bhāva 9');
  nearCusp(jupiterBefore.degree, jupiterDegree, 'Jupiter retains its natal degree');
  const jupiterAtCusp = calculateNadiParaya({
    ageYears: jupiterCuspAge, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalJupiterDegree: jupiterDegree, jupiterRetrograde: true, options,
  }).jupiter;
  assert.equal(jupiterAtCusp.signIndex, 0, 'the Rāśi is still Aries at the bhāva cusp');
  assert.equal(jupiterAtCusp.house, 10, 'crossing Aries 24°30′ moves Jupiter into bhāva 10');
  nearCusp(jupiterAtCusp.degree, cusp, 'Jupiter reaches the equal-bhāva cusp');
  nearCusp(jupiterCuspAge * 360, 273, 'Jupiter reaches the cusp after 273 sāvana days');

  const saturnDegree = 23.1;
  const saturnCuspAge = ((cusp - saturnDegree) / 30) * 2.5;
  const saturnAtBirth = calculateNadiParaya({
    ageYears: 0, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalSaturnDegree: saturnDegree, options: { ...options, saturn: 'even' },
  }).saturn;
  assert.equal(saturnAtBirth.signIndex, 7, 'Saturn remains in its physical natal Rāśi, Scorpio');
  assert.equal(saturnAtBirth.house, 4, 'before Scorpio 24°30′ Saturn is still in bhāva 4');
  const saturnAtCusp = calculateNadiParaya({
    ageYears: saturnCuspAge, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalSaturnDegree: saturnDegree, options: { ...options, saturn: 'even' },
  }).saturn;
  assert.equal(saturnAtCusp.signIndex, 7, 'the Rāśi remains Scorpio at the bhāva cusp');
  assert.equal(saturnAtCusp.house, 5, 'crossing Scorpio 24°30′ moves Saturn into bhāva 5');
  nearCusp(saturnAtCusp.degree, cusp, 'Saturn reaches the same cusp degree');
  nearCusp(saturnCuspAge * 360, 42, 'Saturn reaches the cusp after 42 sāvana days');

  const cuspHits = findParayaAgesForPosition({
    body: 'Jupiter', targetSignIndex: 0, degree: cusp,
    natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    jupiterRetrograde: true, natalDegrees: { Jupiter: jupiterDegree }, maxAge: 3, options,
  });
  assert.ok(cuspHits.length > 0, 'the cusp-degree Jupiter hit is found');
  nearCusp(cuspHits[0].ageYears, jupiterCuspAge, 'exact Parāya hits keep using the Rāśi degree timeline');
}

// --- Moon and Sun: direct one-sign-per-year progressions and house-cusp dates ----------------------------------------
{
  const cusp = 24.5;
  const nearSolarLunar = (a: number, b: number, message: string) => assert.ok(Math.abs(a - b) < 1e-6, `${message}: ${a} ≈ ${b}`);
  const options = { ...DEFAULT_PARAYA_OPTIONS, bhavaCuspDegree: cusp, bhavaAscendantSignIndex: 3 };

  // These natal degrees are the ones implied by the supplied example rows at a 24°30′ equal-bhāva cusp.
  const moonDegree = cusp - 233 / 12;
  const moonAge = 233 / 360;
  const moonAtBirth = calculateNadiParaya({
    ageYears: 0, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalMoonSignIndex: 2, natalMoonDegree: moonDegree, options,
  }).moon!;
  assert.equal(moonAtBirth.signIndex, 2, 'Moon stays in Gemini from birth');
  assert.equal(moonAtBirth.house, 11, 'before Gemini 24°30′ Moon is in bhāva 11');
  const moonAtCusp = calculateNadiParaya({
    ageYears: moonAge, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalMoonSignIndex: 2, natalMoonDegree: moonDegree, options,
  }).moon!;
  assert.equal(moonAtCusp.signIndex, 2, 'Moon is still in Gemini when it enters bhāva 12');
  assert.equal(moonAtCusp.house, 12);
  nearSolarLunar(moonAtCusp.degree, cusp, 'Moon reaches the 12th-house cusp on the supplied date');
  nearSolarLunar(moonAge * 360, 233, 'Moon reaches the Gemini cusp after 233 sāvana days');
  const moonNext = calculateNadiParaya({
    ageYears: moonAge + 1, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalMoonSignIndex: 2, natalMoonDegree: moonDegree, options,
  }).moon!;
  assert.equal(moonNext.signIndex, 3, 'one year later Moon is in Cancer');
  assert.equal(moonNext.house, 1, 'Cancer 24°30′ is the 1st-house cusp');

  const sunDegree = 30 + cusp - 350 / 12;
  const sunAge = 350 / 360;
  const sunAtBirth = calculateNadiParaya({
    ageYears: 0, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalSunSignIndex: 5, natalSunDegree: sunDegree, options,
  }).sun!;
  assert.equal(sunAtBirth.signIndex, 5, 'Sun stays in Virgo at birth');
  assert.equal(sunAtBirth.house, 3, 'Sun is still in bhāva 3 before Libra 24°30′');
  const sunAtCusp = calculateNadiParaya({
    ageYears: sunAge, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalSunSignIndex: 5, natalSunDegree: sunDegree, options,
  }).sun!;
  assert.equal(sunAtCusp.signIndex, 6, 'Sun is in Libra when it enters bhāva 4');
  assert.equal(sunAtCusp.house, 4);
  nearSolarLunar(sunAtCusp.degree, cusp, 'Sun reaches the 4th-house cusp on the supplied date');
  nearSolarLunar(sunAge * 360, 350, 'Sun reaches Libra cusp after 350 sāvana days');
  const sunNext = calculateNadiParaya({
    ageYears: sunAge + 1, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11,
    natalSunSignIndex: 5, natalSunDegree: sunDegree, options,
  }).sun!;
  assert.equal(sunNext.signIndex, 7, 'one year later Sun is in Scorpio');
  assert.equal(sunNext.house, 5, 'Scorpio 24°30′ is the 5th-house cusp');
}

// --- The beta grahas: Mars uses the table's 522.5-day stay; Mercury and Venus each take one year per sign ------------
assert.deepEqual(PARAYA_BODIES, ['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Moon', 'Sun'], 'the six standard Parāya grahas');
assert.deepEqual(PARAYA_BETA_BODIES, ['Mars', 'Mercury', 'Venus']);
assert.deepEqual(ALL_PARAYA_BODIES, ['Jupiter', 'Saturn', 'Rahu', 'Ketu', 'Moon', 'Sun', 'Mars', 'Mercury', 'Venus']);
assert.deepEqual([parayaDurations('Moon'), parayaDurations('Sun')], [[1], [1]], 'Moon and Sun each progress one sign per year');
assert.deepEqual([parayaDurations('Mars'), parayaDurations('Mercury'), parayaDurations('Venus')], [[PARAYA_TABLE_SIGN_YEARS], [1], [1]]);

const beta = (ageYears: number) => calculateBetaParaya({
  ageYears,
  natal: { Mars: { signIndex: 0 }, Mercury: { signIndex: 2 }, Venus: { signIndex: 11, retrograde: true } },
});
// At birth: each on its natal sign at 0°, and Venus, which was going backwards, one sign back (as Jupiter and Saturn are).
const born = beta(0);
assert.deepEqual(born.map(period => [period.body, period.signIndex, period.degree]), [['Mars', 0, 0], ['Mercury', 2, 0], ['Venus', 10, 0]]);
// Mars moves 30° in 522.5 sāvana days.
near(beta(0.1)[0].degree, 0.1 / PARAYA_TABLE_SIGN_YEARS * 30, 'Mars at 0.1');
assert.equal(beta(0.1)[0].signIndex, 0);
// Taurus begins after one 522.5-day stay.
assert.equal(beta(PARAYA_TABLE_SIGN_YEARS + 0.05)[0].signIndex, 1);
near(beta(PARAYA_TABLE_SIGN_YEARS + 0.05)[0].degree, 0.05 / PARAYA_TABLE_SIGN_YEARS * 30, 'Mars in Taurus');
// Mars completes a twelve-sign round in 12 × 522.5 sāvana days.
const marsAgain = beta(12 * PARAYA_TABLE_SIGN_YEARS + 0.1)[0];
assert.equal(marsAgain.signIndex, 0);
assert.equal(marsAgain.cycleNumber, 2);
near(marsAgain.degree, 0.1 / PARAYA_TABLE_SIGN_YEARS * 30, 'Mars a round later');
// Mercury takes one year per sign: at 0.51 it remains in Gemini; at 1.04 it is 1.2° into Cancer.
assert.equal(beta(0.51)[1].signIndex, 2);
near(beta(0.51)[1].degree, 15.3, 'Mercury at 0.51');
assert.equal(beta(1.04)[1].signIndex, 3);
near(beta(1.04)[1].degree, 1.2, 'Mercury at 1.04');
// Retrograde Venus begins one sign back (Aquarius); at 0.2 years it is 6° into Aquarius.
assert.equal(beta(0.2)[2].signIndex, 10);
near(beta(0.2)[2].degree, 6, 'Venus at 0.2');
// Only the grahas that are given.
assert.deepEqual(calculateBetaParaya({ ageYears: 1, natal: { Venus: { signIndex: 3 } } }).map(period => period.body), ['Venus']);
assert.deepEqual(calculateBetaParaya({ ageYears: 1, natal: {} }), []);

// A position is reached once a round: Mars from Aries at 15° of Leo, after 4.5 stays of 522.5 sāvana days each.
const marsAt = findParayaAgesForPosition({
  body: 'Mars', targetSignIndex: 4, degree: 15, natalJupiterSignIndex: 0, natalSaturnSignIndex: 0, natalRahuSignIndex: 0,
  natalBeta: { Mars: { signIndex: 0 } }, maxAge: 50,
});
assert.deepEqual(marsAt.map(match => Math.round(match.ageYears * 1000) / 1000), [6.531, 23.948, 41.365]);
assert.deepEqual(marsAt.map(match => match.cycleNumber), [1, 2, 3]);
// Without the natal sign of the beta graha there is nothing to find.
assert.deepEqual(findParayaAgesForPosition({ body: 'Mars', targetSignIndex: 4, degree: 15, natalJupiterSignIndex: 0, natalSaturnSignIndex: 0, natalRahuSignIndex: 0, maxAge: 5 }), []);
// A full Mercury round is twelve years, one year in each of the twelve signs.
assert.equal(buildParayaTimeline({ body: 'Mercury', natalSignIndex: 0, maxAge: 12.01 }).length, 13);
// --- The beta grahas begin at their natal degrees: Mercury at 7° and Venus at 18° of Libra are in different places on the way round -----------------
const libra = (ageYears: number) => calculateBetaParaya({
  ageYears,
  natal: { Mercury: { signIndex: 6, degree: 7 }, Venus: { signIndex: 6, degree: 18 } },
});
const [mercury0, venus0] = libra(0);
assert.deepEqual([mercury0.signIndex, mercury0.cycleNumber, venus0.signIndex, venus0.cycleNumber], [6, 1, 6, 1]);
near(mercury0.degree, 7, 'Mercury at birth');
near(venus0.degree, 18, 'Venus at birth');
// At 0.02 years they have moved 0.6° each, keeping their 11° natal separation.
near(libra(0.02)[0].degree, 7.6, 'Mercury at 0.02');
near(libra(0.02)[1].degree, 18.6, 'Venus at 0.02');
// Both remain in Libra at 0.05 and 0.07 years: each moves 30° per year.
assert.equal(libra(0.05)[1].signIndex, 6);
near(libra(0.05)[1].degree, 19.5, 'Venus at 0.05');
assert.equal(libra(0.05)[0].signIndex, 6);
near(libra(0.05)[0].degree, 8.5, 'Mercury at 0.05');
near(libra(0.07)[0].degree, 9.1, 'Mercury at 0.07');
assert.equal(libra(0.07)[0].signIndex, 6);
// The first stay began before birth: its start age is negative.
near(calculateBetaParaya({ ageYears: 0, natal: { Mercury: { signIndex: 6, degree: 7 } } })[0].startAge, -7 / 30, 'the one-year stay began 7° before birth');
// After one year, Mercury has moved from Libra to Scorpio.
near(libra(1)[0].degree, 7, 'Mercury keeps its natal degree');
assert.equal(libra(1)[0].cycleNumber, 1);
// A graha that was retrograde at birth begins one sign back, and at the same degree.
const backwards = calculateBetaParaya({ ageYears: 0, natal: { Mercury: { signIndex: 6, degree: 7, retrograde: true } } })[0];
assert.equal(backwards.signIndex, 5);
near(backwards.degree, 7, 'the degree is kept');
// The ages at which Mercury reaches a position, from Libra 7°.
const mercuryAt = (targetSignIndex: number, degree: number) => findParayaAgesForPosition({
  body: 'Mercury', targetSignIndex, degree, natalJupiterSignIndex: 0, natalSaturnSignIndex: 0, natalRahuSignIndex: 0,
  natalBeta: { Mercury: { signIndex: 6, degree: 7 } }, maxAge: 31,
}).map(match => Math.round(match.ageYears * 1000) / 1000);
assert.deepEqual(mercuryAt(0, 15), [6.267, 18.267, 30.267]);
// A degree of its natal sign already passed at birth is reached next round.
assert.deepEqual(mercuryAt(6, 2), [11.833, 23.833]);
assert.deepEqual(mercuryAt(6, 10), [0.1, 12.1, 24.1]);
// Venus from Libra 18° reaches Aries 15° after 5.9 years, then every twelve years.
const venusAt = findParayaAgesForPosition({
  body: 'Venus', targetSignIndex: 0, degree: 15, natalJupiterSignIndex: 0, natalSaturnSignIndex: 0, natalRahuSignIndex: 0,
  natalBeta: { Venus: { signIndex: 6, degree: 18 } }, maxAge: 31,
}).map(match => Math.round(match.ageYears * 1000) / 1000);
assert.deepEqual(venusAt, [5.9, 17.9, 29.9]);
// A timeline of a beta graha begins with the stay that was going on at birth.
const timeline = buildParayaTimeline({ body: 'Mercury', natalSignIndex: 6, startDegree: 7, maxAge: 1 });
near(timeline[0].startAge, -7 / 30, 'the first one-year stay began 7° before birth');
assert.ok(timeline[0].endAge > 0);
assert.equal(timeline.length, 13, 'the stay of birth, eleven whole ones and the stay that the year ends in: thirteen touch the first year');

// --- Jupiter, Saturn, Rahu and Ketu begin at their natal degrees too, and a graha that was retrograde at birth can begin in its own sign ---------------
const at = (ageYears: number, options?: Parameters<typeof calculateNadiParaya>[0]['options'], retro = false) => calculateNadiParaya({
  ageYears,
  natalJupiterSignIndex: 6, natalJupiterDegree: 7, // Jupiter 7° Libra
  natalSaturnSignIndex: 3, natalSaturnDegree: 20, // Saturn 20° Cancer
  natalRahuSignIndex: 3, natalRahuDegree: 20, // Rahu 20° Cancer (Ketu 20° Capricorn)
  jupiterRetrograde: retro, saturnRetrograde: retro,
  options,
});
const four0 = at(0);
assert.deepEqual([four0.jupiter.signIndex, four0.saturn.signIndex, four0.rahu.signIndex, four0.ketu.signIndex], [6, 3, 3, 9]);
near(four0.jupiter.degree, 7, 'Jupiter at birth');
near(four0.saturn.degree, 20, 'Saturn at birth');
near(four0.rahu.degree, 20, 'Rahu at birth');
near(four0.ketu.degree, 20, 'Ketu at birth');
assert.equal(four0.jupiter.cycleNumber, 1);
// Jupiter goes on a sign a year, 30° a year: half a year later it is at 22°, and at 0.8 years it has gone 24° and is 1° into Scorpio.
near(at(0.5).jupiter.degree, 22, 'Jupiter at 0.5');
assert.equal(at(0.8).jupiter.signIndex, 7);
near(at(0.8).jupiter.degree, 1, 'Jupiter at 0.8');
// Saturn (3 and 2 years) has two thirds of its first stay gone: 2 years of 3 are gone, and it leaves the sign at age 1.
assert.equal(at(0.9).saturn.signIndex, 3);
assert.equal(at(1.1).saturn.signIndex, 4);
near(at(1.1).saturn.degree, 0.1 / 2 * 30, 'Saturn 0.1 years into its 2 year stay in Leo');
near(four0.saturn.startAge, -2, 'its first stay began 2 years before birth');
// Rāhu moves backwards; the time in every sign is fixed by the supplied 522.5-day table interval.
near(at(0.5).rahu.degree, 20 - (0.5 / PARAYA_TABLE_SIGN_YEARS) * 30, 'Rahu at 0.5 going backwards');
assert.equal(at(0.5).rahu.signIndex, 3);
assert.equal(at(1.4).rahu.signIndex, 2, 'Gemini, the sign before Cancer');
near(at(1.4).rahu.degree, 30 * (1 - (1.4 - (2 / 3) * PARAYA_TABLE_SIGN_YEARS) / PARAYA_TABLE_SIGN_YEARS), 'Rahu continues backwards in Gemini');
assert.equal(at(1.4).ketu.signIndex, 8, 'Ketu is six signs on from Rahu');
// The speed options still change when the signs change: Saturn (20° of its sign gone) leaves Cancer at age 1 with stays of 3 and 2 years, and at 5/6 with 2½ a sign.
const evenSaturn = { saturn: 'even', rahu: 'alternating' } as const;
assert.equal(at(0.9).saturn.signIndex, 3, 'alternating: still in Cancer at 0.9');
assert.equal(at(0.9, evenSaturn).saturn.signIndex, 4, 'even: already in Leo at 0.9');
assert.equal(at(0.8, evenSaturn).saturn.signIndex, 3, 'even: still in Cancer at 0.8');

// A graha that was retrograde at birth: one sign back (as it always was) or, as chosen, in its own sign. Rahu and Ketu are never moved.
const back = at(0, undefined, true);
assert.equal(back.jupiter.signIndex, 5, 'Virgo, the sign before Libra');
near(back.jupiter.degree, 7, 'the degree is kept');
assert.equal(back.saturn.signIndex, 2);
assert.equal(back.rahu.signIndex, 3);
for (const options of [{ saturn: 'alternating', rahu: 'alternating', retro: 'previous' }, { saturn: 'alternating', rahu: 'alternating' }] as const) {
  assert.equal(at(0, options, true).jupiter.signIndex, 5, 'previous is the default');
}
const same = at(0, { saturn: 'alternating', rahu: 'alternating', retro: 'same' }, true);
assert.equal(same.jupiter.signIndex, 6, 'the natal sign');
near(same.jupiter.degree, 7, 'at the natal degree');
assert.equal(same.saturn.signIndex, 3);
assert.equal(same.rahu.signIndex, 3);
assert.equal(at(0, { saturn: 'alternating', rahu: 'alternating', retro: 'same' }, false).jupiter.signIndex, 6, 'a direct graha is not affected by the choice');
// The same for the beta grahas.
const betaRetro = (retro: 'previous' | 'same') => calculateBetaParaya({ ageYears: 0, natal: { Mercury: { signIndex: 6, degree: 7, retrograde: true } }, options: { saturn: 'alternating', rahu: 'alternating', retro } })[0];
assert.equal(betaRetro('previous').signIndex, 5);
assert.equal(betaRetro('same').signIndex, 6);
// The ages a position is reached at, for Jupiter from 7°: a degree it has passed at birth comes next round (12 years on), and a later one soon.
const jupiterAt = (degree: number, retrograde = false, retro?: 'previous' | 'same') => findParayaAgesForPosition({
  body: 'Jupiter', targetSignIndex: 6, degree, natalJupiterSignIndex: 6, natalSaturnSignIndex: 0, natalRahuSignIndex: 0,
  natalDegrees: { Jupiter: 7 }, jupiterRetrograde: retrograde, options: retro ? { saturn: 'alternating', rahu: 'alternating', retro } : undefined, maxAge: 25,
}).map(match => Math.round(match.ageYears * 1000) / 1000);
assert.deepEqual(jupiterAt(2), [11.833, 23.833]);
assert.deepEqual(jupiterAt(10), [0.1, 12.1, 24.1]);
// Retrograde at birth: Libra comes a year later (one sign back) or at once (the same sign).
assert.deepEqual(jupiterAt(10, true), [1.1, 13.1]);
assert.deepEqual(jupiterAt(10, true, 'same'), [0.1, 12.1, 24.1]);
// Rahu from 20° of Cancer: it passes 15° of Cancer after 5/30 of its 522.5-day stay, then every twelve-sign round.
const rahuAt = findParayaAgesForPosition({ body: 'Rahu', targetSignIndex: 3, degree: 15, natalJupiterSignIndex: 0, natalSaturnSignIndex: 0, natalRahuSignIndex: 3, natalDegrees: { Rahu: 20 }, maxAge: 40 })
  .map(match => Math.round(match.ageYears * 1000) / 1000);
assert.deepEqual(rahuAt, [0.242, 17.659, 35.075]);

console.log('Nadi paraya tests passed');

// --- Stays in each sign: Saturn remains configurable; Mars and Rāhu/Ketu use the supplied table ---------------
assert.deepEqual(parayaDurations('Jupiter'), [1]);
assert.deepEqual(parayaDurations('Saturn'), [3, 2], 'Saturn alternates 3 and 2 years by default');
assert.deepEqual(parayaDurations('Rahu'), [PARAYA_TABLE_SIGN_YEARS], 'Rahu uses the 522.5-day table speed');
assert.deepEqual(parayaDurations('Saturn', { ...DEFAULT_PARAYA_OPTIONS, saturn: 'even' }), [2.5]);
assert.deepEqual(parayaDurations('Rahu', { ...DEFAULT_PARAYA_OPTIONS, rahu: 'even' }), [PARAYA_TABLE_SIGN_YEARS], 'the obsolete Rahu selector no longer changes the speed');
assert.deepEqual(parayaDurations('Jupiter', { saturn: 'even', rahu: 'even' }), [1], 'Jupiter does not change');

const even = { saturn: 'even', rahu: 'even' } as const;
const evenAt = (ageYears: number) => calculateNadiParaya({ ageYears, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11, options: even });
assert.equal(evenAt(0).saturn.endAge, 2.5, 'Saturn stays 2.5 years in its first sign');
assert.equal(evenAt(2.5).saturn.signIndex, 8);
assert.equal(evenAt(2.5).saturn.endAge, 5, 'and 2.5 in the next');
assert.equal(evenAt(5).saturn.signIndex, 9);
assert.equal(evenAt(30).saturn.signIndex, 7, 'a round of twelve signs takes 30 years');
assert.equal(evenAt(30).saturn.cycleNumber, 2);
near(evenAt(0).rahu.endAge, PARAYA_TABLE_SIGN_YEARS, 'Rahu stays 522.5 sāvana days per sign');
assert.equal(evenAt(PARAYA_TABLE_SIGN_YEARS).rahu.signIndex, 10, 'Rahu moves backwards to the previous sign');
assert.equal(evenAt(3).rahu.signIndex, 9);
assert.equal(evenAt(12 * PARAYA_TABLE_SIGN_YEARS).rahu.signIndex, 11, 'a round takes 12 table-derived sign stays');
assert.equal(evenAt(PARAYA_TABLE_SIGN_YEARS).ketu.signIndex, (10 + 6) % 12, 'Ketu stays opposite Rahu');
assert.equal(evenAt(7.4).jupiter.signIndex, 7, 'Jupiter still moves a sign a year');
// Saturn remains configurable; the legacy Rahu option has no effect.
const mixed = calculateNadiParaya({ ageYears: 3, natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11, options: { saturn: 'alternating', rahu: 'even' } });
assert.equal(mixed.saturn.signIndex, 8, 'alternating Saturn is in its second sign at 3');
assert.equal(mixed.rahu.signIndex, 9, 'Rahu has moved backwards two signs by 3');

// --- Timelines and the age search follow the choice ----------------------------------------------
const evenTimeline = buildParayaTimeline({ body: 'Saturn', natalSignIndex: 7, maxAge: 10, options: even });
assert.deepEqual(evenTimeline.map(p => p.endAge), [2.5, 5, 7.5, 10]);
const evenMatches = findParayaAgesForPosition({
  body: 'Saturn', targetSignIndex: 9, degree: 15,
  natalJupiterSignIndex: 0, natalSaturnSignIndex: 7, natalRahuSignIndex: 11, maxAge: 40, options: even,
});
assert.deepEqual(evenMatches.map(m => m.ageYears), [6.25, 36.25], 'the third sign from 15°: at 5 + half of 2.5 years, and a round of 30 years later');

console.log('Paraya option tests passed');
