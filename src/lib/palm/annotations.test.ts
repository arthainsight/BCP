import assert from 'node:assert/strict';
import {
  STROKE_DEFAULT, STROKE_MAX, STROKE_MIN, anchorOf, arrowHead, boundingBox, clampStroke, distanceToSegment, hitTest, isNumbered, moveAnnotation, newId, noteList, numbering,
  pathData, pushHistory, redoHistory, sanitizeAnnotations, simplifyPath, startHistory, undoHistory, unitOf,
  type Annotation, type Point,
} from './annotations';
import { fitTransform, focusTransform, toImage, zoomAt } from './viewport';

const near = (actual: number, expected: number, message: string, epsilon = 1e-6) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `${message}: ${actual} vs ${expected}`);
const base = { color: '#ef4444', width: 4 };
const pen = (id: string, points: Point[]): Annotation => ({ ...base, id, kind: 'pen', points });
const arrow = (id: string, from: Point, to: Point): Annotation => ({ ...base, id, kind: 'arrow', from, to });
const ellipse = (id: string, from: Point, to: Point): Annotation => ({ ...base, id, kind: 'ellipse', from, to });
const pin = (id: string, at: Point, extra: Partial<Annotation> = {}): Annotation => ({ ...base, id, kind: 'pin', at, ...extra } as Annotation);
const text = (id: string, at: Point, label: string): Annotation => ({ ...base, id, kind: 'text', at, size: 30, label });

// Units: a thousandth of the longer side of the photo.
assert.equal(unitOf(3000, 2000), 3);
assert.notEqual(newId(), newId());

// Distance to a segment: along it, beyond its end, and to a degenerate one.
near(distanceToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 3, 'beside the segment');
near(distanceToSegment({ x: 13, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 5, 'beyond the end');
near(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 }), 5, 'a single point');

// Anchors and boxes.
assert.deepEqual(anchorOf(pen('p', [{ x: 1, y: 2 }, { x: 5, y: 6 }])), { x: 1, y: 2 });
assert.deepEqual(anchorOf(arrow('a', { x: 3, y: 4 }, { x: 9, y: 9 })), { x: 3, y: 4 });
const box = boundingBox(arrow('a', { x: 10, y: 20 }, { x: 50, y: 60 }));
assert.deepEqual([box.x, box.y, box.width, box.height], [8, 18, 44, 44]);

// Moving an annotation moves all of its geometry and leaves the rest.
const moved = moveAnnotation(pen('p', [{ x: 0, y: 0 }, { x: 10, y: 5 }]), 3, -2) as Extract<Annotation, { kind: 'pen' }>;
assert.deepEqual(moved.points, [{ x: 3, y: -2 }, { x: 13, y: 3 }]);
assert.equal(moved.id, 'p');
assert.deepEqual((moveAnnotation(pin('q', { x: 1, y: 1 }), 2, 2) as Extract<Annotation, { kind: 'pin' }>).at, { x: 3, y: 3 });
const movedEllipse = moveAnnotation(ellipse('e', { x: 0, y: 0 }, { x: 10, y: 20 }), 5, 5) as Extract<Annotation, { kind: 'ellipse' }>;
assert.deepEqual([movedEllipse.from, movedEllipse.to], [{ x: 5, y: 5 }, { x: 15, y: 25 }]);

// Hit testing: the topmost annotation within reach; lines, ellipse outlines, pins and text.
const list: Annotation[] = [
  pen('stroke', [{ x: 0, y: 100 }, { x: 200, y: 100 }]),
  arrow('arrow', { x: 0, y: 0 }, { x: 100, y: 0 }),
  ellipse('ring', { x: 300, y: 300 }, { x: 400, y: 340 }),
  pin('pin', { x: 500, y: 500 }),
  text('words', { x: 600, y: 600 }, 'Fate'),
];
assert.equal(hitTest(list, { x: 50, y: 101 }, 1, 6)?.id, 'stroke');
assert.equal(hitTest(list, { x: 50, y: 4 }, 1, 6)?.id, 'arrow');
assert.equal(hitTest(list, { x: 50, y: 30 }, 1, 6), null, 'too far from anything');
assert.equal(hitTest(list, { x: 350, y: 300 }, 1, 6)?.id, 'ring', 'on the outline');
assert.equal(hitTest(list, { x: 350, y: 320 }, 1, 6), null, 'inside the ellipse is not on it');
assert.equal(hitTest(list, { x: 505, y: 505 }, 1, 6)?.id, 'pin', 'inside the badge');
assert.equal(hitTest(list, { x: 520, y: 500 }, 1, 6)?.id, 'pin', 'badge radius is 22 units');
assert.equal(hitTest(list, { x: 620, y: 590 }, 1, 6)?.id, 'words');
// Overlapping annotations: the one drawn last wins.
assert.equal(hitTest([pen('under', [{ x: 0, y: 0 }, { x: 100, y: 0 }]), pen('over', [{ x: 0, y: 0 }, { x: 100, y: 0 }])], { x: 50, y: 0 }, 1, 4)?.id, 'over');
// A note makes the badge of a line a target of its own.
assert.equal(hitTest([{ ...arrow('n', { x: 0, y: 0 }, { x: 100, y: 0 }), note: 'x' } as Annotation], { x: 0, y: 12 }, 1, 2)?.id, 'n');

// Pen strokes: simplification keeps the shape and drops the points in between.
const dense = Array.from({ length: 50 }, (_, index) => ({ x: index * 2, y: 0 }));
assert.deepEqual(simplifyPath(dense, 0.5), [dense[0], dense[49]], 'a straight run becomes its two ends');
const corner = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 10, y: 10 }];
assert.deepEqual(simplifyPath(corner, 0.5), [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], 'the corner stays');
assert.deepEqual(simplifyPath([{ x: 1, y: 1 }], 1), [{ x: 1, y: 1 }]);

// Path data: a dot, a line and a smoothed curve.
assert.match(pathData([{ x: 1, y: 2 }]), /^M1 2l0\.01 0$/);
assert.equal(pathData([{ x: 1, y: 2 }, { x: 3, y: 4 }]), 'M1 2L3 4');
assert.equal(pathData([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }]), 'M0 0Q10 0 10 5L10 10');
assert.equal(pathData([]), '');

// The wings of an arrow head are symmetric about the line.
const [left, right] = arrowHead({ x: 0, y: 0 }, { x: 100, y: 0 }, 20);
near(left.x, right.x, 'same distance back');
near(left.y, -right.y, 'mirrored across the line');
assert.ok(left.x < 100 && left.x > 70);

// Numbering: pins always, other annotations once they carry a note, in drawing order.
const noted = [
  pen('a', [{ x: 0, y: 0 }]),
  { ...pen('b', [{ x: 0, y: 0 }]), note: ' Life line ' } as Annotation,
  pin('c', { x: 1, y: 1 }, { label: '25', note: 'Move abroad' }),
  pin('d', { x: 2, y: 2 }),
  { ...arrow('e', { x: 0, y: 0 }, { x: 1, y: 1 }), note: '   ' } as Annotation,
];
assert.equal(isNumbered(noted[0]), false);
assert.equal(isNumbered(noted[1]), true);
assert.equal(isNumbered(noted[4]), false, 'a blank note does not count');
assert.deepEqual([...numbering(noted).entries()], [['b', 1], ['c', 2], ['d', 3]]);
assert.deepEqual(noteList(noted), [
  { number: 1, id: 'b', label: '', note: 'Life line' },
  { number: 2, id: 'c', label: '25', note: 'Move abroad' },
  { number: 3, id: 'd', label: '', note: '' },
]);

// History: undo and redo, and a new step drops the steps that were undone.
let history = startHistory<number[]>([]);
history = pushHistory(history, [1]);
history = pushHistory(history, [1, 2]);
assert.deepEqual(undoHistory(history).present, [1]);
assert.deepEqual(redoHistory(undoHistory(history)).present, [1, 2]);
assert.deepEqual(undoHistory(undoHistory(undoHistory(history))).present, [], 'undo stops at the start');
assert.deepEqual(redoHistory(history), history, 'nothing to redo');
assert.deepEqual(pushHistory(undoHistory(history), [9]).future, []);
assert.equal(pushHistory(startHistory(0), 1, 3).past.length, 1);
let long = startHistory(0);
for (let step = 1; step <= 10; step++) long = pushHistory(long, step, 3);
assert.deepEqual(long.past, [7, 8, 9], 'only the last steps are kept');

// Saved data: well-formed annotations survive, the rest are dropped.
const saved = sanitizeAnnotations([
  pen('ok', [{ x: 1, y: 2 }]),
  { ...pin('pin', { x: 1, y: 1 }), label: 'a', note: 'b' },
  text('t', { x: 1, y: 1 }, 'hi'),
  { id: 'bad1', kind: 'pen', color: 'red', width: 3, points: [] },
  { id: 'bad2', kind: 'arrow', color: 'red', width: 3, from: { x: 1, y: 1 } },
  { id: 'bad3', kind: 'wavy', color: 'red', width: 3 },
  { kind: 'pin', at: { x: 1, y: 1 } },
  { id: 'bad4', kind: 'pin', color: 'red', width: NaN, at: { x: 1, y: 1 } },
  'nonsense',
  null,
]);
assert.deepEqual(saved.map(item => item.id), ['ok', 'pin', 't']);
assert.equal(saved[1].label, 'a');
assert.deepEqual(sanitizeAnnotations('nothing'), []);
assert.deepEqual(sanitizeAnnotations(undefined), []);

// The viewport: fit, zoom around a point, window ↔ photo, focus on a box.
const fit = fitTransform(800, 600, 2000, 1000, 0);
near(fit.k, 0.4, 'fits the width');
near(fit.tx, 0, 'no horizontal margin');
near(fit.ty, 100, 'centred vertically');
const zoomed = zoomAt(fit, 400, 300, 2, fit.k);
near(zoomed.k, 0.8, 'doubled');
const centreBefore = toImage(fit, 400, 300);
const centreAfter = toImage(zoomed, 400, 300);
near(centreBefore.x, centreAfter.x, 'the point under the cursor stays put (x)');
near(centreBefore.y, centreAfter.y, 'the point under the cursor stays put (y)');
near(zoomAt(fit, 0, 0, 1000, fit.k).k, fit.k * 12, 'zoom is capped');
near(zoomAt(fit, 0, 0, 0.0001, fit.k).k, fit.k * 0.5, 'and so is zooming out');
const focus = focusTransform({ x: 900, y: 400, width: 200, height: 200 }, 800, 600, 3, 0);
near(focus.k, 3, 'a small box is shown no larger than the limit');
const centre = toImage(focus, 400, 300);
near(centre.x, 1000, 'the box is centred (x)');
near(centre.y, 500, 'the box is centred (y)');

console.log('Palm annotation tests passed');

// --- Stroke width ---------------------------------------------------------------
assert.equal(clampStroke(6), 6);
assert.equal(clampStroke(6.3), 6.5, 'in whole steps of half a unit');
assert.equal(clampStroke(0), STROKE_MIN, 'a hairline is the thinnest');
assert.equal(clampStroke(500), STROKE_MAX, 'a marker pen is the thickest');
assert.equal(clampStroke(Number.NaN), STROKE_DEFAULT, 'not a number is the usual width');
assert.ok(STROKE_MIN < STROKE_DEFAULT && STROKE_DEFAULT < STROKE_MAX);
