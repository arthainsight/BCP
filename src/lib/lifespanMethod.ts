import { strongestOf } from './jaiminiRasiDashas';
import { toJaiminiChart } from './jaiminiStrength';

/**
 * Which span of life the text takes (Phaladīpikā 22.28–29): with a strong Lagna the Aṃśāyu, with a strong Sun the Piṇḍāyu, with a strong Moon the Naisargika; when two are
 * equally strong half of the sum of their spans, when all three are, a third of the sum; when none is strong the span of Jīvaśarman.
 *
 * Read so: the strength of the Lagna, the Sun and the Moon is that of the signs they are in (the Jaimini rules for signs, as in the order of the Paiṇḍī daśā); two are
 * equal when they are in the same sign. "None is strong" is not applied (one of the three is always the strongest here).
 */
export type LifespanMethod = 'amsha' | 'pinda' | 'naisargika';
export const LIFESPAN_METHOD_NAMES: Record<LifespanMethod, string> = { amsha: 'Aṃśāyu', pinda: 'Piṇḍāyu', naisargika: 'Naisargika' };

export interface LifespanChoice {
  /** The method or methods whose spans are taken (two or three: their mean). */
  methods: LifespanMethod[];
  /** Which of the Lagna, Sun and Moon is the strongest (those in the strongest sign). */
  strongest: ('Lagna' | 'Sun' | 'Moon')[];
}

export function chooseLifespanMethod(planets: { name: string; sign: number; degree: number }[], ascendantSign: number): LifespanChoice | null {
  const sun = planets.find(planet => planet.name === 'Sun');
  const moon = planets.find(planet => planet.name === 'Moon');
  if (!sun || !moon) return null;
  const chart = toJaiminiChart(planets, ascendantSign);
  const candidates = [
    { who: 'Lagna' as const, method: 'amsha' as const, sign: (ascendantSign - 1) % 12 },
    { who: 'Sun' as const, method: 'pinda' as const, sign: sun.sign - 1 },
    { who: 'Moon' as const, method: 'naisargika' as const, sign: moon.sign - 1 },
  ];
  const best = strongestOf(chart, candidates.map(item => item.sign));
  const strongest = candidates.filter(item => item.sign === best);
  return { methods: strongest.map(item => item.method), strongest: strongest.map(item => item.who) };
}
