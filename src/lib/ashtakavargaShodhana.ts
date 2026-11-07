// Aṣṭakavarga: the reductions (Trikoṇa and Ekādhipatya Śodhana), the Piṇḍas, the Prastāra and the Kakṣyā.
//
// BPHS 67–69 (the Sanskrit text was read for this; docs/ashtakavarga-sources.md has the verses):
//
//  Trikoṇa Śodhana (67.2–5). The signs are taken in the four trines (Aries–Leo–Sagittarius, Taurus–Virgo–Capricorn, Gemini–Libra–
//    Aquarius, Cancer–Scorpio–Pisces). In each trine of a graha's Bhinnāṣṭakavarga: if one of the three signs has no bindu, nothing
//    is done; if all three are equal, all three become nought; otherwise the least of the three is taken from each.
//  Ekādhipatya Śodhana (68.1–6), after the first, for the five grahas that own two signs (Mars, Mercury, Jupiter, Venus, Saturn; the Sun
//    and the Moon own one each, 68.6):
//      – a sign with no bindu: nothing is done;
//      – both signs hold a graha: nothing is done;
//      – both empty: the greater is made equal to the lesser; if they are equal, both become nought;
//      – one holds a graha and the other is empty: if the empty one has the more, it is made equal to the other; if it has the
//        less, or the same, it becomes nought (68.3–5: ग्रहयुक्ते फलैर्हीने ग्रहाभावे फलाधिके | ऊनेन सममन्यस्मिन् …; फलाधिके
//        ग्रहैर्युक्ते चान्यस्मिन् सर्वमुत्सृजेत्; सग्रहाग्रहयोस्तुल्ये सर्वं संशोध्यमग्रहे).
//  Piṇḍa (69.1–4). What is left in each sign (the Śodhita Aṣṭakavarga) is multiplied by the number of its sign (Rāśi Piṇḍa: Aries 7,
//    Taurus 10, Gemini 8, Cancer 4, Leo 10, Virgo 5, Libra 7, Scorpio 8, Sagittarius 9, Capricorn 5, Aquarius 11, Pisces 12); and what
//    is left in the sign of each of the grahas is multiplied by the number of that graha (Graha Piṇḍa: Jupiter 10, Mars 8, Venus 7,
//    Mercury 5, the Sun, the Moon and Saturn 5). The two added are the Śodhya Piṇḍa.
//
// PyJHora does these too, and two things differ from the verses: its Virgo is 6 where the verse says 5 ("मृगकन्ये च पञ्चभिः":
// Capricorn and Virgo by five), and a sign with a graha against an empty one of the same value keeps its bindu where the verse reduces
// the empty one to nought; it also counts the Lagna as a graha in a sign. The 'pyjhora' rules of this module are those, to check the
// rest of the work against it number by number; 'bphs' is the default.
//
// Prastāra and Kakṣyā are not in BPHS 66–69 as such. The Prastāra is the table the Bhinnāṣṭakavarga is made of; the Kakṣyā (the eight
// parts of 3°45′ of a sign, each ruled by a body in the order of the speed of the grahas, Saturn first) is from later teaching and is
// not checked against another program.

import { PARASHARA_AV, VARAHAMIHIRA_AV, buildBhinnaAshtakavarga, mapAshtakavargaHousesToSigns, type AshtakavargaChartLike, type AshtakavargaPlanet, type AshtakavargaSystem } from './ashtakavarga';

export const AV_PLANETS: readonly AshtakavargaPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
export type AvContributor = AshtakavargaPlanet | 'Ascendant';
export const AV_CONTRIBUTORS: readonly AvContributor[] = [...AV_PLANETS, 'Ascendant'];

/** The signs (0 = Aries) each of the grahas that own two owns. */
export const TWO_SIGN_OWNERS: Readonly<Partial<Record<AshtakavargaPlanet, readonly [number, number]>>> = {
  Mars: [0, 7], Mercury: [2, 5], Jupiter: [8, 11], Venus: [1, 6], Saturn: [9, 10],
};

/** The number of each sign for the Rāśi Piṇḍa (BPHS 69.2–3), Aries first. */
export const RASI_MULTIPLIERS_BPHS: readonly number[] = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12];
/** The number of each graha for the Graha Piṇḍa (BPHS 69.4). */
export const GRAHA_MULTIPLIERS: Readonly<Record<AshtakavargaPlanet, number>> = { Sun: 5, Moon: 5, Mars: 8, Mercury: 5, Jupiter: 10, Venus: 7, Saturn: 5 };

export interface ShodhanaRules {
  /** Which bodies make a sign "occupied" in the Ekādhipatya rules. */
  occupants: 'grahas' | 'grahas-and-lagna';
  /** What a sign with a graha and an empty sign of the same value do: the empty one becomes nought (the verse), or both stay (PyJHora). */
  equalOneOccupied: 'vacant-nought' | 'keep';
  rasiMultipliers: readonly number[];
}
export type ShodhanaRulesName = 'bphs' | 'pyjhora';
export const SHODHANA_RULES: Record<ShodhanaRulesName, ShodhanaRules> = {
  bphs: { occupants: 'grahas', equalOneOccupied: 'vacant-nought', rasiMultipliers: RASI_MULTIPLIERS_BPHS },
  pyjhora: { occupants: 'grahas-and-lagna', equalOneOccupied: 'keep', rasiMultipliers: [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12] },
};

export type SignRow = number[]; // twelve numbers, Aries first

/** Trikoṇa Śodhana of one graha's Bhinnāṣṭakavarga (BPHS 67): a copy, the row that was given is not changed. */
export function trikonaShodhana(row: readonly number[]): SignRow {
  const out = [...row];
  for (let r = 0; r < 4; r += 1) {
    const trine = [r, r + 4, r + 8];
    const values = trine.map(sign => out[sign]);
    if (values.some(value => value === 0)) continue; // one sign has no bindu: no reduction
    if (values[0] === values[1] && values[1] === values[2]) {
      for (const sign of trine) out[sign] = 0; // all three alike: all go
    } else {
      const least = Math.min(...values);
      for (const sign of trine) out[sign] -= least;
    }
  }
  return out;
}

/** Ekādhipatya Śodhana of one graha's row, after the Trikoṇa Śodhana (BPHS 68): a copy. `occupied[s]` says whether sign s holds a graha. */
export function ekadhipatyaShodhana(planet: AshtakavargaPlanet, row: readonly number[], occupied: readonly boolean[], rules: ShodhanaRules = SHODHANA_RULES.bphs): SignRow {
  const out = [...row];
  const owned = TWO_SIGN_OWNERS[planet];
  if (!owned) return out; // the Sun and the Moon own one sign each
  const [a, b] = owned;
  if (out[a] === 0 || out[b] === 0) return out;
  if (occupied[a] && occupied[b]) return out;
  if (!occupied[a] && !occupied[b]) {
    if (out[a] === out[b]) { out[a] = 0; out[b] = 0; } else { const least = Math.min(out[a], out[b]); out[a] = least; out[b] = least; }
    return out;
  }
  const [held, empty] = occupied[a] ? [a, b] : [b, a];
  if (out[empty] > out[held]) out[empty] = out[held];
  else if (out[empty] < out[held]) out[empty] = 0;
  else if (rules.equalOneOccupied === 'vacant-nought') out[empty] = 0;
  return out;
}

export interface Shodhana {
  /** Each graha's Bhinnāṣṭakavarga by sign (Aries first), then after the Trikoṇa Śodhana, then after the Ekādhipatya Śodhana (the Śodhita). */
  original: Record<AshtakavargaPlanet, SignRow>;
  afterTrikona: Record<AshtakavargaPlanet, SignRow>;
  sodhita: Record<AshtakavargaPlanet, SignRow>;
  rasiPinda: Record<AshtakavargaPlanet, number>;
  grahaPinda: Record<AshtakavargaPlanet, number>;
  sodhyaPinda: Record<AshtakavargaPlanet, number>;
  /** The signs (0 = Aries) taken as occupied, and the rules that were used. */
  occupied: boolean[];
  rules: ShodhanaRules;
}

const GRAHA_NAMES = [...AV_PLANETS, 'Rahu', 'Ketu'];

/** The bindus of each graha by sign (Aries first), from a chart whose planets carry a sign (1–12) and an ascendant sign. */
export function bhinnaBySign(chart: AshtakavargaChartLike, system: AshtakavargaSystem = 'Parashara'): Record<AshtakavargaPlanet, SignRow> {
  const ascendantSign = chart.ascendant?.sign ?? 1;
  const out = {} as Record<AshtakavargaPlanet, SignRow>;
  for (const row of buildBhinnaAshtakavarga(chart, system)) out[row.planet] = mapAshtakavargaHousesToSigns(row.houses, ascendantSign);
  return out;
}

/** The Śodhana and the Piṇḍas of a chart (BPHS 67–69). Rahu and Ketu make a sign occupied but have no Piṇḍa number. */
export function buildShodhana(chart: AshtakavargaChartLike, system: AshtakavargaSystem = 'Parashara', rules: ShodhanaRules = SHODHANA_RULES.bphs): Shodhana {
  const original = bhinnaBySign(chart, system);
  const signOf = (name: string): number | null => {
    const planet = chart.planets?.find(item => item.name === name);
    if (typeof planet?.sign === 'number') return planet.sign - 1;
    if (typeof planet?.longitude === 'number') return Math.floor((((planet.longitude % 360) + 360) % 360) / 30);
    return null;
  };
  const occupied = new Array<boolean>(12).fill(false);
  for (const name of GRAHA_NAMES) { const sign = signOf(name); if (sign !== null) occupied[sign] = true; }
  if (rules.occupants === 'grahas-and-lagna' && typeof chart.ascendant?.sign === 'number') occupied[chart.ascendant.sign - 1] = true;

  const afterTrikona = {} as Record<AshtakavargaPlanet, SignRow>;
  const sodhita = {} as Record<AshtakavargaPlanet, SignRow>;
  const rasiPinda = {} as Record<AshtakavargaPlanet, number>;
  const grahaPinda = {} as Record<AshtakavargaPlanet, number>;
  const sodhyaPinda = {} as Record<AshtakavargaPlanet, number>;
  for (const planet of AV_PLANETS) {
    afterTrikona[planet] = trikonaShodhana(original[planet]);
    sodhita[planet] = ekadhipatyaShodhana(planet, afterTrikona[planet], occupied, rules);
    rasiPinda[planet] = sodhita[planet].reduce((sum, value, sign) => sum + value * rules.rasiMultipliers[sign], 0);
    grahaPinda[planet] = AV_PLANETS.reduce((sum, graha) => {
      const sign = signOf(graha);
      return sign === null ? sum : sum + GRAHA_MULTIPLIERS[graha] * sodhita[planet][sign];
    }, 0);
    sodhyaPinda[planet] = rasiPinda[planet] + grahaPinda[planet];
  }
  return { original, afterTrikona, sodhita, rasiPinda, grahaPinda, sodhyaPinda, occupied, rules };
}

// ── Prastāra ──────────────────────────────────────────────────────────────────

export interface PrastaraRow {
  contributor: AvContributor;
  /** The sign the contributor stands in (0 = Aries). */
  sign: number;
  /** Whether it gives a bindu in each sign (Aries first). */
  bindu: boolean[];
}
export interface Prastara {
  planet: AshtakavargaPlanet;
  rows: PrastaraRow[];
  /** The bindus in each sign: the Bhinnāṣṭakavarga. */
  totals: SignRow;
}

/** The Prastāra of each graha: for each of the eight contributors, the signs it gives a bindu in. */
export function buildPrastara(chart: AshtakavargaChartLike, system: AshtakavargaSystem = 'Parashara'): Record<AshtakavargaPlanet, Prastara> {
  const tables = system === 'Varahamihira' ? VARAHAMIHIRA_AV : PARASHARA_AV;
  const signOf = (contributor: AvContributor): number => {
    if (contributor === 'Ascendant') return (chart.ascendant?.sign ?? 1) - 1;
    const planet = chart.planets?.find(item => item.name === contributor);
    if (typeof planet?.sign === 'number') return planet.sign - 1;
    return Math.floor((((planet?.longitude ?? 0) % 360) + 360) % 360 / 30);
  };
  const out = {} as Record<AshtakavargaPlanet, Prastara>;
  for (const planet of AV_PLANETS) {
    const rows: PrastaraRow[] = AV_CONTRIBUTORS.map(contributor => {
      const sign = signOf(contributor);
      const houses = tables[planet][contributor];
      return { contributor, sign, bindu: Array.from({ length: 12 }, (_, target) => houses.includes(((target - sign + 12) % 12) + 1)) };
    });
    out[planet] = { planet, rows, totals: Array.from({ length: 12 }, (_, sign) => rows.filter(row => row.bindu[sign]).length) };
  }
  return out;
}

// ── Kakṣyā ──────────────────────────────────────────────────────────────────

/** The bodies that rule the eight kakṣyās of a sign, from its beginning (the order of the speed of the grahas, the slowest first). */
export const KAKSHYA_LORDS: readonly AvContributor[] = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Ascendant'];
export const KAKSHYA_SIZE = 30 / 8;

/** The kakṣyā a longitude is in: its number (0–7), its lord and the degrees it runs from and to inside the sign. */
export function kakshyaOf(longitude: number): { index: number; lord: AvContributor; from: number; to: number; sign: number } {
  const normal = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(normal / 30);
  const index = Math.min(Math.floor((normal - sign * 30) / KAKSHYA_SIZE), 7);
  return { index, lord: KAKSHYA_LORDS[index], from: index * KAKSHYA_SIZE, to: (index + 1) * KAKSHYA_SIZE, sign };
}
