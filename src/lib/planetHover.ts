'use client';

import type { PlanetData } from '@/types';
import { YOGI_MARK, useGrahaRoles } from './grahaMarks';
import { useLanguage, useT } from './i18n';
import { markLines } from './planetMarksText';

/**
 * The hover text of a graha in a chart: its sensitive degrees and combustion (⚠ ✦ ☼, one per line) and the Yogi roles it holds when that
 * layer is on. Undefined when there is nothing to say, so a graha without marks has no tooltip.
 */
export function usePlanetHover(): (planet: PlanetData) => string | undefined {
  const t = useT();
  const language = useLanguage();
  const roles = useGrahaRoles();
  return planet => {
    const lines = [
      ...markLines(planet.marks, t, language),
      ...(roles[planet.name] ?? []).map(role => `${YOGI_MARK[role]} ${role}`),
    ];
    return lines.length > 0 ? lines.join('\n') : undefined;
  };
}
