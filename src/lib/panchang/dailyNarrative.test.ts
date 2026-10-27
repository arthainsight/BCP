import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDailyPanchangNarrative } from './dailyNarrative';

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
