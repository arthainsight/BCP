import { SIGN_NAMES } from '@/lib/varga/index';

export type MinorInfluenceStrength = 'strong' | 'weak' | 'none';

export type MinorActivation = {
  graha: string;
  grahaName: string;
  signIndex: number;
  signName: string;
  relation: number;
  strength: MinorInfluenceStrength;
};

export type MinorProgressionResult = {
  minorSignIndex: number;
  minorSignName: string;
  activations: MinorActivation[];
  strongActivations: MinorActivation[];
  weakActivations: MinorActivation[];
};

const NAME_TO_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

const ABBR_TO_FULL: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
};

function classifyStrength(house: number): MinorInfluenceStrength {
  if (house === 1 || house === 2 || house === 5 || house === 7 || house === 9) return 'strong';
  if (house === 3 || house === 11 || house === 12) return 'weak';
  return 'none';
}

export function calculateMinorProgression(params: {
  natalJupiterSignIndex: number;
  ageYears: number;
  planets: Array<{ name: string; signIndex: number }>;
}): MinorProgressionResult {
  const { natalJupiterSignIndex, ageYears, planets } = params;

  // Minor Jupiter advances one sign per year, cycling every 12 years
  const minorSignIndex = (natalJupiterSignIndex + Math.floor(ageYears)) % 12;
  const minorSignName = SIGN_NAMES[minorSignIndex];

  const activations: MinorActivation[] = [];

  for (const planet of planets) {
    const abbr = NAME_TO_ABBR[planet.name];
    if (!abbr) continue;
    const signIndex = Math.max(0, Math.min(11, planet.signIndex));
    const relation = ((signIndex - minorSignIndex + 12) % 12) + 1;
    const strength = classifyStrength(relation);

    activations.push({
      graha: abbr,
      grahaName: ABBR_TO_FULL[abbr] ?? planet.name,
      signIndex,
      signName: SIGN_NAMES[signIndex],
      relation,
      strength,
    });
  }

  activations.sort((a, b) => a.relation - b.relation);

  return {
    minorSignIndex,
    minorSignName,
    activations,
    strongActivations: activations.filter(a => a.strength === 'strong'),
    weakActivations: activations.filter(a => a.strength === 'weak'),
  };
}
