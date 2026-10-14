// The four annual charts of a year side by side: Tithi Praveśa, Nakṣatra Praveśa, Yoga Praveśa and Tājika Varṣaphala
// (the solar return). Each starts at a moment of its own, so the periods overlap and run a few weeks apart; this
// module puts them on one time axis. Pure arithmetic on the moments the four routes return.

export interface GlanceLocal { year: number; month: number; day: number; hour: number; minute: number; second: number }

/** The wall-clock time of a local date-time as milliseconds, so that moments in one zone can be set against each other. */
export const localMs = (p: GlanceLocal) => Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);

export interface GlanceSpan { id: string; startMs: number; endMs: number }

export interface GlanceAxis {
  startMs: number;
  endMs: number;
  /** The first moment of each month inside the axis, for the ticks. */
  months: { ms: number; year: number; month: number }[];
}

const DAY_MS = 86400000;

/** The time axis that holds all the spans, a margin of days either side, with its month starts. null when there is nothing to show. */
export function glanceAxis(spans: readonly GlanceSpan[], marginDays = 12): GlanceAxis | null {
  if (spans.length === 0) return null;
  const startMs = Math.min(...spans.map(span => span.startMs)) - marginDays * DAY_MS;
  const endMs = Math.max(...spans.map(span => span.endMs)) + marginDays * DAY_MS;
  const months: GlanceAxis['months'] = [];
  const first = new Date(startMs);
  let year = first.getUTCFullYear();
  let month = first.getUTCMonth() + 1;
  for (;;) {
    month += 1;
    if (month > 12) { month = 1; year += 1; }
    const ms = Date.UTC(year, month - 1, 1);
    if (ms > endMs) break;
    months.push({ ms, year, month });
  }
  return { startMs, endMs, months };
}

/** Where a moment falls on the axis as a fraction, 0 to 1 (not limited to that range). */
export function glanceFraction(axis: GlanceAxis, ms: number): number {
  return (ms - axis.startMs) / (axis.endMs - axis.startMs);
}

/** Days from the start of the first span to the start of each of the others, for the "a few weeks apart" summary. */
export function startOffsetsDays(spans: readonly GlanceSpan[]): Record<string, number> {
  if (spans.length === 0) return {};
  const first = Math.min(...spans.map(span => span.startMs));
  return Object.fromEntries(spans.map(span => [span.id, Math.round(((span.startMs - first) / DAY_MS) * 10) / 10]));
}
