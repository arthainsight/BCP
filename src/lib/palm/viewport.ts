import type { Box } from './annotations';

// The zoom and pan of the photo in its window. A point of the photo (x, y) is at
// (tx + k·x, ty + k·y) in the window.

export interface Transform {
  k: number;
  tx: number;
  ty: number;
}

export const MAX_ZOOM = 12;

/** The photo as large as fits the window, centred, with a margin. */
export function fitTransform(viewWidth: number, viewHeight: number, imageWidth: number, imageHeight: number, margin = 8): Transform {
  const k = Math.max(0.01, Math.min((viewWidth - 2 * margin) / imageWidth, (viewHeight - 2 * margin) / imageHeight));
  return { k, tx: (viewWidth - imageWidth * k) / 2, ty: (viewHeight - imageHeight * k) / 2 };
}

/** Zoom by a factor around a point of the window, between the fitted size and MAX_ZOOM times it. */
export function zoomAt(transform: Transform, x: number, y: number, factor: number, fitK: number): Transform {
  const k = Math.min(fitK * MAX_ZOOM, Math.max(fitK * 0.5, transform.k * factor));
  const ratio = k / transform.k;
  return { k, tx: x - (x - transform.tx) * ratio, ty: y - (y - transform.ty) * ratio };
}

/** Window point → photo point. */
export function toImage(transform: Transform, x: number, y: number) {
  return { x: (x - transform.tx) / transform.k, y: (y - transform.ty) / transform.k };
}

/** The zoom that shows a box of the photo filling the window (at most `maxK`), centred. */
export function focusTransform(box: Box, viewWidth: number, viewHeight: number, maxK: number, margin = 48): Transform {
  const k = Math.min(maxK, Math.max(0.01, Math.min((viewWidth - 2 * margin) / box.width, (viewHeight - 2 * margin) / box.height)));
  return { k, tx: viewWidth / 2 - (box.x + box.width / 2) * k, ty: viewHeight / 2 - (box.y + box.height / 2) * k };
}
