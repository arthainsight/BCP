import { SIGN_NAMES } from '@/lib/varga/index';

// ── Round types ─────────────────────────────────────────────────────────────

export type JupiterianRound = {
  roundNumber: number;
  startAge: number;
  endAge: number;
  activeSignIndex: number;
  activeSignName: string;
};

export type JupiterianRoundsResult = {
  natalJupiterSignIndex: number;
  natalJupiterDegree: number;
  balanceDegrees: number;
  firstRoundLength: number;
  currentAge: number;
  currentRound: JupiterianRound | null;
  rounds: JupiterianRound[];
};

// ── Activation types ─────────────────────────────────────────────────────────

export type ActivationRole =
  | 'primary'
  | 'trine'
  | 'seventh'
  | 'dispositor'
  | 'support-2-12'
  | 'other';

export type BNNJupiterianGrahaActivation = {
  graha: string;
  grahaName: string;
  signIndex: number;
  signName: string;
  houseFromTemporaryLagna: number;
  roles: ActivationRole[];
  score: number;
  karakatwa: string[];
  interpretation: string;
};

export type BNNJupiterianActivationResult = {
  activeSignIndex: number;
  activeSignName: string;
  dispositorGraha: string;
  activations: BNNJupiterianGrahaActivation[];
  primaryActivations: BNNJupiterianGrahaActivation[];
  trineActivations: BNNJupiterianGrahaActivation[];
  seventhActivations: BNNJupiterianGrahaActivation[];
  supportAxisActivations: BNNJupiterianGrahaActivation[];
  summary: string[];
};

// ── Internal maps ─────────────────────────────────────────────────────────────

const NAME_TO_ABBR: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
  Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

const ABBR_TO_FULL: Record<string, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
};

// Traditional Jyotish sign lords (no outer planets)
const SIGN_LORD: Record<number, string> = {
  0: 'Ma', 1: 'Ve', 2: 'Me', 3: 'Mo',
  4: 'Su', 5: 'Me', 6: 'Ve', 7: 'Ma',
  8: 'Ju', 9: 'Sa', 10: 'Sa', 11: 'Ju',
};

// BNN Jupiterian-layer karakatwa — not Parashari house significations
const JR_KARAKATWA: Record<string, string[]> = {
  Su: [
    'Fame / Name / Recognition',
    'Talent / Brilliance / Specialisation',
    'Father / Son / Prominent Person',
    'Large-scale prospects / Ambitious plans',
    'Government / Political / Administration',
    'Presiding deity / Religious ceremonies / Family functions',
    'Chemicals / Designing / Organisational matters',
  ],
  Mo: [
    'Mind / emotional state',
    'Mother / care / nourishment',
    'Public response',
    'Movement / change / variation',
  ],
  Ma: [
    'Action / courage / conflict',
    'Land / property / construction',
    'Siblings / competition',
    'Surgery / injury / technical force',
  ],
  Me: [
    'Speech / communication',
    'Learning / calculation / writing',
    'Business / trade',
    'Analysis / documents',
  ],
  Ju: [
    'Wisdom / guidance / teacher',
    'Children / expansion',
    'Dharma / blessings',
    'Counsel / protection',
  ],
  Ve: [
    'Relationship / spouse / attraction',
    'Comfort / luxury / vehicles',
    'Art / beauty / design',
    'Agreements / enjoyment',
  ],
  Sa: [
    'Work / duty / pressure',
    'Delay / endurance',
    'Servants / labour / masses',
    'Structure / karma / long-term consequences',
  ],
  Ra: [
    'Amplification / foreign element',
    'Obsession / unusual path',
    'Technology / smoke / confusion',
    'Sudden rise or distortion',
  ],
  Ke: [
    'Separation / detachment',
    'Spiritualisation',
    'Break / cut / loss of interest',
    'Past karmic residue',
  ],
};

function buildInterpretation(roles: ActivationRole[]): string {
  const lines: string[] = [];
  if (roles.includes('primary')) {
    lines.push('Directly activated — placed in the active Jupiterian Round rashi.');
  }
  if (roles.includes('trine')) {
    lines.push('Activated through the 1-5-9 trinal current from the temporary lagna.');
  }
  if (roles.includes('seventh')) {
    lines.push('May manifest through external people, opposition, partnership or visible confrontation.');
  }
  if (roles.includes('dispositor')) {
    lines.push('Controls the active rashi as its dispositor — key driver of the round.');
  }
  if (roles.includes('support-2-12')) {
    lines.push('Works through the 2/12 support axis: resources, speech, family, expenditure, loss or withdrawal.');
  }
  if (lines.length === 0) {
    lines.push('Present as background context — not directly activated in this round.');
  }
  return lines.join(' ');
}

// ── Round calculation ─────────────────────────────────────────────────────────

export function calculateJupiterianRounds(params: {
  natalJupiterSignIndex: number;
  natalJupiterDegree: number;
  ageYears: number;
  maxAge?: number;
}): JupiterianRoundsResult {
  const { ageYears, maxAge = 96 } = params;
  const natalJupiterSignIndex = Math.max(0, Math.min(11, Math.floor(params.natalJupiterSignIndex)));
  const natalJupiterDegree = Math.max(0, Math.min(29.99, params.natalJupiterDegree));

  const balanceDegrees = 30 - natalJupiterDegree;
  const firstRoundLength = Math.max(1, Math.round(balanceDegrees / 2.3));

  const rounds: JupiterianRound[] = [];

  rounds.push({
    roundNumber: 1,
    startAge: 0,
    endAge: firstRoundLength,
    activeSignIndex: natalJupiterSignIndex,
    activeSignName: SIGN_NAMES[natalJupiterSignIndex],
  });

  let roundStart = firstRoundLength;
  let roundNumber = 2;
  while (roundStart < maxAge) {
    const signOffset = roundNumber - 1;
    const activeSignIndex = (natalJupiterSignIndex + signOffset) % 12;
    const endAge = roundStart + 12;
    rounds.push({
      roundNumber,
      startAge: roundStart,
      endAge,
      activeSignIndex,
      activeSignName: SIGN_NAMES[activeSignIndex],
    });
    roundStart = endAge;
    roundNumber++;
  }

  const currentRound = rounds.find(r => ageYears >= r.startAge && ageYears < r.endAge) ?? null;

  return {
    natalJupiterSignIndex,
    natalJupiterDegree,
    balanceDegrees,
    firstRoundLength,
    currentAge: ageYears,
    currentRound,
    rounds,
  };
}

// Returns house 1–12 from temporary lagna. Both indices 0-based (0 = Aries).
export function getHouseFromTemporaryLagna(activeSignIndex: number, planetSignIndex: number): number {
  return ((planetSignIndex - activeSignIndex + 12) % 12) + 1;
}

// ── Activation string builder ─────────────────────────────────────────────────

export function buildBNNJupiterianActivationString(params: {
  activeSignIndex: number;
  planets: Array<{
    id?: string;
    name: string;
    abbreviation?: string;
    signIndex: number;
  }>;
}): BNNJupiterianActivationResult {
  const { planets } = params;
  const activeSignIndex = Math.max(0, Math.min(11, params.activeSignIndex));
  const activeSignName = SIGN_NAMES[activeSignIndex];
  const dispositorAbbr = SIGN_LORD[activeSignIndex] ?? 'Ju';

  const activationMap = new Map<string, BNNJupiterianGrahaActivation>();

  for (const planet of planets) {
    const abbr = planet.abbreviation ?? NAME_TO_ABBR[planet.name];
    if (!abbr) continue;
    const fullName = ABBR_TO_FULL[abbr] ?? planet.name;
    const signIndex = Math.max(0, Math.min(11, planet.signIndex));
    const house = getHouseFromTemporaryLagna(activeSignIndex, signIndex);

    const roles: ActivationRole[] = [];
    let score = 0;

    if (house === 1) {
      roles.push('primary');
      score += 5;
    } else if (house === 5 || house === 9) {
      roles.push('trine');
      score += 4;
    } else if (house === 7) {
      roles.push('seventh');
      score += 3;
    } else if (house === 2 || house === 12) {
      roles.push('support-2-12');
      score += 2;
    } else {
      roles.push('other');
    }

    if (abbr === dispositorAbbr) {
      roles.push('dispositor');
      score += 4;
    }

    activationMap.set(abbr, {
      graha: abbr,
      grahaName: fullName,
      signIndex,
      signName: SIGN_NAMES[signIndex],
      houseFromTemporaryLagna: house,
      roles,
      score,
      karakatwa: JR_KARAKATWA[abbr] ?? ['Karakatwa mapping pending'],
      interpretation: buildInterpretation(roles),
    });
  }

  const activations = Array.from(activationMap.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.houseFromTemporaryLagna !== b.houseFromTemporaryLagna) {
      return a.houseFromTemporaryLagna - b.houseFromTemporaryLagna;
    }
    return a.graha.localeCompare(b.graha);
  });

  const primaryActivations = activations.filter(a => a.roles.includes('primary'));
  const trineActivations = activations.filter(a => a.roles.includes('trine'));
  const seventhActivations = activations.filter(a => a.roles.includes('seventh'));
  const supportAxisActivations = activations.filter(a => a.roles.includes('support-2-12'));

  const dispositorEntry = activations.find(a => a.roles.includes('dispositor'));

  const summary: string[] = [];
  if (primaryActivations.length > 0) {
    const names = primaryActivations.map(a => `${a.graha} (${a.grahaName})`).join(', ');
    summary.push(
      `${names} ${primaryActivations.length === 1 ? 'is' : 'are'} directly placed in ${activeSignName}.`,
    );
  }
  if (trineActivations.length > 0) {
    const parts = trineActivations.map(a => `${a.graha} H${a.houseFromTemporaryLagna}`).join(', ');
    summary.push(`Trinal support (1-5-9): ${parts}.`);
  }
  if (seventhActivations.length > 0) {
    summary.push(`7th axis: ${seventhActivations.map(a => a.graha).join(', ')}.`);
  }
  if (dispositorEntry) {
    summary.push(
      `Dispositor of ${activeSignName}: ${dispositorAbbr} placed in H${dispositorEntry.houseFromTemporaryLagna}.`,
    );
  }
  if (supportAxisActivations.length > 0) {
    const parts = supportAxisActivations.map(a => `${a.graha} H${a.houseFromTemporaryLagna}`).join(', ');
    summary.push(`2/12 support axis: ${parts}.`);
  }

  return {
    activeSignIndex,
    activeSignName,
    dispositorGraha: dispositorAbbr,
    activations,
    primaryActivations,
    trineActivations,
    seventhActivations,
    supportAxisActivations,
    summary,
  };
}
