import assert from 'node:assert/strict';
import { analyzeDashaEventPatterns, type DashaPatternRecord } from './dashaEventPatterns';

const snapshot = (key: 'vimshottari', md: string, ad: string) => ({ key, label: 'Vimsottari', levels: [{ level: 'MD', value: md }, { level: 'AD', value: ad }] });
const records: DashaPatternRecord[] = [
  { eventId: '1', category: 'work', snapshot: snapshot('vimshottari', 'Saturn', 'Mercury') },
  { eventId: '2', category: 'work', snapshot: snapshot('vimshottari', 'Saturn', 'Venus') },
  { eventId: '3', category: 'money', snapshot: snapshot('vimshottari', 'Saturn', 'Mercury') },
];

assert.deepEqual(analyzeDashaEventPatterns(records).map(pattern => [pattern.level, pattern.value, pattern.count]), [['MD', 'Saturn', 3], ['AD', 'Mercury', 2], ['MD + AD', 'Saturn › Mercury', 2]]);
assert.deepEqual(analyzeDashaEventPatterns(records, 'work').map(pattern => [pattern.level, pattern.value, pattern.count]), [['MD', 'Saturn', 2]]);
assert.deepEqual(analyzeDashaEventPatterns(records, 'health'), []);
console.log('Dasha event pattern tests passed');
