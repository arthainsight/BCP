'use client';

import { getVargaSignIndex, getSignIndex, getDegreesInSign } from '@/lib/varga';

const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const DEFAULT_DIVISIONS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];
const ROW_ORDER = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SCORE_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

const OWN_SIGNS = {
  Sun: [4],
  Moon: [3],
  Mars: [0, 7],
  Mercury: [2, 5],
  Jupiter: [8, 11],
  Venus: [1, 6],
  Saturn: [9, 10],
};

const EXALTATION_SIGNS = {
  Sun: 0,
  Moon: 1,
  Mars: 9,
  Mercury: 5,
  Jupiter: 3,
  Venus: 11,
  Saturn: 6,
};

const DEBILITATION_SIGNS = {
  Sun: 6,
  Moon: 7,
  Mars: 3,
  Mercury: 11,
  Jupiter: 9,
  Venus: 5,
  Saturn: 0,
};

const NATURAL_RELATIONS = {
  Sun:     { friends: ['Moon', 'Mars', 'Jupiter'], neutral: ['Mercury'], enemies: ['Venus', 'Saturn'] },
  Moon:    { friends: ['Sun', 'Mercury'], neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'], enemies: [] },
  Mars:    { friends: ['Sun', 'Moon', 'Jupiter'], neutral: ['Venus', 'Saturn'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], neutral: ['Mars', 'Jupiter', 'Saturn'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], neutral: ['Saturn'], enemies: ['Mercury', 'Venus'] },
  Venus:   { friends: ['Mercury', 'Saturn'], neutral: ['Mars', 'Jupiter'], enemies: ['Sun', 'Moon'] },
  Saturn:  { friends: ['Mercury', 'Venus'], neutral: ['Jupiter'], enemies: ['Sun', 'Moon', 'Mars'] },
};

const DIGNITY_VISWA = {
  exalted: 20,
  own: 20,
  friend: 15,
  neutral: 10,
  enemy: 7,
  debilitated: 0,
  none: 0,
};

const DIGNITY_LABELS = {
  exalted: 'Ex',
  own: 'Own',
  friend: 'Fr',
  neutral: 'Neu',
  enemy: 'En',
  debilitated: 'Deb',
  none: '—',
};

const VIMSOPAKA_SCHEMES = {
  shadvarga: {
    label: 'Ṣaḍvarga',
    weights: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 },
  },
  saptavarga: {
    label: 'Saptavarga',
    weights: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 },
  },
  dasavarga: {
    label: 'Daśavarga',
    weights: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 },
  },
  shodasavarga: {
    label: 'Ṣoḍaśavarga',
    weights: { D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5, D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4 },
  },
};

// getSignIndex and getDegreesInSign are imported from @/lib/varga above.
// Kept as named exports so any existing callers continue to work.
export { getSignIndex, getDegreesInSign };

export function getVargaSign(longitude, division) {
  return getVargaSignIndex(longitude, division);
}

function getDignity(planet, signIndex) {
  if (!SCORE_PLANETS.includes(planet) || typeof signIndex !== 'number') return 'none';
  if (DEBILITATION_SIGNS[planet] === signIndex) return 'debilitated';
  if (EXALTATION_SIGNS[planet] === signIndex) return 'exalted';
  if (OWN_SIGNS[planet]?.includes(signIndex)) return 'own';

  const signLord = SIGN_LORDS[signIndex];
  const relation = NATURAL_RELATIONS[planet];
  if (relation?.friends.includes(signLord)) return 'friend';
  if (relation?.enemies.includes(signLord)) return 'enemy';
  return 'neutral';
}

function getDignityCellClass(dignity) {
  switch (dignity) {
    case 'exalted':
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

function formatScore(value) {
  return Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, '') : '—';
}

export function buildVargaMatrix(planets = {}, lagna, divisions = DEFAULT_DIVISIONS) {
  const matrix = {};
  const source = {
    Lagna: lagna,
    ...planets,
  };

  ROW_ORDER.forEach((name) => {
    const longitude = source[name];
    matrix[name] = {};

    divisions.forEach((division) => {
      const key = `D${division}`;
      if (typeof longitude !== 'number') {
        matrix[name][key] = { sign: '—', signIndex: null, dignity: 'none' };
        return;
      }
      const signIndex = getVargaSign(longitude, division);
      matrix[name][key] = {
        sign: SIGN_ABBR[signIndex],
        signIndex,
        dignity: getDignity(name, signIndex),
      };
    });
  });

  return matrix;
}

function buildVimsopakaStrength(planets = {}, matrix = {}) {
  return SCORE_PLANETS.map((planet) => {
    const longitude = planets[planet];
    if (typeof longitude !== 'number') return null;

    const scores = {};
    Object.entries(VIMSOPAKA_SCHEMES).forEach(([schemeKey, scheme]) => {
      let total = 0;
      Object.entries(scheme.weights).forEach(([divisionKey, weight]) => {
        const dignity = matrix[planet]?.[divisionKey]?.dignity ?? 'none';
        total += weight * (DIGNITY_VISWA[dignity] ?? 0) / 20;
      });
      scores[schemeKey] = total;
    });

    return { planet, ...scores };
  })
    .filter(Boolean)
    .sort((a, b) => b.shodasavarga - a.shodasavarga || b.dasavarga - a.dasavarga || b.saptavarga - a.saptavarga || b.shadvarga - a.shadvarga);
}

function mapPlanetLongitudes(chart) {
  const wanted = new Set(ROW_ORDER.filter((name) => name !== 'Lagna'));
  const result = {};

  (chart?.planets ?? []).forEach((planet) => {
    if (wanted.has(planet.name) && typeof planet.longitude === 'number') {
      result[planet.name] = planet.longitude;
    }
  });

  return result;
}

function formatDivisionList(divisions) {
  return divisions.map((division) => `D${division}`).join(', ');
}

export default function VargaMatrix({ chart }) {
  const divisions = DEFAULT_DIVISIONS;
  const planets = mapPlanetLongitudes(chart);
  const lagna = typeof chart?.ascendant?.longitude === 'number' ? chart.ascendant.longitude : undefined;
  const matrix = buildVargaMatrix(planets, lagna, divisions);
  const strength = buildVimsopakaStrength(planets, matrix);
  const divisionList = formatDivisionList(divisions);

  if (!chart) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-400 dark:text-zinc-600 text-xs font-mono text-center px-4">
        Calculate a chart to see Varga Matrix
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; varga.matrix</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
          {divisionList} from existing sidereal longitudes. Cell colour = dignity; debilitated = 0 strength.
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[980px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="sticky left-0 z-10 bg-zinc-100 dark:bg-zinc-800 text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Body</th>
              {divisions.map((division) => (
                <th key={division} className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
                  D{division}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROW_ORDER.map((name) => (
              <tr key={name} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{name}</td>
                {divisions.map((division) => {
                  const cell = matrix[name][`D${division}`];
                  return (
                    <td key={division} className={`p-2 border whitespace-nowrap ${getDignityCellClass(cell.dignity)}`} title={DIGNITY_LABELS[cell.dignity]}>
                      <span className="font-bold">{cell.sign}</span>
                      {cell.dignity !== 'none' && (
                        <span className="ml-1 text-[9px] opacity-75">{DIGNITY_LABELS[cell.dignity]}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; varga.strength.vimsopaka</div>
          <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
            Four weighted calculations out of 20. Viswa: exalted/own 20, friend 15, neutral 10, enemy 7, debilitated 0. Rahu/Ketu and Lagna excluded.
          </div>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <table className="w-full min-w-[720px] border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th>
                {Object.entries(VIMSOPAKA_SCHEMES).map(([key, scheme]) => (
                  <th key={key} className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
                    {scheme.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strength.map((row) => (
                <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}</td>
                  {Object.keys(VIMSOPAKA_SCHEMES).map((key) => (
                    <td key={key} className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-700 dark:text-amber-300">
                      {formatScore(row[key])} / 20
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
