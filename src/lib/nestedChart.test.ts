import assert from 'node:assert/strict';
import { CHART_SIZE, INNER_SQUARE, SOUTH_CENTRE, centroidOf, houseOfSign, insideSquare, northRegions, outsideSquare, polygonArea, southRegions } from './nestedChart';

const near = (actual: number, expected: number, message: string, epsilon = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${message}: ${actual} vs ${expected}`);

// The inner square is three quarters of the chart, in the middle.
near(INNER_SQUARE.x0, 62.5, 'left of the inner square');
near(INNER_SQUARE.x1, 437.5, 'right of the inner square');
near(INNER_SQUARE.y0, 62.5, 'top');
near(INNER_SQUARE.y1, 437.5, 'bottom');

// The twelve houses of the North Indian chart fill the square, and each is cut in two by the inner square.
const north = northRegions();
assert.equal(north.length, 12);
assert.deepEqual(north.map(region => region.house), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
near(north.reduce((sum, region) => sum + polygonArea(region.polygon), 0), CHART_SIZE * CHART_SIZE, 'the houses fill the chart');
let outerTotal = 0;
let innerTotal = 0;
for (const region of north) {
  const whole = polygonArea(region.polygon);
  assert.ok(region.inner.length >= 3 && region.outer.length >= 3, `house ${region.house} has both an inner and an outer part`);
  near(polygonArea(region.inner) + polygonArea(region.outer), whole, `house ${region.house}: the two parts are the whole house`, 1e-6);
  assert.ok(region.inner.every(([x, y]) => x >= 62.5 - 1e-9 && x <= 437.5 + 1e-9 && y >= 62.5 - 1e-9 && y <= 437.5 + 1e-9), `house ${region.house}: the inner part is in the square`);
  assert.ok(region.outer.every(([x, y]) => x <= 62.5 + 1e-9 || x >= 437.5 - 1e-9 || y <= 62.5 + 1e-9 || y >= 437.5 - 1e-9), `house ${region.house}: the outer part is outside it`);
  outerTotal += polygonArea(region.outer);
  innerTotal += polygonArea(region.inner);
}
near(innerTotal, 375 * 375, 'together the inner parts are the inner square');
near(outerTotal, 500 * 500 - 375 * 375, 'and the outer parts the band around it');
const centre = north[3];
assert.ok(polygonArea(centre.inner) > polygonArea(centre.outer), 'the kite of house 4 is mostly inside');
assert.ok(north[1].signAt[1] > 62.5, 'the sign of house 2 is in its inner part');

// The South Indian chart: twelve sign cells around the four cells of the middle.
const south = southRegions();
assert.equal(south.length, 12);
assert.deepEqual(south.map(region => region.sign!).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
const cell = 125;
near(south.reduce((sum, region) => sum + polygonArea(region.polygon), 0) + (SOUTH_CENTRE.x1 - SOUTH_CENTRE.x0) * (SOUTH_CENTRE.y1 - SOUTH_CENTRE.y0), CHART_SIZE * CHART_SIZE, 'the cells and the middle fill the chart');
const aries = south.find(region => region.sign === 1)!;
near(polygonArea(aries.inner), cell * cell / 2, 'an edge cell is half inside the square');
near(polygonArea(aries.outer), cell * cell / 2, 'and half outside');
const pisces = south.find(region => region.sign === 12)!;
near(polygonArea(pisces.inner), (cell / 2) * (cell / 2), 'a corner cell has a quarter inside');
near(polygonArea(pisces.outer), cell * cell / 2, 'and its outer part is the longer strip, half the cell');
for (const region of south) {
  assert.ok(polygonArea(region.inner) > 0 && polygonArea(region.outer) > 0, `sign ${region.sign} has both parts`);
  const [x, y] = centroidOf(region.inner);
  assert.ok(x >= 62.5 && x <= 437.5 && y >= 62.5 && y <= 437.5, `sign ${region.sign}: the inner part is inside`);
}

// Clipping on its own.
assert.deepEqual(insideSquare([[0, 0], [50, 0], [50, 50], [0, 50]]), [], 'a polygon wholly outside has no inner part');
assert.equal(outsideSquare([[100, 100], [150, 100], [150, 150], [100, 150]]).length, 0, 'a polygon wholly inside has no outer part');
near(polygonArea(insideSquare([[0, 0], [500, 0], [500, 500], [0, 500]])), 375 * 375, 'the whole chart cut to the square');
near(polygonArea(outsideSquare([[0, 0], [500, 0], [500, 500], [0, 500]])), 500 * 62.5, 'its largest outer piece is one of the four strips');

// The house of a sign, counted from the lagna.
assert.equal(houseOfSign(1, 1), 1);
assert.equal(houseOfSign(1, 6), 8, 'Aries from a Virgo lagna is the 8th');
assert.equal(houseOfSign(12, 1), 12);

console.log('Nested chart geometry tests passed');
