import { PlanetData } from '@/types';

const OUTER = ['Uranus', 'Neptune', 'Pluto'];

export interface BnnContext {
  planets: PlanetData[];
  ascendant: { sign: number; degree: number };
}

export interface BnnRuleCard {
  id: string;
  planet: string;
  context: string;
  theme: string;
}

function conjuncts(planet: PlanetData, planets: PlanetData[]): string[] {
  return planets
    .filter(p => p.name !== planet.name && p.house === planet.house)
    .map(p => p.name);
}

interface BnnRule {
  id: string;
  match: (p: PlanetData, ctx: BnnContext) => boolean;
  theme: (p: PlanetData) => string;
}

const RULES: BnnRule[] = [
  {
    id: 'sun-h10',
    match: (p) => p.name === 'Sun' && p.house === 10,
    theme: () => 'Career prominence, visibility, authority themes active',
  },
  {
    id: 'sun-h1',
    match: (p) => p.name === 'Sun' && p.house === 1,
    theme: () => 'Strong self-expression, leadership orientation',
  },
  {
    id: 'moon-saturn',
    match: (p, ctx) => p.name === 'Moon' && conjuncts(p, ctx.planets).includes('Saturn'),
    theme: () => 'Moon–Saturn: emotional discipline, restricted nurturing, delayed emotional expression',
  },
  {
    id: 'jupiter-dharma',
    match: (p) => p.name === 'Jupiter' && (p.house === 1 || p.house === 5 || p.house === 9),
    theme: (p) => `Jupiter in H${p.house}: expansion in dharma, wisdom, teaching`,
  },
  {
    id: 'rahu-sun',
    match: (p, ctx) => p.name === 'Rahu' && conjuncts(p, ctx.planets).includes('Sun'),
    theme: () => 'Rahu–Sun: identity amplified by worldly desire, eclipse-pattern authority',
  },
  {
    id: 'jupiter-rahu',
    match: (p, ctx) => p.name === 'Jupiter' && conjuncts(p, ctx.planets).includes('Rahu'),
    theme: () => 'Jupiter–Rahu (Guru Chandala): unconventional belief, amplified ideology, potential for excess',
  },
  {
    id: 'venus-h7',
    match: (p) => p.name === 'Venus' && p.house === 7,
    theme: () => 'Venus in H7: relational grace, artistic partnerships, harmony in agreements',
  },
  {
    id: 'mars-h8',
    match: (p) => p.name === 'Mars' && p.house === 8,
    theme: () => 'Mars in H8: intense drive toward hidden matters, transformation under pressure',
  },
  {
    id: 'saturn-h12',
    match: (p) => p.name === 'Saturn' && p.house === 12,
    theme: () => 'Saturn in H12: structured withdrawal, foreign lands, disciplined release',
  },
  {
    id: 'ketu-h12',
    match: (p) => p.name === 'Ketu' && p.house === 12,
    theme: () => 'Ketu in H12: past-life release, spiritual detachment, moksha orientation',
  },
  {
    id: 'mars-h1',
    match: (p) => p.name === 'Mars' && p.house === 1,
    theme: () => 'Mars in H1: strong will, direct action, physical vitality prominent in character',
  },
  {
    id: 'saturn-h10',
    match: (p) => p.name === 'Saturn' && p.house === 10,
    theme: () => 'Saturn in H10: disciplined career, authority through effort, delayed recognition',
  },
];

export function analyzeBnn(ctx: BnnContext): BnnRuleCard[] {
  const visible = ctx.planets.filter(p => !OUTER.includes(p.name));
  const ctxVisible: BnnContext = { ...ctx, planets: visible };
  const cards: BnnRuleCard[] = [];

  for (const rule of RULES) {
    for (const planet of visible) {
      if (rule.match(planet, ctxVisible)) {
        const conj = conjuncts(planet, visible);
        const context = `H${planet.house}${conj.length ? ` w/ ${conj.join(', ')}` : ''}`;
        cards.push({ id: rule.id, planet: planet.name, context, theme: rule.theme(planet) });
      }
    }
  }
  return cards;
}
