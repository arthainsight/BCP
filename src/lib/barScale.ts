// The arithmetic of the bar charts of the Bala views: round axes, and the layout of stacked bars that have segments on both sides of zero.

/** A round step (1, 2 or 5 times a power of ten) that gives about `target` intervals over `range`. */
export function niceStep(range: number, target = 5): number {
  if (!(range > 0) || !Number.isFinite(range)) return 1;
  const raw = range / target;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const factor = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return factor * power;
}

/** Round tick values covering [min, max], zero included when the range spans it. */
export function niceTicks(min: number, max: number, target = 5): { ticks: number[]; min: number; max: number } {
  const low = Math.min(min, 0);
  const high = Math.max(max, 0);
  const step = niceStep(high - low, target);
  const start = Math.floor(low / step + 1e-9) * step;
  const ceil = Math.ceil(high / step - 1e-9) * step;
  const end = ceil === start ? start + step : ceil;
  const ticks: number[] = [];
  for (let value = start; value <= end + step / 1e6; value += step) ticks.push(Math.abs(value) < step / 1e6 ? 0 : Number(value.toFixed(10)));
  return { ticks, min: start, max: end };
}

export interface Segment { key: string; value: number; start: number; end: number }

/**
 * The segments of one stacked bar: those with a positive value pile up to the right of zero, those with a negative value to the
 * left of it, each in the order given. `start` and `end` are positions on the value axis, `start` nearer to zero.
 */
export function stackSegments(values: { key: string; value: number }[]): { segments: Segment[]; low: number; high: number } {
  let positive = 0;
  let negative = 0;
  const segments: Segment[] = [];
  for (const { key, value } of values) {
    if (!Number.isFinite(value) || value === 0) { segments.push({ key, value: 0, start: 0, end: 0 }); continue; }
    if (value > 0) { segments.push({ key, value, start: positive, end: positive + value }); positive += value; }
    else { segments.push({ key, value, start: negative, end: negative + value }); negative += value; }
  }
  return { segments, low: negative, high: positive };
}

/** The pixel position of a value on an axis from `min` to `max` laid on `from` to `to`. */
export function scaleLinear(value: number, min: number, max: number, from: number, to: number): number {
  return max === min ? from : from + ((value - min) / (max - min)) * (to - from);
}
