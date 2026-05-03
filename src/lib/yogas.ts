import { PlanetData } from '@/types';

export type YogaStatus = 'active' | 'inactive';
export type YogaCategory = 'solar' | 'moon' | 'raja' | 'dhana' | 'general' | 'pancha-mahapurusha';

export interface YogaResult {
  id: string;
  name: string;
  category: YogaCategory;
  status: YogaStatus;
  referencePlanet: string;
  planetsInvolved: string[];
  rule: string;
  resultText: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ELIGIBLE = new Set(['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']);
const BENEFICS  = new Set(['Jupiter', 'Venus', 'Mercury']);

const SIGN_LORDS: Record<number, string> = {
  1: 'Mars',    2: 'Venus',   3: 'Mercury',  4: 'Moon',
  5: 'Sun',     6: 'Mercury', 7: 'Venus',    8: 'Mars',
  9: 'Jupiter', 10: 'Saturn', 11: 'Saturn',  12: 'Jupiter',
};

const SIGN_NAMES: Record<number, string> = {
  1: 'Aries',       2: 'Taurus',      3: 'Gemini',      4: 'Cancer',
  5: 'Leo',         6: 'Virgo',       7: 'Libra',       8: 'Scorpio',
  9: 'Sagittarius', 10: 'Capricorn',  11: 'Aquarius',   12: 'Pisces',
};

const EXALTATION: Record<string, number> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7,
};

const DEBILITATION: Record<string, number> = {
  Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1,
};

const PANCHA_DEFS: { id: string; name: string; planet: string; ownSigns: number[]; exaltSign: number }[] = [
  { id: 'ruchaka', name: 'Ruchaka', planet: 'Mars',    ownSigns: [1, 8],   exaltSign: 10 },
  { id: 'bhadra',  name: 'Bhadra',  planet: 'Mercury', ownSigns: [3, 6],   exaltSign: 6  },
  { id: 'hamsa',   name: 'Hamsa',   planet: 'Jupiter', ownSigns: [9, 12],  exaltSign: 4  },
  { id: 'malavya', name: 'Malavya', planet: 'Venus',   ownSigns: [2, 7],   exaltSign: 12 },
  { id: 'shasha',  name: 'Shasha',  planet: 'Saturn',  ownSigns: [10, 11], exaltSign: 7  },
];

const TRACKED_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPlanetsInRelativeSign(
  referenceSign: number,
  relativeHouse: number,
  planets: PlanetData[]
): PlanetData[] {
  const targetSign = ((referenceSign - 1 + relativeHouse - 1) % 12) + 1;
  return planets.filter(p => ELIGIBLE.has(p.name) && p.sign === targetSign);
}

function getBeneficsInRelativeSign(referenceSign: number, relativeHouse: number, planets: PlanetData[]): PlanetData[] {
  const targetSign = ((referenceSign - 1 + relativeHouse - 1) % 12) + 1;
  return planets.filter(p => BENEFICS.has(p.name) && p.sign === targetSign);
}

function houseLord(ascSign: number, houseNum: number): string {
  const houseSign = ((ascSign - 1 + houseNum - 1) % 12) + 1;
  return SIGN_LORDS[houseSign];
}

function sn(sign: number): string {
  return SIGN_NAMES[sign] ?? `sign ${sign}`;
}

function ordinal(n: number): string {
  if (n === 11 || n === 12) return `${n}th`;
  const d = n % 10;
  if (d === 1) return `${n}st`;
  if (d === 2) return `${n}nd`;
  if (d === 3) return `${n}rd`;
  return `${n}th`;
}

// ── Main engine ───────────────────────────────────────────────────────────────

export function calculateYogas(planets: PlanetData[], ascendantSign: number): YogaResult[] {
  const results: YogaResult[] = [];

  const sun     = planets.find(p => p.name === 'Sun');
  const moon    = planets.find(p => p.name === 'Moon');
  const jupiter = planets.find(p => p.name === 'Jupiter');

  // ── Solar yogas ──────────────────────────────────────────────────────────

  if (sun) {
    const in12 = getPlanetsInRelativeSign(sun.sign, 12, planets);
    const in2  = getPlanetsInRelativeSign(sun.sign, 2,  planets);

    results.push({
      id: 'vosi', name: 'Vosi', category: 'solar',
      status: in12.length > 0 ? 'active' : 'inactive',
      referencePlanet: 'Sun',
      planetsInvolved: in12.map(p => p.name),
      rule: 'Eligible planets in 12th sign from Sun',
      resultText: in12.length > 0
        ? `${in12.map(p => p.name).join(', ')} in 12th from Sun`
        : 'No eligible planets in 12th from Sun',
    });

    results.push({
      id: 'vesi', name: 'Vesi', category: 'solar',
      status: in2.length > 0 ? 'active' : 'inactive',
      referencePlanet: 'Sun',
      planetsInvolved: in2.map(p => p.name),
      rule: 'Eligible planets in 2nd sign from Sun',
      resultText: in2.length > 0
        ? `${in2.map(p => p.name).join(', ')} in 2nd from Sun`
        : 'No eligible planets in 2nd from Sun',
    });

    const ubhaya = in12.length > 0 && in2.length > 0;
    results.push({
      id: 'ubhayachari', name: 'Ubhayachari', category: 'solar',
      status: ubhaya ? 'active' : 'inactive',
      referencePlanet: 'Sun',
      planetsInvolved: [...new Set([...in12.map(p => p.name), ...in2.map(p => p.name)])],
      rule: 'Eligible planets in both 2nd and 12th sign from Sun',
      resultText: ubhaya
        ? `12th: ${in12.map(p => p.name).join(', ')}; 2nd: ${in2.map(p => p.name).join(', ')}`
        : 'Not both flanks of Sun are occupied',
    });
  }

  // ── Moon yogas ────────────────────────────────────────────────────────────

  if (moon) {
    const in12 = getPlanetsInRelativeSign(moon.sign, 12, planets);
    const in2  = getPlanetsInRelativeSign(moon.sign, 2,  planets);

    results.push({
      id: 'anapha', name: 'Anapha', category: 'moon',
      status: in12.length > 0 ? 'active' : 'inactive',
      referencePlanet: 'Moon',
      planetsInvolved: in12.map(p => p.name),
      rule: 'Eligible planets in 12th sign from Moon',
      resultText: in12.length > 0
        ? `${in12.map(p => p.name).join(', ')} in 12th from Moon`
        : 'No eligible planets in 12th from Moon',
    });

    results.push({
      id: 'sunapha', name: 'Sunapha', category: 'moon',
      status: in2.length > 0 ? 'active' : 'inactive',
      referencePlanet: 'Moon',
      planetsInvolved: in2.map(p => p.name),
      rule: 'Eligible planets in 2nd sign from Moon',
      resultText: in2.length > 0
        ? `${in2.map(p => p.name).join(', ')} in 2nd from Moon`
        : 'No eligible planets in 2nd from Moon',
    });

    const duruw = in12.length > 0 && in2.length > 0;
    results.push({
      id: 'durudhara', name: 'Durudhara', category: 'moon',
      status: duruw ? 'active' : 'inactive',
      referencePlanet: 'Moon',
      planetsInvolved: [...new Set([...in12.map(p => p.name), ...in2.map(p => p.name)])],
      rule: 'Eligible planets in both 2nd and 12th sign from Moon',
      resultText: duruw
        ? `12th: ${in12.map(p => p.name).join(', ')}; 2nd: ${in2.map(p => p.name).join(', ')}`
        : 'Not both flanks of Moon are occupied',
    });

    const kema = in12.length === 0 && in2.length === 0;
    results.push({
      id: 'kemadruma', name: 'Kemadruma', category: 'moon',
      status: kema ? 'active' : 'inactive',
      referencePlanet: 'Moon',
      planetsInvolved: [],
      rule: 'No eligible planets in 2nd or 12th sign from Moon',
      resultText: kema
        ? 'Moon unattended — no eligible planets in 2nd or 12th'
        : `Moon flanked by: ${[...in12.map(p => p.name), ...in2.map(p => p.name)].join(', ')}`,
    });
  }

  // ── Raja-type yogas ───────────────────────────────────────────────────────

  // Mukuta: Jupiter in Kendra AND Moon in Trikona from Lagna
  if (jupiter && moon) {
    const jupKendra  = [1, 4, 7, 10].includes(jupiter.house);
    const moonTrikona = [1, 5, 9].includes(moon.house);
    const mukuta = jupKendra && moonTrikona;
    results.push({
      id: 'mukuta', name: 'Mukuta', category: 'raja',
      status: mukuta ? 'active' : 'inactive',
      referencePlanet: 'Jupiter, Moon',
      planetsInvolved: mukuta ? ['Jupiter', 'Moon'] : [],
      rule: 'Jupiter in Kendra (1/4/7/10) from Lagna AND Moon in Trikona (1/5/9)',
      resultText: mukuta
        ? `Jupiter in house ${jupiter.house} (Kendra), Moon in house ${moon.house} (Trikona)`
        : jupKendra
          ? `Jupiter in Kendra but Moon in house ${moon.house} (not Trikona)`
          : `Jupiter in house ${jupiter.house} (not Kendra)`,
    });
  }

  // Raja Yoga: lord of Kendra + lord of Trikona conjunct
  {
    const kendraLords  = [1, 4, 7, 10].map(h => houseLord(ascendantSign, h));
    const trikonaLords = [1, 5, 9].map(h => houseLord(ascendantSign, h));
    const pairs = new Map<string, { kl: string; tl: string; sign: number }>();

    for (const kl of new Set(kendraLords)) {
      for (const tl of new Set(trikonaLords)) {
        if (kl === tl) continue;
        const klP = planets.find(p => p.name === kl);
        const tlP = planets.find(p => p.name === tl);
        if (klP && tlP && klP.sign === tlP.sign) {
          const key = [kl, tl].sort().join('|');
          if (!pairs.has(key)) pairs.set(key, { kl, tl, sign: klP.sign });
        }
      }
    }

    const found = [...pairs.values()];
    const rajaActive = found.length > 0;
    results.push({
      id: 'raja', name: 'Raja', category: 'raja',
      status: rajaActive ? 'active' : 'inactive',
      referencePlanet: 'Kendra/Trikona lords',
      planetsInvolved: [...new Set(found.flatMap(f => [f.kl, f.tl]))],
      rule: 'Lord of a Kendra house and lord of a Trikona house are conjunct (same sign)',
      resultText: rajaActive
        ? found.map(f => `${f.kl} + ${f.tl} in ${sn(f.sign)}`).join('; ')
        : 'No Kendra lord and Trikona lord are in the same sign',
    });
  }

  // Sakata: Moon in 6th or 8th sign from Jupiter
  if (moon && jupiter) {
    const relPos = ((moon.sign - jupiter.sign + 12) % 12) + 1;
    const sakata = relPos === 6 || relPos === 8;
    results.push({
      id: 'sakata', name: 'Sakata', category: 'moon',
      status: sakata ? 'active' : 'inactive',
      referencePlanet: 'Jupiter, Moon',
      planetsInvolved: sakata ? ['Jupiter', 'Moon'] : [],
      rule: 'Moon in 6th or 8th sign from Jupiter',
      resultText: sakata
        ? `Moon is in the ${ordinal(relPos)} sign from Jupiter`
        : `Moon is in the ${ordinal(relPos)} sign from Jupiter (not 6th or 8th)`,
    });
  }

  // ── Dhana yoga ────────────────────────────────────────────────────────────

  {
    const lord2  = houseLord(ascendantSign, 2);
    const lord11 = houseLord(ascendantSign, 11);
    const lord2P  = planets.find(p => p.name === lord2);
    const lord11P = planets.find(p => p.name === lord11);

    let dhanaActive: boolean;
    let dhanaText: string;

    if (lord2 === lord11) {
      dhanaActive = !!lord2P;
      dhanaText = dhanaActive
        ? `${lord2} rules both 2nd and 11th — concentrated in ${sn(lord2P!.sign)}`
        : `${lord2} rules both 2nd and 11th but not found in chart`;
    } else {
      dhanaActive = !!lord2P && !!lord11P && lord2P.sign === lord11P.sign;
      dhanaText = dhanaActive
        ? `${lord2} (2nd lord) and ${lord11} (11th lord) conjunct in ${sn(lord2P!.sign)}`
        : `${lord2} (2nd lord) in ${lord2P ? sn(lord2P.sign) : '?'}, ${lord11} (11th lord) in ${lord11P ? sn(lord11P.sign) : '?'}`;
    }

    results.push({
      id: 'dhana', name: 'Dhana', category: 'dhana',
      status: dhanaActive ? 'active' : 'inactive',
      referencePlanet: '2nd and 11th lords',
      planetsInvolved: dhanaActive ? (lord2 === lord11 ? [lord2] : [lord2, lord11]) : [],
      rule: 'Lord of 2nd house and lord of 11th house are conjunct (same sign)',
      resultText: dhanaText,
    });
  }

  // ── More Moon yogas ───────────────────────────────────────────────────────

  // Chandra: Moon in Kendra from Lagna
  if (moon) {
    const chandra = [1, 4, 7, 10].includes(moon.house);
    results.push({
      id: 'chandra', name: 'Chandra', category: 'moon',
      status: chandra ? 'active' : 'inactive',
      referencePlanet: 'Moon',
      planetsInvolved: chandra ? ['Moon'] : [],
      rule: 'Moon in a Kendra house (1st, 4th, 7th, or 10th) from Lagna',
      resultText: chandra
        ? `Moon in house ${moon.house} (Kendra)`
        : `Moon in house ${moon.house} (not a Kendra)`,
    });
  }

  // Adhi: benefics (Jupiter, Venus, Mercury) in all three of 6th, 7th, 8th from Moon
  if (moon) {
    const b6 = getBeneficsInRelativeSign(moon.sign, 6, planets);
    const b7 = getBeneficsInRelativeSign(moon.sign, 7, planets);
    const b8 = getBeneficsInRelativeSign(moon.sign, 8, planets);
    const adhi = b6.length > 0 && b7.length > 0 && b8.length > 0;
    const allB = [...new Set([...b6, ...b7, ...b8].map(p => p.name))];

    const missingPositions = [
      ...(b6.length === 0 ? ['6th'] : []),
      ...(b7.length === 0 ? ['7th'] : []),
      ...(b8.length === 0 ? ['8th'] : []),
    ];

    results.push({
      id: 'adhi', name: 'Adhi', category: 'general',
      status: adhi ? 'active' : 'inactive',
      referencePlanet: 'Moon',
      planetsInvolved: adhi ? allB : [],
      rule: 'Natural benefics (Jupiter, Venus, Mercury) in all of 6th, 7th, 8th signs from Moon',
      resultText: adhi
        ? `6th: ${b6.map(p => p.name).join(', ')}; 7th: ${b7.map(p => p.name).join(', ')}; 8th: ${b8.map(p => p.name).join(', ')}`
        : `No benefic in ${missingPositions.join(', ')} from Moon`,
    });
  }

  // ── Uttama / Sama / Adhama ────────────────────────────────────────────────

  {
    const exalted     = planets.filter(p => TRACKED_PLANETS.includes(p.name) && EXALTATION[p.name] === p.sign);
    const debilitated = planets.filter(p => TRACKED_PLANETS.includes(p.name) && DEBILITATION[p.name] === p.sign);

    results.push({
      id: 'uttama', name: 'Uttama', category: 'general',
      status: exalted.length >= 3 ? 'active' : 'inactive',
      referencePlanet: '—',
      planetsInvolved: exalted.map(p => p.name),
      rule: '3 or more planets in their exaltation signs',
      resultText: exalted.length >= 3
        ? `Exalted: ${exalted.map(p => `${p.name} (${sn(p.sign)})`).join(', ')}`
        : `${exalted.length} exalted planet${exalted.length !== 1 ? 's' : ''} — need 3+`,
    });

    const sama = exalted.length >= 1 && debilitated.length >= 1 && exalted.length === debilitated.length;
    results.push({
      id: 'sama', name: 'Sama', category: 'general',
      status: sama ? 'active' : 'inactive',
      referencePlanet: '—',
      planetsInvolved: sama ? [...exalted.map(p => p.name), ...debilitated.map(p => p.name)] : [],
      rule: 'Equal number of exalted and debilitated planets (both ≥ 1)',
      resultText: sama
        ? `${exalted.length} exalted (${exalted.map(p => p.name).join(', ')}), ${debilitated.length} debilitated (${debilitated.map(p => p.name).join(', ')})`
        : `Exalted: ${exalted.length}, Debilitated: ${debilitated.length} — not equal`,
    });

    results.push({
      id: 'adhama', name: 'Adhama', category: 'general',
      status: debilitated.length >= 3 ? 'active' : 'inactive',
      referencePlanet: '—',
      planetsInvolved: debilitated.map(p => p.name),
      rule: '3 or more planets in their debilitation signs',
      resultText: debilitated.length >= 3
        ? `Debilitated: ${debilitated.map(p => `${p.name} (${sn(p.sign)})`).join(', ')}`
        : `${debilitated.length} debilitated planet${debilitated.length !== 1 ? 's' : ''} — need 3+`,
    });
  }

  // ── Pancha Mahapurusha yogas ──────────────────────────────────────────────

  for (const pm of PANCHA_DEFS) {
    const p = planets.find(pl => pl.name === pm.planet);
    if (!p) continue;
    const inQualSign = pm.ownSigns.includes(p.sign) || p.sign === pm.exaltSign;
    const inKendra   = [1, 4, 7, 10].includes(p.house);
    const active     = inQualSign && inKendra;
    const signQuality = p.sign === pm.exaltSign ? 'exaltation' : 'own sign';

    results.push({
      id: pm.id, name: pm.name, category: 'pancha-mahapurusha',
      status: active ? 'active' : 'inactive',
      referencePlanet: pm.planet,
      planetsInvolved: active ? [pm.planet] : [],
      rule: `${pm.planet} in own or exaltation sign AND in Kendra (1/4/7/10) from Lagna`,
      resultText: active
        ? `${pm.planet} in ${sn(p.sign)} (${signQuality}), house ${p.house}`
        : !inQualSign
          ? `${pm.planet} in ${sn(p.sign)} — not own or exaltation sign`
          : `${pm.planet} in ${sn(p.sign)} (${signQuality}) but in house ${p.house} — not Kendra`,
    });
  }

  return results;
}
