import type { JupiterianRoundsResult } from './jupiterianRounds';
import { getHouseFromTemporaryLagna } from './jupiterianRounds';
import type { MinorProgressionResult } from './jupiterMinorProgression';

export type BNNEventCategory =
  | 'marriage'
  | 'career'
  | 'property'
  | 'children'
  | 'father_authority'
  | 'wealth_family'
  | 'spirituality'
  | 'health_pressure'
  | 'foreign_travel'
  | 'education';

export type BNNEventWindow = {
  category: BNNEventCategory;
  label: string;
  startAge: number;
  endAge: number;
  confidence: 'low' | 'medium' | 'high';
  activatedGrahas: string[];
  reasons: string[];
  cautions: string[];
};

const NAME_TO_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

const ABBR_TO_FULL: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
};

const MAJOR_STRONG_HOUSES = new Set([1, 5, 7, 9]);

type EventRule = {
  category: BNNEventCategory;
  label: string;
  keyGrahas: string[];
  relevantHouses: number[];
  cautions: string[];
};

const EVENT_RULES: EventRule[] = [
  {
    category: 'marriage',
    label: 'Marriage / partnership themes',
    keyGrahas: ['Ve', 'Ma', 'Ju'],
    relevantHouses: [7, 2],
    cautions: [
      'Partnership themes may reflect developments in existing relationships rather than new unions.',
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
  {
    category: 'career',
    label: 'Career / recognition themes',
    keyGrahas: ['Su', 'Sa', 'Me'],
    relevantHouses: [10, 1],
    cautions: [
      'Recognition may manifest as a role change or internal growth rather than a formal promotion.',
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
  {
    category: 'property',
    label: 'Property / land / home themes',
    keyGrahas: ['Ma', 'Mo'],
    relevantHouses: [4, 2],
    cautions: [
      'Property themes may reflect changes in home environment rather than a transaction.',
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
  {
    category: 'children',
    label: 'Children / creativity themes',
    keyGrahas: ['Ju'],
    relevantHouses: [5],
    cautions: [
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
  {
    category: 'father_authority',
    label: 'Father / authority / government themes',
    keyGrahas: ['Su'],
    relevantHouses: [9, 10],
    cautions: [
      'May reflect interaction with any authority figure, not only the biological father.',
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
  {
    category: 'wealth_family',
    label: 'Wealth / family resources themes',
    keyGrahas: ['Ve', 'Ju', 'Me'],
    relevantHouses: [2, 11],
    cautions: [
      'Wealth themes indicate potential openings, not guaranteed financial gains.',
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
  {
    category: 'spirituality',
    label: 'Spiritual / renunciation themes',
    keyGrahas: ['Ke', 'Ju'],
    relevantHouses: [9, 12],
    cautions: [
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
  {
    category: 'health_pressure',
    label: 'Health / pressure themes',
    keyGrahas: ['Sa', 'Ma', 'Ra'],
    relevantHouses: [6, 8, 12],
    cautions: [
      'Health themes require multiple confirming factors from dasha, transit and palm lines.',
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
  {
    category: 'foreign_travel',
    label: 'Foreign / travel themes',
    keyGrahas: ['Ra', 'Ke'],
    relevantHouses: [9, 12],
    cautions: [
      'Travel themes may indicate cross-cultural exposure or mental journeys rather than physical travel.',
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
  {
    category: 'education',
    label: 'Education / learning themes',
    keyGrahas: ['Me', 'Ju'],
    relevantHouses: [4, 5, 9],
    cautions: [
      'May manifest as informal learning or skill development rather than formal study.',
      'Confirm with dasha/transit before treating as prediction.',
    ],
  },
];

const CONFIDENCE_ORDER: Record<'low' | 'medium' | 'high', number> = { high: 0, medium: 1, low: 2 };

export function detectBNNEventWindows(params: {
  roundsResult: JupiterianRoundsResult;
  majorProgression?: unknown;
  minorProgression?: MinorProgressionResult;
  natalPlanets: Array<{
    name: string;
    abbreviation?: string;
    signIndex: number;
  }>;
}): BNNEventWindow[] {
  const { roundsResult, minorProgression, natalPlanets } = params;

  if (!roundsResult.currentRound) return [];

  const currentRound = roundsResult.currentRound;
  const currentAge = roundsResult.currentAge;
  const majorActiveSignIndex = currentRound.activeSignIndex;
  const currentMinorYear = Math.floor(currentAge);

  const minorStrong = new Set(minorProgression?.strongActivations.map(a => a.graha) ?? []);
  const minorWeak = new Set(minorProgression?.weakActivations.map(a => a.graha) ?? []);

  // Build graha → signIndex lookup from natal planets
  const grahaSign = new Map<string, number>();
  for (const p of natalPlanets) {
    const abbr = p.abbreviation ?? NAME_TO_ABBR[p.name];
    if (abbr) grahaSign.set(abbr, p.signIndex);
  }

  function houseOf(abbr: string): number | null {
    const si = grahaSign.get(abbr);
    if (si === undefined) return null;
    return getHouseFromTemporaryLagna(majorActiveSignIndex, si);
  }

  // Pre-compute which grahas are in H1/5/7/9 from major active sign
  const majorActivated = new Set<string>();
  for (const [abbr] of grahaSign) {
    const h = houseOf(abbr);
    if (h !== null && MAJOR_STRONG_HOUSES.has(h)) majorActivated.add(abbr);
  }

  const windows: BNNEventWindow[] = [];

  for (const rule of EVENT_RULES) {
    let score = 0;
    const activatedGrahas: string[] = [];
    const reasons: string[] = [];
    const scoredHouses = new Set<number>();

    for (const graha of rule.keyGrahas) {
      const inMajor = majorActivated.has(graha);
      const inMinorStrong = minorStrong.has(graha);
      const inMinorWeak = minorWeak.has(graha);

      if (!inMajor && !inMinorStrong && !inMinorWeak) continue;

      activatedGrahas.push(graha);
      const full = ABBR_TO_FULL[graha] ?? graha;

      if (inMajor && inMinorStrong) {
        score += 8; // 2 + 3 + 3 double-activation bonus
        const h = houseOf(graha)!;
        reasons.push(
          `${full} active in both Jupiterian Round (H${h} from ${currentRound.activeSignName}) and Minor Progression — double activation`,
        );
      } else if (inMajor) {
        score += 2;
        const h = houseOf(graha)!;
        reasons.push(`${full} activated in Jupiterian Round (H${h} from ${currentRound.activeSignName})`);
      } else if (inMinorStrong) {
        score += 3;
        reasons.push(`${full} strongly activated by Minor Jupiter Progression`);
      } else {
        score += 1;
        reasons.push(`${full} weakly activated by Minor Jupiter Progression`);
      }
    }

    // Score relevant houses from major temporary lagna
    for (const house of rule.relevantHouses) {
      if (scoredHouses.has(house)) continue;
      for (const [abbr, si] of grahaSign) {
        const h = getHouseFromTemporaryLagna(majorActiveSignIndex, si);
        if (h === house) {
          score += 2;
          scoredHouses.add(house);
          const full = ABBR_TO_FULL[abbr] ?? abbr;
          reasons.push(`H${house} from temporary lagna (${currentRound.activeSignName}) occupied by ${full}`);
          break;
        }
      }
    }

    if (score === 0) continue;

    const confidence: 'low' | 'medium' | 'high' =
      score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';

    let startAge: number;
    let endAge: number;
    if (confidence === 'high') {
      startAge = currentMinorYear;
      endAge = currentMinorYear + 1;
    } else if (confidence === 'medium') {
      startAge = currentMinorYear;
      endAge = currentMinorYear + 2;
    } else {
      startAge = Math.max(currentRound.startAge, currentMinorYear - 1);
      endAge = Math.min(currentRound.endAge, currentMinorYear + 3);
    }

    windows.push({
      category: rule.category,
      label: rule.label,
      startAge,
      endAge,
      confidence,
      activatedGrahas: [...new Set(activatedGrahas)],
      reasons,
      cautions: rule.cautions,
    });
  }

  return windows.sort((a, b) => CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence]);
}
