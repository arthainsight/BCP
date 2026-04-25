interface PlanetDetail {
  name: string;
  sign: number;
  degree: number;
  house: number;
}

interface Props {
  yearHouse: number;
  monthHouse: number;
  planets: PlanetDetail[];
  ascSign: number;
}

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

function getSignRuler(sign: number): string {
  const rulers: Record<number, string> = {
    1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon',
    5: 'Sun', 6: 'Mercury', 7: 'Venus', 8: 'Mars',
    9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter',
  };
  return rulers[sign] || '';
}

function getPlanetHouse(planetName: string, planets: PlanetDetail[]): number {
  const p = planets.find(pl => pl.name === planetName);
  return p ? p.house : 0;
}

function analyzeHouse(houseNum: number, planets: PlanetDetail[], ascSign: number) {
  const planetsInHouse = planets.filter(p => p.house === houseNum).map(p => p.name);
  const houseSign = ((ascSign + houseNum - 1 - 1 + 12) % 12) + 1;
  const ruler = getSignRuler(houseSign);
  const rulerHouse = getPlanetHouse(ruler, planets);
  return { planets: planetsInHouse, ruler, rulerHouse, houseSign };
}

export default function HouseAnalysisDisplay({ yearHouse, monthHouse, planets, ascSign }: Props) {
  const yearAnalysis = analyzeHouse(yearHouse, planets, ascSign);
  const monthAnalysis = analyzeHouse(monthHouse, planets, ascSign);

  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; house.analysis</h3>

      <div className="bg-zinc-100 dark:bg-zinc-800 border border-cyan-300 dark:border-cyan-900 rounded p-3 space-y-1">
        <div className="font-mono text-xs text-cyan-600 dark:text-cyan-400">
          H{yearHouse} — {SIGN_NAMES[yearAnalysis.houseSign]} · active year house
        </div>
        <div className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">
          <span className="text-zinc-400 dark:text-zinc-500">planets: </span>
          {yearAnalysis.planets.length > 0 ? yearAnalysis.planets.join(', ') : 'none'}
        </div>
        <div className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">
          <span className="text-zinc-400 dark:text-zinc-500">ruler: </span>
          {yearAnalysis.ruler}
        </div>
        <div className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">
          <span className="text-zinc-400 dark:text-zinc-500">ruler in: </span>
          {yearAnalysis.rulerHouse > 0 ? `H${yearAnalysis.rulerHouse}` : '—'}
        </div>
      </div>

      <div className="bg-zinc-100 dark:bg-zinc-800 border border-emerald-300 dark:border-green-900 rounded p-3 space-y-1">
        <div className="font-mono text-xs text-emerald-700 dark:text-green-400">
          H{monthHouse} — {SIGN_NAMES[monthAnalysis.houseSign]} · active month house
        </div>
        <div className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">
          <span className="text-zinc-400 dark:text-zinc-500">planets: </span>
          {monthAnalysis.planets.length > 0 ? monthAnalysis.planets.join(', ') : 'none'}
        </div>
        <div className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">
          <span className="text-zinc-400 dark:text-zinc-500">ruler: </span>
          {monthAnalysis.ruler}
        </div>
        <div className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">
          <span className="text-zinc-400 dark:text-zinc-500">ruler in: </span>
          {monthAnalysis.rulerHouse > 0 ? `H${monthAnalysis.rulerHouse}` : '—'}
        </div>
      </div>

      {yearHouse === monthHouse && (
        <div className="bg-zinc-100 dark:bg-zinc-800 border border-purple-300 dark:border-purple-900 rounded p-3">
          <span className="font-mono text-xs text-purple-600 dark:text-purple-400">// double activation — </span>
          <span className="text-zinc-500 dark:text-zinc-400 text-xs font-mono">H{yearHouse} is active for both year and month.</span>
        </div>
      )}
    </div>
  );
}
