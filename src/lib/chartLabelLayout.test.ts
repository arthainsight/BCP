import assert from 'node:assert/strict';
import { layoutHouseLabels, polygonSpanAt, type LabelToken, type Point } from './chartLabelLayout';

// ---------------------------------------------------------------------------
// Label layout for the North Indian chart houses.
//
// The geometry is checked with the chart's own polygons: the 1st house
// diamond and the 11th house side triangle, which overflowed before.
// ---------------------------------------------------------------------------
const DIAMOND: Point[] = [[250, 0], [375, 125], [250, 250], [125, 125]];
const SIDE_TRIANGLE: Point[] = [[500, 250], [375, 125], [500, 0]];
const CHAR = 0.6;

const token = (group: LabelToken['group'], text: string, i = 0): LabelToken => ({ key: `${group}-${text}-${i}`, group, text });

// polygonSpanAt
assert.deepEqual(polygonSpanAt(DIAMOND, 125), [125, 375]);
assert.deepEqual(polygonSpanAt(DIAMOND, 50), [200, 300]);
assert.deepEqual(polygonSpanAt(SIDE_TRIANGLE, 125), [375, 500]);
assert.equal(polygonSpanAt(DIAMOND, 300), null);

/** Every label lies inside the polygon, with its full glyph height. */
function assertInside(polygon: Point[], layout: ReturnType<typeof layoutHouseLabels>) {
  for (const row of layout.rows) {
    const width = row.tokens.reduce((sum, t, i) => sum + (Array.from(t.text).length + (i ? 1 : 0)) * row.fontSize * CHAR, 0);
    for (const y of [row.y - row.fontSize / 2, row.y + row.fontSize / 2]) {
      const span = polygonSpanAt(polygon, y);
      assert.ok(span, `row at ${row.y} is outside the house`);
      assert.ok(row.x - width / 2 >= span[0] - 0.01 && row.x + width / 2 <= span[1] + 0.01, `row "${row.tokens.map(t => t.text).join(' ')}" crosses the house edge`);
    }
  }
}

// --- A light house keeps the largest font ------------------------------------
const light = layoutHouseLabels([token('natal', 'Su'), token('natal', 'Mo')], { polygon: DIAMOND, anchorY: 115 });
assert.equal(light.fontSize, 16);
assert.equal(light.overflow, false);
assertInside(DIAMOND, light);

// --- The crowded 11th house of the 1947 test chart now fits -------------------
const crowded = [
  token('paraya', 'Ke 12.8°'),
  ...['Su 28°21\' Asl', 'Mo 9°48\' Pus', 'Me 14°22\' Pus', 'Ve 23°2\' Asl', 'Sa 20°31\' Asl'].map((t, i) => token('natal', t, i)),
  ...['Mo 20°53\'', 'Ma 10°22\'', 'Ju 26°14\''].map((t, i) => token('transit', t, i)),
];
const fitted = layoutHouseLabels(crowded, {
  polygon: SIDE_TRIANGLE,
  exclude: [{ x0: 387, x1: 413, y0: 121, y1: 138 }],
  anchorY: 130,
}, { maxFontSize: 13 });
assert.equal(fitted.overflow, false);
assert.ok(fitted.fontSize < 13, 'a crowded house shrinks its font');
assertInside(SIDE_TRIANGLE, fitted);
assert.deepEqual(
  fitted.rows.flatMap(row => row.tokens.map(t => t.key)),
  crowded.map(t => t.key),
  'every label is drawn once, in group order',
);
for (const row of fitted.rows) {
  assert.ok(row.x - 13 > 413 || row.y + row.fontSize / 2 <= 121 || row.y - row.fontSize / 2 >= 138, 'labels avoid the sign label');
}

// --- Short transit codes share a row ------------------------------------------
const transits = layoutHouseLabels(
  ['Mo', 'Ma', 'Ju'].map((t, i) => token('transit', t, i)),
  { polygon: DIAMOND, anchorY: 115 },
);
assert.equal(transits.rows.length, 1);

// --- Groups never share a row -------------------------------------------------
const mixed = layoutHouseLabels([token('natal', 'Su'), token('transit', 'Mo')], { polygon: DIAMOND, anchorY: 115 });
assert.deepEqual(mixed.rows.map(row => row.group), ['natal', 'transit']);

// --- Asc comes first, then Paraya, natal, transits, special lagnas -----------
const ordered = layoutHouseLabels(
  [token('special', 'HL'), token('transit', 'Mo'), token('natal', 'Su'), token('paraya', 'Ju 4.3°'), token('asc', 'Asc 12°18\'')],
  { polygon: DIAMOND, anchorY: 115 },
);
assert.deepEqual(ordered.rows.map(row => row.group), ['asc', 'paraya', 'natal', 'transit', 'special']);

// --- Far too much text is still drawn and reported ---------------------------
const tooMuch = layoutHouseLabels(
  Array.from({ length: 40 }, (_, i) => token('natal', 'Su 28°21\'34" AK Asl', i)),
  { polygon: SIDE_TRIANGLE, anchorY: 130 },
);
assert.equal(tooMuch.overflow, true);
assert.equal(tooMuch.rows.length, 40);

// --- No labels, no rows -------------------------------------------------------
assert.deepEqual(layoutHouseLabels([], { polygon: DIAMOND, anchorY: 115 }).rows, []);
