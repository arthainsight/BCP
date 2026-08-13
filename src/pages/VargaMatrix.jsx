'use client';

import { useState, Fragment } from 'react';
import { getVargaSignIndex, getSignIndex, getDegreesInSign } from '@/lib/varga';
import { buildClassicalBhavaBala } from '@/lib/bhavaBala';

const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const DEFAULT_DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
const ROW_ORDER = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SCORE_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const BENEFICS = ['Moon', 'Mercury', 'Jupiter', 'Venus'];
const MALEFICS = ['Sun', 'Mars', 'Saturn'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const OWN_SIGNS = { Sun: [4], Moon: [3], Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10] };
const EXALTATION_SIGNS = { Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6 };
const DEBILITATION_SIGNS = { Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0 };
const EXALTATION_LONGITUDES = { Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200 };
const SHADBALA_REQUIRED_VIRUPA = { Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300 };
const NAISARGIKA_BALA_VIRUPA = { Sun: 60, Moon: 51, Venus: 43, Jupiter: 34, Mercury: 26, Mars: 17, Saturn: 9 };
const DIG_BALA_MAX_HOUSE = { Sun: 10, Mars: 10, Moon: 4, Venus: 4, Jupiter: 1, Mercury: 1, Saturn: 7 };
const ODD_EVEN_STRENGTH = { Sun: 'odd', Mars: 'odd', Jupiter: 'odd', Moon: 'even', Venus: 'even', Mercury: 'both', Saturn: 'both' };
const DREKKANA_STRENGTH = { Sun: 1, Mars: 1, Jupiter: 1, Mercury: 2, Saturn: 2, Moon: 3, Venus: 3 };
const DAY_NIGHT_STRENGTH = { Sun: 'day', Jupiter: 'day', Venus: 'day', Moon: 'night', Mars: 'night', Saturn: 'night', Mercury: 'both' };
const NATURAL_RELATIONS = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], neutral: ['Mercury'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], neutral: ['Venus', 'Saturn'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], neutral: ['Mars', 'Jupiter', 'Saturn'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], neutral: ['Saturn'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], neutral: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], neutral: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
};
const DIGNITY_VISWA = { exalted: 20, own: 20, friend: 15, neutral: 10, enemy: 7, debilitated: 0, none: 0 };
// Classical Saptavargaja Bala virupa per dignity (BPHS Ch.27). Used as per-varga weights;
// the sum across 7 vargas is divided by 7 so max = 45 (exalted in all 7).
// Exact (table-based). Moolatrikona treated as own since getDignity() doesn't distinguish it.
const SAPTAVARGAJA_VIRUPA = { exalted: 45, own: 30, friend: 22.5, neutral: 7.5, enemy: 3.75, debilitated: 0, none: 0 };
const DIGNITY_LABELS = { exalted: 'Ex', own: 'Own', friend: 'Fr', neutral: 'Neu', enemy: 'En', debilitated: 'Deb', none: '—' };
const VIMSOPAKA_SCHEMES = {
  shadvarga: { label: 'Ṣaḍvarga', weights: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 } },
  saptavarga: { label: 'Saptavarga', weights: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 } },
  dasavarga: { label: 'Daśavarga', weights: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 } },
  shodasavarga: { label: 'Ṣoḍaśavarga', weights: { D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5, D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4 } },
};

export { getSignIndex, getDegreesInSign };
export function getVargaSign(longitude, division) { return getVargaSignIndex(longitude, division); }
// See src/lib/varga/utils.ts — the ((x % 360) + 360) % 360 form loses low mantissa
// bits on values that were already in range.
function normalizeDegrees(value) { const wrapped = value % 360; return wrapped < 0 ? wrapped + 360 : wrapped; }
function virupaToRupa(virupa) { return virupa / 60; }
function formatScore(value) { return Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, '') : '—'; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function getPlanet(chart, name) { return (chart?.planets ?? []).find((p) => p.name === name); }
function getPlanetHouse(planet, ascendantSign) { if (typeof planet?.house === 'number') return planet.house; if (typeof planet?.sign !== 'number' || typeof ascendantSign !== 'number') return null; return ((planet.sign - ascendantSign + 12) % 12) + 1; }
function circularHouseDistance(a, b) { const raw = Math.abs(a - b) % 12; return Math.min(raw, 12 - raw); }
function circularDegreeDistance(a, b) { const raw = Math.abs(normalizeDegrees(a) - normalizeDegrees(b)); return Math.min(raw, 360 - raw); }

function getDignity(planet, signIndex) { if (!SCORE_PLANETS.includes(planet) || typeof signIndex !== 'number') return 'none'; if (DEBILITATION_SIGNS[planet] === signIndex) return 'debilitated'; if (EXALTATION_SIGNS[planet] === signIndex) return 'exalted'; if (OWN_SIGNS[planet]?.includes(signIndex)) return 'own'; const signLord = SIGN_LORDS[signIndex]; const relation = NATURAL_RELATIONS[planet]; if (relation?.friends.includes(signLord)) return 'friend'; if (relation?.enemies.includes(signLord)) return 'enemy'; return 'neutral'; }
function getDignityCellClass(dignity) { switch (dignity) { case 'exalted': case 'own': return 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/70'; case 'friend': return 'bg-lime-50 dark:bg-lime-950/25 text-lime-800 dark:text-lime-200 border-lime-200 dark:border-lime-800/50'; case 'neutral': return 'bg-zinc-50 dark:bg-zinc-800/45 text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800'; case 'enemy': return 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800/60'; case 'debilitated': return 'bg-red-50 dark:bg-red-950/35 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/70'; default: return 'text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800'; } }

function calculateDigBalaVirupa(planetName, house) { const maxHouse = DIG_BALA_MAX_HOUSE[planetName]; if (!maxHouse || typeof house !== 'number') return 0; return clamp(60 * (1 - circularHouseDistance(house, maxHouse) / 6), 0, 60); }
function calculateUcchaBalaVirupa(planetName, longitude) { const exaltLongitude = EXALTATION_LONGITUDES[planetName]; if (typeof exaltLongitude !== 'number' || typeof longitude !== 'number') return 0; return clamp(60 * (1 - circularDegreeDistance(longitude, exaltLongitude) / 180), 0, 60); }
function calculateSaptavargajaBalaVirupa(planetName, longitude) { return [1, 2, 3, 7, 9, 12, 30].reduce((sum, d) => sum + (SAPTAVARGAJA_VIRUPA[getDignity(planetName, getVargaSign(longitude, d))] ?? 0), 0) / 7; }
function calculateOjhayugmaBalaVirupa(planetName, longitude) { const preference = ODD_EVEN_STRENGTH[planetName]; if (!preference || typeof longitude !== 'number') return 0; if (preference === 'both') return 15; const signMatches = (signIndex) => preference === 'odd' ? signIndex % 2 === 0 : signIndex % 2 === 1; return (signMatches(getVargaSign(longitude, 1)) ? 15 : 0) + (signMatches(getVargaSign(longitude, 9)) ? 15 : 0); }
function calculateKendradiBalaVirupa(house) { if (typeof house !== 'number') return 0; if ([1, 4, 7, 10].includes(house)) return 60; if ([2, 5, 8, 11].includes(house)) return 30; return 15; }
function calculateDrekkanaBalaVirupa(planetName, longitude) { const preferred = DREKKANA_STRENGTH[planetName]; if (!preferred || typeof longitude !== 'number') return 0; return Math.floor(getDegreesInSign(longitude) / 10) + 1 === preferred ? 15 : 0; }
function calculateSthanaBalaBreakdown(planetName, planet, house) { const longitude = planet?.longitude; const uccha = calculateUcchaBalaVirupa(planetName, longitude); const saptavargaja = calculateSaptavargajaBalaVirupa(planetName, longitude); const ojhayugma = calculateOjhayugmaBalaVirupa(planetName, longitude); const kendradi = calculateKendradiBalaVirupa(house); const drekkana = calculateDrekkanaBalaVirupa(planetName, longitude); return { uccha, saptavargaja, ojhayugma, kendradi, drekkana, total: uccha + saptavargaja + ojhayugma + kendradi + drekkana }; }
function estimateSectFromSunHouse(chart) { const sunHouse = getPlanetHouse(getPlanet(chart, 'Sun'), chart?.ascendant?.sign); if (typeof sunHouse !== 'number') return 'unknown'; return [7, 8, 9, 10, 11, 12].includes(sunHouse) ? 'day' : 'night'; }
function calculateNatonnataBalaVirupa(planetName, sect) { const pref = DAY_NIGHT_STRENGTH[planetName]; if (pref === 'both') return 60; if (sect === 'unknown') return 0; return pref === sect ? 60 : 0; }
function calculatePakshaBalaVirupa(chart) { const sun = getPlanet(chart, 'Sun'); const moon = getPlanet(chart, 'Moon'); if (typeof sun?.longitude !== 'number' || typeof moon?.longitude !== 'number') return {}; const elongation = normalizeDegrees(moon.longitude - sun.longitude); const bright = elongation <= 180 ? (elongation / 180) * 60 : ((360 - elongation) / 180) * 60; const dark = 60 - bright; return { Moon: bright, Venus: bright, Jupiter: bright, Mercury: bright, Sun: dark, Mars: dark, Saturn: dark }; }
// Returns the Tribhaga lord for the given birth time.
// Day (6am–6pm) thirds: Mercury (6–10am), Sun (10am–2pm), Saturn (2–6pm).
// Night (6pm–6am) thirds: Moon (6–10pm), Venus (10pm–2am), Mars (2–6am).
// Jupiter is strong in all six thirds. Approximation: assumes 6am sunrise/sunset.
function getTribhagaLord(chart) { const input = chart?.debug?.inputDateTime; if (!input) return null; const timeParts = input.split(' ')[1]?.split(':'); if (!timeParts) return null; const localHour = parseInt(timeParts[0] ?? '0') + parseInt(timeParts[1] ?? '0') / 60; const DAY_LORDS = ['Mercury', 'Sun', 'Saturn']; const NIGHT_LORDS = ['Moon', 'Venus', 'Mars']; if (localHour >= 6 && localHour < 18) return DAY_LORDS[Math.min(Math.floor((localHour - 6) / 4), 2)]; const nightHour = localHour >= 18 ? localHour - 18 : localHour + 6; return NIGHT_LORDS[Math.min(Math.floor(nightHour / 4), 2)]; }
function calculateTribhaagaBalaVirupa(planetName, chart) { if (planetName === 'Jupiter') return 60; return planetName === getTribhagaLord(chart) ? 60 : 0; }
function calculateVarsheshadiBalaVirupa(planetName, chart) { const input = chart?.debug?.inputDateTime; const d = input ? new Date(input) : null; const dayLords = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; const lord = d && !Number.isNaN(d.getTime()) ? dayLords[d.getDay()] : null; if (!lord) return 0; if (planetName === lord) return 60; if (NATURAL_RELATIONS[planetName]?.friends.includes(lord)) return 30; if (NATURAL_RELATIONS[planetName]?.enemies.includes(lord)) return 0; return 15; }
// Approximation of declination-based Ayana Bala. Uses sin(tropical longitude) as a proxy for
// declination; valid near the ecliptic. Ayanamsha comes from chart.debug.ayanamsa (exact for date).
function calculateAyanaBalaVirupa(planet, ayanamsa) { if (typeof planet?.longitude !== 'number') return 0; const ayan = typeof ayanamsa === 'number' ? ayanamsa : 24; const tropicalLongitude = normalizeDegrees(planet.longitude + ayan); return clamp(30 + 30 * Math.sin((tropicalLongitude * Math.PI) / 180), 0, 60); }
function calculateKalaBalaBreakdown(planetName, chart, planet) { const sect = estimateSectFromSunHouse(chart); const pakshaMap = calculatePakshaBalaVirupa(chart); const natonnata = calculateNatonnataBalaVirupa(planetName, sect); const paksha = pakshaMap[planetName] ?? 0; const tribhaaga = calculateTribhaagaBalaVirupa(planetName, chart); const tribhagaLord = getTribhagaLord(chart); const varsheshadi = calculateVarsheshadiBalaVirupa(planetName, chart); const ayana = calculateAyanaBalaVirupa(planet, chart?.debug?.ayanamsa); return { sect, natonnata, paksha, tribhaaga, tribhagaLord, varsheshadi, ayana, total: natonnata + paksha + tribhaaga + varsheshadi + ayana }; }
// Approximation. Classical Cheshta Bala requires planet speed categories (Vakra/Sama/etc.).
// Outer planets: retrograde (Vakra) = 60 virupa; direct = distance-from-Sun proxy.
// Inner planets: distance-from-Sun proxy (elongation). Sun=30 (fixed); Moon=60 (fixed).
function calculateCheshtaBalaVirupa(planetName, chart, planet) { if (planetName === 'Sun') return 30; if (planetName === 'Moon') return 60; const sun = getPlanet(chart, 'Sun'); if (typeof sun?.longitude !== 'number' || typeof planet?.longitude !== 'number') return 0; const distance = circularDegreeDistance(planet.longitude, sun.longitude); if (['Mars', 'Jupiter', 'Saturn'].includes(planetName)) { if (planet.isRetrograde) return 60; return clamp((distance / 180) * 60, 0, 60); } if (['Mercury', 'Venus'].includes(planetName)) return clamp(60 * (1 - Math.abs(distance - 60) / 120), 0, 60); return 0; }
function aspectOrbStrength(diff, exact, orb = 30) { const delta = Math.abs(diff - exact); return delta <= orb ? 1 - delta / orb : 0; }
function getAspectStrength(fromName, fromLongitude, toLongitude) { const diff = normalizeDegrees(toLongitude - fromLongitude); let strength = aspectOrbStrength(diff, 180, 45); if (fromName === 'Mars') strength = Math.max(strength, aspectOrbStrength(diff, 90, 35), aspectOrbStrength(diff, 210, 35)); if (fromName === 'Jupiter') strength = Math.max(strength, aspectOrbStrength(diff, 120, 35), aspectOrbStrength(diff, 240, 35)); if (fromName === 'Saturn') strength = Math.max(strength, aspectOrbStrength(diff, 60, 35), aspectOrbStrength(diff, 270, 35)); return clamp(strength, 0, 1); }
// Approximation. Classical Drig Bala uses drishti-pinda (aspect points) with fixed weights.
// Here: +45 virupa per benefic aspect, −30 per malefic aspect. No arbitrary base score.
// Aspect orbs are custom (not classical exact-aspect). Negative values allowed per classical convention.
function calculateDrikBalaVirupa(targetName, chart) { const target = getPlanet(chart, targetName); if (typeof target?.longitude !== 'number') return 0; let score = 0; SCORE_PLANETS.forEach((fromName) => { if (fromName === targetName) return; const from = getPlanet(chart, fromName); if (typeof from?.longitude !== 'number') return; const aspect = getAspectStrength(fromName, from.longitude, target.longitude); if (!aspect) return; score += (BENEFICS.includes(fromName) ? 45 : -30) * aspect; }); return score; }
function buildShadbalaRows(chart) { const ascendantSign = chart?.ascendant?.sign; return SCORE_PLANETS.map((planetName) => { const planet = getPlanet(chart, planetName); if (!planet) return null; const house = getPlanetHouse(planet, ascendantSign); const sthanaBreakdown = calculateSthanaBalaBreakdown(planetName, planet, house); const kalaBreakdown = calculateKalaBalaBreakdown(planetName, chart, planet); const naisargikaVirupa = NAISARGIKA_BALA_VIRUPA[planetName] ?? 0; const digVirupa = calculateDigBalaVirupa(planetName, house); const cheshtaVirupa = calculateCheshtaBalaVirupa(planetName, chart, planet); const drikVirupa = calculateDrikBalaVirupa(planetName, chart); const totalVirupa = sthanaBreakdown.total + digVirupa + kalaBreakdown.total + cheshtaVirupa + naisargikaVirupa + drikVirupa; const totalRupa = virupaToRupa(totalVirupa); const requiredVirupa = SHADBALA_REQUIRED_VIRUPA[planetName] ?? 0; return { planet: planetName, house, retrograde: planet.isRetrograde ?? false, sthana: virupaToRupa(sthanaBreakdown.total), sthanaBreakdown, dig: virupaToRupa(digVirupa), digVirupa, kala: virupaToRupa(kalaBreakdown.total), kalaBreakdown, cheshta: virupaToRupa(cheshtaVirupa), cheshtaVirupa, naisargika: virupaToRupa(naisargikaVirupa), naisargikaVirupa, drik: virupaToRupa(drikVirupa), drikVirupa, total: totalRupa, totalVirupa, requiredVirupa, ratio: requiredVirupa ? totalVirupa / requiredVirupa : 0 }; }).filter(Boolean); }


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

// Exported for src/lib/shadbala.test.ts. The Shadbala engine lives in this file
// rather than in src/lib because the card grew around it; the tests import the
// pure pieces directly so they exercise the real implementation.
export {
  NAISARGIKA_BALA_VIRUPA,
  SHADBALA_REQUIRED_VIRUPA,
  DIG_BALA_MAX_HOUSE,
  buildShadbalaRows,
  calculateDigBalaVirupa,
  calculateUcchaBalaVirupa,
  calculateKendradiBalaVirupa,
  calculateOjhayugmaBalaVirupa,
  calculateDrekkanaBalaVirupa,
  calculateSaptavargajaBalaVirupa,
  virupaToRupa,
};

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
