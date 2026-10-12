import assert from 'node:assert/strict';
import {
  AGE_DEFAULT, RULER_DEFAULT_PARTS, RULER_MAX_PARTS, ageMarks, ageValues, clampParts, validAgeScale, validScale, eraseAlong, eraseAt, handleAt, handlesOf, reshapeAnnotation, rulerGeometry, rulerLabel, rulerPoints, snapPoint, snapTargets,
  STROKE_DEFAULT, STROKE_MAX, STROKE_MIN, anchorOf, arrowHead, boundingBox, clampStroke, distanceToSegment, hitTest, isNumbered, moveAnnotation, newId, noteList, numbering,
  pathData, pushHistory, redoHistory, sanitizeAnnotations, simplifyPath, startHistory, undoHistory, unitOf,
  type Annotation, type LineAnnotation, type Point,
} from './annotations';
import { fitTransform, focusTransform, fromLinkedView, toImage, toLinkedView, zoomAt } from './viewport';

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

// --- The circle ----------------------------------------------------------------------
const circle = (id: string, at: Point, radius: number): Annotation => ({ ...base, id, kind: 'circle', at, radius });
const ruler = (id: string, from: Point, to: Point, parts = 2): Annotation => ({ ...base, id, kind: 'ruler', from, to, parts });

const ring = circle('ring', { x: 100, y: 100 }, 40);
assert.deepEqual(anchorOf(ring), { x: 100, y: 100 }, 'a circle is anchored at its centre');
const ringBox = boundingBox(ring);
assert.deepEqual([ringBox.x, ringBox.y, ringBox.width, ringBox.height], [58, 58, 84, 84]);
assert.deepEqual((moveAnnotation(ring, 5, -5) as Extract<Annotation, { kind: 'circle' }>).at, { x: 105, y: 95 });
assert.equal(hitTest([ring], { x: 140, y: 100 }, 1, 6)?.id, 'ring', 'on the outline');
assert.equal(hitTest([ring], { x: 100, y: 100 }, 1, 6), null, 'inside a circle is not on it');
assert.equal(sanitizeAnnotations([ring, circle('flat', { x: 1, y: 1 }, 0), { ...base, id: 'bad', kind: 'circle', at: { x: 1, y: 1 } }]).map(item => item.id).join(), 'ring', 'a circle needs a radius');

// --- The ruler -----------------------------------------------------------------------
assert.equal(clampParts(2), 2);
assert.equal(clampParts(0), 1, 'at least one part');
assert.equal(clampParts(99), RULER_MAX_PARTS);
assert.equal(clampParts(3.4), 3, 'whole parts');
assert.equal(clampParts(Number.NaN), RULER_DEFAULT_PARTS);
assert.deepEqual(rulerPoints({ x: 0, y: 0 }, { x: 100, y: 50 }, 2), [{ x: 0, y: 0 }, { x: 50, y: 25 }, { x: 100, y: 50 }], 'two parts: the middle');
assert.equal(rulerPoints({ x: 0, y: 0 }, { x: 90, y: 0 }, 3).length, 4, 'a mark for every division and both ends');
near(rulerPoints({ x: 0, y: 0 }, { x: 90, y: 0 }, 3)[1].x, 30, 'thirds');
assert.equal(rulerLabel(ruler('r', { x: 0, y: 0 }, { x: 300, y: 400 }, 1) as Extract<Annotation, { kind: 'ruler' }>), '500', 'the length alone');
assert.equal(rulerLabel(ruler('r', { x: 0, y: 0 }, { x: 300, y: 400 }, 2) as Extract<Annotation, { kind: 'ruler' }>), '500 ÷ 2 = 250', 'and a part of it');
assert.equal(rulerLabel(ruler('r', { x: 0, y: 0 }, { x: 100, y: 0 }, 3) as Extract<Annotation, { kind: 'ruler' }>), '100 ÷ 3 = 33.3');

const flat = rulerGeometry(ruler('f', { x: 0, y: 100 }, { x: 200, y: 100 }, 4) as Extract<Annotation, { kind: 'ruler' }>, 1);
assert.equal(flat.ticks.length, 5);
assert.deepEqual(flat.middle, { x: 100, y: 100 }, 'an even number of parts has a middle');
assert.ok(flat.label.at.y < 100 && flat.label.anchor === 'middle', 'the figures sit above a level ruler');
assert.equal(rulerGeometry(ruler('f', { x: 0, y: 0 }, { x: 90, y: 0 }, 3) as Extract<Annotation, { kind: 'ruler' }>, 1).middle, null, 'three parts have no middle mark');
const upright = rulerGeometry(ruler('u', { x: 100, y: 0 }, { x: 100, y: 200 }) as Extract<Annotation, { kind: 'ruler' }>, 1);
assert.ok(upright.label.at.x > 100 && upright.label.anchor === 'start', 'beside an upright ruler, to the right');
assert.ok(flat.ticks[0][0].y !== flat.ticks[0][1].y, 'the marks cross the line');
assert.ok(Number.isFinite(rulerGeometry(ruler('z', { x: 5, y: 5 }, { x: 5, y: 5 }) as Extract<Annotation, { kind: 'ruler' }>, 1).label.at.x), 'a ruler without length does not break');

const loadedRuler = sanitizeAnnotations([{ id: 'r', kind: 'ruler', color: '#fff', width: 3, from: { x: 0, y: 0 }, to: { x: 10, y: 0 } }]);
assert.equal((loadedRuler[0] as Extract<Annotation, { kind: 'ruler' }>).parts, RULER_DEFAULT_PARTS, 'a ruler without parts has two');
assert.equal(hitTest([ruler('r', { x: 0, y: 0 }, { x: 100, y: 0 })], { x: 50, y: 2 }, 1, 6)?.id, 'r');

// --- Changing a drawing: handles ---------------------------------------------------------
assert.deepEqual(handlesOf(arrow('a', { x: 1, y: 2 }, { x: 3, y: 4 })).map(handle => handle.id), ['from', 'to']);
assert.deepEqual(handlesOf(ring).map(handle => [handle.id, handle.at]), [['radius', { x: 140, y: 100 }]]);
assert.deepEqual(handlesOf(ellipse('e', { x: 50, y: 10 }, { x: 10, y: 60 })).map(handle => handle.at), [{ x: 10, y: 10 }, { x: 50, y: 10 }, { x: 10, y: 60 }, { x: 50, y: 60 }], 'the corners of the box, whichever way it was drawn');
assert.equal(handlesOf(pen('p', [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 9, y: 2 }])).length, 3, 'a stroke has a handle for every point');
assert.deepEqual(handlesOf(pin('q', { x: 1, y: 1 })), [], 'a pin is only moved');
assert.deepEqual(handlesOf(text('t', { x: 1, y: 1 }, 'hi')), []);

const dragged = reshapeAnnotation(arrow('a', { x: 0, y: 0 }, { x: 10, y: 0 }), 'to', { x: 30, y: 40 }) as LineAnnotation;
assert.deepEqual([dragged.from, dragged.to], [{ x: 0, y: 0 }, { x: 30, y: 40 }], 'one end moves, the other stays');
assert.equal(dragged.kind, 'arrow');
near((reshapeAnnotation(ring, 'radius', { x: 100, y: 160 }) as Extract<Annotation, { kind: 'circle' }>).radius, 60, 'the radius follows the handle, in any direction');
assert.deepEqual((reshapeAnnotation(ring, 'radius', { x: 100, y: 160 }) as Extract<Annotation, { kind: 'circle' }>).at, { x: 100, y: 100 }, 'the centre stays');
const reshaped = reshapeAnnotation(ellipse('e', { x: 10, y: 10 }, { x: 50, y: 60 }), 'se', { x: 80, y: 90 }) as Extract<Annotation, { kind: 'ellipse' }>;
assert.deepEqual([reshaped.from, reshaped.to], [{ x: 10, y: 10 }, { x: 80, y: 90 }], 'the opposite corner stays');
const reshapedNw = reshapeAnnotation(ellipse('e', { x: 10, y: 10 }, { x: 50, y: 60 }), 'nw', { x: 0, y: 5 }) as Extract<Annotation, { kind: 'ellipse' }>;
assert.deepEqual([reshapedNw.from, reshapedNw.to], [{ x: 50, y: 60 }, { x: 0, y: 5 }]);
const bent = reshapeAnnotation(pen('p', [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 9, y: 2 }]), 'p1', { x: 5, y: 20 }) as Extract<Annotation, { kind: 'pen' }>;
assert.deepEqual(bent.points, [{ x: 0, y: 0 }, { x: 5, y: 20 }, { x: 9, y: 2 }], 'one point of a stroke moves');
assert.equal(reshapeAnnotation(pin('q', { x: 1, y: 1 }), 'at', { x: 9, y: 9 }).kind, 'pin');
assert.equal((reshapeAnnotation(ring, 'radius', { x: 100, y: 100 }) as Extract<Annotation, { kind: 'circle' }>).radius, 1, 'a circle never shrinks to nothing');

const handles = handlesOf(arrow('a', { x: 0, y: 0 }, { x: 10, y: 0 }));
assert.equal(handleAt(handles, { x: 9, y: 1 }, 3)?.id, 'to');
assert.equal(handleAt(handles, { x: 5, y: 0 }, 3), null, 'in the middle there is no handle');

// --- Snapping ---------------------------------------------------------------------------
const targets = snapTargets([
  ruler('r', { x: 0, y: 0 }, { x: 100, y: 0 }, 2),
  arrow('a', { x: 0, y: 50 }, { x: 40, y: 50 }),
  ring,
  pen('p', [{ x: 300, y: 300 }, { x: 310, y: 305 }, { x: 330, y: 300 }]),
  pin('pin', { x: 500, y: 500 }),
  text('t', { x: 600, y: 600 }, 'x'),
]);
assert.deepEqual(snapPoint(targets, { x: 52, y: 3 }, 6), { x: 50, y: 0 }, 'the middle of the ruler');
assert.deepEqual(snapPoint(targets, { x: 21, y: 48 }, 6), { x: 20, y: 50 }, 'the middle of an arrow');
assert.deepEqual(snapPoint(targets, { x: 98, y: 98 }, 6), { x: 100, y: 100 }, 'the centre of a circle');
assert.deepEqual(snapPoint(targets, { x: 329, y: 301 }, 6), { x: 330, y: 300 }, 'the end of a stroke');
assert.equal(snapPoint(targets, { x: 310, y: 305 }, 3), null, 'a point in the middle of a stroke is not a target');
assert.equal(snapPoint(targets, { x: 600, y: 600 }, 6), null, 'text is not a target');
assert.equal(snapPoint(targets, { x: 70, y: 20 }, 6), null, 'too far from everything');
assert.equal(snapTargets([ruler('r', { x: 0, y: 0 }, { x: 100, y: 0 })], 'r').length, 0, 'a drawing does not snap to itself');

// --- The eraser ---------------------------------------------------------------------------
let counter = 0;
const ids = () => `new${++counter}`;
const longStroke = { ...pen('stroke', [{ x: 0, y: 100 }, { x: 100, y: 100 }, { x: 200, y: 100 }]), note: 'Life line', label: '30' } as Annotation;
const untouched = eraseAt([longStroke], { x: 100, y: 300 }, 10, 1, ids);
assert.equal(untouched.length, 1);
assert.equal(eraseAt([longStroke], { x: 100, y: 300 }, 10, 1, ids)[0], longStroke, 'untouched drawings are left as they were');
const sameList = [longStroke];
assert.equal(eraseAt(sameList, { x: 100, y: 300 }, 10, 1, ids), sameList, 'the same list when nothing was touched');

const cutMiddle = eraseAt([longStroke], { x: 100, y: 100 }, 10, 1, ids);
assert.equal(cutMiddle.length, 2, 'wiping the middle leaves two pieces');
const [firstPiece, secondPiece] = cutMiddle as Extract<Annotation, { kind: 'pen' }>[];
assert.equal(firstPiece.id, 'stroke', 'the first piece is the stroke itself');
assert.equal(firstPiece.note, 'Life line', 'and keeps its note');
assert.ok(secondPiece.id !== 'stroke' && secondPiece.note === undefined && secondPiece.label === undefined, 'the other piece is new and has no note');
assert.ok(firstPiece.points[firstPiece.points.length - 1].x < 95 && firstPiece.points[0].x === 0, 'the first piece ends before the eraser');
assert.ok(secondPiece.points[0].x > 105 && secondPiece.points[secondPiece.points.length - 1].x === 200, 'the second begins after it');
assert.equal(secondPiece.color, longStroke.color);

const cutEnd = eraseAt([longStroke], { x: 200, y: 100 }, 10, 1, ids);
assert.equal(cutEnd.length, 1, 'wiping the end shortens the stroke');
assert.ok((cutEnd[0] as Extract<Annotation, { kind: 'pen' }>).points.at(-1)!.x < 195);
assert.deepEqual(eraseAt([pen('dot', [{ x: 5, y: 5 }])], { x: 6, y: 6 }, 10, 1, ids), [], 'a dot is wiped out');
assert.deepEqual(eraseAt([pen('short', [{ x: 0, y: 0 }, { x: 8, y: 0 }])], { x: 4, y: 0 }, 10, 1, ids), [], 'a stroke that is wiped away entirely is gone');

const sweep = eraseAlong([pen('s', [{ x: 0, y: 100 }, { x: 200, y: 100 }])], { x: 100, y: 60 }, { x: 100, y: 140 }, 10, 1, ids);
assert.equal(sweep.length, 2, 'a quick sweep across a stroke cuts it, though no step of it lay on the stroke');

const cutLine = eraseAt([{ ...base, id: 'l', kind: 'line', from: { x: 0, y: 0 }, to: { x: 200, y: 0 } } as Annotation], { x: 100, y: 0 }, 10, 1, ids) as LineAnnotation[];
assert.equal(cutLine.length, 2, 'a line is cut in two');
assert.ok(cutLine[0].to.x < 95 && cutLine[1].from.x > 105);
const cutArrow = eraseAt([arrow('ar', { x: 0, y: 0 }, { x: 200, y: 0 })], { x: 100, y: 0 }, 10, 1, ids);
assert.deepEqual(cutArrow.map(item => item.kind), ['line', 'arrow'], 'the arrow head stays on the piece at its end');
const arrowHeadGone = eraseAt([arrow('ar', { x: 0, y: 0 }, { x: 200, y: 0 })], { x: 200, y: 0 }, 10, 1, ids);
assert.deepEqual(arrowHeadGone.map(item => item.kind), ['line'], 'what is left of an arrow without its head is a line');
assert.equal(arrowHeadGone[0].id, 'ar');
assert.deepEqual(eraseAt([arrow('ar', { x: 0, y: 0 }, { x: 8, y: 0 })], { x: 4, y: 0 }, 10, 1, ids), []);

assert.deepEqual(eraseAt([ring], { x: 140, y: 100 }, 10, 1, ids), [], 'a circle touched on its outline is removed');
assert.equal(eraseAt([ring], { x: 100, y: 100 }, 10, 1, ids).length, 1, 'inside the circle is not on it');
assert.deepEqual(eraseAt([pin('pin', { x: 50, y: 50 })], { x: 60, y: 50 }, 10, 1, ids), [], 'a pin is removed whole');
assert.equal(eraseAt([ruler('r', { x: 0, y: 0 }, { x: 100, y: 0 })], { x: 50, y: 3 }, 10, 1, ids).length, 0);
assert.deepEqual(eraseAt([pen('keep', [{ x: 0, y: 500 }, { x: 100, y: 500 }]), pin('gone', { x: 50, y: 50 })], { x: 50, y: 50 }, 10, 1, ids).map(item => item.id), ['keep'], 'only what is under the eraser goes');

// --- A scale in centimetres -----------------------------------------------------------------
const rulerOf = (length: number, parts = 2) => ruler('r', { x: 0, y: 0 }, { x: length, y: 0 }, parts) as Extract<Annotation, { kind: 'ruler' }>;
assert.equal(validScale(48.3), true);
for (const bad of [0, -1, Number.NaN, Infinity, '12', null, undefined]) assert.equal(validScale(bad), false, `${String(bad)} is not a scale`);
assert.equal(rulerLabel(rulerOf(480, 1), 48), '10 cm', 'a length in centimetres');
assert.equal(rulerLabel(rulerOf(360, 4), 48), '7.5 cm ÷ 4 = 1.88 cm', 'and a part of it');
assert.equal(rulerLabel(rulerOf(480, 2), undefined), '480 ÷ 2 = 240', 'without a scale, pixels as before');
assert.equal(rulerLabel(rulerOf(480, 2), 0), '480 ÷ 2 = 240', 'a scale that is not one is no scale');
assert.equal(rulerGeometry(rulerOf(480, 1), 1, 48).label.text, '10 cm');

// --- Ages along a line -----------------------------------------------------------------------
assert.deepEqual(validAgeScale({ from: 0, to: 70, step: 10 }), AGE_DEFAULT);
for (const bad of [null, 'x', { from: 0, to: 70 }, { from: 5, to: 5, step: 1 }, { from: -1, to: 70, step: 10 }, { from: 0, to: 121, step: 10 }, { from: 0, to: 70, step: 0 }, { from: 0, to: 70, step: 0.1 }, { from: 0, to: 100, step: 0.5 }, { from: 0, to: 70, step: Number.NaN }]) {
  assert.equal(validAgeScale(bad), null, `${JSON.stringify(bad)} is not an age scale`);
}
assert.deepEqual(ageValues({ from: 0, to: 70, step: 10 }), [0, 10, 20, 30, 40, 50, 60, 70]);
assert.deepEqual(ageValues({ from: 12, to: 47, step: 10 }), [20, 30, 40], 'the multiples of the step between the ages');
assert.deepEqual(ageValues({ from: 80, to: 0, step: 20 }), [0, 20, 40, 60, 80], 'in either direction');
assert.deepEqual(ageValues({ from: 0, to: 2, step: 0.5 }), [0, 0.5, 1, 1.5, 2]);

const lifeLine = { ...arrow('life', { x: 0, y: 0 }, { x: 700, y: 0 }), ages: { from: 0, to: 70, step: 10 } } as Annotation;
const marks = ageMarks(lifeLine, 1);
assert.equal(marks.length, 8);
assert.deepEqual(marks.map(mark => mark.age), [0, 10, 20, 30, 40, 50, 60, 70]);
near(marks[0].at.x, 0, 'the first age is at the start');
near(marks[3].at.x, 300, 'thirty of seventy years: a third of the way');
near(marks[7].at.x, 700, 'the last at the end');
assert.ok(marks[3].tick[0].y !== marks[3].tick[1].y && marks[3].tick[0].x === marks[3].tick[1].x, 'a mark crosses the line');
assert.ok(marks[3].label.at.y < 0 && marks[3].label.text === '30', 'the age is written above a level line');
assert.equal(ageMarks(arrow('plain', { x: 0, y: 0 }, { x: 10, y: 0 }), 1).length, 0, 'no scale, no marks');
assert.equal(ageMarks({ ...ring, ages: AGE_DEFAULT } as Annotation, 1).length, 0, 'a circle has no line to follow');
assert.equal(ageMarks({ ...lifeLine, ages: { from: 5, to: 5, step: 1 } } as Annotation, 1).length, 0, 'a scale that is not one gives none');

// Along a stroke that bends, the ages follow its length, not its straight reach.
const corner90 = { ...pen('bend', [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]), ages: { from: 0, to: 20, step: 10 } } as Annotation;
const bentMarks = ageMarks(corner90, 1);
assert.deepEqual(bentMarks.map(mark => mark.age), [0, 10, 20]);
near(bentMarks[1].at.x, 100, 'half the length is at the corner (x)');
near(bentMarks[1].at.y, 0, 'half the length is at the corner (y)');
near(bentMarks[2].at.y, 100, 'the end');
// Reversed: the first age at the end of the line.
const reversed = ageMarks({ ...lifeLine, ages: { from: 70, to: 0, step: 35 } } as Annotation, 1);
assert.deepEqual(reversed.map(mark => [mark.age, Math.round(mark.at.x)]), [[0, 700], [35, 350], [70, 0]]);
// Saved data keeps the ages of strokes and lines, and drops anything else.
const kept = sanitizeAnnotations([
  lifeLine,
  { ...pen('p', [{ x: 0, y: 0 }, { x: 5, y: 5 }]), ages: { from: 0, to: 80, step: 10 } },
  { ...pen('bad', [{ x: 0, y: 0 }, { x: 5, y: 5 }]), ages: { from: 0, to: 0, step: 10 } },
  { ...pin('pin', { x: 1, y: 1 }), ages: AGE_DEFAULT },
]);
assert.deepEqual(kept.map(item => item.ages !== undefined), [true, true, false, false]);

// --- Two photographs, one view -------------------------------------------------------------------
{
  // A wide window with a tall photograph, and a square window with a wide one.
  const fitA = fitTransform(800, 600, 600, 800, 0);
  const fitB = fitTransform(500, 500, 1000, 500, 0);
  assert.deepEqual(toLinkedView(fitA, fitA, 800, 600, 600, 800, 'a'), { source: 'a', zoom: 1, cx: 0.5, cy: 0.5 }, 'the whole photograph: zoom 1, in the middle');
  // Zoomed in three times on a place at 30% across and 20% down.
  const zoomedA = { k: fitA.k * 3, tx: 400 - 0.3 * 600 * fitA.k * 3, ty: 300 - 0.2 * 800 * fitA.k * 3 };
  const linked = toLinkedView(zoomedA, fitA, 800, 600, 600, 800, 'a');
  near(linked.zoom, 3, 'three times');
  near(linked.cx, 0.3, 'across');
  near(linked.cy, 0.2, 'down');
  // The other photograph shows the same place, three times in, in the middle of its own window.
  const zoomedB = fromLinkedView(linked, fitB, 500, 500, 1000, 500);
  near(zoomedB.k, fitB.k * 3, 'the same zoom beyond fitting');
  const middleB = toImage(zoomedB, 250, 250);
  near(middleB.x / 1000, 0.3, 'the same place across');
  near(middleB.y / 500, 0.2, 'the same place down');
  // And back again.
  const back = toLinkedView(zoomedB, fitB, 500, 500, 1000, 500, 'b');
  near(back.zoom, 3, 'round trip: zoom');
  near(back.cx, 0.3, 'round trip: across');
  // The zoom stays within what a window allows.
  near(fromLinkedView({ source: 'a', zoom: 1000, cx: 0.5, cy: 0.5 }, fitB, 500, 500, 1000, 500).k, fitB.k * 12, 'no further than the most');
  near(fromLinkedView({ source: 'a', zoom: 0.01, cx: 0.5, cy: 0.5 }, fitB, 500, 500, 1000, 500).k, fitB.k * 0.5, 'nor further out than half');
}
