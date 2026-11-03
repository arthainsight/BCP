'use client';

import type { ChartData } from '@/types';
import { JULIAN_YEAR_MS } from '@/lib/time';
import { SIGN_NAMES } from '@/lib/signs';
import { useGrahaNames } from '@/lib/grahaNames';
import { BHRIGU_PADA_CYCLES, BHRIGU_PADA_BODIES, type BhriguPadaVersion } from '@/lib/bhriguPadaProgression';

type Props = { chart: ChartData; birth: Date | null; version: BhriguPadaVersion };
const wrap = (n: number) => ((n - 1) % 12 + 12) % 12 + 1;
const dateAt = (birth: Date, age: number) => new Date(birth.getTime() + age * JULIAN_YEAR_MS);
const label = (date: Date) => date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export default function BhriguDashaTree({ chart, birth, version }: Props) {
  const { name } = useGrahaNames();
  if (version !== 'nadi-praveshika-8' || !birth) return null;
  return <section className="space-y-2" data-bhrigu-dasha-tree>
    <div><h3 className="text-xs font-semibold">MD → AD → PD · avattavat jaksot</h3><p className="text-[10px] text-zinc-500">Avaa grahan MD nähdäksesi AD-jaksot ja avaa AD nähdäksesi sen 12 PD-jaksoa.</p></div>
    <div className="space-y-2">
      {BHRIGU_PADA_BODIES[version].map(body => {
        const natal = chart.planets.find(p => p.name === body);
        const cycle = BHRIGU_PADA_CYCLES[version][body];
        if (!natal || !cycle) return null;
        return <details key={body} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
          <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold">{name(body)} MD · {SIGN_NAMES[natal.sign - 1]} <span className="ml-2 text-[9px] font-normal text-zinc-400">{cycle} vuotta · 12 AD-jaksoa</span></summary>
          <div className="space-y-1 border-t p-2 dark:border-zinc-800">
            {Array.from({ length: 12 }, (_, ad) => {
              const adStartAge = ad * cycle / 12;
              const adEndAge = (ad + 1) * cycle / 12;
              const adSign = wrap(natal.sign + ad);
              return <details key={ad} className="ml-2 rounded border border-zinc-100 dark:border-zinc-800">
                <summary className="cursor-pointer px-2 py-2 text-[10px]">AD {ad + 1}/12 · <strong>{SIGN_NAMES[adSign - 1]}</strong><span className="ml-2 text-zinc-400">{label(dateAt(birth, adStartAge))} – {label(dateAt(birth, adEndAge))}</span></summary>
                <div className="space-y-1 border-t px-2 py-2 dark:border-zinc-800">
                  {Array.from({ length: 12 }, (_, pd) => {
                    const index = ad * 12 + pd;
                    const startAge = index * cycle / 144;
                    const endAge = (index + 1) * cycle / 144;
                    const pdSign = wrap(adSign + pd);
                    return <div key={pd} className="grid grid-cols-[75px_minmax(70px,1fr)_minmax(150px,2fr)] gap-2 border-b border-zinc-100 py-1 text-[9px] last:border-0 dark:border-zinc-800">
                      <span className="font-mono text-zinc-500">PD {pd + 1}/12</span><span className="font-medium">{SIGN_NAMES[pdSign - 1]}</span><span className="text-zinc-400">{label(dateAt(birth, startAge))} – {label(dateAt(birth, endAge))}</span>
                    </div>;
                  })}
                </div>
              </details>;
            })}
          </div>
        </details>;
      })}
    </div>
  </section>;
}
