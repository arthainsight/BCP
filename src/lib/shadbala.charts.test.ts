// The Ṣaḍbala and the Bhāva Bala of two more charts, against numbers worked out by a separate program from
// the Sanskrit rules (see shadbala.fixture2.ts). They cover what the reference chart does not: a day birth,
// a birth in the twilight, the southern hemisphere, a retrograde Jupiter, a waning Moon, other ascendants.
import assert from 'node:assert/strict';
import { buildClassicalBhavaBala } from './bhavaBala';
import { buildShadbalaRows, type ShadbalaPlanet } from './shadbala';
import { INDEPENDENT_CASES } from './shadbala.fixture2';

const close = (actual: number, expected: number, tolerance: number, message: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);

for (const testCase of INDEPENDENT_CASES) {
  const rows = buildShadbalaRows(testCase.chart);
  for (const row of rows) {
    const expected = testCase.shadbala[row.planet as ShadbalaPlanet];
    const tag = `${testCase.name}, ${row.planet}`;
    const sthana = row.sthanaBreakdown;
    const kala = row.kalaBreakdown;
    close(sthana.uccha, expected.uccha, 0.01, `${tag}: Uccha`);
    close(sthana.saptavargaja, expected.saptavargaja, 1e-9, `${tag}: Saptavargaja`);
    close(sthana.ojhayugma, expected.ojhayugma, 1e-9, `${tag}: Ojhayugma`);
    close(sthana.kendradi, expected.kendradi, 1e-9, `${tag}: Kendradi`);
    close(sthana.drekkana, expected.drekkana, 1e-9, `${tag}: Drekkana`);
    close(row.digVirupa, expected.dig, 0.01, `${tag}: Dig`);
    close(kala.natonnata, expected.natonnata, 0.01, `${tag}: Natonnata`);
    close(kala.paksha, expected.paksha, 0.01, `${tag}: Paksha`);
    close(kala.tribhaaga, expected.tribhaga, 1e-9, `${tag}: Tribhaga`);
    close(kala.varsheshadi, expected.varsheshadi, 1e-9, `${tag}: Abda, Masa, Vara, Hora`);
    close(kala.ayana, expected.ayana, 0.01, `${tag}: Ayana`);
    close(row.naisargikaVirupa, expected.naisargika, 0.01, `${tag}: Naisargika`);
    close(row.drikVirupa, expected.drik, 0.01, `${tag}: Drik`);
  }

  const bhava = buildClassicalBhavaBala(testCase.chart, rows);
  assert.equal(bhava.length, 12);
  for (const expected of testCase.bhava) {
    const row = bhava[expected.house - 1];
    const tag = `${testCase.name}, house ${expected.house}`;
    assert.equal(row.lord, expected.lord, `${tag}: lord`);
    close(row.dig, expected.dig, 0.01, `${tag}: Dig`);
    close(row.drig, expected.drig, 0.01, `${tag}: Drig`);
    assert.equal(row.occupantTotal, expected.occupants, `${tag}: occupants`);
    assert.equal(row.kala, expected.kala, `${tag}: Kala`);
  }
}

console.log('Two more charts: Shadbala and Bhava Bala tests passed');
