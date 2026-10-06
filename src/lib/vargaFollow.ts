import type { ChartData } from '@/types';
import { buildVargaChart } from './vargaChart';
import { signDignity, type SignDignity } from './dignity';

// Where one graha falls across a set of divisional charts, for the "follow"
// strip above the Varga grid.

export interface VargaPlacement {
  division: number;
  sign: number;
  dignity: SignDignity;
  /** Same sign as in the rāśi chart (vargottama in that division). */
  sameAsRasi: boolean;
}

export function followPlanet(chart: ChartData, planet: string, divisions: number[]): VargaPlacement[] {
  const rasiSign = chart.planets.find(p => p.name === planet)?.sign;
  if (rasiSign === undefined) return [];
  return divisions.flatMap(division => {
    const sign = buildVargaChart(chart, division).planets.find(p => p.name === planet)?.sign;
    if (sign === undefined) return [];
    return [{ division, sign, dignity: signDignity(planet, sign), sameAsRasi: division !== 1 && sign === rasiSign }];
  });
}
