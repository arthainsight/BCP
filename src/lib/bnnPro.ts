import { PlanetData, ChartData } from '@/types';

const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];

export type CircuitName = 'Fire' | 'Earth' | 'Air' | 'Water';

const CIRCUITS: Record<CircuitName, number[]> = {
  Fire:  [1, 5, 9],
  Earth: [2, 6, 10],
  Air:   [3, 7, 11],
  Water: [4, 8, 12],
};

const PLANET_KEYWORDS: Record<string, string> = {
  Sun:     'soul, authority, vitality',
  Moon:    'mind, emotion, nurture',
  Mars:    'action, desire, courage',
  Mercury: 'intellect, communication, skill',
  Jupiter: 'wisdom, faith, expansion',
  Venus:   'love, beauty, pleasure',
  Saturn:  'duty, discipline, karma',
  Rahu:    'obsession, amplification, desire',
  Ketu:    'detachment, past, liberation',
};

type PairData = { meaning: string; keywords: string[] };

const PAIR_MAP: Record<string, PairData> = {
  'Venus→Moon': {
    meaning:
      'Relationships, pleasure, affection or aesthetic needs condition the emotional life. The person may seek emotional safety through love, beauty, comfort or relational harmony.',
    keywords: ['relational comfort', 'aesthetic emotion', 'pleasure-seeking'],
  },
  'Moon→Venus': {
    meaning:
      "Emotional states condition relationship patterns and desire. The person's mood, attachment needs or inner fluctuations may strongly influence love, pleasure and attraction.",
    keywords: ['mood-driven love', 'emotional desire', 'fluctuating attraction'],
  },
  'Mars→Venus': {
    meaning:
      'Desire, passion and assertion push into relationships, pleasure and attraction. This can give strong romantic pursuit, artistic drive or conflict in love.',
    keywords: ['passionate pursuit', 'romantic drive', 'assertive love'],
  },
  'Venus→Mars': {
    meaning:
      'Pleasure, attraction and relationship needs activate passion and action. Desire may arise through beauty, affection, sensuality or relational stimulus.',
    keywords: ['beauty-activated drive', 'sensual action', 'love-powered ambition'],
  },
  'Saturn→Moon': {
    meaning:
      'Duty, delay, fear, discipline or heaviness conditions the emotional life. This may show emotional restraint, seriousness, loneliness or maturity through pressure.',
    keywords: ['emotional restriction', 'karmic burden', 'disciplined feeling'],
  },
  'Moon→Saturn': {
    meaning:
      'Emotional needs move toward structure, responsibility and endurance. Feelings may become tied to duty, survival, work or karmic burden.',
    keywords: ['duty-bound emotion', 'feeling through structure', 'emotional endurance'],
  },
  'Jupiter→Venus': {
    meaning:
      'Wisdom, belief, teaching or expansion influences love, beauty and relationship. This can give refined values, guidance through relationships or generous affection.',
    keywords: ['refined love', 'philosophical beauty', 'generous affection'],
  },
  'Venus→Jupiter': {
    meaning:
      'Love, beauty, pleasure or relationship opens the path toward wisdom, faith, teaching or expansion.',
    keywords: ['love-through-wisdom', 'aesthetic expansion', 'relational growth'],
  },
  'Rahu→Moon': {
    meaning:
      'Obsession, foreignness, amplification or unusual desire affects the mind and emotions. This can create restlessness, fascination or psychological intensity.',
    keywords: ['amplified emotion', 'restless mind', 'obsessive feeling'],
  },
  'Moon→Rahu': {
    meaning:
      'The emotional nature moves toward amplification, hunger, unusual experience or obsession. The mind may chase novelty, intensity or unconventional security.',
    keywords: ['craving security', 'emotionally obsessive', 'novelty-seeking'],
  },
};

function getPairData(fromName: string, toName: string): PairData {
  const key = `${fromName}→${toName}`;
  const found = PAIR_MAP[key];
  if (found) return found;
  const fromKw = PLANET_KEYWORDS[fromName] ?? fromName.toLowerCase();
  const toKw = PLANET_KEYWORDS[toName] ?? toName.toLowerCase();
  return {
    meaning: `${fromName} modifies ${toName}. Read through ${fromName}'s significations (${fromKw}) flowing into ${toName}'s significations (${toKw}).`,
    keywords: [fromName.toLowerCase(), toName.toLowerCase()],
  };
}

export type BnnLink = {
  from: PlanetData;
  to: PlanetData;
  meaning: string;
  keywords: string[];
};

export type BnnChain = {
  circuitName: CircuitName;
  signs: number[];
  planets: PlanetData[];
  links: BnnLink[];
  summary: string;
};

export type BnnActivationOptions = {
  mahaDashaPlanet?: string;
  antarDashaPlanet?: string;
  pratyantarDashaPlanet?: string;
  transitPlanets?: PlanetData[];
};

export type BnnActivation = {
  chain: BnnChain;
  activatedBy: string[];
  activationLevel: 'major' | 'focused' | 'specific' | 'transit';
  explanation: string;
};

export function buildBnnChains(chart: ChartData): BnnChain[] {
  const planets = chart.planets.filter((p) => !OUTER_PLANETS.includes(p.name));
  const chains: BnnChain[] = [];

  for (const [name, signs] of Object.entries(CIRCUITS) as Array<[CircuitName, number[]]>) {
    const inCircuit = planets
      .filter((p) => signs.includes(p.sign))
      .sort((a, b) => a.degree - b.degree);

    if (inCircuit.length < 2) continue;

    const links: BnnLink[] = inCircuit.slice(0, -1).map((from, i) => {
      const to = inCircuit[i + 1];
      const { meaning, keywords } = getPairData(from.name, to.name);
      return { from, to, meaning, keywords };
    });

    chains.push({
      circuitName: name,
      signs,
      planets: inCircuit,
      links,
      summary: `${name} trine: ${inCircuit.map((p) => p.name).join(' → ')}`,
    });
  }

  return chains;
}

function seventhSignFrom(sign: number): number {
  return ((sign - 1 + 6) % 12) + 1;
}

export function getActiveBnnChains(
  chart: ChartData,
  options: BnnActivationOptions = {},
): BnnActivation[] {
  const chains = buildBnnChains(chart);
  const activations: BnnActivation[] = [];

  for (const chain of chains) {
    const names = new Set(chain.planets.map((p) => p.name));
    const signs = new Set(chain.planets.map((p) => p.sign));
    const activatedBy: string[] = [];
    let level: BnnActivation['activationLevel'] | null = null;

    if (options.mahaDashaPlanet && names.has(options.mahaDashaPlanet)) {
      activatedBy.push(`${options.mahaDashaPlanet} MD (major dasha)`);
      level = 'major';
    }
    if (options.antarDashaPlanet && names.has(options.antarDashaPlanet)) {
      activatedBy.push(`${options.antarDashaPlanet} AD (antardasha)`);
      if (!level) level = 'focused';
    }
    if (options.pratyantarDashaPlanet && names.has(options.pratyantarDashaPlanet)) {
      activatedBy.push(`${options.pratyantarDashaPlanet} PD (pratyantardasha)`);
      if (!level) level = 'specific';
    }

    if (options.transitPlanets) {
      for (const tp of options.transitPlanets) {
        if (OUTER_PLANETS.includes(tp.name)) continue;
        if (signs.has(tp.sign)) {
          activatedBy.push(`${tp.name} transit conjunct chain sign (${tp.sign})`);
          if (!level) level = 'transit';
        } else {
          const aspected = seventhSignFrom(tp.sign);
          if (signs.has(aspected)) {
            activatedBy.push(`${tp.name} transit 7th aspect on sign ${aspected}`);
            if (!level) level = 'transit';
          }
        }
      }
    }

    if (activatedBy.length === 0) continue;

    activations.push({
      chain,
      activatedBy,
      activationLevel: level!,
      explanation: `${chain.summary} — activated by: ${activatedBy.join('; ')}.`,
    });
  }

  return activations;
}
