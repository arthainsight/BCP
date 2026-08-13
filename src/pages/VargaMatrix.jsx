'use client';

import { useState, Fragment } from 'react';
import { getVargaSignIndex } from '@/lib/varga';
import { buildClassicalBhavaBala } from '@/lib/bhavaBala';
// The Shadbala engine used to live in this file as untyped one-liners; it now
// has types and fixtures in src/lib/shadbala.ts. This file keeps only the UI
// cards plus the varga-matrix and Vimsopaka display calculations.
import { buildShadbalaRows, getDignity, SCORE_PLANETS } from '@/lib/shadbala';

const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const DEFAULT_DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
const ROW_ORDER = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const DIGNITY_VISWA = { exalted: 20, own: 20, friend: 15, neutral: 10, enemy: 7, debilitated: 0, none: 0 };
const DIGNITY_LABELS = { exalted: 'Ex', own: 'Own', friend: 'Fr', neutral: 'Neu', enemy: 'En', debilitated: 'Deb', none: '—' };
const VIMSOPAKA_SCHEMES = {
  shadvarga: { label: 'Ṣaḍvarga', weights: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 } },
  saptavarga: { label: 'Saptavarga', weights: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 } },
  dasavarga: { label: 'Daśavarga', weights: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 } },
  shodasavarga: { label: 'Ṣoḍaśavarga', weights: { D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5, D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4 } },
};

export function getVargaSign(longitude, division) { return getVargaSignIndex(longitude, division); }
function formatScore(value) { return Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, '') : '—'; }
function getDignityCellClass(dignity) { switch (dignity) { case 'exalted': case 'own': return 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/70'; case 'friend': return 'bg-lime-50 dark:bg-lime-950/25 text-lime-800 dark:text-lime-200 border-lime-200 dark:border-lime-800/50'; case 'neutral': return 'bg-zinc-50 dark:bg-zinc-800/45 text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800'; case 'enemy': return 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800/60'; case 'debilitated': return 'bg-red-50 dark:bg-red-950/35 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/70'; default: return 'text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800'; } }



export function buildVargaMatrix(planets = {}, lagna, divisions = DEFAULT_DIVISIONS) { const source = { Lagna: lagna, ...planets }; const matrix = {}; ROW_ORDER.forEach((name) => { matrix[name] = {}; divisions.forEach((division) => { const key = `D${division}`; const longitude = source[name]; if (typeof longitude !== 'number') { matrix[name][key] = { sign: '—', signIndex: null, dignity: 'none' }; return; } const signIndex = getVargaSign(longitude, division); matrix[name][key] = { sign: SIGN_ABBR[signIndex], signIndex, dignity: getDignity(name, signIndex) }; }); }); return matrix; }
function buildVimsopakaStrength(planets = {}, matrix = {}) { return SCORE_PLANETS.map((planet) => { if (typeof planets[planet] !== 'number') return null; const scores = {}; Object.entries(VIMSOPAKA_SCHEMES).forEach(([schemeKey, scheme]) => { scores[schemeKey] = Object.entries(scheme.weights).reduce((sum, [divisionKey, weight]) => sum + weight * (DIGNITY_VISWA[matrix[planet]?.[divisionKey]?.dignity ?? 'none'] ?? 0) / 20, 0); }); return { planet, ...scores }; }).filter(Boolean).sort((a, b) => b.shodasavarga - a.shodasavarga || b.dasavarga - a.dasavarga || b.saptavarga - a.saptavarga || b.shadvarga - a.shadvarga); }
function mapPlanetLongitudes(chart) { const wanted = new Set(ROW_ORDER.filter((name) => name !== 'Lagna')); const result = {}; (chart?.planets ?? []).forEach((planet) => { if (wanted.has(planet.name) && typeof planet.longitude === 'number') result[planet.name] = planet.longitude; }); return result; }
function formatDivisionList(divisions) { return divisions.map((division) => `D${division}`).join(', '); }

export function VargaMatrixCard({ chart }) {
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">Calculate a chart to see Varga Matrix</div>;
  const divisions = DEFAULT_DIVISIONS;
  const planets = mapPlanetLongitudes(chart);
  const lagna = typeof chart?.ascendant?.longitude === 'number' ? chart.ascendant.longitude : undefined;
  const matrix = buildVargaMatrix(planets, lagna, divisions);
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Varga Matrix</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">{formatDivisionList(divisions)} from sidereal longitudes. Cell colour = dignity; debilitated = 0 strength.</div>
      </div>
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[980px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="sticky left-0 z-10 bg-zinc-100 dark:bg-zinc-800 text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Body</th>
              {divisions.map((d) => <th key={d} className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">D{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROW_ORDER.map((name) => (
              <tr key={name} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{name}</td>
                {divisions.map((d) => {
                  const cell = matrix[name][`D${d}`];
                  return (
                    <td key={d} className={`p-2 border whitespace-nowrap ${getDignityCellClass(cell.dignity)}`} title={DIGNITY_LABELS[cell.dignity]}>
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

export function VargaStrengthCard({ chart }) {
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">Calculate a chart to see Varga Strength</div>;
  const divisions = DEFAULT_DIVISIONS;
  const planets = mapPlanetLongitudes(chart);
  const lagna = typeof chart?.ascendant?.longitude === 'number' ? chart.ascendant.longitude : undefined;
  const matrix = buildVargaMatrix(planets, lagna, divisions);
  const strength = buildVimsopakaStrength(planets, matrix);
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Varga Strength / Viṁśopaka Bala</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">Four weighted calculations out of 20. Rahu/Ketu and Lagna excluded.</div>
      </div>
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[720px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th>
              {Object.entries(VIMSOPAKA_SCHEMES).map(([key, scheme]) => (
                <th key={key} className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">{scheme.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strength.map((row) => (
              <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}</td>
                {Object.keys(VIMSOPAKA_SCHEMES).map((key) => (
                  <td key={key} className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{formatScore(row[key])} / 20</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ShadbalaCard({ chart }) {
  const [showDebug, setShowDebug] = useState(false);
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">Calculate a chart to see Shadbala</div>;
  const shadbala = buildShadbalaRows(chart);
  const ayanamsa = chart?.debug?.ayanamsa;
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Shadbala <span className="text-[9px] font-normal text-amber-600 dark:text-amber-400 ml-1">beta</span></div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          Values in virūpa. Exact: Uccha, Ojhayugma, Kendradi, Drekkana, Paksha, Naisargika, Vara.
          Approx (~): Saptavargaja (no Moolatrikona), Dig (house proxy), Natonnata (Sun-house proxy),
          Tribhaga (~6am sunrise), Ayana (~sin proxy{ayanamsa != null ? `, ayan ${ayanamsa.toFixed(2)}°` : ''}),
          Cheṣṭā (~retrograde/elongation), Dṛg (~orb-weighted, can be negative).
          Vara = {chart?.debug?.inputDateTime ? new Date(chart.debug.inputDateTime.replace(' ', 'T')).toLocaleDateString('en-US', { weekday: 'long' }) : '—'}.
        </div>
      </div>
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[1100px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Sthāna</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Dig</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Kāla</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Cheṣṭā</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Naisargika</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Dṛg</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Total vp</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Req vp</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">%</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {shadbala.map((row) => {
              const pct = Math.round(row.ratio * 100);
              const statusCls = row.ratio < 1 ? 'text-red-600 dark:text-red-400' : row.ratio < 1.2 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
              const statusLabel = row.ratio < 1 ? 'weak' : row.ratio < 1.2 ? 'ok' : 'strong';
              return (
                <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}{row.retrograde ? ' ℞' : ''}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={`Uccha ${formatScore(row.sthanaBreakdown.uccha)} + ~Sapt ${formatScore(row.sthanaBreakdown.saptavargaja)} + Ojhayugma ${formatScore(row.sthanaBreakdown.ojhayugma)} + Kendradi ${formatScore(row.sthanaBreakdown.kendradi)} + Drekkana ${formatScore(row.sthanaBreakdown.drekkana)} vp`}>{formatScore(row.sthanaBreakdown.total)}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={`~Dig: H${row.house} proxy`}>{formatScore(row.digVirupa)}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={`Sect ${row.kalaBreakdown.sect}; ~Nat ${formatScore(row.kalaBreakdown.natonnata)} + Pksh ${formatScore(row.kalaBreakdown.paksha)} + ~Tri ${formatScore(row.kalaBreakdown.tribhaaga)} (${row.kalaBreakdown.tribhagaLord ?? '?'}) + Vara ${formatScore(row.kalaBreakdown.varsheshadi)} + ~Ayn ${formatScore(row.kalaBreakdown.ayana)} vp`}>{formatScore(row.kalaBreakdown.total)}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={row.retrograde ? '~Cheṣṭā: retrograde → vakra=60' : '~Cheṣṭā: elongation proxy'}>{formatScore(row.cheshtaVirupa)}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.naisargikaVirupa)}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.drikVirupa)}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{Math.round(row.totalVirupa)} vp</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">{row.requiredVirupa} vp</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-cyan-700 dark:text-cyan-300">{pct}%</td>
                  <td className={`p-2 border border-zinc-100 dark:border-zinc-800 font-bold ${statusCls}`}>{statusLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2">
        <button onClick={() => setShowDebug((v) => !v)} className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
          <span className="text-[9px]">{showDebug ? '▼' : '▶'}</span>
          debug: intermediate virupa values
        </button>
        {showDebug && (
          <div className="mt-2 overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
            <table className="w-full min-w-[1200px] border-collapse text-[10px] font-mono">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500" colSpan={5}>— Sthāna Bala (virupa) —</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Dig</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500" colSpan={5}>— Kāla Bala (virupa) —</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Cheṣṭā</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Nais.</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Dṛg</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Total</th>
                </tr>
                <tr className="bg-zinc-50 dark:bg-zinc-800/60">
                  <th className="p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500"></th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Uccha</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">~Sapt7</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">O/E</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Kdr</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Drek</th>
                  <th className="p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">~Dig</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">~Nat</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Pksh</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">~Tri({'{lord}'})</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Vara</th>
                  <th className="text-left p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">~Ayn</th>
                  <th className="p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">~Cheṣṭā</th>
                  <th className="p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Nais.</th>
                  <th className="p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">~Dṛg</th>
                  <th className="p-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500">Total (vp)</th>
                </tr>
              </thead>
              <tbody>
                {shadbala.map((row) => {
                  const s = row.sthanaBreakdown;
                  const k = row.kalaBreakdown;
                  const fmt = (v) => formatScore(v);
                  return (
                    <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}{row.retrograde ? ' ℞' : ''}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(s.uccha)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(s.saptavargaja)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(s.ojhayugma)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(s.kendradi)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(s.drekkana)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(row.digVirupa)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(k.natonnata)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(k.paksha)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(k.tribhaaga)} <span className="text-zinc-400 dark:text-zinc-500 text-[9px]">({k.tribhagaLord ?? '?'})</span></td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(k.varsheshadi)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(k.ayana)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(row.cheshtaVirupa)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(row.naisargikaVirupa)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">{fmt(row.drikVirupa)}</td>
                      <td className="p-1.5 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{fmt(row.totalVirupa)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function BhavaBalaCard({ chart }) {
  const [expandedHouse, setExpandedHouse] = useState(null);
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">Calculate a chart to see Bhava Bala</div>;
  const shadbala = buildShadbalaRows(chart);
  const bhavaBala = buildClassicalBhavaBala(chart, shadbala);
  const mean = bhavaBala.reduce((s, r) => s + r.total, 0) / 12;

  function getStatus(total) {
    if (total >= mean * 1.1) return 'strong';
    if (total >= mean * 0.9) return 'ok';
    return 'weak';
  }
  function getStatusCls(status) {
    if (status === 'strong') return 'text-emerald-600 dark:text-emerald-400';
    if (status === 'ok') return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Bhava Bala <span className="text-[9px] font-normal text-amber-600 dark:text-amber-400 ml-1">beta</span></div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          Bhavadhipati = lord&apos;s Ṣaḍbala virupa (ratio shown). ~Drig = orb-based drishti to sign midpoint.
          ~Occupant = benefic +45×ratio, malefic −30×ratio. ~Dig = kendra +15/panapara +7.5 vp.
          Status relative to chart mean. Click a row for per-house debug breakdown.
        </div>
      </div>
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[860px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">House</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Sign</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Lord</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Bhavadhipati vp</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">~Occupants</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">~Drig+</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">~Drig−</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">~Dig</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Total vp</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {bhavaBala.map((row) => {
              const status = getStatus(row.total);
              const statusCls = getStatusCls(status);
              const isExpanded = expandedHouse === row.house;
              const totalPct = mean > 0 ? Math.round((row.total / mean) * 100) : 0;
              const drigPos = row.drig1 + row.drig2;
              const drigNeg = row.drig3 + row.drig4;
              return (
                <Fragment key={row.house}>
                  <tr
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                    onClick={() => setExpandedHouse(isExpanded ? null : row.house)}
                  >
                    <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400 whitespace-nowrap">
                      H{row.house} <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{isExpanded ? '▼' : '▶'}</span>
                    </td>
                    <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.sign}</td>
                    <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.lord}</td>
                    <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={row.bhaveshaSource}>
                      {formatScore(row.bhavesha)}
                      <span className="ml-1 text-[9px] text-zinc-400 dark:text-zinc-500">{row.bhaveshaRatio.toFixed(2)}×</span>
                    </td>
                    <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {row.occupants.length === 0 ? <span className="text-zinc-400 dark:text-zinc-600">—</span> : row.occupants.map((o) => (
                        <span key={o.name} className={o.nature === 'benefic' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                          {o.name}({o.contribution > 0 ? '+' : ''}{Math.round(o.contribution)})
                        </span>
                      ))}
                    </td>
                    <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-emerald-700 dark:text-emerald-400">{drigPos > 0 ? `+${formatScore(drigPos)}` : '—'}</td>
                    <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-red-600 dark:text-red-400">{drigNeg < 0 ? formatScore(drigNeg) : '—'}</td>
                    <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.kendra > 0 ? `+${formatScore(row.kendra)}` : '—'}</td>
                    <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                      {Math.round(row.total)} <span className="text-[9px] text-zinc-400 dark:text-zinc-500">({totalPct}%)</span>
                    </td>
                    <td className={`p-2 border border-zinc-100 dark:border-zinc-800 font-bold ${statusCls}`}>{status}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-zinc-50 dark:bg-zinc-800/40">
                      <td colSpan={10} className="p-3 border border-zinc-100 dark:border-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">Lord:</span> {row.lord} —{' '}
                            <span className="text-zinc-500 dark:text-zinc-500">source:</span> {row.bhaveshaSource}
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">~Occupants:</span>{' '}
                            {row.occupants.length === 0
                              ? 'none'
                              : row.occupants.map((o) => `${o.name} (${o.nature}, ${o.note}) → ${o.contribution > 0 ? '+' : ''}${o.contribution.toFixed(1)} vp`).join('; ')}
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">~Drig aspects to H{row.house} sign midpoint:</span>{' '}
                            {row.drigDetails.length === 0
                              ? 'none'
                              : row.drigDetails.map((d) => `${d.planet}(${d.nature[0]}: ${d.contribution > 0 ? '+' : ''}${d.contribution.toFixed(1)} vp, str=${d.aspectStrength.toFixed(2)})`).join('; ')}
                          </div>
                          <div>
                            <span className="text-zinc-500 dark:text-zinc-500">~Dig Bala:</span>{' '}
                            {row.kendra > 0
                              ? `+${row.kendra} vp (${[1, 4, 7, 10].includes(row.house) ? 'kendra/angular' : 'panapara/succedent'})`
                              : '0 (apoklima/cadent)'} — approximate
                          </div>
                          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-1.5 text-zinc-500 dark:text-zinc-500">
                            Calculation: Bhavadhipati {formatScore(row.bhavesha)}
                            {row.occupantTotal !== 0 && ` + ~Occ ${row.occupantTotal > 0 ? '+' : ''}${row.occupantTotal.toFixed(1)}`}
                            {` + ~Drig+ ${formatScore(row.drig1 + row.drig2)}`}
                            {` + ~Drig− ${formatScore(row.drig3 + row.drig4)}`}
                            {row.kendra > 0 && ` + ~Dig ${row.kendra}`}
                            {' = '}<span className="font-bold text-amber-700 dark:text-amber-300">{Math.round(row.total)} vp</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VargaMatrix({ chart }) {
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">Calculate a chart first.</div>;
  const divisions = DEFAULT_DIVISIONS;
  const planets = mapPlanetLongitudes(chart);
  const lagna = typeof chart?.ascendant?.longitude === 'number' ? chart.ascendant.longitude : undefined;
  const matrix = buildVargaMatrix(planets, lagna, divisions);
  const strength = buildVimsopakaStrength(planets, matrix);
  const shadbala = buildShadbalaRows(chart);
  const bhavaBala = buildClassicalBhavaBala(chart, shadbala);
  const divisionList = formatDivisionList(divisions);
  return <div className="space-y-5">
    <div><div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; varga.matrix</div><div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">{divisionList} from existing sidereal longitudes. Cell colour = dignity; debilitated = 0 strength.</div></div>
    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg"><table className="w-full min-w-[980px] border-collapse text-xs font-mono"><thead><tr className="bg-zinc-100 dark:bg-zinc-800"><th className="sticky left-0 z-10 bg-zinc-100 dark:bg-zinc-800 text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Body</th>{divisions.map((division) => <th key={division} className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">D{division}</th>)}</tr></thead><tbody>{ROW_ORDER.map((name) => <tr key={name} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{name}</td>{divisions.map((division) => { const cell = matrix[name][`D${division}`]; return <td key={division} className={`p-2 border whitespace-nowrap ${getDignityCellClass(cell.dignity)}`} title={DIGNITY_LABELS[cell.dignity]}><span className="font-bold">{cell.sign}</span>{cell.dignity !== 'none' && <span className="ml-1 text-[9px] opacity-75">{DIGNITY_LABELS[cell.dignity]}</span>}</td>; })}</tr>)}</tbody></table></div>
    <div className="space-y-2"><div><div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; varga.strength.vimsopaka</div><div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">Four weighted calculations out of 20. Rahu/Ketu and Lagna excluded.</div></div><div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg"><table className="w-full min-w-[720px] border-collapse text-xs font-mono"><thead><tr className="bg-zinc-100 dark:bg-zinc-800"><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th>{Object.entries(VIMSOPAKA_SCHEMES).map(([key, scheme]) => <th key={key} className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">{scheme.label}</th>)}</tr></thead><tbody>{strength.map((row) => <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}</td>{Object.keys(VIMSOPAKA_SCHEMES).map((key) => <td key={key} className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{formatScore(row[key])} / 20</td>)}</tr>)}</tbody></table></div></div>
    <div className="space-y-2"><div><div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; shadbala.beta</div><div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">Values in virūpa. Exact: Uccha, Ojhayugma, Kendradi, Drekkana, Paksha, Naisargika, Vara. Approx (~): Saptavargaja, Dig, Natonnata, Tribhaga, Ayana, Cheṣṭā, Dṛg (can be negative).</div></div><div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg"><table className="w-full min-w-[1100px] border-collapse text-xs font-mono"><thead><tr className="bg-zinc-100 dark:bg-zinc-800"><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Sthāna</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Dig</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Kāla</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Cheṣṭā</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Naisargika</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Dṛg</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Total vp</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Req vp</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">%</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Status</th></tr></thead><tbody>{shadbala.map((row) => { const pct = Math.round(row.ratio * 100); const statusCls = row.ratio < 1 ? 'text-red-600 dark:text-red-400' : row.ratio < 1.2 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'; const statusLabel = row.ratio < 1 ? 'weak' : row.ratio < 1.2 ? 'ok' : 'strong'; return <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}{row.retrograde ? ' ℞' : ''}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={`Uccha ${formatScore(row.sthanaBreakdown.uccha)} + ~Sapt ${formatScore(row.sthanaBreakdown.saptavargaja)} + Ojhayugma ${formatScore(row.sthanaBreakdown.ojhayugma)} + Kendradi ${formatScore(row.sthanaBreakdown.kendradi)} + Drekkana ${formatScore(row.sthanaBreakdown.drekkana)} vp`}>{formatScore(row.sthanaBreakdown.total)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.digVirupa)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={`~Nat ${formatScore(row.kalaBreakdown.natonnata)} + Pksh ${formatScore(row.kalaBreakdown.paksha)} + ~Tri ${formatScore(row.kalaBreakdown.tribhaaga)} + Vara ${formatScore(row.kalaBreakdown.varsheshadi)} + ~Ayn ${formatScore(row.kalaBreakdown.ayana)} vp`}>{formatScore(row.kalaBreakdown.total)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.cheshtaVirupa)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.naisargikaVirupa)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.drikVirupa)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{Math.round(row.totalVirupa)} vp</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">{row.requiredVirupa} vp</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-cyan-700 dark:text-cyan-300">{pct}%</td><td className={`p-2 border border-zinc-100 dark:border-zinc-800 font-bold ${statusCls}`}>{statusLabel}</td></tr>; })}</tbody></table></div></div>
    <div className="space-y-2"><div><div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; bhava.bala.beta</div><div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">Bhavesha = lord&apos;s Ṣaḍbala (virupa). Drig = simplified drishti to sign midpoint. Kendra = +15 virupa (H1/4/7/10). Bhava Digbala and Kala Bala not yet included.</div></div><div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg"><table className="w-full min-w-[640px] border-collapse text-xs font-mono"><thead><tr className="bg-zinc-100 dark:bg-zinc-800"><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">House</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Sign</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Lord</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Bhavesha</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Drig+</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Drig−</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Kendra</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Total</th></tr></thead><tbody>{bhavaBala.map((row) => <tr key={row.house} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">H{row.house}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.sign}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.lord}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.bhavesha)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.drig1 + row.drig2)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.drig3 + row.drig4)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.kendra)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{formatScore(row.total)}</td></tr>)}</tbody></table></div></div>
  </div>;
}
