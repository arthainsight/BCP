// Fits the labels of one North Indian house inside its polygon.
//
// The chart used to stack every label in a single centred column, which ran
// over the house edges once a house held five or six items, most visibly in
// the narrow side triangles. Here labels flow into rows: each row takes as
// many labels as fit the width of the polygon at that height, and the font
// shrinks step by step until every row fits. Labels are monospace (Geist
// Mono), so a label's width is its character count times a fixed fraction of
// the font size.

export type LabelGroup = 'asc' | 'paraya' | 'natal' | 'transit' | 'special';

export interface LabelToken {
  key: string;
  text: string;
  group: LabelGroup;
}

export type Point = readonly [number, number];

export interface ExclusionBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface LabelBox {
  /** Convex polygon of the house, in chart coordinates. */
  polygon: readonly Point[];
  /** Areas already used by other text, such as the sign label. */
  exclude?: ExclusionBox[];
  /** Preferred vertical centre of the label block. */
  anchorY: number;
}

export interface PlacedRow {
  x: number;
  y: number;
  fontSize: number;
  group: LabelGroup;
  tokens: LabelToken[];
}

export interface LabelLayout {
  rows: PlacedRow[];
  /** Font size of natal planet labels; other groups are drawn smaller. */
  fontSize: number;
  /** True when even the smallest font could not fit every label. */
  overflow: boolean;
}

export interface LayoutOptions {
  maxFontSize?: number;
  minFontSize?: number;
  /** Width of one character as a fraction of the font size. */
  charWidth?: number;
  lineHeight?: number;
  padding?: number;
}

/** Size of each group relative to the natal planet font. */
export const GROUP_SCALE: Record<LabelGroup, number> = {
  asc: 0.8,
  paraya: 0.75,
  natal: 1,
  transit: 0.85,
  special: 0.75,
};

const GROUP_ORDER: LabelGroup[] = ['asc', 'paraya', 'natal', 'transit', 'special'];

/** Horizontal extent of a convex polygon at height y, or null outside it. */
export function polygonSpanAt(polygon: readonly Point[], y: number): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    if (y < Math.min(y1, y2) || y > Math.max(y1, y2)) continue;
    if (y1 === y2) {
      lo = Math.min(lo, x1, x2);
      hi = Math.max(hi, x1, x2);
      continue;
    }
    const x = x1 + ((y - y1) / (y2 - y1)) * (x2 - x1);
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
  }
  return lo <= hi ? [lo, hi] : null;
}

function textWidth(text: string, fontSize: number, charWidth: number): number {
  return Array.from(text).length * fontSize * charWidth;
}

/** Usable horizontal interval for a row of the given height centred at y. */
function rowSpan(box: LabelBox, y: number, height: number, padding: number): [number, number] | null {
  const top = polygonSpanAt(box.polygon, y - height / 2);
  const bottom = polygonSpanAt(box.polygon, y + height / 2);
  if (!top || !bottom) return null;
  let lo = Math.max(top[0], bottom[0]) + padding;
  let hi = Math.min(top[1], bottom[1]) - padding;
  for (const ex of box.exclude ?? []) {
    if (y + height / 2 <= ex.y0 || y - height / 2 >= ex.y1) continue;
    if (ex.x1 <= lo || ex.x0 >= hi) continue;
    const left = ex.x0 - lo;
    const right = hi - ex.x1;
    if (left >= right) hi = Math.min(hi, ex.x0 - padding);
    else lo = Math.max(lo, ex.x1 + padding);
  }
  return hi > lo ? [lo, hi] : null;
}

function tryPlace(
  groups: LabelToken[][],
  box: LabelBox,
  fontSize: number,
  yStart: number,
  yEnd: number,
  opts: Required<LayoutOptions>,
): PlacedRow[] | null {
  const rows: PlacedRow[] = [];
  let y = yStart;
  for (const tokens of groups) {
    const group = tokens[0].group;
    const rowFont = fontSize * GROUP_SCALE[group];
    const rowHeight = rowFont * opts.lineHeight;
    const gap = rowFont * opts.charWidth;
    let i = 0;
    while (i < tokens.length) {
      const centre = y + rowHeight / 2;
      if (y + rowHeight > yEnd) return null;
      const span = rowSpan(box, centre, rowFont, opts.padding);
      if (!span) return null;
      const available = span[1] - span[0];
      const row: LabelToken[] = [];
      let width = 0;
      while (i < tokens.length) {
        const w = textWidth(tokens[i].text, rowFont, opts.charWidth) + (row.length ? gap : 0);
        if (width + w > available) break;
        row.push(tokens[i]);
        width += w;
        i++;
      }
      if (!row.length) return null;
      rows.push({ x: (span[0] + span[1]) / 2, y: centre, fontSize: rowFont, group, tokens: row });
      y += rowHeight;
    }
  }
  return rows;
}

export function layoutHouseLabels(tokens: LabelToken[], box: LabelBox, options: LayoutOptions = {}): LabelLayout {
  const opts: Required<LayoutOptions> = {
    maxFontSize: options.maxFontSize ?? 16,
    minFontSize: options.minFontSize ?? 7,
    charWidth: options.charWidth ?? 0.6,
    lineHeight: options.lineHeight ?? 1.2,
    padding: options.padding ?? 3,
  };
  const groups = GROUP_ORDER
    .map(group => tokens.filter(token => token.group === group))
    .filter(list => list.length > 0);
  if (!groups.length) return { rows: [], fontSize: opts.maxFontSize, overflow: false };

  const ys = box.polygon.map(([, y]) => y);
  const yMin = Math.min(...ys) + opts.padding;
  const yMax = Math.max(...ys) - opts.padding;

  for (let fontSize = opts.maxFontSize; fontSize >= opts.minFontSize; fontSize--) {
    let best: PlacedRow[] | null = null;
    let bestDistance = Infinity;
    for (let yStart = yMin; yStart < yMax; yStart += 2) {
      const rows = tryPlace(groups, box, fontSize, yStart, yMax, opts);
      if (!rows) continue;
      const last = rows[rows.length - 1];
      const blockEnd = last.y + (last.fontSize * opts.lineHeight) / 2;
      const distance = Math.abs((yStart + blockEnd) / 2 - box.anchorY);
      if (distance < bestDistance) {
        best = rows;
        bestDistance = distance;
      }
    }
    if (best) return { rows: best, fontSize, overflow: false };
  }

  // Nothing fits even at the smallest size: stack one label per row from the
  // anchor so everything is still drawn, and report the overflow.
  const fontSize = opts.minFontSize;
  const flat = groups.flat();
  const lineHeight = fontSize * opts.lineHeight;
  const top = box.anchorY - ((flat.length - 1) * lineHeight) / 2;
  const centreX = (() => {
    const span = polygonSpanAt(box.polygon, box.anchorY);
    return span ? (span[0] + span[1]) / 2 : 0;
  })();
  return {
    rows: flat.map((token, index) => ({
      x: centreX,
      y: top + index * lineHeight,
      fontSize: fontSize * GROUP_SCALE[token.group],
      group: token.group,
      tokens: [token],
    })),
    fontSize,
    overflow: true,
  };
}
