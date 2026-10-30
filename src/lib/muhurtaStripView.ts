// What the month strip shows: the rows of stretches, each coloured against the choices of the page. The colours are the
// book's for the purpose chosen: green where the value is one that is chosen (what the book calls favourable for the
// event), yellow where the book calls it middling, red where it is not chosen. The row of the Vāra/Tithi/Nakṣatra yogas is
// the book's own judgement of the combination.

import type { StripState } from './muhurtaStrip';
import { FINDER_SIZES, KARANA_NAMES, houseFrom, isLimited, taraOf, tithiLabel, TARA_NAMES } from './muhurtaFinder';
import { NAKSHATRA_NAMES } from './nakshatras';
import { YOGA_NAMES } from './panchang';
import { vtnVerdict, vtnYogasAt, type VtnYoga } from './vtnYogas';

export type StripTone = 'good' | 'middling' | 'bad' | 'none';
export type StripRowId = 'vara' | 'nakshatra' | 'tara' | 'chandra' | 'tithi' | 'karana' | 'yoga' | 'vtn';

export interface StripSegment {
  start: number;
  end: number;
  /** The short text in the stretch, and the full text of its title. */
  label: string;
  title: string;
  tone: StripTone;
}

export interface StripChoices {
  vara: number[];
  tithi: number[];
  nakshatra: number[];
  karana: number[];
  yoga: number[];
  /** The Tarabala (the nakṣatra of the Moon at birth and the tārās that suit) and the Chandrabala (the sign of the Moon at birth and the houses that suit), where there is a natal chart. */
  tara?: { nakshatra: number; taras: number[] };
  chandra?: { moonSign: number; houses: number[] };
  /** What the book calls middling for the event (nakṣatras 0 to 26, tithis 1 to 30). */
  middling?: { nakshatra?: number[]; tithi?: number[] };
  /** The event is a marriage, a journey or entering a house. */
  sarvarthaExceptions?: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toneOf = (value: number, chosen: number[], size: number, middling: number[] = []): StripTone => {
  if (!isLimited(chosen, size) || chosen.includes(value)) return 'good';
  return middling.includes(value) ? 'middling' : 'bad';
};

/** The house of the Moon from the sign of the Moon at birth (the Moon's sign in the state is taken whole: the sign is what the Chandrabala counts). */
const chandraHouse = (natalMoonSign: number, state: StripState) => houseFrom(natalMoonSign, state.moonSign * 30 + 15);

/**
 * The stretches in which every one of the `required` rows is green, from the rows of the strip: the times to show when the
 * user makes those rows green by choice. A row that is not in the strip (no natal chart for the Tarabala) is no condition.
 * Stretches that touch are one.
 */
export function greenWindows(rows: { id: StripRowId; segments: StripSegment[] }[], required: StripRowId[]): { start: number; end: number }[] {
  const wanted = rows.filter(row => required.includes(row.id));
  if (wanted.length === 0) return [];
  const edges = [...new Set(wanted.flatMap(row => row.segments.flatMap(segment => [segment.start, segment.end])))].sort((a, b) => a - b);
  const toneAt = (row: { segments: StripSegment[] }, ms: number) => row.segments.find(segment => segment.start <= ms && ms < segment.end)?.tone;
  const windows: { start: number; end: number }[] = [];
  for (let index = 0; index + 1 < edges.length; index += 1) {
    const [start, end] = [edges[index], edges[index + 1]];
    if (!wanted.every(row => toneAt(row, start) === 'good')) continue;
    const last = windows[windows.length - 1];
    if (last && last.end === start) last.end = end;
    else windows.push({ start, end });
  }
  return windows;
}

/** Stretches of equal text and tone put together: a stretch of the same value in two states is one. */
function merge(segments: StripSegment[]): StripSegment[] {
  const merged: StripSegment[] = [];
  for (const segment of segments) {
    const last = merged[merged.length - 1];
    if (last && last.label === segment.label && last.title === segment.title && last.tone === segment.tone && last.end === segment.start) last.end = segment.end;
    else merged.push({ ...segment });
  }
  return merged;
}

export const VTN_TONE: Record<ReturnType<typeof vtnVerdict>, StripTone> = { good: 'good', mixed: 'middling', bad: 'bad', none: 'none' };

/** The yogas that a state forms, with the exceptions of the event. */
export const vtnOfState = (state: StripState, choices: Pick<StripChoices, 'sarvarthaExceptions'>): VtnYoga[] =>
  vtnYogasAt(state.vara, state.tithi, state.nakshatra, { sarvarthaExceptions: choices.sarvarthaExceptions });

/** The rows of the strip for the states of a span, against the choices. The Tarabala and Chandrabala rows are there only with a natal chart. */
export function stripRows(states: StripState[], choices: StripChoices): { id: StripRowId; segments: StripSegment[] }[] {
  const rows: { id: StripRowId; segments: StripSegment[] }[] = [];
  const row = (id: StripRowId, make: (state: StripState) => Omit<StripSegment, 'start' | 'end'>) => {
    rows.push({ id, segments: merge(states.map(state => ({ start: state.start, end: state.end, ...make(state) }))) });
  };
  row('vara', state => ({ label: WEEKDAYS[state.vara], title: WEEKDAYS[state.vara], tone: toneOf(state.vara, choices.vara, FINDER_SIZES.vara) }));
  row('nakshatra', state => ({
    label: String(state.nakshatra + 1), title: NAKSHATRA_NAMES[state.nakshatra],
    tone: toneOf(state.nakshatra, choices.nakshatra, FINDER_SIZES.nakshatra, choices.middling?.nakshatra),
  }));
  const { tara, chandra } = choices;
  if (tara) {
    row('tara', state => {
      const value = taraOf(tara.nakshatra, state.nakshatra);
      return { label: String(value), title: TARA_NAMES[value - 1], tone: toneOf(value, tara.taras, 9) };
    });
  }
  if (chandra) {
    row('chandra', state => {
      const house = chandraHouse(chandra.moonSign, state);
      return { label: String(house), title: `${house}`, tone: toneOf(house, chandra.houses, 12) };
    });
  }
  row('tithi', state => ({ label: tithiLabel(state.tithi), title: tithiLabel(state.tithi), tone: toneOf(state.tithi, choices.tithi, FINDER_SIZES.tithi, choices.middling?.tithi) }));
  row('karana', state => ({ label: KARANA_NAMES[state.karana].slice(0, 3), title: KARANA_NAMES[state.karana], tone: toneOf(state.karana, choices.karana, FINDER_SIZES.karana) }));
  row('yoga', state => ({ label: String(state.yoga + 1), title: YOGA_NAMES[state.yoga], tone: toneOf(state.yoga, choices.yoga, FINDER_SIZES.yoga) }));
  row('vtn', state => {
    const yogas = vtnOfState(state, choices);
    return { label: '', title: yogas.map(yoga => yoga.name).join(', '), tone: VTN_TONE[vtnVerdict(yogas)] };
  });
  return rows;
}
