import { UPAGRAHA_CLOSE, UPAGRAHA_VERSES, type UpagrahaBody, type UpagrahaVerse } from './upagrahaVerses';

/**
 * The results of the non-luminous bodies in the houses, Bṛhat Parāśara Horā Śāstra chapter 25 (verses 2–85, seven bodies × twelve houses): Dhūma, Pāta, Paridhi, Cāpa, Ketu (the Upaketu), Gulika and Prāṇapada.
 * The names of the text and the points of the app: Dhūma is Dhuma, Pāta Vyatipāta, Paridhi Parivesha, Cāpa Indrachāpa, Ketu Upaketu, Gulika Gulika (the text does not name Māndi) and Prāṇapada the Prāṇapada Lagna.
 * Verses 86–87 close the chapter: the results are to be told by the position of the body, the exact aspects on it and the strength and weakness.
 */
export { UPAGRAHA_VERSES, UPAGRAHA_CLOSE };
export type { UpagrahaBody, UpagrahaVerse };

export const UPAGRAHA_BODIES: { body: UpagrahaBody; name: string; pointKey: string }[] = [
  { body: 'Dhuma', name: 'Dhūma', pointKey: 'Dh' }, { body: 'Pata', name: 'Pāta (Vyatipāta)', pointKey: 'Vy' }, { body: 'Paridhi', name: 'Paridhi (Parivesha)', pointKey: 'Pa' },
  { body: 'Chapa', name: 'Cāpa (Indrachāpa)', pointKey: 'In' }, { body: 'Ketu', name: 'Ketu (Upaketu)', pointKey: 'Uk' }, { body: 'Gulika', name: 'Gulika', pointKey: 'Gu' },
  { body: 'Pranapada', name: 'Prāṇapada', pointKey: 'PP' },
];

export function upagrahaVerse(body: UpagrahaBody, house: number): UpagrahaVerse {
  const found = UPAGRAHA_VERSES.find(verse => verse.body === body && verse.house === house);
  if (!found) throw new Error(`no verse for ${body} in the ${house}th house`);
  return found;
}

export interface UpagrahaReading { body: UpagrahaBody; name: string; longitude: number; sign: number; degree: number; house: number; verse: UpagrahaVerse }

/** The reading of each body whose longitude is known, with the house from the Lagna and the verse of the text. */
export function upagrahaReadings(points: { pointKey: string; longitude: number }[], ascendantSign: number): UpagrahaReading[] {
  const readings: UpagrahaReading[] = [];
  for (const item of UPAGRAHA_BODIES) {
    const point = points.find(candidate => candidate.pointKey === item.pointKey);
    if (!point) continue;
    const longitude = ((point.longitude % 360) + 360) % 360;
    const sign = Math.floor(longitude / 30) + 1;
    const house = ((sign - ascendantSign + 12) % 12) + 1;
    readings.push({ body: item.body, name: item.name, longitude, sign, degree: longitude % 30, house, verse: upagrahaVerse(item.body, house) });
  }
  return readings;
}
