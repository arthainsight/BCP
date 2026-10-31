import { combustionOf } from './combustion';
import { EXALTATION, NATURAL_ENEMIES, OWN_SIGNS } from './dignity';
import { strongestOf } from './jaiminiRasiDashas';
import { strongerGraha, toJaiminiChart, type Graha } from './jaiminiStrength';
import { buildDashaSubPeriods, type NakshatraDashaDefinition, type NakshatraDashaEntry } from './nakshatraDasha';
import { SIGN_LORDS, signName } from './signs';
import { addDashaYears } from './time';

/**
 * The Paiṇḍī and Aṃśī daśās of BPHS 46.201–202: the daśā of each of the seven grahas is as long as the span of life it gives, the Piṇḍāyu (43.5–11) or the
 * Aṃśāyu (43.18–22). The Naisargikā is the Naisargika daśā of the app (43.16–17). The first daśā is that of the strongest of the Lagna, the Sun and the
 * Moon, then the grahas in the angles from it and so on, by strength (46.202).
 *
 * How the text was read where it leaves points open (docs/ayurdaya-vs-sources.md): the Lagna has no row of its own; a graha's reductions are taken one
 * after another and, when two or more apply, the loss is halved (43.22); the retrograde are excepted from the loss of a third in an enemy's sign (43.9,
 * the Sanskrit); 43.11–13 (one graha in a sign, the Lagna's degrees) are not applied.
 */
export type AyurdayaKind = 'paindi' | 'amshi';

export interface AyurdayaPlanet { name: string; sign: number; degree: number; longitude: number; isRetrograde?: boolean }

/** The Piṇḍāyu of a graha in its exaltation sign (43.6–7): Sun 19, Moon 25, Mars 15, Mercury 12, Jupiter 15, Venus 21, Saturn 20. */
export const PINDA_YEARS: Record<string, number> = { Sun: 19, Moon: 25, Mars: 15, Mercury: 12, Jupiter: 15, Venus: 21, Saturn: 20 };
/** The deepest debilitation points, in degrees of longitude. */
const DEBILITATION_POINT: Record<string, number> = { Sun: 190, Moon: 213, Mars: 118, Mercury: 345, Jupiter: 275, Venus: 177, Saturn: 20 };
const MALEFICS = new Set(['Sun', 'Mars', 'Saturn']);
/** The share lost by a graha in the 12th, 11th, 10th, 9th, 8th and 7th house from the Lagna (43.10). */
const HOUSE_LOSS: Record<number, number> = { 12: 1, 11: 1 / 2, 10: 1 / 3, 9: 1 / 4, 8: 1 / 5, 7: 1 / 6 };
const GRAHAS = Object.keys(PINDA_YEARS);

const norm360 = (value: number) => ((value % 360) + 360) % 360;
const NAVAMSHA = 360 / 108;

export interface AyurdayaYears { graha: string; years: number; steps: string[] }

/** The reductions of 43.9–10 as shares lost, with what they were. */
function reductions(planet: AyurdayaPlanet, ascendantSign: number, sunLongitude: number | null): { share: number; why: string }[] {
  const found: { share: number; why: string }[] = [];
  const combust = sunLongitude !== null && planet.name !== 'Venus' && planet.name !== 'Saturn' && combustionOf(planet.name, planet.longitude, sunLongitude, planet.isRetrograde === true);
  if (combust) found.push({ share: 1 / 2, why: 'combust: half is lost (43.9)' });
  const lord = SIGN_LORDS[planet.sign - 1];
  if (planet.isRetrograde !== true && NATURAL_ENEMIES[planet.name]?.includes(lord)) found.push({ share: 1 / 3, why: `in the sign of an enemy, ${lord}: a third is lost (43.9)` });
  const house = ((planet.sign - ascendantSign + 12) % 12) + 1;
  const loss = HOUSE_LOSS[house];
  if (loss) {
    const share = MALEFICS.has(planet.name) ? loss : loss / 2;
    found.push({ share, why: `in the ${house}th house, ${MALEFICS.has(planet.name) ? 'a malefic' : 'a benefic'}: ${Math.round(share * 1000) / 10} % is lost (43.10)` });
  }
  return found;
}

function reduce(years: number, found: { share: number; why: string }[], steps: string[]): number {
  if (found.length === 0) return years;
  let kept = 1;
  for (const item of found) { kept *= 1 - item.share; steps.push(item.why); }
  let loss = 1 - kept;
  if (found.length >= 2) { loss /= 2; steps.push('two reductions: half of the loss (43.22)'); }
  return years * (1 - loss);
}

/** The Piṇḍāyu of a graha (43.6–11). */
export function pindaYears(planet: AyurdayaPlanet, ascendantSign: number, sunLongitude: number | null): AyurdayaYears {
  const full = PINDA_YEARS[planet.name];
  const steps: string[] = [];
  let arc = norm360(planet.longitude - DEBILITATION_POINT[planet.name]);
  if (arc > 180) arc = 360 - arc;
  // 43.7: the whole in the exaltation sign, a half at the debilitation point, in between by proportion.
  const base = full * (1 / 2 + arc / 360);
  steps.push(`${full} y at exaltation, half at the debilitation point; ${Math.round(arc * 100) / 100}° from it → ${Math.round(base * 1000) / 1000} y`);
  return { graha: planet.name, years: reduce(base, reductions(planet, ascendantSign, sunLongitude), steps), steps };
}

/** The sign of the drekkāṇa of a longitude: the sign itself, its 5th and its 9th for the three parts. */
function drekkanaSign(sign: number, degree: number): number {
  return ((sign - 1 + Math.floor(degree / 10) * 4) % 12) + 1;
}

/** The Aṃśāyu of a graha (43.18–22). */
export function amshaYears(planet: AyurdayaPlanet, ascendantSign: number, sunLongitude: number | null): AyurdayaYears {
  const steps: string[] = [];
  const count = norm360(planet.longitude) / NAVAMSHA;
  const base = count % 12;
  steps.push(`navāṁśa number ${Math.round(count * 1000) / 1000} from Aries, modulo 12 → ${Math.round(base * 1000) / 1000} y (43.19)`);
  const navamshaSign = Math.floor(count) % 12 + 1;
  const strongPlace = EXALTATION[planet.name] === planet.sign || OWN_SIGNS[planet.name]?.includes(planet.sign) === true;
  const goodPlace = SIGN_LORDS[navamshaSign - 1] === planet.name || SIGN_LORDS[drekkanaSign(planet.sign, planet.degree) - 1] === planet.name || navamshaSign === planet.sign;
  const factor = strongPlace ? 3 : goodPlace ? 2 : 1;
  if (factor > 1) steps.push(`${strongPlace ? 'in its exaltation or own sign' : 'in its own navāṁśa or drekkāṇa, or Vargottama'}: ${factor} times (43.21–22)`);
  return { graha: planet.name, years: reduce(base * factor, reductions(planet, ascendantSign, sunLongitude), steps), steps };
}

export interface AyurdayaDasha {
  kind: AyurdayaKind;
  /** The grahas in the order of the daśās with the years of each. */
  definitions: NakshatraDashaDefinition[];
  entries: NakshatraDashaEntry[];
  totalYears: number;
  /** How the order and the years were found, line by line. */
  audit: string[];
}

/** The grahas in the order of 46.202: those of the strongest of the Lagna, Sun and Moon, then by the angles, the 2nd/5th/8th/11th and the rest from its sign. */
export function ayurdayaOrder(planets: AyurdayaPlanet[], ascendantSign: number, audit: string[] = []): string[] {
  const chart = toJaiminiChart(planets, ascendantSign);
  const sun = planets.find(planet => planet.name === 'Sun');
  const moon = planets.find(planet => planet.name === 'Moon');
  const candidates = [(ascendantSign - 1) % 12, ...(sun ? [sun.sign - 1] : []), ...(moon ? [moon.sign - 1] : [])];
  const reference = strongestOf(chart, candidates);
  const lead = [sun, moon].filter(planet => planet && planet.sign - 1 === reference).map(planet => planet!.name as Graha);
  audit.push(`Strongest of the Lagna (${signName(ascendantSign)}), the Sun and the Moon: ${signName(reference + 1)}${lead.length ? ` → ${lead.join(', ')} first` : ' (the Lagna: no graha of its own to begin with)'}`);
  const rank = (grahas: Graha[]) => {
    const remaining = [...grahas];
    const ranked: Graha[] = [];
    while (remaining.length) {
      const best = remaining.reduce((a, b) => strongerGraha(chart, a, b));
      ranked.push(best);
      remaining.splice(remaining.indexOf(best), 1);
    }
    return ranked;
  };
  const order: string[] = [...rank(lead)];
  const houseOf = (planet: AyurdayaPlanet) => ((planet.sign - 1 - reference + 12) % 12) + 1;
  for (const houses of [[1, 4, 7, 10], [2, 5, 8, 11], [3, 6, 9, 12]]) {
    const group = GRAHAS.filter(name => !order.includes(name) && houses.includes(houseOf(planets.find(planet => planet.name === name)!)));
    order.push(...rank(group as Graha[]));
  }
  return order;
}

export function calculateAyurdayaDasha(kind: AyurdayaKind, planets: AyurdayaPlanet[], ascendantSign: number, birthDate: Date): AyurdayaDasha | null {
  const sun = planets.find(planet => planet.name === 'Sun');
  if (!sun || GRAHAS.some(name => !planets.some(planet => planet.name === name))) return null;
  const audit: string[] = [];
  const order = ayurdayaOrder(planets, ascendantSign, audit);
  const years = new Map<string, AyurdayaYears>();
  for (const name of GRAHAS) {
    const planet = planets.find(item => item.name === name)!;
    const result = kind === 'paindi' ? pindaYears(planet, ascendantSign, sun.longitude) : amshaYears(planet, ascendantSign, sun.longitude);
    years.set(name, result);
    audit.push(`${name}: ${result.steps.join('; ')} → ${Math.round(result.years * 1000) / 1000} y`);
  }
  const definitions: NakshatraDashaDefinition[] = order
    .filter(name => (years.get(name)?.years ?? 0) > 1e-9)
    .map(name => ({ key: name.toLowerCase(), name, lord: name, years: years.get(name)!.years }));
  const dropped = order.filter(name => !definitions.some(definition => definition.name === name));
  if (dropped.length) audit.push(`No years, so no daśā: ${dropped.join(', ')}`);
  const entries: NakshatraDashaEntry[] = [];
  let cursor = birthDate;
  for (const definition of definitions) {
    const endDate = addDashaYears(cursor, definition.years);
    entries.push({ ...definition, startDate: cursor, endDate, durationYears: definition.years });
    cursor = endDate;
  }
  audit.push('One round: the daśās end with the last of them (the text gives no cycle)');
  return { kind, definitions, entries, totalYears: definitions.reduce((sum, definition) => sum + definition.years, 0), audit };
}

export function calculateAyurdayaSubDashas(parent: NakshatraDashaEntry, definitions: readonly NakshatraDashaDefinition[]): NakshatraDashaEntry[] {
  return buildDashaSubPeriods(parent, definitions);
}
