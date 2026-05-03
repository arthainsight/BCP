import { ChartData } from '@/types';
import { calculateYogas, YogaCategory } from '@/lib/yogas';

const CATEGORY_LABELS: Record<YogaCategory, string> = {
  solar:                'Solar',
  moon:                 'Lunar',
  raja:                 'Raja',
  dhana:                'Dhana',
  general:              'General',
  'pancha-mahapurusha': 'Pancha Mahapurusha',
};

interface Props {
  chart: ChartData;
  showInactive?: boolean;
}

export default function YogaTable({ chart, showInactive = false }: Props) {
  const all = calculateYogas(chart.planets, chart.ascendant.sign);
  const visible = showInactive ? all : all.filter(y => y.status === 'active');

  return (
    <div className="space-y-2">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; yoga.detection</div>
      {visible.length === 0 ? (
        <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600 py-4 text-center">
          No active yogas found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className="p-2 text-left whitespace-nowrap">Yoga</th>
                <th className="p-2 text-left whitespace-nowrap">Category</th>
                {showInactive && <th className="p-2 text-left whitespace-nowrap">Status</th>}
                <th className="p-2 text-left whitespace-nowrap">Reference</th>
                <th className="p-2 text-left whitespace-nowrap">Planets</th>
                <th className="p-2 text-left min-w-[160px]">Reason</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(yoga => (
                <tr
                  key={yoga.id}
                  className={`border-b border-zinc-100 dark:border-zinc-800 ${
                    yoga.status === 'inactive' ? 'opacity-50' : ''
                  }`}
                >
                  <td className={`p-2 font-bold whitespace-nowrap ${
                    yoga.status === 'active'
                      ? 'text-emerald-700 dark:text-green-400'
                      : 'text-zinc-500 dark:text-zinc-500'
                  }`}>
                    {yoga.name}
                  </td>
                  <td className="p-2 text-zinc-500 dark:text-zinc-500 whitespace-nowrap">
                    {CATEGORY_LABELS[yoga.category] ?? yoga.category}
                  </td>
                  {showInactive && (
                    <td className="p-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        yoga.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-green-400'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600'
                      }`}>
                        {yoga.status}
                      </span>
                    </td>
                  )}
                  <td className="p-2 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {yoga.referencePlanet}
                  </td>
                  <td className="p-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    {yoga.planetsInvolved.length > 0 ? yoga.planetsInvolved.join(', ') : '—'}
                  </td>
                  <td className="p-2 text-zinc-500 dark:text-zinc-500 break-words max-w-[240px]">
                    {yoga.resultText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
