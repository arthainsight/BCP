import type { ChartData } from '@/types';
import { getVargaSignIndex } from '@/lib/varga';
import { SIGN_LORDS } from '@/lib/signs';
import type { SevenPlanet } from '@/lib/varshaphala';

export type HarshaGrade = 'nirbala' | 'alpabali' | 'madhya-bali' | 'poorna-bali' | 'extraordinary';

export type HarshaBalaRow = {
  grade: HarshaGrade;
  planet: SevenPlanet;
  positional: number;
  ownOrExalted: number;
  gender: number;
  dayNight: number;
  total: number;
};

const HARSA_HOUSES: Record<SevenPlanet, number> = {
  Sun: 9, Moon: 3, Mars: 6, Mercury: 1, Jupiter: 11, Venus: 5, Saturn: 12,
};
const MALE_PLANETS = new Set<SevenPlanet>(['Sun', 'Mars', 'Jupiter']);
const FEMALE_PLANETS = new Set<SevenPlanet>(['Moon', 'Mercury', 'Venus', 'Saturn']);
const FEMININE_HOUSES = new Set([1, 2, 3, 7, 8, 9]);
const EXALTATION_SIGNS: Record<SevenPlanet, number> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7,
};
const DEBILITATION_SIGNS: Record<SevenPlanet, number> = {
  Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1,
};
const OWN_SIGNS: Record<SevenPlanet, readonly number[]> = {
  Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6],
  Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11],
};

/** Charak's qualitative reading of the five-point Harṣa Bala total. */
export function harshaGrade(total: number): HarshaGrade {
  if (total <= 0) return 'nirbala';
  if (total <= 5) return 'alpabali';
  if (total <= 10) return 'madhya-bali';
  if (total <= 15) return 'poorna-bali';
  return 'extraordinary';
}

/** K. S. Charak, A Textbook of Varshaphala, chapter VI: four components × five points. */
export function calculateHarshaBala(annual: ChartData, dayYear: boolean): HarshaBalaRow[] {
  return (Object.keys(HARSA_HOUSES) as SevenPlanet[]).map(planet => {
    const body = annual.planets.find(item => item.name === planet);
    if (!body) {
      return { planet, positional: 0, ownOrExalted: 0, gender: 0, dayNight: 0, total: 0, grade: 'nirbala' };
    }
    const positional = body.house === HARSA_HOUSES[planet] ? 5 : 0;
    const ownOrExalted = OWN_SIGNS[planet].includes(body.sign) || body.sign === EXALTATION_SIGNS[planet] ? 5 : 0;
    const house = body.house ?? (((body.sign - annual.ascendant.sign + 12) % 12) + 1);
    const gender = (MALE_PLANETS.has(planet) ? !FEMININE_HOUSES.has(house) : FEMININE_HOUSES.has(house)) ? 5 : 0;
    const dayNight = (MALE_PLANETS.has(planet) && dayYear) || (FEMALE_PLANETS.has(planet) && !dayYear) ? 5 : 0;
    const total = positional + ownOrExalted + gender + dayNight;
    return { planet, positional, ownOrExalted, gender, dayNight, total, grade: harshaGrade(total) };
  });
}

export type DwadashavargiyaDisposition = 'benefic' | 'malefic' | 'neutral';
export interface DwadashavargiyaFactor {
  division: number;
  name: string;
  sign: number;
  lord: string;
  disposition: DwadashavargiyaDisposition;
  reason: string;
}
export interface DwadashavargiyaRow {
  planet: SevenPlanet;
  benefic: number;
  malefic: number;
  neutral: number;
  net: number;
  result: DwadashavargiyaDisposition;
  factors: DwadashavargiyaFactor[];
}

const DWADASHAVARGAS = [
  { division: 1, name: 'Rāśi' }, { division: 2, name: 'Horā' },
  { division: 3, name: 'Drekkāṇa' }, { division: 4, name: 'Chaturthāṁśa' },
  { division: 5, name: 'Pañchāṁśa' }, { division: 6, name: 'Ṣaṣṭhāṁśa' },
  { division: 7, name: 'Saptāṁśa' }, { division: 8, name: 'Aṣṭāṁśa' },
  { division: 9, name: 'Navāṁśa' }, { division: 10, name: 'Daśāṁśa' },
  { division: 11, name: 'Ekādaśāṁśa' }, { division: 12, name: 'Dvādaśāṁśa' },
] as const;
const PANCHAMSHA_ODD_LORDS = ['Mars', 'Saturn', 'Jupiter', 'Mercury', 'Venus'] as const;
const PANCHAMSHA_EVEN_LORDS = [...PANCHAMSHA_ODD_LORDS].reverse();

function panchamshaLord(longitude: number): SevenPlanet {
  const sign = Math.floor(longitude / 30) + 1;
  const segment = Math.min(4, Math.floor((longitude % 30) / 6));
  return (sign % 2 === 1 ? PANCHAMSHA_ODD_LORDS : PANCHAMSHA_EVEN_LORDS)[segment];
}

/**
 * Charak's Dvādaśavargīya Bala (A Textbook of Varshaphala, chapter VI).
 * Friend/enemy/equal is the Tājika relationship in the annual rāśi chart:
 * 3/5/9/11 = friend, 1/4/7/10 = enemy, 2/6/8/12 = equal.
 * Own, exaltation and debilitation override the relationship.
 */
export function calculateDwadashavargiyaBala(annual: ChartData): DwadashavargiyaRow[] {
  return (Object.keys(OWN_SIGNS) as SevenPlanet[]).map(planet => {
    const body = annual.planets.find(item => item.name === planet);
    if (!body) {
      return { planet, benefic: 0, malefic: 0, neutral: 12, net: 0, result: 'neutral', factors: [] };
    }
    const factors: DwadashavargiyaFactor[] = DWADASHAVARGAS.map(({ division, name }) => {
      const sign = division === 5
        ? Math.floor(getVargaSignIndex(body.longitude, 5)) + 1
        : getVargaSignIndex(body.longitude, division) + 1;
      const lord = division === 5
        ? panchamshaLord(body.longitude)
        : SIGN_LORDS[sign - 1] as SevenPlanet;
      let disposition: DwadashavargiyaDisposition;
      let reason: string;
      if (sign === EXALTATION_SIGNS[planet]) {
        disposition = 'benefic'; reason = 'exalted';
      } else if (sign === DEBILITATION_SIGNS[planet]) {
        disposition = 'malefic'; reason = 'debilitated';
      } else if (OWN_SIGNS[planet].includes(sign) || lord === planet) {
        disposition = 'benefic'; reason = 'own sign';
      } else {
        const lordBody = annual.planets.find(item => item.name === lord);
        if (!lordBody) {
          disposition = 'neutral'; reason = 'lord position unavailable';
        } else {
          const relation = ((lordBody.sign - body.sign + 12) % 12) + 1;
          if ([3, 5, 9, 11].includes(relation)) {
            disposition = 'benefic'; reason = 'Tājika friend (3/5/9/11)';
          } else if ([1, 4, 7, 10].includes(relation)) {
            disposition = 'malefic'; reason = 'Tājika enemy (1/4/7/10)';
          } else {
            disposition = 'neutral'; reason = 'Tājika equal (2/6/8/12)';
          }
        }
      }
      return { division, name, sign, lord, disposition, reason };
    });
    const benefic = factors.filter(factor => factor.disposition === 'benefic').length;
    const malefic = factors.filter(factor => factor.disposition === 'malefic').length;
    const neutral = factors.filter(factor => factor.disposition === 'neutral').length;
    const net = benefic - malefic;
    const result: DwadashavargiyaDisposition = net > 0 ? 'benefic' : net < 0 ? 'malefic' : 'neutral';
    return { planet, benefic, malefic, neutral, net, result, factors };
  });
}
