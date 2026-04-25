'use client';

import { BcpResult, PlanetData } from '@/types';
import { HOUSE_NAMES, HOUSE_MEANINGS } from '@/lib/houseData';

interface Props {
  bcp: BcpResult;
  planets: PlanetData[];
  ascSign: number;
}

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer',
  5: 'Leo', 6: 'Virgo', 7: 'Libra', 8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces',
};

const SIGN_RULERS: Record<number, string> = {
  1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon',
  5: 'Sun', 6: 'Mercury', 7: 'Venus', 8: 'Mars',
  9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter',
};

const PLANET_KEYWORDS: Record<string, string> = {
  Sun: 'authority and vitality',
  Moon: 'emotions and sensitivity',
  Mars: 'drive and urgency',
  Mercury: 'intellect and communication',
  Jupiter: 'wisdom and expansion',
  Venus: 'harmony and creativity',
  Saturn: 'discipline and karmic weight',
  Rahu: 'amplification and unconventional influences',
  Ketu: 'detachment and spiritual orientation',
};

const HOUSE_BRIEF: Record<number, string> = {
  1:  'self, body, and direction',
  2:  'speech, family, and resources',
  3:  'effort, courage, and communication',
  4:  'home, mother, and emotional roots',
  5:  'intelligence, creativity, and children',
  6:  'conflict, service, and health challenges',
  7:  'partnerships and public life',
  8:  'hidden matters and transformation',
  9:  'dharma, teachers, and fortune',
  10: 'career, status, and responsibility',
  11: 'gains, networks, and ambitions',
  12: 'retreat, expenses, and inner life',
};

function getHouseSign(ascSign: number, house: number): number {
  return ((ascSign - 1 + house - 1) % 12) + 1;
}

function analyzeHouse(houseNum: number, planets: PlanetData[], ascSign: number) {
  const houseSign = getHouseSign(ascSign, houseNum);
  const signName = SIGN_NAMES[houseSign];
  const ruler = SIGN_RULERS[houseSign];
  const planetsInHouse = planets.filter(p => p.house === houseNum).map(p => p.name);
  const rulerPlanet = planets.find(p => p.name === ruler);
  const rulerHouse = rulerPlanet ? rulerPlanet.house : 0;
  return { houseSign, signName, ruler, planetsInHouse, rulerHouse };
}

function buildInterpretation(
  houseNum: number,
  analysis: ReturnType<typeof analyzeHouse>,
  period: 'year' | 'month',
  runningYear: number,
  monthNum: number,
): string {
  const { signName, ruler, planetsInHouse, rulerHouse } = analysis;
  const theme = HOUSE_BRIEF[houseNum];
  const parts: string[] = [];

  const periodLabel = period === 'year'
    ? `Running year ${runningYear}`
    : `Month ${monthNum} of the running year`;
  parts.push(`${periodLabel} activates House ${houseNum} (${signName}), the house of ${theme}.`);

  if (planetsInHouse.length > 0) {
    const withKeywords = planetsInHouse
      .map(p => `${p} (${PLANET_KEYWORDS[p] ?? 'influence'})`)
      .join('; ');
    parts.push(
      `${planetsInHouse.join(' and ')} ${planetsInHouse.length === 1 ? 'is' : 'are'} placed here, bringing ${withKeywords}.`
    );
  } else {
    parts.push(`No planets are placed here; the house expresses primarily through its ruler.`);
  }

  if (rulerHouse > 0) {
    parts.push(
      `${ruler}, ruler of ${signName}, sits in House ${rulerHouse} — the house of ${HOUSE_BRIEF[rulerHouse]}. ` +
      `This connects House ${houseNum}'s themes (${theme}) with the domain of House ${rulerHouse} (${HOUSE_BRIEF[rulerHouse]}), ` +
      `suggesting that ${theme} will tend to manifest through ${HOUSE_BRIEF[rulerHouse]}.`
    );
  }

  return parts.join(' ');
}

function buildCombinedInterpretation(
  yearHouse: number,
  monthHouse: number,
  yearAnalysis: ReturnType<typeof analyzeHouse>,
  monthAnalysis: ReturnType<typeof analyzeHouse>,
): string {
  if (yearHouse === monthHouse) {
    return (
      `Both the year and month are focused on House ${yearHouse} (${yearAnalysis.signName}), ` +
      `the house of ${HOUSE_BRIEF[yearHouse]}. This double activation intensifies all themes of this house. ` +
      `The period tends to be marked by concentrated energy around ${HOUSE_MEANINGS[yearHouse].toLowerCase()}.`
    );
  }

  let text =
    `The year's focus is on House ${yearHouse} (${yearAnalysis.signName}) — ${HOUSE_BRIEF[yearHouse]}. ` +
    `This month's activation through House ${monthHouse} (${monthAnalysis.signName}) — ${HOUSE_BRIEF[monthHouse]} — ` +
    `provides the immediate channel of expression. ` +
    `Day-to-day events tend to reflect the month house theme, while the year house describes the broader backdrop.`;

  const monthRulerInYearHouse = monthAnalysis.rulerHouse === yearHouse;
  const yearRulerInMonthHouse = yearAnalysis.rulerHouse === monthHouse;

  if (monthRulerInYearHouse) {
    text +=
      ` Notably, the ruler of the month house (${monthAnalysis.ruler}) is placed in the active year house, ` +
      `creating a strong link between the month's domain and the year's broader theme.`;
  } else if (yearRulerInMonthHouse) {
    text +=
      ` Notably, the ruler of the year house (${yearAnalysis.ruler}) is placed in the active month house, ` +
      `making this month's domain a direct outlet for the year's energy.`;
  }

  return text;
}

export default function BcpSummary({ bcp, planets, ascSign }: Props) {
  const yearAnalysis = analyzeHouse(bcp.activeYearHouse, planets, ascSign);
  const monthAnalysis = analyzeHouse(bcp.activeMonthHouse, planets, ascSign);
  const sameHouse = bcp.activeYearHouse === bcp.activeMonthHouse;

  const yearText = buildInterpretation(bcp.activeYearHouse, yearAnalysis, 'year', bcp.runningYear, bcp.monthInRunningYear);
  const monthText = buildInterpretation(bcp.activeMonthHouse, monthAnalysis, 'month', bcp.runningYear, bcp.monthInRunningYear);
  const combinedText = buildCombinedInterpretation(bcp.activeYearHouse, bcp.activeMonthHouse, yearAnalysis, monthAnalysis);

  return (
    <div className="w-full space-y-4 text-sm">
      <h3 className="font-mono text-xs text-zinc-400 uppercase tracking-widest">&gt; bcp.engine</h3>

      {/* Age & cycle */}
      <div className="bg-zinc-800 border border-zinc-700 rounded p-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
          <div className="text-zinc-500">completed age</div>
          <div className="text-zinc-200">{bcp.completedAge} years</div>

          <div className="text-zinc-500">running year</div>
          <div className="text-zinc-200">{bcp.runningYear}</div>

          <div className="text-zinc-500">bcp cycle</div>
          <div className="text-zinc-200">cycle {bcp.bcpCycle}</div>

          <div className="text-zinc-500">month in year</div>
          <div className="text-zinc-200">month {bcp.monthInRunningYear}</div>

          <div className="text-zinc-500">active year house</div>
          <div className="text-cyan-400 font-semibold">
            H{bcp.activeYearHouse} · {yearAnalysis.signName} · {HOUSE_NAMES[bcp.activeYearHouse]}
          </div>

          <div className="text-zinc-500">active month house</div>
          <div className="text-green-400 font-semibold">
            H{bcp.activeMonthHouse} · {monthAnalysis.signName} · {HOUSE_NAMES[bcp.activeMonthHouse]}
          </div>
        </div>
      </div>

      {/* Year house */}
      <div className="bg-zinc-800 border border-cyan-900 rounded p-4 space-y-3">
        <div>
          <h4 className="font-mono font-semibold text-cyan-400">
            year — H{bcp.activeYearHouse} ({yearAnalysis.signName})
          </h4>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">{HOUSE_MEANINGS[bcp.activeYearHouse]}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
          <div className="text-zinc-500">planets in house</div>
          <div className="text-zinc-300">{yearAnalysis.planetsInHouse.length > 0 ? yearAnalysis.planetsInHouse.join(', ') : 'none'}</div>
          <div className="text-zinc-500">sign ruler</div>
          <div className="text-zinc-300">{yearAnalysis.ruler}</div>
          <div className="text-zinc-500">ruler placed in</div>
          <div className="text-zinc-300">{yearAnalysis.rulerHouse > 0 ? `H${yearAnalysis.rulerHouse} — ${HOUSE_BRIEF[yearAnalysis.rulerHouse]}` : '—'}</div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-700 pt-2 font-mono">
          {yearText}
        </p>
      </div>

      {/* Month house */}
      <div className="bg-zinc-800 border border-green-900 rounded p-4 space-y-3">
        <div>
          <h4 className="font-mono font-semibold text-green-400">
            month {bcp.monthInRunningYear} — H{bcp.activeMonthHouse} ({monthAnalysis.signName})
          </h4>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">{HOUSE_MEANINGS[bcp.activeMonthHouse]}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
          <div className="text-zinc-500">planets in house</div>
          <div className="text-zinc-300">{monthAnalysis.planetsInHouse.length > 0 ? monthAnalysis.planetsInHouse.join(', ') : 'none'}</div>
          <div className="text-zinc-500">sign ruler</div>
          <div className="text-zinc-300">{monthAnalysis.ruler}</div>
          <div className="text-zinc-500">ruler placed in</div>
          <div className="text-zinc-300">{monthAnalysis.rulerHouse > 0 ? `H${monthAnalysis.rulerHouse} — ${HOUSE_BRIEF[monthAnalysis.rulerHouse]}` : '—'}</div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-700 pt-2 font-mono">
          {monthText}
        </p>
      </div>

      {/* Combined interpretation */}
      <div className={`border rounded p-4 space-y-2 bg-zinc-800 ${sameHouse ? 'border-purple-900' : 'border-amber-900'}`}>
        <h4 className={`font-mono text-xs font-semibold ${sameHouse ? 'text-purple-400' : 'text-amber-400'}`}>
          {sameHouse ? '// combined year + month — same house' : '// combined year + month'}
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed font-mono">{combinedText}</p>
      </div>
    </div>
  );
}
