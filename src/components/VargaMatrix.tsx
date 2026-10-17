import type { ChartData } from '@/types';
import { buildVargaMatrix, DEFAULT_DIVISIONS, DIGNITY_LABELS, mapPlanetLongitudes, ROW_ORDER } from '@/lib/vargaMatrix';
import type { Dignity } from '@/lib/shadbala';
import { useT } from '@/lib/i18n';
import { Heading, HEAD_CELL, ROW } from './balaShared';

function dignityCellClass(dignity: Dignity): string {
  switch (dignity) {
    case 'exalted':
    case 'moolatrikona':
    case 'own':
      return 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/70';
    case 'friend':
      return 'bg-lime-50 dark:bg-lime-950/25 text-lime-800 dark:text-lime-200 border-lime-200 dark:border-lime-800/50';
    case 'neutral':
      return 'bg-zinc-50 dark:bg-zinc-800/45 text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800';
    case 'enemy':
      return 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800/60';
    case 'debilitated':
      return 'bg-red-50 dark:bg-red-950/35 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/70';
    default:
      return 'text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800';
  }
}

export default function VargaMatrix({ chart }: { chart: ChartData | null | undefined }) {
  const t = useT();
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">{t('Calculate a chart first.')}</div>;

  const divisions = DEFAULT_DIVISIONS;
  const planets = mapPlanetLongitudes(chart);
  const lagna = typeof chart.ascendant?.longitude === 'number' ? chart.ascendant.longitude : undefined;
  const matrix = buildVargaMatrix(planets, lagna, divisions);
  const divisionList = divisions.map((division) => `D${division}`).join(', ');

  return (
    <div className="space-y-5">
      <Heading command="varga.matrix">{divisionList}{t(' from existing sidereal longitudes. Cell colour = dignity; debilitated = 0 strength.')}</Heading>
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[980px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className={`sticky left-0 z-10 bg-zinc-100 dark:bg-zinc-800 ${HEAD_CELL}`}>{t('Body')}</th>
              {divisions.map((division) => <th key={division} className={HEAD_CELL}>D{division}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROW_ORDER.map((name) => (
              <tr key={name} className={ROW}>
                <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{name}</td>
                {divisions.map((division) => {
                  const cell = matrix[name][`D${division}`];
                  return (
                    <td key={division} className={`p-2 border whitespace-nowrap ${dignityCellClass(cell.dignity)}`} title={DIGNITY_LABELS[cell.dignity]}>
                      <span className="font-bold">{cell.sign}</span>
                      {cell.dignity !== 'none' && <span className="ml-1 text-[9px] opacity-75">{DIGNITY_LABELS[cell.dignity]}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
