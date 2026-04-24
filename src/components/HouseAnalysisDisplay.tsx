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
  const planetsInHouse = planets
    .filter(p => p.house === houseNum)
    .map(p => p.name);

  // The sign of house N (whole sign): ascSign determines house 1 sign
  // House 1 = sign ascSign, House 2 = sign ascSign+1, etc.
  const houseSign = ((ascSign + houseNum - 1 - 1 + 12) % 12) + 1;
  const ruler = getSignRuler(houseSign);
  const rulerHouse = getPlanetHouse(ruler, planets);

  return { planets: planetsInHouse, ruler, rulerHouse };
}

export default function HouseAnalysisDisplay({ yearHouse, monthHouse, planets, ascSign }: Props) {
  const yearAnalysis = analyzeHouse(yearHouse, planets, ascSign);
  const monthAnalysis = analyzeHouse(monthHouse, planets, ascSign);

  return (
    <div className="space-y-3 text-sm">
      <h3 className="font-semibold text-lg">BCP House Analysis</h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="font-medium text-blue-800">Active Year House: {yearHouse}H</div>
        <div className="mt-1 text-gray-700">
          <span className="font-medium">Planets in house: </span>
          {yearAnalysis.planets.length > 0
            ? yearAnalysis.planets.join(", ")
            : "None"}
        </div>
        <div className="text-gray-700">
          <span className="font-medium">Ruler: </span>
          {yearAnalysis.ruler}
        </div>
        <div className="text-gray-700">
          <span className="font-medium">Ruler in house: </span>
          {yearAnalysis.rulerHouse > 0 ? yearAnalysis.rulerHouse + "H" : "Not placed in chart"}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="font-medium text-green-800">Active Month House: {monthHouse}H</div>
        <div className="mt-1 text-gray-700">
          <span className="font-medium">Planets in house: </span>
          {monthAnalysis.planets.length > 0
            ? monthAnalysis.planets.join(", ")
            : "None"}
        </div>
        <div className="text-gray-700">
          <span className="font-medium">Ruler: </span>
          {monthAnalysis.ruler}
        </div>
        <div className="text-gray-700">
          <span className="font-medium">Ruler in house: </span>
          {monthAnalysis.rulerHouse > 0 ? monthAnalysis.rulerHouse + "H" : "Not placed in chart"}
        </div>
      </div>

      {yearHouse === monthHouse && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <span className="font-medium text-purple-800">Combined Year + Month:</span>
          <span className="text-gray-700"> Same house ({yearHouse}H) is active for both year and month.</span>
        </div>
      )}
    </div>
  );
}
