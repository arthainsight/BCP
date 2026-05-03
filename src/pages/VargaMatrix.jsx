'use client';

import { getVargaSignIndex, getSignIndex, getDegreesInSign } from '@/lib/varga';

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
const SHADBALA_REQUIRED_RUPA = { Sun: 6.5, Moon: 6, Mars: 5, Mercury: 7, Jupiter: 6.5, Venus: 5.5, Saturn: 5 };
const NAISARGIKA_BALA_VIRUPA = { Sun: 60, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57 };
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
const DIGNITY_LABELS = { exalted: 'Ex', own: 'Own', friend: 'Fr', neutral: 'Neu', enemy: 'En', debilitated: 'Deb', none: '—' };
const VIMSOPAKA_SCHEMES = {
  shadvarga: { label: 'Ṣaḍvarga', weights: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 } },
  saptavarga: { label: 'Saptavarga', weights: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 } },
  dasavarga: { label: 'Daśavarga', weights: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 } },
  shodasavarga: { label: 'Ṣoḍaśavarga', weights: { D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5, D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4 } },
};

export { getSignIndex, getDegreesInSign };
export function getVargaSign(longitude, division) { return getVargaSignIndex(longitude, division); }
function normalizeDegrees(value) { return ((value % 360) + 360) % 360; }
function virupaToRupa(virupa) { return virupa / 60; }
function formatScore(value) { return Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, '') : '—'; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function getPlanet(chart, name) { return (chart?.planets ?? []).find((p) => p.name === name); }
function getPlanetHouse(planet, ascendantSign) { if (typeof planet?.house === 'number') return planet.house; if (typeof planet?.sign !== 'number' || typeof ascendantSign !== 'number') return null; return ((planet.sign - ascendantSign + 12) % 12) + 1; }
function circularHouseDistance(a, b) { const raw = Math.abs(a - b) % 12; return Math.min(raw, 12 - raw); }
function circularDegreeDistance(a, b) { const raw = Math.abs(normalizeDegrees(a) - normalizeDegrees(b)); return Math.min(raw, 360 - raw); }
function getHouseSignIndex(ascendantSign, house) { return typeof ascendantSign === 'number' ? (ascendantSign + house - 2 + 12) % 12 : null; }
function getHouseMidLongitude(ascendantSign, house) { const signIndex = getHouseSignIndex(ascendantSign, house); return typeof signIndex === 'number' ? signIndex * 30 + 15 : null; }
function getQuality(score) { if (score >= 75) return 'Strong'; if (score >= 55) return 'Mixed+'; if (score >= 40) return 'Mixed'; return 'Weak'; }

function getDignity(planet, signIndex) { if (!SCORE_PLANETS.includes(planet) || typeof signIndex !== 'number') return 'none'; if (DEBILITATION_SIGNS[planet] === signIndex) return 'debilitated'; if (EXALTATION_SIGNS[planet] === signIndex) return 'exalted'; if (OWN_SIGNS[planet]?.includes(signIndex)) return 'own'; const signLord = SIGN_LORDS[signIndex]; const relation = NATURAL_RELATIONS[planet]; if (relation?.friends.includes(signLord)) return 'friend'; if (relation?.enemies.includes(signLord)) return 'enemy'; return 'neutral'; }
function getDignityCellClass(dignity) { switch (dignity) { case 'exalted': case 'own': return 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800/70'; case 'friend': return 'bg-lime-50 dark:bg-lime-950/25 text-lime-800 dark:text-lime-200 border-lime-200 dark:border-lime-800/50'; case 'neutral': return 'bg-zinc-50 dark:bg-zinc-800/45 text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800'; case 'enemy': return 'bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800/60'; case 'debilitated': return 'bg-red-50 dark:bg-red-950/35 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800/70'; default: return 'text-zinc-700 dark:text-zinc-300 border-zinc-100 dark:border-zinc-800'; } }

function calculateDigBalaVirupa(planetName, house) { const maxHouse = DIG_BALA_MAX_HOUSE[planetName]; if (!maxHouse || typeof house !== 'number') return 0; return clamp(60 * (1 - circularHouseDistance(house, maxHouse) / 6), 0, 60); }
function calculateUcchaBalaVirupa(planetName, longitude) { const exaltLongitude = EXALTATION_LONGITUDES[planetName]; if (typeof exaltLongitude !== 'number' || typeof longitude !== 'number') return 0; return clamp(60 * (1 - circularDegreeDistance(longitude, exaltLongitude) / 180), 0, 60); }
function calculateSaptavargajaBalaVirupa(planetName, longitude) { return [1, 2, 3, 7, 9, 12, 30].reduce((sum, d) => sum + (DIGNITY_VISWA[getDignity(planetName, getVargaSign(longitude, d))] ?? 0), 0) / 7; }
function calculateOjhayugmaBalaVirupa(planetName, longitude) { const preference = ODD_EVEN_STRENGTH[planetName]; if (!preference || typeof longitude !== 'number') return 0; if (preference === 'both') return 15; const signMatches = (signIndex) => preference === 'odd' ? signIndex % 2 === 0 : signIndex % 2 === 1; return (signMatches(getVargaSign(longitude, 1)) ? 15 : 0) + (signMatches(getVargaSign(longitude, 9)) ? 15 : 0); }
function calculateKendradiBalaVirupa(house) { if (typeof house !== 'number') return 0; if ([1, 4, 7, 10].includes(house)) return 60; if ([2, 5, 8, 11].includes(house)) return 30; return 15; }
function calculateDrekkanaBalaVirupa(planetName, longitude) { const preferred = DREKKANA_STRENGTH[planetName]; if (!preferred || typeof longitude !== 'number') return 0; return Math.floor(getDegreesInSign(longitude) / 10) + 1 === preferred ? 15 : 0; }
function calculateSthanaBalaBreakdown(planetName, planet, house) { const longitude = planet?.longitude; const uccha = calculateUcchaBalaVirupa(planetName, longitude); const saptavargaja = calculateSaptavargajaBalaVirupa(planetName, longitude); const ojhayugma = calculateOjhayugmaBalaVirupa(planetName, longitude); const kendradi = calculateKendradiBalaVirupa(house); const drekkana = calculateDrekkanaBalaVirupa(planetName, longitude); return { uccha, saptavargaja, ojhayugma, kendradi, drekkana, total: uccha + saptavargaja + ojhayugma + kendradi + drekkana }; }
function estimateSectFromSunHouse(chart) { const sunHouse = getPlanetHouse(getPlanet(chart, 'Sun'), chart?.ascendant?.sign); if (typeof sunHouse !== 'number') return 'unknown'; return [7, 8, 9, 10, 11, 12].includes(sunHouse) ? 'day' : 'night'; }
function calculateNatonnataBalaVirupa(planetName, sect) { const pref = DAY_NIGHT_STRENGTH[planetName]; if (pref === 'both') return 60; if (sect === 'unknown') return 0; return pref === sect ? 60 : 0; }
function calculatePakshaBalaVirupa(chart) { const sun = getPlanet(chart, 'Sun'); const moon = getPlanet(chart, 'Moon'); if (typeof sun?.longitude !== 'number' || typeof moon?.longitude !== 'number') return {}; const elongation = normalizeDegrees(moon.longitude - sun.longitude); const bright = elongation <= 180 ? (elongation / 180) * 60 : ((360 - elongation) / 180) * 60; const dark = 60 - bright; return { Moon: bright, Venus: bright, Jupiter: bright, Mercury: bright, Sun: dark, Mars: dark, Saturn: dark }; }
function calculateTribhaagaBalaVirupa(planetName, sect) { if (sect === 'day') return planetName === 'Mercury' ? 60 : 0; if (sect === 'night') return planetName === 'Moon' ? 60 : 0; return 0; }
function calculateVarsheshadiBalaVirupa(planetName, chart) { const input = chart?.debug?.inputDateTime; const d = input ? new Date(input) : null; const dayLords = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; const lord = d && !Number.isNaN(d.getTime()) ? dayLords[d.getDay()] : null; if (!lord) return 0; if (planetName === lord) return 60; if (NATURAL_RELATIONS[planetName]?.friends.includes(lord)) return 30; if (NATURAL_RELATIONS[planetName]?.enemies.includes(lord)) return 0; return 15; }
function calculateAyanaBalaVirupa(planet) { if (typeof planet?.longitude !== 'number') return 0; const tropicalProxy = normalizeDegrees(planet.longitude + 24); return clamp(30 + 30 * Math.sin((tropicalProxy * Math.PI) / 180), 0, 60); }
function calculateKalaBalaBreakdown(planetName, chart, planet) { const sect = estimateSectFromSunHouse(chart); const pakshaMap = calculatePakshaBalaVirupa(chart); const natonnata = calculateNatonnataBalaVirupa(planetName, sect); const paksha = pakshaMap[planetName] ?? 0; const tribhaaga = calculateTribhaagaBalaVirupa(planetName, sect); const varsheshadi = calculateVarsheshadiBalaVirupa(planetName, chart); const ayana = calculateAyanaBalaVirupa(planet); return { sect, natonnata, paksha, tribhaaga, varsheshadi, ayana, total: natonnata + paksha + tribhaaga + varsheshadi + ayana }; }
function calculateCheshtaBalaVirupa(planetName, chart, planet) { if (planetName === 'Sun') return 30; if (planetName === 'Moon') return 60; const sun = getPlanet(chart, 'Sun'); if (typeof sun?.longitude !== 'number' || typeof planet?.longitude !== 'number') return 0; const distance = circularDegreeDistance(planet.longitude, sun.longitude); if (['Mars', 'Jupiter', 'Saturn'].includes(planetName)) return clamp((distance / 180) * 60, 0, 60); if (['Mercury', 'Venus'].includes(planetName)) return clamp(60 * (1 - Math.abs(distance - 60) / 120), 0, 60); return 0; }
function aspectOrbStrength(diff, exact, orb = 30) { const delta = Math.abs(diff - exact); return delta <= orb ? 1 - delta / orb : 0; }
function getAspectStrength(fromName, fromLongitude, toLongitude) { const diff = normalizeDegrees(toLongitude - fromLongitude); let strength = aspectOrbStrength(diff, 180, 45); if (fromName === 'Mars') strength = Math.max(strength, aspectOrbStrength(diff, 90, 35), aspectOrbStrength(diff, 210, 35)); if (fromName === 'Jupiter') strength = Math.max(strength, aspectOrbStrength(diff, 120, 35), aspectOrbStrength(diff, 240, 35)); if (fromName === 'Saturn') strength = Math.max(strength, aspectOrbStrength(diff, 60, 35), aspectOrbStrength(diff, 270, 35)); return clamp(strength, 0, 1); }
function calculateDrikBalaVirupa(targetName, chart) { const target = getPlanet(chart, targetName); if (typeof target?.longitude !== 'number') return 0; let score = 60; SCORE_PLANETS.forEach((fromName) => { if (fromName === targetName) return; const from = getPlanet(chart, fromName); if (typeof from?.longitude !== 'number') return; const aspect = getAspectStrength(fromName, from.longitude, target.longitude); if (!aspect) return; score += (BENEFICS.includes(fromName) ? 45 : -30) * aspect; }); return clamp(score, 0, 180); }
function buildShadbalaRows(chart) { const ascendantSign = chart?.ascendant?.sign; return SCORE_PLANETS.map((planetName) => { const planet = getPlanet(chart, planetName); if (!planet) return null; const house = getPlanetHouse(planet, ascendantSign); const sthanaBreakdown = calculateSthanaBalaBreakdown(planetName, planet, house); const kalaBreakdown = calculateKalaBalaBreakdown(planetName, chart, planet); const naisargikaVirupa = NAISARGIKA_BALA_VIRUPA[planetName] ?? 0; const digVirupa = calculateDigBalaVirupa(planetName, house); const cheshtaVirupa = calculateCheshtaBalaVirupa(planetName, chart, planet); const drikVirupa = calculateDrikBalaVirupa(planetName, chart); const totalVirupa = sthanaBreakdown.total + digVirupa + kalaBreakdown.total + cheshtaVirupa + naisargikaVirupa + drikVirupa; const totalRupa = virupaToRupa(totalVirupa); const requiredRupa = SHADBALA_REQUIRED_RUPA[planetName] ?? 0; return { planet: planetName, house, sthana: virupaToRupa(sthanaBreakdown.total), sthanaBreakdown, dig: virupaToRupa(digVirupa), kala: virupaToRupa(kalaBreakdown.total), kalaBreakdown, cheshta: virupaToRupa(cheshtaVirupa), naisargika: virupaToRupa(naisargikaVirupa), drik: virupaToRupa(drikVirupa), total: totalRupa, required: requiredRupa, ratio: requiredRupa ? totalRupa / requiredRupa : 0 }; }).filter(Boolean); }

function calculateBhavaLordScore(chart, house, houseSignIndex) { const lord = SIGN_LORDS[houseSignIndex]; const lordPlanet = getPlanet(chart, lord); if (!lordPlanet) return { lord, score: 0, note: 'lord missing' }; const lordHouse = getPlanetHouse(lordPlanet, chart?.ascendant?.sign); const dignity = getDignity(lord, lordPlanet.sign - 1); const dignityScore = { exalted: 35, own: 32, friend: 26, neutral: 20, enemy: 12, debilitated: 2, none: 0 }[dignity] ?? 0; const houseBonus = [1, 4, 7, 10].includes(lordHouse) ? 15 : [1, 5, 9].includes(lordHouse) ? 14 : [3, 6, 10, 11].includes(lordHouse) ? 10 : [6, 8, 12].includes(lordHouse) ? -8 : 5; return { lord, score: clamp(dignityScore + houseBonus, 0, 45), note: `${lord} ${dignity} H${lordHouse ?? '—'}` }; }
function calculateBhavaOccupantScore(chart, house) { const planets = (chart?.planets ?? []).filter((p) => SCORE_PLANETS.includes(p.name) && getPlanetHouse(p, chart?.ascendant?.sign) === house); let score = 15; planets.forEach((p) => { const dignity = getDignity(p.name, p.sign - 1); const dignityBonus = dignity === 'exalted' || dignity === 'own' ? 8 : dignity === 'friend' ? 5 : dignity === 'enemy' ? -4 : dignity === 'debilitated' ? -10 : 0; score += (BENEFICS.includes(p.name) ? 8 : -3) + dignityBonus; }); return { score: clamp(score, 0, 30), note: planets.length ? planets.map((p) => p.name.slice(0, 2)).join(', ') : 'empty' }; }
function calculateBhavaAspectScore(chart, house) { const midpoint = getHouseMidLongitude(chart?.ascendant?.sign, house); if (typeof midpoint !== 'number') return { score: 0, note: '—' }; let raw = 10; const hits = []; SCORE_PLANETS.forEach((fromName) => { const from = getPlanet(chart, fromName); if (typeof from?.longitude !== 'number') return; const aspect = getAspectStrength(fromName, from.longitude, midpoint); if (!aspect) return; raw += (BENEFICS.includes(fromName) ? 12 : -8) * aspect; hits.push(`${fromName.slice(0, 2)}${aspect > 0.66 ? '++' : '+'}`); }); return { score: clamp(raw, 0, 25), note: hits.length ? hits.join(' ') : 'no major aspects' }; }
function buildBhavaBalaRows(chart) { const asc = chart?.ascendant?.sign; return Array.from({ length: 12 }, (_, i) => i + 1).map((house) => { const signIndex = getHouseSignIndex(asc, house); const lord = calculateBhavaLordScore(chart, house, signIndex); const occupants = calculateBhavaOccupantScore(chart, house); const aspects = calculateBhavaAspectScore(chart, house); const angularBonus = [1, 4, 7, 10].includes(house) ? 8 : [5, 9].includes(house) ? 6 : [6, 8, 12].includes(house) ? -5 : 2; const total = clamp(lord.score + occupants.score + aspects.score + angularBonus, 0, 100); return { house, sign: typeof signIndex === 'number' ? SIGN_ABBR[signIndex] : '—', lord: lord.lord, lordScore: lord.score, lordNote: lord.note, occupantScore: occupants.score, occupantNote: occupants.note, aspectScore: aspects.score, aspectNote: aspects.note, total, quality: getQuality(total) }; }); }

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
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">Calculate a chart to see Shadbala</div>;
  const shadbala = buildShadbalaRows(chart);
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Shadbala <span className="text-[9px] font-normal text-amber-600 dark:text-amber-400 ml-1">beta</span></div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">Beta: all six Shadbala heads are present. Values in rūpa; Cheṣṭā, Dṛg and Ayana are approximation-based.</div>
      </div>
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[920px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Sthāna</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Dig</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Samaya</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Cheṣṭā</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Naisargika</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Dṛg</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Total</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">%</th>
            </tr>
          </thead>
          <tbody>
            {shadbala.map((row) => (
              <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={`Uccha ${formatScore(virupaToRupa(row.sthanaBreakdown.uccha))} + Saptavargaja ${formatScore(virupaToRupa(row.sthanaBreakdown.saptavargaja))} + Ojhayugma ${formatScore(virupaToRupa(row.sthanaBreakdown.ojhayugma))} + Kendradi ${formatScore(virupaToRupa(row.sthanaBreakdown.kendradi))} + Drekkana ${formatScore(virupaToRupa(row.sthanaBreakdown.drekkana))}`}>{formatScore(row.sthana)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.dig)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={`Sect ${row.kalaBreakdown.sect}; Natonnata ${formatScore(virupaToRupa(row.kalaBreakdown.natonnata))} + Paksha ${formatScore(virupaToRupa(row.kalaBreakdown.paksha))} + Tribhaga ${formatScore(virupaToRupa(row.kalaBreakdown.tribhaaga))} + Varsheshadi ${formatScore(virupaToRupa(row.kalaBreakdown.varsheshadi))} + Ayana ${formatScore(virupaToRupa(row.kalaBreakdown.ayana))}`}>{formatScore(row.kala)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.cheshta)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.naisargika)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.drik)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{formatScore(row.total)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-cyan-700 dark:text-cyan-300">{formatScore(row.ratio * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BhavaBalaCard({ chart }) {
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">Calculate a chart to see Bhava Bala</div>;
  const bhavaBala = buildBhavaBalaRows(chart);
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">Bhava Bala <span className="text-[9px] font-normal text-amber-600 dark:text-amber-400 ml-1">beta</span></div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">Beta house strength index: lord strength + occupants + aspects. Compact 0–100 score.</div>
      </div>
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[780px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">House</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Sign</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Lord</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Lord Bala</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Occupants</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Aspects</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Total</th>
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Quality</th>
            </tr>
          </thead>
          <tbody>
            {bhavaBala.map((row) => (
              <tr key={row.house} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">H{row.house}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.sign}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.lord}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={row.lordNote}>{formatScore(row.lordScore)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={row.occupantNote}>{formatScore(row.occupantScore)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={row.aspectNote}>{formatScore(row.aspectScore)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{formatScore(row.total)}</td>
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-cyan-700 dark:text-cyan-300">{row.quality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VargaMatrix({ chart }) {
  const divisions = DEFAULT_DIVISIONS;
  const planets = mapPlanetLongitudes(chart);
  const lagna = typeof chart?.ascendant?.longitude === 'number' ? chart.ascendant.longitude : undefined;
  const matrix = buildVargaMatrix(planets, lagna, divisions);
  const strength = buildVimsopakaStrength(planets, matrix);
  const shadbala = buildShadbalaRows(chart);
  const bhavaBala = buildBhavaBalaRows(chart);
  const divisionList = formatDivisionList(divisions);
  if (!chart) return <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">Calculate a chart to see Varga Matrix</div>;
  return <div className="space-y-5">
    <div><div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; varga.matrix</div><div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">{divisionList} from existing sidereal longitudes. Cell colour = dignity; debilitated = 0 strength.</div></div>
    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg"><table className="w-full min-w-[980px] border-collapse text-xs font-mono"><thead><tr className="bg-zinc-100 dark:bg-zinc-800"><th className="sticky left-0 z-10 bg-zinc-100 dark:bg-zinc-800 text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Body</th>{divisions.map((division) => <th key={division} className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">D{division}</th>)}</tr></thead><tbody>{ROW_ORDER.map((name) => <tr key={name} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{name}</td>{divisions.map((division) => { const cell = matrix[name][`D${division}`]; return <td key={division} className={`p-2 border whitespace-nowrap ${getDignityCellClass(cell.dignity)}`} title={DIGNITY_LABELS[cell.dignity]}><span className="font-bold">{cell.sign}</span>{cell.dignity !== 'none' && <span className="ml-1 text-[9px] opacity-75">{DIGNITY_LABELS[cell.dignity]}</span>}</td>; })}</tr>)}</tbody></table></div>
    <div className="space-y-2"><div><div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; varga.strength.vimsopaka</div><div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">Four weighted calculations out of 20. Rahu/Ketu and Lagna excluded.</div></div><div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg"><table className="w-full min-w-[720px] border-collapse text-xs font-mono"><thead><tr className="bg-zinc-100 dark:bg-zinc-800"><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th>{Object.entries(VIMSOPAKA_SCHEMES).map(([key, scheme]) => <th key={key} className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">{scheme.label}</th>)}</tr></thead><tbody>{strength.map((row) => <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}</td>{Object.keys(VIMSOPAKA_SCHEMES).map((key) => <td key={key} className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{formatScore(row[key])} / 20</td>)}</tr>)}</tbody></table></div></div>
    <div className="space-y-2"><div><div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; shadbala.beta</div><div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">Beta: all six Shadbala heads are present. Values are in rūpa; Cheṣṭā, Dṛg and Ayana are approximation-based until exact ephemeris speed/declination/aspect bala are added.</div></div><div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg"><table className="w-full min-w-[920px] border-collapse text-xs font-mono"><thead><tr className="bg-zinc-100 dark:bg-zinc-800"><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Sthāna</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Dig</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Samaya</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Cheṣṭā</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Naisargika</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Dṛg</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Total</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">%</th></tr></thead><tbody>{shadbala.map((row) => <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={`Uccha ${formatScore(virupaToRupa(row.sthanaBreakdown.uccha))} + Saptavargaja ${formatScore(virupaToRupa(row.sthanaBreakdown.saptavargaja))} + Ojhayugma ${formatScore(virupaToRupa(row.sthanaBreakdown.ojhayugma))} + Kendradi ${formatScore(virupaToRupa(row.sthanaBreakdown.kendradi))} + Drekkana ${formatScore(virupaToRupa(row.sthanaBreakdown.drekkana))}`}>{formatScore(row.sthana)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.dig)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={`Sect ${row.kalaBreakdown.sect}; Natonnata ${formatScore(virupaToRupa(row.kalaBreakdown.natonnata))} + Paksha ${formatScore(virupaToRupa(row.kalaBreakdown.paksha))} + Tribhaga ${formatScore(virupaToRupa(row.kalaBreakdown.tribhaaga))} + Varsheshadi ${formatScore(virupaToRupa(row.kalaBreakdown.varsheshadi))} + Ayana ${formatScore(virupaToRupa(row.kalaBreakdown.ayana))}`}>{formatScore(row.kala)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.cheshta)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.naisargika)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{formatScore(row.drik)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{formatScore(row.total)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-cyan-700 dark:text-cyan-300">{formatScore(row.ratio * 100)}%</td></tr>)}</tbody></table></div></div>
    <div className="space-y-2"><div><div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; bhava.bala.beta</div><div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">Beta house strength index: lord strength + occupants + aspects. Compact 0–100 score; not yet a full classical Bhava Bala parity calculation.</div></div><div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg"><table className="w-full min-w-[780px] border-collapse text-xs font-mono"><thead><tr className="bg-zinc-100 dark:bg-zinc-800"><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">House</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Sign</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Lord</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Lord Bala</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Occupants</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Aspects</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Total</th><th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Quality</th></tr></thead><tbody>{bhavaBala.map((row) => <tr key={row.house} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">H{row.house}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.sign}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.lord}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={row.lordNote}>{formatScore(row.lordScore)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={row.occupantNote}>{formatScore(row.occupantScore)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300" title={row.aspectNote}>{formatScore(row.aspectScore)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">{formatScore(row.total)}</td><td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-cyan-700 dark:text-cyan-300">{row.quality}</td></tr>)}</tbody></table></div></div>
  </div>;
}
