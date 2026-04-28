'use client';

const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const DEFAULT_DIVISIONS = [1, 3, 9, 10, 60];
const ROW_ORDER = ['Lagna', 'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const SCORE_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const MOVABLE_SIGNS = new Set([0, 3, 6, 9]);
const FIXED_SIGNS = new Set([1, 4, 7, 10]);
const DUAL_SIGNS = new Set([2, 5, 8, 11]);

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

const FRIEND_SIGNS = {
  Sun: [0, 3, 4, 7, 8, 11],
  Moon: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11],
  Mars: [0, 3, 4, 7, 8, 11],
  Mercury: [1, 2, 4, 5, 6, 9, 10],
  Jupiter: [0, 3, 4, 7, 8, 11],
  Venus: [1, 2, 5, 6, 9, 10],
  Saturn: [1, 2, 5, 6, 9, 10],
};

function normalizeLongitude(longitude) {
  return ((Number(longitude || 0) % 360) + 360) % 360;
}

export function getSignIndex(longitude) {
  return Math.floor(normalizeLongitude(longitude) / 30);
}

export function getDegreesInSign(longitude) {
  return normalizeLongitude(longitude) % 30;
}

function getSimpleVargaSign(longitude, division) {
  const signIndex = getSignIndex(longitude);
  const degreesInSign = getDegreesInSign(longitude);
  const partSize = 30 / division;
  const partIndex = Math.min(Math.floor(degreesInSign / partSize), division - 1);
  return (signIndex + partIndex) % 12;
}

function getNavamsaSign(longitude) {
  const signIndex = getSignIndex(longitude);
  const degreesInSign = getDegreesInSign(longitude);
  const partSize = 30 / 9;
  const partIndex = Math.min(Math.floor(degreesInSign / partSize), 8);

  let startSign = signIndex;
  if (MOVABLE_SIGNS.has(signIndex)) {
    startSign = signIndex;
  } else if (FIXED_SIGNS.has(signIndex)) {
    startSign = (signIndex + 8) % 12;
  } else if (DUAL_SIGNS.has(signIndex)) {
    startSign = (signIndex + 4) % 12;
  }

  return (startSign + partIndex) % 12;
}

export function getVargaSign(longitude, division) {
  if (division === 1) return getSignIndex(longitude);
  if (division === 9) return getNavamsaSign(longitude);
  return getSimpleVargaSign(longitude, division);
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
      matrix[name][key] = typeof longitude === 'number'
        ? SIGN_ABBR[getVargaSign(longitude, division)]
        : '—';
    });
  });

  return matrix;
}

function buildVargaSignIndexMatrix(planets = {}, divisions = DEFAULT_DIVISIONS) {
  const result = {};

  SCORE_PLANETS.forEach((planet) => {
    const longitude = planets[planet];
    if (typeof longitude !== 'number') return;
    result[planet] = divisions.map((division) => getVargaSign(longitude, division));
  });

  return result;
}

function buildDominanceScore(planets = {}, divisions = DEFAULT_DIVISIONS) {
  const signIndexMatrix = buildVargaSignIndexMatrix(planets, divisions);

  return SCORE_PLANETS.map((planet) => {
    const signs = signIndexMatrix[planet] ?? [];
    const own = signs.filter((sign) => OWN_SIGNS[planet]?.includes(sign)).length;
    const exalted = signs.filter((sign) => EXALTATION_SIGNS[planet] === sign).length;
    const friend = signs.filter((sign) => FRIEND_SIGNS[planet]?.includes(sign)).length;

    return {
      planet,
      own,
      exalted,
      friend,
      total: own * 3 + exalted * 4 + friend,
    };
  }).sort((a, b) => b.total - a.total || b.exalted - a.exalted || b.own - a.own || b.friend - a.friend);
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

export default function VargaMatrix({ chart }) {
  const divisions = DEFAULT_DIVISIONS;
  const planets = mapPlanetLongitudes(chart);
  const lagna = typeof chart?.ascendant?.longitude === 'number' ? chart.ascendant.longitude : undefined;
  const matrix = buildVargaMatrix(planets, lagna, divisions);
  const dominance = buildDominanceScore(planets, divisions);

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
          D1, D3, D9, D10 and D60 from existing sidereal longitudes
        </div>
      </div>

      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full min-w-[520px] border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-zinc-100 dark:bg-zinc-800">
              <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Body</th>
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
                <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{name}</td>
                {divisions.map((division) => (
                  <td key={division} className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {matrix[name][`D${division}`]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <div>
          <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; varga.dominance.score</div>
          <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">
            Score across D1/D3/D9/D10/D60: exalted ×4, own sign ×3, friend sign ×1. Rahu/Ketu excluded from score.
          </div>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
          <table className="w-full min-w-[520px] border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Planet</th>
                <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Own</th>
                <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Exalted</th>
                <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Friend</th>
                <th className="text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">Score</th>
              </tr>
            </thead>
            <tbody>
              {dominance.map((row) => (
                <tr key={row.planet} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-emerald-700 dark:text-green-400">{row.planet}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.own}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.exalted}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{row.friend}</td>
                  <td className="p-2 border border-zinc-100 dark:border-zinc-800 font-bold text-amber-600 dark:text-amber-400">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
