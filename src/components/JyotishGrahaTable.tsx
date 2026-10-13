'use client';

import { ChartData } from '@/types';
import { type DegreePrecision, formatDegree } from '@/lib/formatDegree';
import { normalizeDegrees } from '@/lib/angles';
import { grahaCode, grahaCodeFromEnglishCode, grahaName, useGrahaNames } from '@/lib/grahaNames';
import { SIGN_ABBR } from '@/lib/signs';
import { NAKSHATRA_SIZE } from '@/lib/nakshatras';

import { useT } from '@/lib/i18n';
const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];

// The Chara karakas, by their short names.
const KARAKA_NAMES: Record<string, string> = {
  AK: 'Ātmakāraka', AmK: 'Amātyakāraka', BK: 'Bhrātṛkāraka', MK: 'Mātṛkāraka',
  PiK: 'Pitṛkāraka', PuK: 'Putrakāraka', GK: 'Jñātikāraka', DK: 'Dārakāraka',
};


const NAKSHATRAS = [
  { name: 'Aśvinī', lord: 'Ke' },
  { name: 'Bharaṇī', lord: 'Ve' },
  { name: 'Kṛttikā', lord: 'Su' },
  { name: 'Rohiṇī', lord: 'Mo' },
  { name: 'Mṛgaśira', lord: 'Ma' },
  { name: 'Ārdrā', lord: 'Ra' },
  { name: 'Punarvasu', lord: 'Ju' },
  { name: 'Puṣya', lord: 'Sa' },
  { name: 'Aśleṣā', lord: 'Me' },
  { name: 'Maghā', lord: 'Ke' },
  { name: 'Pūrvaphālgunī', lord: 'Ve' },
  { name: 'Uttaraphālgunī', lord: 'Su' },
  { name: 'Hasta', lord: 'Mo' },
  { name: 'Citrā', lord: 'Ma' },
  { name: 'Svātī', lord: 'Ra' },
  { name: 'Viśākhā', lord: 'Ju' },
  { name: 'Anurādhā', lord: 'Sa' },
  { name: 'Jyeṣṭhā', lord: 'Me' },
  { name: 'Mūla', lord: 'Ke' },
  { name: 'Pūrvāṣāḍhā', lord: 'Ve' },
  { name: 'Uttarāṣāḍhā', lord: 'Su' },
  { name: 'Śravaṇa', lord: 'Mo' },
  { name: 'Dhaniṣṭhā', lord: 'Ma' },
  { name: 'Śatabhiṣaj', lord: 'Ra' },
  { name: 'Pūrvabhādrapadā', lord: 'Ju' },
  { name: 'Uttarabhādrapadā', lord: 'Sa' },
  { name: 'Revatī', lord: 'Me' },
];

function tableFormatDeg(deg: number, precision: DegreePrecision): string {
  return formatDegree(deg, precision === 'off' ? 'second' : precision);
}

function normalizeLongitude(longitude: number): number {
  return normalizeDegrees(longitude);
}

function getNakshatra(longitude: number) {
  const index = Math.min(Math.floor(normalizeLongitude(longitude) / NAKSHATRA_SIZE), 26);
  return { name: NAKSHATRAS[index].name, number: index + 1, lord: NAKSHATRAS[index].lord };
}

interface Props {
  chart: ChartData;
  karakaByPlanet?: Record<string, string>;
  degreePrecision?: DegreePrecision;
  showOuterPlanets?: boolean;
  showSpecialLagnas?: boolean;
  nakshatraAdjust?: number;
}

export default function JyotishGrahaTable({
  chart,
  karakaByPlanet = {},
  degreePrecision = 'off',
  showOuterPlanets = false,
  showSpecialLagnas = true,
  nakshatraAdjust = 0,
}: Props) {
  const t = useT();
  const { style } = useGrahaNames();
  const adjLon = (lon: number) => normalizeDegrees(lon + nakshatraAdjust);

  /** One row: a point of the chart with its sign and degree, and the nakṣatra of its longitude. */
  const buildRow = (code: string, name: string, karaka: string, sign: number, degree: number, longitude: number, isSpecial: boolean) => {
    const nak = getNakshatra(adjLon(longitude));
    return {
      code, name, karaka, isSpecial,
      position: `${SIGN_ABBR[sign - 1]} ${tableFormatDeg(degree, degreePrecision)}`,
      nakshatra: `${nak.name}(${nak.number}) ${grahaCodeFromEnglishCode(nak.lord, style)}`,
    };
  };

  const filteredPlanets = showOuterPlanets
    ? chart.planets
    : chart.planets.filter((p) => !OUTER_PLANETS.includes(p.name));

  const rows = [
    buildRow('As', 'Lagna', '', chart.ascendant.sign, chart.ascendant.degree, chart.ascendant.longitude, false),
    ...filteredPlanets.map((p) => buildRow(grahaCode(p.name, style) + (p.isRetrograde ? ' ℞' : ''), grahaName(p.name, style), karakaByPlanet[p.name] ?? '', p.sign, p.degree, p.longitude, false)),
    ...(showSpecialLagnas ? (chart.specialLagnas ?? []).map((sl) => buildRow(sl.name, sl.name, '', sl.sign, sl.degree, sl.longitude, true)) : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse font-mono">
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            <th className="p-2 text-left">{t('Code')}</th>
            <th className="p-2 text-left">Graha</th>
            <th className="p-2 text-left">{t('Pos')}</th>
            <th className="p-2 text-left">Kāraka</th>
            <th className="p-2 text-left">Nakṣatra</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className={`p-2 font-bold ${row.isSpecial ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-700 dark:text-green-400'}`}>{row.code}</td>
              <td className="p-2 text-zinc-800 dark:text-zinc-100">{row.name}</td>
              <td className="p-2 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{row.position}</td>
              <td className="p-2 font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap" title={KARAKA_NAMES[row.karaka]}>{row.karaka}</td>
              <td className="p-2 text-cyan-700 dark:text-cyan-300 whitespace-nowrap">{row.nakshatra}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
