import { ChartData, PlanetData, SpecialLagna } from '@/types';

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
  const nak = NAKSHATRAS[Math.min(nakIndex, 26)];
  const remainder = longitude % nakSize;
  const pada = Math.floor(remainder / padaSize) + 1;
  return { name: nak.name, number: Math.min(nakIndex, 26) + 1, lord: nak.lord, pada };
}

function getD108(longitude: number) {
  const sign = Math.floor(longitude / 30) + 1;
  const degInSign = longitude % 30;
  const partSize = 30 / 108;
  const part = Math.floor(degInSign / partSize) + 1;
  const d108Sign = ((sign + part - 2) % 12) + 1;
  return { sign: d108Sign, part };
}

function buildPlanetRow(planet: PlanetData, karakaByPlanet: Record<string, string>) {
  const graha = GRAHA_NAMES[planet.name] ?? { code: planet.name.slice(0, 2), name: planet.name };
  const nak = getNakshatra(planet.longitude);
  const d108 = getD108(planet.longitude);
  return {
    code: graha.code,
    name: graha.name,
    karaka: karakaByPlanet[planet.name] ?? '',
    position: `${SIGN_ABBR[planet.sign]} ${formatDms(planet.degree)}`,
    nakshatra: `${nak.name}(${nak.number}) ${nak.lord}`,
    pada: nak.pada,
    d108: `${SIGN_ABBR[d108.sign]} (${d108.part})`,
  };
}

interface Props {
  chart: ChartData;
  karakaByPlanet?: Record<string, string>;
  showOuterPlanets?: boolean;
  showSpecialLagnas?: boolean;
}

export default function JyotishGrahaTable({
  chart,
  karakaByPlanet = {},
  showOuterPlanets = false,
  showSpecialLagnas = true,
}: Props) {
  const ascNak = getNakshatra(chart.ascendant.longitude);
  const ascD108 = getD108(chart.ascendant.longitude);

  const buildSpecialLagnaRow = (sl: SpecialLagna) => {
    const nak = getNakshatra(sl.longitude);
    const d108 = getD108(sl.longitude);
    return {
      code: sl.name,
      name: sl.name,
      karaka: '',
      position: `${SIGN_ABBR[sl.sign]} ${formatDms(sl.degree)}`,
      nakshatra: `${nak.name}(${nak.number}) ${nak.lord}`,
      pada: nak.pada,
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
      position: `${SIGN_ABBR[chart.ascendant.sign]} ${formatDms(chart.ascendant.degree)}`,
      nakshatra: `${ascNak.name}(${ascNak.number}) ${ascNak.lord}`,
      pada: ascNak.pada,
      d108: `${SIGN_ABBR[ascD108.sign]} (${ascD108.part})`,
      isSpecial: false,
    },
    ...filteredPlanets.map((p) => ({ ...buildPlanetRow(p, karakaByPlanet), isSpecial: false })),
    ...(showSpecialLagnas ? (chart.specialLagnas ?? []).map(buildSpecialLagnaRow) : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse font-mono">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="p-2">Code</th>
            <th className="p-2">Graha</th>
            <th className="p-2">Pos</th>
            <th className="p-2">Nakṣatra</th>
            <th className="p-2">Pada</th>
            <th className="p-2">D108</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code}>
              <td className="p-2">{row.code}</td>
              <td className="p-2">{row.name}</td>
              <td className="p-2">{row.position}</td>
              <td className="p-2">{row.nakshatra}</td>
              <td className="p-2">{row.pada}</td>
              <td className="p-2">{row.d108}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
