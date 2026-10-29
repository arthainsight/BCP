// Tests of the choices of the Ṣaḍbala and the Bhāva Bala (balaOptions.ts, balaOptionsStore.ts). The expected
// numbers were worked out separately from the engine, for the reference chart of shadbala.fixture.ts.
import assert from 'node:assert/strict';
import {
  BALA_OPTION_DEFINITIONS,
  DEFAULT_BALA_OPTIONS,
  JHORA_LIKE_BALA_OPTIONS,
  balaOptionsAreCustom,
  readBalaOptions,
  type BalaOptions,
} from './balaOptions';
import { buildClassicalBhavaBala } from './bhavaBala';
import { translate } from './i18n';
import { buildShadbalaRows, classifyBenefics, type ShadbalaChartLike } from './shadbala';
import { REFERENCE_CHART } from './shadbala.fixture';
import { isMoonBenefic } from './shadbalaAspects';
import {
  BALA_OPTIONS_STORAGE_KEY, getBalaOptionsSnapshot, resetBalaOptions, setBalaOptions, subscribeBalaOptions,
} from './balaOptionsStore';

const close = (actual: number, expected: number, tolerance: number, message: string) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
const rowsWith = (change: Partial<BalaOptions>) => buildShadbalaRows(REFERENCE_CHART, { ...DEFAULT_BALA_OPTIONS, ...change });
const column = (rows: ReturnType<typeof buildShadbalaRows>, pick: (row: ReturnType<typeof buildShadbalaRows>[number]) => number) => rows.map(pick);

// ---------------------------------------------------------------------------
// The definitions: every default is a choice, every text has a Finnish translation
// ---------------------------------------------------------------------------
{
  const keys = new Set<string>();
  for (const definition of BALA_OPTION_DEFINITIONS) {
    assert.ok(!keys.has(definition.key), `${definition.key} is defined once`);
    keys.add(definition.key);
    assert.ok(definition.choices.some((choice) => choice.value === DEFAULT_BALA_OPTIONS[definition.key]), `${definition.key} default is among its choices`);
    assert.equal(definition.choices[0].value, DEFAULT_BALA_OPTIONS[definition.key], `${definition.key}: the first choice is the Sanskrit reading`);
    for (const text of [definition.label, definition.note, ...definition.choices.map((choice) => choice.label)]) {
      assert.notEqual(translate('fi', text), text, `no Finnish translation for: ${text}`);
    }
  }
  assert.deepEqual([...keys].sort(), Object.keys(DEFAULT_BALA_OPTIONS).sort(), 'every option is defined');
}

// ---------------------------------------------------------------------------
// Reading what is stored
// ---------------------------------------------------------------------------
assert.deepEqual(readBalaOptions(null), DEFAULT_BALA_OPTIONS);
assert.deepEqual(readBalaOptions('nonsense'), DEFAULT_BALA_OPTIONS);
assert.deepEqual(readBalaOptions({ moonRule: 'tithi-8', digPoints: 'something else', unknown: 1 }), { ...DEFAULT_BALA_OPTIONS, moonRule: 'tithi-8' });
assert.equal(balaOptionsAreCustom(DEFAULT_BALA_OPTIONS), false);
assert.equal(balaOptionsAreCustom({ ...DEFAULT_BALA_OPTIONS, ayana: 'declination' }), true);

// ---------------------------------------------------------------------------
// The store: a change is kept, told to the listeners, and reset
// ---------------------------------------------------------------------------
{
  const written: Record<string, string> = {};
  // A browser stand-in for the store, which reads and writes localStorage.
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: { getItem: (key: string) => written[key] ?? null, setItem: (key: string, value: string) => { written[key] = value; } },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  let told = 0;
  const unsubscribe = subscribeBalaOptions(() => { told += 1; });
  assert.deepEqual(getBalaOptionsSnapshot(), DEFAULT_BALA_OPTIONS);
  setBalaOptions({ moonRule: 'tithi-8' });
  assert.equal(getBalaOptionsSnapshot().moonRule, 'tithi-8');
  assert.equal(told, 1);
  assert.equal(JSON.parse(written[BALA_OPTIONS_STORAGE_KEY]).moonRule, 'tithi-8');
  setBalaOptions({ digPoints: 'bogus' as BalaOptions['digPoints'] });
  assert.equal(getBalaOptionsSnapshot().digPoints, 'angles', 'an unknown choice is ignored');
  assert.equal(getBalaOptionsSnapshot().moonRule, 'tithi-8', 'and does not undo the others');
  resetBalaOptions();
  assert.deepEqual(getBalaOptionsSnapshot(), DEFAULT_BALA_OPTIONS);
  unsubscribe();
  delete (globalThis as unknown as { window?: unknown }).window;
}

// ---------------------------------------------------------------------------
// The Moon (C1)
// ---------------------------------------------------------------------------
assert.equal(isMoonBenefic(249.8, 'dark-half'), false);
assert.equal(isMoonBenefic(249.8, 'tithi-8'), true, 'the Moon of the reference chart, 249.8°, is a benefic by Raman');
assert.equal(isMoonBenefic(83.99, 'tithi-8'), false, 'before the 8th tithi of the bright half');
assert.equal(isMoonBenefic(84, 'tithi-8'), true, 'from the 8th tithi of the bright half');
assert.equal(isMoonBenefic(263.99, 'tithi-8'), true, 'until the 8th tithi of the dark half');
assert.equal(isMoonBenefic(264, 'tithi-8'), false, 'from the 8th tithi of the dark half');
assert.equal(isMoonBenefic(100, 'dark-half'), true);
assert.equal(isMoonBenefic(50, 'tithi-8'), false, 'a young Moon is weak by Raman, a benefic by Santhanam');
assert.equal(isMoonBenefic(50, 'dark-half'), true);

// ---------------------------------------------------------------------------
// Mercury (C2)
// ---------------------------------------------------------------------------
{
  const chartWith = (companions: Array<{ name: string; longitude: number }>): ShadbalaChartLike => ({
    planets: [
      { name: 'Sun', longitude: 200 },
      { name: 'Moon', longitude: 280 }, // bright half from the Sun at 200: elongation 80, a benefic by Santhanam
      { name: 'Mercury', longitude: 100 },
      ...companions,
    ],
  });
  const isBenefic = (chart: ShadbalaChartLike, rule: BalaOptions['mercuryRule']) => classifyBenefics(chart, { ...DEFAULT_BALA_OPTIONS, mercuryRule: rule }).has('Mercury');
  const alone = chartWith([]);
  const withMars = chartWith([{ name: 'Mars', longitude: 105 }]);
  const withMarsJupiterVenus = chartWith([{ name: 'Mars', longitude: 105 }, { name: 'Jupiter', longitude: 101 }, { name: 'Venus', longitude: 102 }]);
  const withMarsAndJupiter = chartWith([{ name: 'Mars', longitude: 105 }, { name: 'Jupiter', longitude: 101 }]);
  for (const rule of ['any-malefic', 'majority', 'always-benefic'] as const) assert.equal(isBenefic(alone, rule), true, `alone, ${rule}`);
  assert.equal(isBenefic(withMars, 'any-malefic'), false);
  assert.equal(isBenefic(withMars, 'majority'), false);
  assert.equal(isBenefic(withMars, 'always-benefic'), true);
  assert.equal(isBenefic(withMarsJupiterVenus, 'any-malefic'), false, 'one malefic is enough by the verse');
  assert.equal(isBenefic(withMarsJupiterVenus, 'majority'), true, 'two benefics outnumber one malefic');
  assert.equal(isBenefic(withMarsAndJupiter, 'majority'), false, 'equal numbers: not more benefics');
}

// ---------------------------------------------------------------------------
// Saptavargaja (C3)
// ---------------------------------------------------------------------------
const sapta = (change: Partial<BalaOptions>) => column(rowsWith(change), (row) => row.sthanaBreakdown.saptavargaja);
assert.deepEqual(sapta({}), [145, 109, 85, 86, 70, 133, 112]);
// Raman's scores with the mūlatrikoṇa in the rāśi only are what JHora gives (PyJHora, the Saptavargaja of the Sthāna).
for (const [index, expected] of [142.5, 108.75, 75, 80.625, 52.5, 135, 106.875].entries()) {
  close(sapta({ saptavargajaScores: 'raman' })[index], expected, 1e-9, `Raman scores, ${PLANETS[index]}`);
}
assert.deepEqual(sapta({ mulatrikona: 'all-vargas' }), [190, 109, 85, 86, 70, 148, 112], 'the 45 in every varga of the mūlatrikoṇa sign');
assert.deepEqual(sapta({ temporaryRelation: 'varga' }), [147, 99, 76, 83, 90, 115, 112], 'the temporary friendship from each varga chart');
close(sapta({ saptavargajaScores: 'raman', mulatrikona: 'all-vargas' })[0], 187.5, 1e-9, 'Raman scores with the 45 in every varga, the Sun');

// ---------------------------------------------------------------------------
// Dig Bala (C4)
// ---------------------------------------------------------------------------
{
  const dig = column(rowsWith({ digPoints: 'equal-houses' }), (row) => row.digVirupa);
  [9.73, 13.54, 15.2, 31.95, 22.4, 54.78, 39.53].forEach((expected, index) => close(dig[index], expected, 0.02, `equal-house Dig Bala, ${PLANETS[index]}`));
  // Jupiter, Mercury and Saturn have the same point in both.
  close(dig[3], rowsWith({}).find((row) => row.planet === 'Mercury')!.digVirupa, 1e-9, 'Mercury is measured from the ascendant either way');
}

// ---------------------------------------------------------------------------
// Cheṣṭā Bala of the Sun and the Moon (C5), Ayana (C6) and the Moon's Pakṣa Bala
// ---------------------------------------------------------------------------
{
  const inTotal = rowsWith({});
  const leftOut = rowsWith({ luminaryCheshta: 'left-out' });
  const doubled = rowsWith({ luminaryCheshta: 'doubled-in-kala' });
  const get = (rows: typeof inTotal, planet: string) => rows.find((row) => row.planet === planet)!;
  for (const planet of ['Sun', 'Moon']) {
    assert.equal(get(leftOut, planet).cheshtaVirupa, 0, `${planet} Cheshta is left out`);
    assert.equal(get(doubled, planet).cheshtaVirupa, 0, `${planet} Cheshta column is empty when doubled in Kala`);
    close(get(leftOut, planet).totalVirupa, get(inTotal, planet).totalVirupa - get(inTotal, planet).cheshtaVirupa, 1e-9, `${planet} total without Cheshta`);
  }
  close(get(doubled, 'Sun').kalaBreakdown.ayana, 40.96, 0.02, 'the Sun\'s Ayana Bala doubled');
  close(get(doubled, 'Moon').kalaBreakdown.paksha, 73.46, 0.02, 'the Moon\'s Pakṣa Bala doubled');
  close(get(doubled, 'Sun').totalVirupa, get(inTotal, 'Sun').totalVirupa, 0.05, 'Raman\'s doubling gives the Sun the same total as the verses');
  close(get(doubled, 'Moon').totalVirupa, get(inTotal, 'Moon').totalVirupa, 0.05, 'and the Moon');
  // The five others are not touched.
  for (const planet of ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
    assert.equal(get(doubled, planet).totalVirupa, get(inTotal, planet).totalVirupa, `${planet} unchanged`);
  }
}
{
  const ayana = column(rowsWith({ ayana: 'declination' }), (row) => row.kalaBreakdown.ayana);
  [20.68, 0, 29.82, 53.43, 40.45, 15.29, 56.93].forEach((expected, index) => close(ayana[index], expected, 0.02, `real-declination Ayana Bala, ${PLANETS[index]}`));
}

// ---------------------------------------------------------------------------
// Drekkana (C14)
// ---------------------------------------------------------------------------
assert.deepEqual(column(rowsWith({ drekkana: 'female-second' }), (row) => row.sthanaBreakdown.drekkana), [0, 0, 15, 0, 15, 0, 15]);

// ---------------------------------------------------------------------------
// Dṛg Bala (C1, C8)
// ---------------------------------------------------------------------------
{
  const drig = (change: Partial<BalaOptions>) => column(rowsWith(change), (row) => row.drikVirupa);
  [20.53, -2.24, 7.28, 15.78, -16.16, 20.68, 12.71].forEach((expected, index) => close(drig({ moonRule: 'tithi-8' })[index], expected, 0.02, `JHora's Moon, ${PLANETS[index]}`));
  [50.29, 52.94, 0.14, 59.07, 9.08, 63.98, 52.65].forEach((expected, index) => close(drig({ drigMercuryJupiter: 'full-addon' })[index], expected, 0.02, `Mercury and Jupiter in full, ${PLANETS[index]}`));
}

// ---------------------------------------------------------------------------
// The JHora-like choices reproduce JHora's own figures for the reference chart
// ---------------------------------------------------------------------------
{
  const rows = buildShadbalaRows(REFERENCE_CHART, JHORA_LIKE_BALA_OPTIONS);
  // JHora's Dṛg Bala (its screen to one decimal) and Cheṣṭā Bala of Mars to Saturn.
  [20.5, -2.2, 7.3, 15.8, -16.2, 20.7, 12.7].forEach((expected, index) => close(rows[index].drikVirupa, expected, 0.06, `JHora Drig, ${PLANETS[index]}`));
  [7.4, 49.0, 58.7, 9.0, 18.8].forEach((expected, index) => close(rows[index + 2].cheshtaVirupa, expected, 0.15, `JHora Cheshta, ${PLANETS[index + 2]}`));
  assert.equal(rows[0].cheshtaVirupa, 0);
  close(rows[0].digVirupa, 9.7, 0.05, 'JHora Dig Bala of the Sun');
  close(rows[0].sthanaBreakdown.saptavargaja, 142.5, 1e-9, 'JHora Saptavargaja of the Sun');
}

// ---------------------------------------------------------------------------
// Bhāva Bala (C8, C9, C10, C11)
// ---------------------------------------------------------------------------
{
  const shadbala = buildShadbalaRows(REFERENCE_CHART);
  const bhava = (change: Partial<BalaOptions>) => buildClassicalBhavaBala(REFERENCE_CHART, shadbala, { ...DEFAULT_BALA_OPTIONS, ...change });
  const totals = (rows: ReturnType<typeof bhava>) => rows.map((row) => row.total);
  const expectTotals = (rows: ReturnType<typeof bhava>, expected: number[], message: string) =>
    expected.forEach((value, index) => close(rows[index].total, value, 0.6, `${message}, house ${index + 1}`));

  expectTotals(bhava({ bhavaHouses: 'sripati' }), [511.4, 351.4, 494.8, 601.3, 332.4, 512.7, 464.6, 427.7, 427.7, 499.5, 527.8, 610.0], 'Śrīpati houses');
  expectTotals(bhava({ bhavaHouses: 'equal-from-lagna' }), [367.1, 498.4, 510.2, 332.4, 503.0, 478.4, 430.5, 424.8, 473.2, 526.9, 602.7, 516.9], 'equal houses from the Lagna');
  expectTotals(bhava({ bhavaCancer: 'midheaven' }), [547.0, 354.4, 450.9, 566.4, 332.2, 512.5, 472.1, 428.2, 418.9, 485.0, 523.0, 608.6], 'Cancer from the midheaven');
  expectTotals(bhava({ bhavaMercuryJupiter: 'full-addon' }), [532.2, 366.5, 457.5, 579.7, 345.1, 527.4, 484.5, 436.2, 419.8, 498.2, 536.4, 623.7], 'Mercury and Jupiter on top');
  expectTotals(bhava({ bhavaMercuryJupiter: 'quarter' }), [463.7, 317.9, 431.0, 526.3, 293.5, 467.5, 434.8, 404.4, 416.1, 445.6, 482.9, 563.6], 'the quarter only');
  expectTotals(bhava({ bhavaParts: 'three' }), [500.1, 354.4, 570.9, 506.4, 392.2, 497.5, 457.1, 428.2, 418.9, 410.0, 508.0, 608.6], 'Raman\'s three parts');
  // In Śrīpati's houses the lords differ from the sign lords in the 1st-to-4th and 10th houses of this chart.
  const sripati = bhava({ bhavaHouses: 'sripati' });
  assert.equal(sripati[3].lord, 'Mercury', 'the middle of the 4th house is in Virgo');
  assert.equal(sripati[9].lord, 'Jupiter', 'the middle of the 10th house is in Pisces');
  assert.equal(totals(bhava({})).length, 12);
  // Mercury sits 0.14° short of the border between the 4th and 5th Śrīpati houses.
  assert.equal(sripati[3].occupants.some((occupant) => occupant.name === 'Mercury'), true);
  assert.equal(bhava({ bhavaParts: 'three' }).every((row) => row.occupantTotal === 0 && row.kala === 0), true, 'no occupants and no Kāla in the three parts');
  // Without a midheaven Śrīpati's houses fall back on whole signs.
  const withoutMidheaven = buildClassicalBhavaBala({ ...REFERENCE_CHART, midheaven: undefined }, shadbala, { ...DEFAULT_BALA_OPTIONS, bhavaHouses: 'sripati' });
  assert.equal(withoutMidheaven[0].sign, 'Cn');
  close(withoutMidheaven[0].middle ?? 0, 105, 1e-9, 'whole-sign fallback');
}

console.log('Bala options tests passed');
