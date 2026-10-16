import { addDashaYears } from './time';
import type { NakshatraDashaDefinition, NakshatraDashaEntry } from './nakshatraDasha';
import type { PlanetData } from '@/types';

/**
 * Naisargika (natural) daśā. The periods run in the order of the natural strength of the grahas, from the Moon to Saturn, and
 * then the Lagna: Moon 1, Mars 2, Mercury 9, Venus 20, Jupiter 18, Sun 20, Saturn 50 years (the years BPHS 46 gives as the
 * Nisargayu of the seven) and the Lagna 12, which Saravali 47 puts last and JHora counts, 132 years in all. The first period
 * begins at birth with no balance, whatever the nakṣatra of the Moon.
 *
 * The antardaśās (and the periods inside them) are the way of JHora: the periods of a daśā are those of the grahas that stand
 * in the 1st, 4th, 7th, 10th, 2nd, 5th, 8th, 11th, 3rd, 6th, 9th and 12th sign from the sign of its lord, in that order (the
 * grahas of one sign in the order Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn), each an equal share of the daśā. The
 * lord of the daśā has none of its own, and Rahu and Ketu none. A daśā of the Lagna counts from the Lagna's sign and has all
 * seven grahas. BPHS gives no antardaśās for it.
 */
export const NAISARGIKA_DEFINITIONS: readonly NakshatraDashaDefinition[] = [
  { key: 'moon', name: 'Moon', lord: 'Moon', years: 1 },
  { key: 'mars', name: 'Mars', lord: 'Mars', years: 2 },
  { key: 'mercury', name: 'Mercury', lord: 'Mercury', years: 9 },
  { key: 'venus', name: 'Venus', lord: 'Venus', years: 20 },
  { key: 'jupiter', name: 'Jupiter', lord: 'Jupiter', years: 18 },
  { key: 'sun', name: 'Sun', lord: 'Sun', years: 20 },
  { key: 'saturn', name: 'Saturn', lord: 'Saturn', years: 50 },
  { key: 'lagna', name: 'Lagna', lord: 'Lagna', years: 12 },
];

export const NAISARGIKA_TOTAL_YEARS = NAISARGIKA_DEFINITIONS.reduce((sum, definition) => sum + definition.years, 0);

/** The houses, counted from the sign of the lord of a daśā, whose grahas give its periods, in order. */
export const NAISARGIKA_HOUSE_ORDER = [1, 4, 7, 10, 2, 5, 8, 11, 3, 6, 9, 12] as const;
/** The grahas of one sign are taken in this order. */
const GRAHA_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

/** The mahādaśās, one cycle of 132 years from birth. */
export function calculateNaisargika(birthDate: Date): { entries: NakshatraDashaEntry[] } {
  const entries: NakshatraDashaEntry[] = [];
  let cursor = birthDate;
  for (const definition of NAISARGIKA_DEFINITIONS) {
    const endDate = addDashaYears(cursor, definition.years);
    entries.push({ ...definition, startDate: cursor, endDate, durationYears: definition.years });
    cursor = endDate;
  }
  return { entries };
}

/**
 * The periods inside a daśā of any level: the grahas of the signs counted from the sign of the lord, an equal share each.
 * Without the lord (a chart that lacks the graha) there are none.
 */
export function calculateNaisargikaSubDashas(parent: NakshatraDashaEntry, planets: PlanetData[], ascendantSign: number): NakshatraDashaEntry[] {
  const anchor = parent.lord === 'Lagna' ? ascendantSign : planets.find(planet => planet.name === parent.lord)?.sign;
  if (anchor === undefined) return [];
  const lords: string[] = [];
  for (const house of NAISARGIKA_HOUSE_ORDER) {
    const sign = ((anchor - 1 + house - 1) % 12) + 1;
    for (const name of GRAHA_ORDER) {
      const planet = planets.find(item => item.name === name);
      if (planet && planet.sign === sign && name !== parent.lord) lords.push(name);
    }
  }
  const durationYears = parent.durationYears / lords.length;
  let cursor = parent.startDate;
  return lords.map(name => {
    const endDate = addDashaYears(cursor, durationYears);
    const entry: NakshatraDashaEntry = { key: name.toLowerCase(), name, lord: name, startDate: cursor, endDate, durationYears };
    cursor = endDate;
    return entry;
  });
}
