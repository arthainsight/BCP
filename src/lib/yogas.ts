import { PlanetData } from '@/types';
import { getRashiAspectSigns } from '@/lib/drishti';
import { normalizeDegrees } from '@/lib/angles';
import { signLord, signName } from '@/lib/signs';
import { dynamicBeneficStatus } from '@/lib/yogaCommon';
import { calculateClassicalYogas } from '@/lib/yogasClassical';
import { calculateBphsYogas } from '@/lib/yogasBphs';

export type YogaStatus = 'active' | 'inactive';
export type YogaCategory = 'solar' | 'moon' | 'raja' | 'dhana' | 'general' | 'pancha-mahapurusha' | 'nabhasa';

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

const PANCHA_DEFS: { id: string; name: string; planet: string; ownSigns: number[]; exaltSign: number }[] = [
  { id: 'ruchaka', name: 'Ruchaka', planet: 'Mars',    ownSigns: [1, 8],   exaltSign: 10 },
  { id: 'bhadra',  name: 'Bhadra',  planet: 'Mercury', ownSigns: [3, 6],   exaltSign: 6  },
  { id: 'hamsa',   name: 'Hamsa',   planet: 'Jupiter', ownSigns: [9, 12],  exaltSign: 4  },
  { id: 'malavya', name: 'Malavya', planet: 'Venus',   ownSigns: [2, 7],   exaltSign: 12 },
  { id: 'shasha',  name: 'Shasha',  planet: 'Saturn',  ownSigns: [10, 11], exaltSign: 7  },
];

const BENEFIC_CANDIDATES = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
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
  return signLord(houseSign);
}

function sn(sign: number): string {
  return signName(sign) ?? `sign ${sign}`;
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

    // Kemadruma (BPHS 37.11-13): no planet with the Moon or in the 2nd or 12th from it. The Sun, the Moon and the nodes are
    // not counted. The texts cancel it by a planet in a Kendra from the Lagna (BPHS) or from the Moon (Saravali and others):
    // then the row below, Kemadruma Bhanga, holds instead of Kemadruma, so the two never hold together. The other
    // cancellations the texts give (a full Moon, the Moon aspected by Jupiter or Venus) are not applied.
    const withMoon = planets.filter(p => ELIGIBLE.has(p.name) && p.sign === moon.sign);
    const lonely = in12.length === 0 && in2.length === 0 && withMoon.length === 0;
    const inKendraFrom = (from: number) => planets.filter(p => ELIGIBLE.has(p.name) && [1, 4, 7, 10].includes(((p.sign - from + 12) % 12) + 1));
    const kendraFromLagna = inKendraFrom(ascendantSign);
    const kendraFromMoon = inKendraFrom(moon.sign);
    const cancelled = lonely && (kendraFromLagna.length > 0 || kendraFromMoon.length > 0);
    const kema = lonely && !cancelled;
    results.push({
      id: 'kemadruma', name: 'Kemadruma', category: 'moon',
      status: kema ? 'active' : 'inactive',
      referencePlanet: 'Moon',
      planetsInvolved: [],
      rule: 'No planet but the Sun with the Moon or in the 2nd or 12th sign from it, and none in a Kendra from the Lagna or from the Moon (BPHS 37.11-13; the Sun, Moon and nodes do not count)',
      resultText: kema
        ? 'Moon unattended — no planet with it or in the 2nd or 12th from it, none in a Kendra from the Lagna or the Moon'
        : withMoon.length > 0
          ? `Moon is joined by: ${withMoon.map(p => p.name).join(', ')}`
          : in12.length > 0 || in2.length > 0
            ? `Moon flanked by: ${[...in12.map(p => p.name), ...in2.map(p => p.name)].join(', ')}`
            : `Kemadruma cancelled by a planet in a Kendra: ${[...new Set([...kendraFromLagna, ...kendraFromMoon].map(p => p.name))].join(', ')}`,
    });

    results.push({
      id: 'kemadruma-bhanga', name: 'Kemadruma Bhanga', category: 'moon',
      status: cancelled ? 'active' : 'inactive',
      referencePlanet: 'Moon',
      planetsInvolved: cancelled ? [...new Set([...kendraFromLagna, ...kendraFromMoon].map(p => p.name))] : [],
      rule: 'The Moon stands alone (nothing with it or in the 2nd or 12th from it) but a planet is in a Kendra from the Lagna or from the Moon: Kemadruma is cancelled',
      resultText: cancelled
        ? [...(kendraFromLagna.length ? [`${kendraFromLagna.map(p => p.name).join(', ')} in a Kendra from the Lagna`] : []), ...(kendraFromMoon.length ? [`${kendraFromMoon.map(p => p.name).join(', ')} in a Kendra from the Moon`] : [])].join('; ')
        : 'No Kemadruma to cancel',
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

  // ── Varishta / Sama / Adhama (BPHS 37.1) ──────────────────────────────────────────────────────────────────────────
  // The Moon's place from the Sun: in a Kendra (1, 4, 7, 10) the lowest, Adhama; in a Panaphara (2, 5, 8, 11) the middle,
  // Sama; in an Apoklima (3, 6, 9, 12) the best (called Uttama in some books, Varishta here). Exactly one of the three always
  // holds, because every place from the Sun is one of the three groups. Before v3.01 the app used the id uttama for a
  // different reading (three exalted planets), which has no classical source.

  if (sun && moon) {
    const fromSun = ((moon.sign - sun.sign + 12) % 12) + 1;
    const kind = [1, 4, 7, 10].includes(fromSun) ? 'Kendra' : [2, 5, 8, 11].includes(fromSun) ? 'Panaphara' : 'Apoklima';
    for (const [id, name, wanted, rule] of [
      ['varishta', 'Varishta', 'Apoklima', 'The Moon in an Apoklima (3rd, 6th, 9th or 12th sign) from the Sun, the best of the three (BPHS 37.1; some books call it Uttama). Exactly one of Varishta, Sama and Adhama always holds'],
      ['sama', 'Sama', 'Panaphara', 'The Moon in a Panaphara (2nd, 5th, 8th or 11th sign) from the Sun (BPHS 37.1). Exactly one of Varishta, Sama and Adhama always holds'],
      ['adhama', 'Adhama', 'Kendra', 'The Moon in a Kendra (1st, 4th, 7th or 10th sign) from the Sun, the lowest of the three (BPHS 37.1). Exactly one of Varishta, Sama and Adhama always holds'],
    ] as const) {
      results.push({
        id, name, category: 'general',
        status: kind === wanted ? 'active' : 'inactive',
        referencePlanet: 'Sun, Moon',
        planetsInvolved: kind === wanted ? ['Sun', 'Moon'] : [],
        rule,
        resultText: `Moon in ${ordinal(fromSun)} from Sun (${kind})`,
      });
    }
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

  // ── Amala Yoga ───────────────────────────────────────────────────────────────
  // Natural benefic in 10th house from Lagna

  {
    const in10thLagna = planets.filter(p =>
      BENEFIC_CANDIDATES.includes(p.name) &&
      p.house === 10 &&
      dynamicBeneficStatus(p.name, planets) === true
    );
    results.push({
      id: 'amala-lagna', name: 'Amala (from Lagna)', category: 'general',
      status: in10thLagna.length > 0 ? 'active' : 'inactive',
      referencePlanet: 'Lagna',
      planetsInvolved: in10thLagna.map(p => p.name),
      rule: 'Natural benefic in 10th house from Lagna',
      resultText: in10thLagna.length > 0
        ? `${in10thLagna.map(p => p.name).join(', ')} in 10th from Lagna`
        : 'No benefic in 10th house from Lagna',
    });
  }

  // Natural benefic in 10th sign from Moon
  if (moon) {
    const tenth = ((moon.sign - 1 + 9) % 12) + 1;
    const in10thMoon = planets.filter(p =>
      BENEFIC_CANDIDATES.includes(p.name) &&
      p.name !== 'Moon' &&
      p.sign === tenth &&
      dynamicBeneficStatus(p.name, planets) === true
    );
    results.push({
      id: 'amala-moon', name: 'Amala (from Moon)', category: 'general',
      status: in10thMoon.length > 0 ? 'active' : 'inactive',
      referencePlanet: 'Moon',
      planetsInvolved: in10thMoon.map(p => p.name),
      rule: 'Natural benefic in 10th sign from Moon',
      resultText: in10thMoon.length > 0
        ? `${in10thMoon.map(p => p.name).join(', ')} in 10th from Moon (${sn(tenth)})`
        : `No benefic in 10th from Moon (${sn(tenth)})`,
    });
  }

  // ── Budha Aditya Yoga ─────────────────────────────────────────────────────
  // Sun and Mercury in same sign

  if (sun) {
    const mercury = planets.find(p => p.name === 'Mercury');
    if (mercury) {
      const conjunct = sun.sign === mercury.sign;
      const angDist  = (() => {
        const d = Math.abs(normalizeDegrees(mercury.longitude - sun.longitude));
        return d > 180 ? 360 - d : d;
      })();
      const combust = angDist < 14;

      let text: string;
      if (conjunct) {
        text = `Sun and Mercury in ${sn(sun.sign)}`;
        if (combust) text += ` — Mercury combust (${angDist.toFixed(1)}° from Sun)`;
      } else {
        text = `Sun in ${sn(sun.sign)}, Mercury in ${sn(mercury.sign)} — not conjunct`;
      }

      results.push({
        id: 'budha-aditya', name: 'Budha Aditya', category: 'general',
        status: conjunct ? 'active' : 'inactive',
        referencePlanet: 'Sun, Mercury',
        planetsInvolved: conjunct ? ['Sun', 'Mercury'] : [],
        rule: 'Sun and Mercury conjunct in same sign',
        resultText: text,
      });
    }
  }

  // ── Chandra Mangala Yoga ──────────────────────────────────────────────────
  // Moon and Mars conjunct OR mutually aspecting (rāśi aspect)

  if (moon) {
    const mars = planets.find(p => p.name === 'Mars');
    if (mars) {
      const conjunct      = moon.sign === mars.sign;
      const mutualAspect  = !conjunct && getRashiAspectSigns(moon.sign).includes(mars.sign);
      const active        = conjunct || mutualAspect;

      results.push({
        id: 'chandra-mangala', name: 'Chandra Mangala', category: 'moon',
        status: active ? 'active' : 'inactive',
        referencePlanet: 'Moon, Mars',
        planetsInvolved: active ? ['Moon', 'Mars'] : [],
        rule: 'Moon and Mars conjunct or mutually aspect (rāśi aspect)',
        resultText: conjunct
          ? `Moon and Mars conjunct in ${sn(moon.sign)}`
          : mutualAspect
            ? `Moon (${sn(moon.sign)}) and Mars (${sn(mars.sign)}) mutually aspect`
            : `Moon (${sn(moon.sign)}) and Mars (${sn(mars.sign)}) — no conjunction or mutual aspect`,
      });
    }
  }

  // ── Susubha Yoga ──────────────────────────────────────────────────────────
  // Natural benefics occupy or aspect Lagna by rāśi aspect

  {
    const lagnaSign     = ascendantSign;
    const aspectLagna   = getRashiAspectSigns(lagnaSign);

    const inLagna = planets.filter(p =>
      BENEFIC_CANDIDATES.includes(p.name) &&
      p.sign === lagnaSign &&
      dynamicBeneficStatus(p.name, planets) === true
    );
    const aspectingBenefics = planets.filter(p =>
      BENEFIC_CANDIDATES.includes(p.name) &&
      aspectLagna.includes(p.sign) &&
      dynamicBeneficStatus(p.name, planets) === true
    );

    const allNames = [...new Set([...inLagna.map(p => p.name), ...aspectingBenefics.map(p => p.name)])];
    const active   = allNames.length > 0;

    const parts: string[] = [];
    if (inLagna.length > 0)           parts.push(`${inLagna.map(p => p.name).join(', ')} in Lagna`);
    if (aspectingBenefics.length > 0) parts.push(`${aspectingBenefics.map(p => p.name).join(', ')} aspecting Lagna`);

    results.push({
      id: 'susubha', name: 'Susubha', category: 'general',
      status: active ? 'active' : 'inactive',
      referencePlanet: 'Lagna',
      planetsInvolved: allNames,
      rule: 'Natural benefics in Lagna or casting rāśi aspect on Lagna',
      resultText: active ? parts.join('; ') : 'No benefic occupies or aspects Lagna',
    });
  }

  // ── Yogas of the classical texts: the Nabhasa yogas and a set of single yogas (yogasClassical.ts) ──

  results.push(...calculateClassicalYogas(planets, ascendantSign));
  results.push(...calculateBphsYogas(planets, ascendantSign));

  // ── Pending definitions ───────────────────────────────────────────────────
  // Amara, Dhvaja, Muni have multiple conflicting definitions across traditions.
  // These are stubs — do not activate until exact rules are confirmed.

  results.push({
    id: 'amara', name: 'Amara', category: 'general',
    status: 'inactive',
    referencePlanet: '—',
    planetsInvolved: [],
    rule: 'Definition pending — exact rule required',
    resultText: 'Definition pending — exact rule required',
  });

  results.push({
    id: 'dhvaja', name: 'Dhvaja', category: 'general',
    status: 'inactive',
    referencePlanet: '—',
    planetsInvolved: [],
    rule: 'Definition pending — exact rule required',
    resultText: 'Definition pending — exact rule required',
  });

  results.push({
    id: 'muni', name: 'Muni', category: 'general',
    status: 'inactive',
    referencePlanet: '—',
    planetsInvolved: [],
    rule: 'Definition pending — exact rule required',
    resultText: 'Definition pending — exact rule required',
  });

  return results;
}
