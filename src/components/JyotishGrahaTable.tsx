import { ChartData, PlanetData, SpecialLagna } from '@/types';

const SIGN_ABBR: Record<number, string> = {
  1: 'Ar', 2: 'Ta', 3: 'Ge', 4: 'Cn', 5: 'Le', 6: 'Vi',
  7: 'Li', 8: 'Sc', 9: 'Sg', 10: 'Cp', 11: 'Aq', 12: 'Pi',
};

const GRAHA_NAMES: Record<string, { code: string; name: string }> = {
  Sun:     { code: 'Su', name: 'Sūrya' },
  Moon:    { code: 'Mo', name: 'Chandra' },
  Mars:    { code: 'Ma', name: 'Maṅgala' },
  Mercury: { code: 'Me', name: 'Budha' },
  Jupiter: { code: 'Ju', name: 'Guru' },
  Venus:   { code: 'Ve', name: 'Śukra' },
  Saturn:  { code: 'Sa', name: 'Śani' },
  Rahu:    { code: 'Ra', name: 'Rāhu' },
  Ketu:    { code: 'Ke', name: 'Ketu' },
};

const NAKSHATRAS = [
  { name: 'Aśvinī', lord: 'Ke' },
  { name: 'Bharaṇī', lord: 'Ve' },
  { name: 'Kṛttikā', lord: 'Su' },
  { name: 'Rohiṇī', lord: 'Mo' },
  { name: 'Mṛgaśira', lord: 'Ma' },
  { name: 'Ārdrā', lord: 'Ra' },
  { name: 'Punarvasu', lord: 'Jp' },
  { name: 'Puṣya', lord: 'Sa' },
  { name: 'Aśleṣā', lord: 'Me' },
  { name: 'Maghā', lord: 'Ke' },
  { name: 'Pūrvaphālgunī', lord: 'Ve' },
  { name: 'Uttaraphālgunī', lord: 'Su' },
  { name: 'Hasta', lord: 'Mo' },
  { name: 'Citrā', lord: 'Ma' },
  { name: 'Svātī', lord: 'Ra' },
  { name: 'Viśākhā', lord: 'Jp' },
  { name: 'Anurādhā', lord: 'Sa' },
  { name: 'Jyeṣṭhā', lord: 'Me' },
  { name: 'Mūla', lord: 'Ke' },
  { name: 'Pūrvāṣāḍhā', lord: 'Ve' },
  { name: 'Uttarāṣāḍhā', lord: 'Su' },
  { name: 'Śravaṇa', lord: 'Mo' },
  { name: 'Dhaniṣṭhā', lord: 'Ma' },
  { name: 'Śatabhiṣaj', lord: 'Ra' },
  { name: 'Pūrvabhādrapadā', lord: 'Jp' },
  { name: 'Uttarabhādrapadā', lord: 'Sa' },
  { name: 'Revatī', lord: 'Me' },
];

function formatDms(deg: number): string {
  const d = Math.floor(deg);
  const minFloat = (deg - d) * 60;
  const m = Math.floor(minFloat);
  const s = Math.round((minFloat - m) * 60);
  return `${d}°${m}'${s}''`;
}

function getNakshatra(longitude: number) {
  const nakSize = 13 + 1 / 3;
  const padaSize = 3 + 1 / 3;
  const nakIndex = Math.floor(longitude / nakSize);
  const nak = NAKSHATRAS[nakIndex];
  const remainder = longitude % nakSize;
  const pada = Math.floor(remainder / padaSize) + 1;
  return { name: nak.name, number: nakIndex + 1, lord: nak.lord, pada };
}

function buildPlanetRow(planet: PlanetData, karakaByPlanet: Record<string, string>) {
  const graha = GRAHA_NAMES[planet.name] ?? { code: planet.name.slice(0, 2), name: planet.name };
  const nak = getNakshatra(planet.longitude);
  return {
    code: graha.code,
    name: graha.name,
    karaka: karakaByPlanet[planet.name] ?? '',
    position: `${SIGN_ABBR[planet.sign]} ${formatDms(planet.degree)}`,
    nakshatra: `${nak.name}(${nak.number}) ${nak.lord}`,
    pada: nak.pada,
  };
}

interface Props {
  chart: ChartData;
  karakaByPlanet?: Record<string, string>;
}

export default function JyotishGrahaTable({ chart, karakaByPlanet = {} }: Props) {
  const ascNak = getNakshatra(chart.ascendant.longitude);

  const buildSpecialLagnaRow = (sl: SpecialLagna) => {
    const nak = getNakshatra(sl.longitude);
    return {
      code: sl.name,
      name: sl.name,
      karaka: '',
      position: `${SIGN_ABBR[sl.sign]} ${formatDms(sl.degree)}`,
      nakshatra: `${nak.name}(${nak.number}) ${nak.lord}`,
      pada: nak.pada,
      isSpecial: true,
    };
  };

  const rows = [
    {
      code: 'As',
      name: 'Lagna',
      karaka: '',
      position: `${SIGN_ABBR[chart.ascendant.sign]} ${formatDms(chart.ascendant.degree)}`,
      nakshatra: `${ascNak.name}(${ascNak.number}) ${ascNak.lord}`,
      pada: ascNak.pada,
      isSpecial: false,
    },
    ...chart.planets.map((p) => ({ ...buildPlanetRow(p, karakaByPlanet), isSpecial: false })),
    ...(chart.specialLagnas ?? []).map(buildSpecialLagnaRow),
  ];

  return (
    <>
      {/* Desktop/tablet table — hidden below 640 px */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Code</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Graha</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Karaka</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Position</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Nakṣatra</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Pada</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const prevIsSpecial = i > 0 && !rows[i - 1].isSpecial && row.isSpecial;
              return (
                <tr key={row.code} className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${prevIsSpecial ? 'border-t-2 border-t-zinc-200 dark:border-t-zinc-700' : ''}`}>
                  <td className={`p-2 border border-zinc-100 dark:border-zinc-800 font-bold ${row.isSpecial ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-700 dark:text-green-400'}`}>{row.code}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100">{row.isSpecial ? '' : row.name}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-amber-600 dark:text-amber-400 font-semibold">{row.karaka}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.position}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-cyan-700 dark:text-cyan-300">{row.nakshatra}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300">{row.pada}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — visible only below 640 px */}
      <div className="sm:hidden flex flex-col gap-2 w-full max-w-full">
        {rows.map((row) => (
          <div
            key={row.code}
            className="rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-2 font-mono text-xs flex flex-col gap-1 w-full max-w-full"
          >
            {/* Row 1: Code · Name · Karaka */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`font-bold ${row.isSpecial ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-700 dark:text-green-400'}`}>
                {row.code}
              </span>
              {!row.isSpecial && (
                <span className="text-zinc-800 dark:text-zinc-100">{row.name}</span>
              )}
              {row.karaka && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold ml-auto">{row.karaka}</span>
              )}
            </div>
            {/* Row 2: Position */}
            <div className="text-zinc-700 dark:text-zinc-300">
              {row.position}
            </div>
            {/* Row 3: Nakshatra · Pada */}
            <div className="text-cyan-700 dark:text-cyan-300" style={{ overflowWrap: 'anywhere' }}>
              {row.nakshatra} · {row.pada}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
