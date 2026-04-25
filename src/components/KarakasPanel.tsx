import { CharaKaraka } from '@/types';

const PLANET_COLORS: Record<string, string> = {
  Sun: 'text-orange-500 dark:text-orange-400',
  Moon: 'text-blue-500 dark:text-blue-300',
  Mars: 'text-red-500 dark:text-red-400',
  Mercury: 'text-emerald-600 dark:text-green-400',
  Jupiter: 'text-yellow-600 dark:text-yellow-400',
  Venus: 'text-pink-500 dark:text-pink-400',
  Saturn: 'text-indigo-600 dark:text-indigo-400',
  Rahu: 'text-purple-600 dark:text-purple-400',
  Ketu: 'text-amber-700 dark:text-amber-600',
};

interface Props {
  charaKarakas: CharaKaraka[];
}

export default function KarakasPanel({ charaKarakas }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; chara.karakas</div>
      <p className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
        8-karaka system (Parashara) — ranked by degree within sign
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">#</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Karaka</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Full Name</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Graha</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Deg°</th>
            </tr>
          </thead>
          <tbody>
            {charaKarakas.map((k, i) => (
              <tr key={k.karaka} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600">{i + 1}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-emerald-700 dark:text-green-400 font-bold">{k.karaka}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{k.karakaFull}</td>
                <td className={`p-2 border border-zinc-100 dark:border-zinc-800 font-semibold ${PLANET_COLORS[k.planet] ?? 'text-zinc-700 dark:text-zinc-300'}`}>
                  {k.planet}
                </td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {k.degree.toFixed(2)}°
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Description list */}
      <div className="space-y-1 pt-1">
        {charaKarakas.slice(0, 3).map((k) => (
          <div key={k.karaka} className="text-xs font-mono text-zinc-500 dark:text-zinc-500">
            <span className={`font-bold mr-1 ${PLANET_COLORS[k.planet] ?? ''}`}>{k.planet}</span>
            <span className="text-emerald-700 dark:text-green-400">{k.karaka}</span>
            <span className="mx-1 text-zinc-300 dark:text-zinc-700">—</span>
            <span>{k.karakaDesc}</span>
          </div>
        ))}
        {charaKarakas.length > 3 && (
          <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600">
            + {charaKarakas.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
}
