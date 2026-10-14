import type { ReactNode } from 'react';
import type { ChartData } from '@/types';
import { getVargaSignIndex } from '@/lib/varga';
import { buildClassicalBhavaBala } from '@/lib/bhavaBala';
// The Shadbala engine lives in src/lib/shadbala.ts. This file keeps the
// varga-matrix and Vimsopaka display calculations and the one view that shows them.
import { buildShadbalaRows, getDignity, SCORE_PLANETS, type Dignity } from '@/lib/shadbala';
import { SIGN_ABBR } from '@/lib/signs';
import { useT } from '@/lib/i18n';

const DEFAULT_DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
const ROW_ORDER = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
// Mūlatrikoṇa only appears when getDignity is given a degree, which the varga
// matrix does not do — its cells are whole-sign. The entries are here so the
// maps stay total against the Dignity union.
const DIGNITY_VISWA: Record<Dignity, number> = { exalted: 20, moolatrikona: 20, own: 20, friend: 15, neutral: 10, enemy: 7, debilitated: 0, none: 0 };
const DIGNITY_LABELS: Record<Dignity, string> = { exalted: 'Ex', moolatrikona: 'MT', own: 'Own', friend: 'Fr', neutral: 'Neu', enemy: 'En', debilitated: 'Deb', none: '—' };
const VIMSOPAKA_SCHEMES = {
  shadvarga: { label: 'Ṣaḍvarga', weights: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 } },
  saptavarga: { label: 'Saptavarga', weights: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 } },
  dasavarga: { label: 'Daśavarga', weights: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 } },
  shodasavarga: { label: 'Ṣoḍaśavarga', weights: { D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5, D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4 } },
} as const;
type SchemeKey = keyof typeof VIMSOPAKA_SCHEMES;

type Cell = { sign: string; signIndex: number | null; dignity: Dignity };
type Matrix = Record<string, Record<string, Cell>>;
type VimsopakaRow = { planet: string } & Record<SchemeKey, number>;

const DASH_CELL: Cell = { sign: '—', signIndex: null, dignity: 'none' };

const formatScore = (value: number) => (Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, '') : '—');

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

/** The sign of each body in each divisional chart, with its dignity there. */
function buildVargaMatrix(planets: Record<string, number>, lagna: number | undefined, divisions: number[]): Matrix {
  const source: Record<string, number | undefined> = { Lagna: lagna, ...planets };
  const matrix: Matrix = {};
  for (const name of ROW_ORDER) {
    matrix[name] = {};
    for (const division of divisions) {
      const longitude = source[name];
      if (typeof longitude !== 'number') {
        matrix[name][`D${division}`] = DASH_CELL;
        continue;
      }
      const signIndex = getVargaSignIndex(longitude, division);
      matrix[name][`D${division}`] = { sign: SIGN_ABBR[signIndex], signIndex, dignity: getDignity(name, signIndex) };
    }
  }
  return matrix;
}

/** Vimsopaka: the dignity of a planet in each divisional chart of a scheme, weighted, out of 20. */
function buildVimsopakaStrength(planets: Record<string, number>, matrix: Matrix): VimsopakaRow[] {
  const rows: VimsopakaRow[] = [];
  for (const planet of SCORE_PLANETS) {
    if (typeof planets[planet] !== 'number') continue;
    const row = { planet } as VimsopakaRow;
    for (const [schemeKey, scheme] of Object.entries(VIMSOPAKA_SCHEMES) as [SchemeKey, (typeof VIMSOPAKA_SCHEMES)[SchemeKey]][]) {
      row[schemeKey] = Object.entries(scheme.weights).reduce(
        (sum, [divisionKey, weight]) => sum + (weight * DIGNITY_VISWA[matrix[planet]?.[divisionKey]?.dignity ?? 'none']) / 20,
        0,
      );
    }
    rows.push(row);
  }
  return rows.sort((a, b) => b.shodasavarga - a.shodasavarga || b.dasavarga - a.dasavarga || b.saptavarga - a.saptavarga || b.shadvarga - a.shadvarga);
}

function mapPlanetLongitudes(chart: ChartData): Record<string, number> {
  const wanted = new Set(ROW_ORDER.filter((name) => name !== 'Lagna'));
  const result: Record<string, number> = {};
  for (const planet of chart.planets ?? []) {
    if (wanted.has(planet.name) && typeof planet.longitude === 'number') result[planet.name] = planet.longitude;
  }
  return result;
}

const HEAD_CELL = 'text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400';
const BODY_CELL = 'p-2 border border-zinc-100 dark:border-zinc-800';
const ROW = 'border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50';
const NAME_CELL = `${BODY_CELL} font-bold text-emerald-700 dark:text-green-400`;
const VALUE_CELL = `${BODY_CELL} text-zinc-700 dark:text-zinc-300`;
const TOTAL_CELL = `${BODY_CELL} font-bold text-amber-700 dark:text-amber-300`;

/** A "> command" heading with its explanation under it. */
function Heading({ command, children }: { command: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; {command}</div>
      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">{children}</div>
    </div>
  );
}

function ScrollTable({ minWidth, headers, children }: { minWidth: string; headers: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
      <table className={`w-full ${minWidth} border-collapse text-xs font-mono`}>
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            {headers.map((header, index) => <th key={index} className={HEAD_CELL}>{header}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default function VargaMatrix({ chart }: { chart: ChartData | null | undefined }) {
  const t = useT();
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">{t('Calculate a chart first.')}</div>;

  const divisions = DEFAULT_DIVISIONS;
  const planets = mapPlanetLongitudes(chart);
  const lagna = typeof chart.ascendant?.longitude === 'number' ? chart.ascendant.longitude : undefined;
  const matrix = buildVargaMatrix(planets, lagna, divisions);
  const strength = buildVimsopakaStrength(planets, matrix);
  const shadbala = buildShadbalaRows(chart);
  const bhavaBala = buildClassicalBhavaBala(chart, shadbala);
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

      <div className="space-y-2">
        <Heading command="varga.strength.vimsopaka">{t('Four weighted calculations out of 20. Rahu/Ketu and Lagna excluded.')}</Heading>
        <ScrollTable minWidth="min-w-[720px]" headers={[t('Planet'), ...Object.values(VIMSOPAKA_SCHEMES).map((scheme) => scheme.label)]}>
          {strength.map((row) => (
            <tr key={row.planet} className={ROW}>
              <td className={NAME_CELL}>{row.planet}</td>
              {(Object.keys(VIMSOPAKA_SCHEMES) as SchemeKey[]).map((key) => (
                <td key={key} className={TOTAL_CELL}>{formatScore(row[key])} / 20</td>
              ))}
            </tr>
          ))}
        </ScrollTable>
      </div>

      <div className="space-y-2">
        <Heading command="shadbala.beta">{t('Values in virūpa. Exact: Uccha, Saptavargaja, Ojhayugma, Kendradi, Drekkana, Natonnata, Paksha, Tribhaga, Vara, Ayana, Cheṣṭā, Naisargika. Approx (~): Dig (whole-sign house proxy), Dṛg (orb-weighted, can be negative).')}</Heading>
        <ScrollTable minWidth="min-w-[1100px]" headers={[t('Planet'), 'Sthāna', 'Dig', 'Kāla', 'Cheṣṭā', 'Naisargika', 'Dṛg', 'Total vp', 'Req vp', '%', t('Status')]}>
          {shadbala.map((row) => {
            const percent = Math.round(row.ratio * 100);
            const statusClass = row.ratio < 1 ? 'text-red-600 dark:text-red-400' : row.ratio < 1.2 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
            const status = row.ratio < 1 ? 'weak' : row.ratio < 1.2 ? 'ok' : 'strong';
            const sthana = row.sthanaBreakdown;
            const kala = row.kalaBreakdown;
            return (
              <tr key={row.planet} className={ROW}>
                <td className={NAME_CELL}>{row.planet}{row.retrograde ? ' ℞' : ''}</td>
                <td className={VALUE_CELL} title={`Uccha ${formatScore(sthana.uccha)} + Sapt ${formatScore(sthana.saptavargaja)} + Ojhayugma ${formatScore(sthana.ojhayugma)} + Kendradi ${formatScore(sthana.kendradi)} + Drekkana ${formatScore(sthana.drekkana)} vp`}>{formatScore(sthana.total)}</td>
                <td className={VALUE_CELL}>{formatScore(row.digVirupa)}</td>
                <td className={VALUE_CELL} title={`Nat ${formatScore(kala.natonnata)} + Pksh ${formatScore(kala.paksha)} + Tri ${formatScore(kala.tribhaaga)} + Vara ${formatScore(kala.varsheshadi)} + Ayn ${formatScore(kala.ayana)} vp`}>{formatScore(kala.total)}</td>
                <td className={VALUE_CELL}>{formatScore(row.cheshtaVirupa)}</td>
                <td className={VALUE_CELL}>{formatScore(row.naisargikaVirupa)}</td>
                <td className={VALUE_CELL}>{formatScore(row.drikVirupa)}</td>
                <td className={TOTAL_CELL}>{Math.round(row.totalVirupa)} vp</td>
                <td className={`${BODY_CELL} text-zinc-500 dark:text-zinc-400`}>{row.requiredVirupa} vp</td>
                <td className={`${BODY_CELL} font-bold text-cyan-700 dark:text-cyan-300`}>{percent}%</td>
                <td className={`${BODY_CELL} font-bold ${statusClass}`}>{t(status)}</td>
              </tr>
            );
          })}
        </ScrollTable>
      </div>

      <div className="space-y-2">
        <Heading command="bhava.bala.beta">{t("Bhavesha = lord's Ṣaḍbala (virupa). Drig = simplified drishti to sign midpoint. Kendra = +15 virupa (H1/4/7/10). Bhava Digbala and Kala Bala not yet included.")}</Heading>
        <ScrollTable minWidth="min-w-[640px]" headers={[t('House'), t('Sign'), t('Lord'), 'Bhavesha', 'Drig+', 'Drig−', 'Kendra', t('Total')]}>
          {bhavaBala.map((row) => (
            <tr key={row.house} className={ROW}>
              <td className={NAME_CELL}>H{row.house}</td>
              <td className={VALUE_CELL}>{row.sign}</td>
              <td className={VALUE_CELL}>{row.lord}</td>
              <td className={VALUE_CELL}>{formatScore(row.bhavesha)}</td>
              <td className={VALUE_CELL}>{formatScore(row.drig1 + row.drig2)}</td>
              <td className={VALUE_CELL}>{formatScore(row.drig3 + row.drig4)}</td>
              <td className={VALUE_CELL}>{formatScore(row.kendra)}</td>
              <td className={TOTAL_CELL}>{formatScore(row.total)}</td>
            </tr>
          ))}
        </ScrollTable>
      </div>
    </div>
  );
}
