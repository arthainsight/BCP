import { ChartData, PlanetData, SpecialLagna } from '@/types';
import { type DegreePrecision, formatDegree } from '@/lib/formatDegree';

const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];

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
  Uranus:  { code: 'Ur', name: 'Uranus' },
  Neptune: { code: 'Ne', name: 'Neptune' },
  Pluto:   { code: 'Pl', name: 'Pluto' },
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

function tableFormatDeg(deg: number, precision: DegreePrecision): string {
  return formatDegree(deg, precision === 'off' ? 'second' : precision);
}

function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function getNakshatra(longitude: number) {
  const normalized = normalizeLongitude(longitude);
  const nakSize = 13 + 1 / 3;
  const padaSize = 3 + 1 / 3;
  const nakIndex = Math.floor(normalized / nakSize);
  const nak = NAKSHATRAS[Math.min(nakIndex, 26)];
  const remainder = normalized % nakSize;
  const pada = Math.floor(remainder / padaSize) + 1;
  const pada108 = Math.floor(normalized / padaSize) + 1;
  return { name: nak.name, number: Math.min(nakIndex, 26) + 1, lord: nak.lord, pada, pada108 };
}

function getD108(longitude: number) {
  const normalized = normalizeLongitude(longitude);
  const natalSign = Math.floor(normalized / 30) + 1;
  const degInSign = normalized % 30;
  const partSize = 30 / 108;
  const part = Math.floor(degInSign / partSize) + 1;

  // Experimental Ashtottaramsa mapping. The part is the 1-108 amsa within the natal rashi.
  // The sign mapping is intentionally separated from Pada108 because these are different 108 grids.
  const d108Sign = ((natalSign + part - 2) % 12) + 1;
  return { sign: d108Sign, part };
}

function buildPlanetRow(planet: PlanetData, karakaByPlanet: Record<string, string>, adjLon: (l: number) => number, precision: DegreePrecision) {
  const graha = GRAHA_NAMES[planet.name] ?? { code: planet.name.slice(0, 2), name: planet.name };
  const nak = getNakshatra(adjLon(planet.longitude));
  const d108 = getD108(planet.longitude);
  return {
    code: graha.code + (planet.isRetrograde ? ' ℞' : ''),
    name: graha.name,
    karaka: karakaByPlanet[planet.name] ?? '',
    position: `${SIGN_ABBR[planet.sign]} ${tableFormatDeg(planet.degree, precision)}`,
    nakshatra: `${nak.name}(${nak.number}) ${nak.lord}`,
    pada: nak.pada,
    pada108: nak.pada108,
    d108: `${SIGN_ABBR[d108.sign]} (${d108.part})`,
  };
}

interface Props {
  chart: ChartData;
  karakaByPlanet?: Record<string, string>;
  degreePrecision?: DegreePrecision;
  showOuterPlanets?: boolean;
  showSpecialLagnas?: boolean;
  showNakshatra?: boolean;
  /** @deprecated Pada columns removed */
  showNakshatraPada?: boolean;
  /** @deprecated D108 removed */
  showD108?: boolean;
  nakshatraAdjust?: number;
}

export default function JyotishGrahaTable({
  chart,
  karakaByPlanet = {},
  degreePrecision = 'off',
  showOuterPlanets = false,
  showSpecialLagnas = true,
  showNakshatra = true,
  nakshatraAdjust = 0,
}: Props) {
  const adjLon = (lon: number) => ((lon + nakshatraAdjust) % 360 + 360) % 360;
  const ascNak = getNakshatra(adjLon(chart.ascendant.longitude));
  const ascD108 = getD108(chart.ascendant.longitude);

  const buildSpecialLagnaRow = (sl: SpecialLagna) => {
    const nak = getNakshatra(adjLon(sl.longitude));
    const d108 = getD108(sl.longitude);
    return {
      code: sl.name,
      name: sl.name,
      karaka: '',
      position: `${SIGN_ABBR[sl.sign]} ${tableFormatDeg(sl.degree, degreePrecision)}`,
      nakshatra: `${nak.name}(${nak.number}) ${nak.lord}`,
      pada: nak.pada,
      pada108: nak.pada108,
      d108: `${SIGN_ABBR[d108.sign]} (${d108.part})`,
      isSpecial: true,
    };
  };

  const filteredPlanets = showOuterPlanets
    ? chart.planets
    : chart.planets.filter((p) => !OUTER_PLANETS.includes(p.name));

  const rows = [
    {
      code: 'As',
      name: 'Lagna',
      karaka: '',
      position: `${SIGN_ABBR[chart.ascendant.sign]} ${tableFormatDeg(chart.ascendant.degree, degreePrecision)}`,
      nakshatra: `${ascNak.name}(${ascNak.number}) ${ascNak.lord}`,
      pada: ascNak.pada,
      pada108: ascNak.pada108,
      d108: `${SIGN_ABBR[ascD108.sign]} (${ascD108.part})`,
      isSpecial: false,
    },
    ...filteredPlanets.map((p) => ({ ...buildPlanetRow(p, karakaByPlanet, adjLon, degreePrecision), isSpecial: false })),
    ...(showSpecialLagnas ? (chart.specialLagnas ?? []).map(buildSpecialLagnaRow) : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse font-mono">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="p-2 text-left">Code</th>
            <th className="p-2 text-left">Graha</th>
            <th className="p-2 text-left">Pos</th>
            {showNakshatra && <th className="p-2 text-left">Nakṣatra</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className={`p-2 font-bold ${row.isSpecial ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-700 dark:text-green-400'}`}>{row.code}</td>
              <td className="p-2 text-zinc-800 dark:text-zinc-100">{row.name}</td>
              <td className="p-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{row.position}</td>
              {showNakshatra && <td className="p-2 text-cyan-700 dark:text-cyan-300 whitespace-nowrap">{row.nakshatra}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
