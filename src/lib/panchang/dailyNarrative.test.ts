import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDailyPanchangNarrative, generateFinnishDailyPanchangNarrative } from './dailyNarrative';

const sample = {
  vara: 'Tuesday',
  varaLord: 'Mars',
  tithi: 'Pratipada',
  tithiNumber: 1,
  paksha: 'Shukla' as const,
  nakshatra: 'Bharani',
  nakshatraPada: 2,
  karana: 'Kaulava',
  yoga: 'Siddhi',
};

test('creates a readable multi-part daily reading from Panchang values', () => {
  const result = generateDailyPanchangNarrative(sample);
  assert.match(result.overview, /Mars rules the weekday/);
  assert.match(result.overview, /Bharani points toward/);
  assert.match(result.work, /Siddhi Yoga/);
  assert.match(result.relationships, /friendship and cooperation/);
  assert.match(result.spiritual, /transformation/);
  assert.ok(result.practicalAdvice.length > 40);
});

test('does not add remedies, rituals, prayers or donations', () => {
  const result = generateDailyPanchangNarrative(sample);
  const text = Object.values(result).join(' ').toLowerCase();
  for (const forbidden of ['remedy:', 'light a', 'recite', 'donate', 'mantra', 'puja']) {
    assert.ok(!text.includes(forbidden), `unexpected remedy language: ${forbidden}`);
  }
});

test('handles unfamiliar names without throwing', () => {
  const result = generateDailyPanchangNarrative({ ...sample, vara: 'Unknown', nakshatra: 'Unknown', yoga: 'Unknown' });
  assert.match(result.overview, /Unknown/);
  assert.match(result.work, /Unknown has its own traditional symbolism/);
});

test('generates a Finnish daily reading across all six sections', () => {
  const result = generateFinnishDailyPanchangNarrative(sample);
  assert.deepEqual(Object.keys(result), [
    'overview', 'work', 'finances', 'relationships', 'spiritual', 'practicalAdvice',
  ]);
  for (const [section, value] of Object.entries(result)) {
    assert.ok(value.length > 40, `${section} should contain a complete interpretation`);
  }
  assert.match(result.overview, /tiistai/);
  assert.match(result.overview, /päivän kokonaisuuden/);
  assert.match(result.work, /Työssä/);
  assert.match(result.finances, /taloudelliset valinnat/);
  assert.match(result.relationships, /Ihmissuhteissa/);
  assert.match(result.spiritual, /Sisäisessä työssä/);
  assert.match(result.practicalAdvice, /Päivän käytännön punainen lanka/);

  const allSections = Object.values(result).join(' ');
  const leakedEnglish = [
    'rules the weekday',
    'points toward',
    'For work,',
    'For money and decisions',
    'In relationships,',
    'For inner work,',
    "Today's practical thread",
    'has its own traditional symbolism',
    'The factors point in different directions',
    'The useful question is',
  ];
  for (const phrase of leakedEnglish) {
    assert.ok(!allSections.includes(phrase), `English phrase leaked into Finnish reading: ${phrase}`);
  }
});

test('keeps Sanskrit Panchang names while localising weekday and narrative text', () => {
  const result = generateFinnishDailyPanchangNarrative(sample);
  assert.match(result.overview, /Bharani-nakshatra/);
  assert.match(result.overview, /Siddhi-jooga/);
  assert.match(result.overview, /Kaulava-karana/);
  assert.doesNotMatch(result.overview, /Tuesday|rules the weekday|points toward/);
});
