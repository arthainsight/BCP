import type { AnnualMahadasha, AnnualPeriod } from './annualDasha';

/**
 * The Pātyāṁśī daśā of the Tājika Nīlakaṇṭhī (Varṣatantra, "varṣadaśākramavicāraḥ", verses 1–3, with the commentary of Mahīdhara): the daśā that Nīlakaṇṭha himself gives
 * for the year. The degrees of the Lagna and the grahas within their signs (the signs dropped) are put in order from the smallest; each one's pātyāṁśa is its degrees less those of the one
 * before it, so that the pātyāṁśas add up to the greatest degrees. The year is divided among them in proportion to the pātyāṁśas, in that order; the sub-periods are in proportion to the
 * same shares (the antardaśā of a graha in the daśā of another is the product of their days over the days of the year). The same is done for a month, with 30 days for 360.
 */
export interface PatyamshaBody {
  name: string;
  /** Degrees within the sign, 0–30. */
  degree: number;
  /** Daily motion, for the tie of 26.3 below: the slower comes first. */
  speed?: number;
}

export interface PatyamshaShare { name: string; degree: number; patyamsha: number }

/** The pātyāṁśas in order. When two have the same degrees the slower comes first (the commentary of verse 3); the Lagna has no motion and follows the others. */
export function patyamshaShares(bodies: PatyamshaBody[]): PatyamshaShare[] {
  const sorted = [...bodies].sort((a, b) => a.degree - b.degree || Math.abs(a.speed ?? Infinity) - Math.abs(b.speed ?? Infinity));
  let previous = 0;
  return sorted.map(body => {
    const patyamsha = body.degree - previous;
    previous = body.degree;
    return { name: body.name, degree: body.degree, patyamsha };
  });
}

/** The daśā of the whole of `spanDays` from `startJd`: a share with no pātyāṁśa (the same degrees as the one before it) has no period. */
export function patyamshaDasha(bodies: PatyamshaBody[], startJd: number, spanDays: number): AnnualMahadasha[] {
  const shares = patyamshaShares(bodies).filter(share => share.patyamsha > 1e-9);
  const total = shares.reduce((sum, share) => sum + share.patyamsha, 0);
  if (shares.length === 0 || total <= 0) return [];
  let start = startJd;
  return shares.map((share, index) => {
    const length = (spanDays * share.patyamsha) / total;
    const antardashas: AnnualPeriod[] = [];
    let subStart = start;
    for (let step = 0; step < shares.length; step++) {
      const sub = shares[(index + step) % shares.length];
      const subLength = (length * sub.patyamsha) / total;
      antardashas.push({ lord: sub.name, startJd: subStart, endJd: subStart + subLength });
      subStart += subLength;
    }
    const mahadasha: AnnualMahadasha = { lord: share.name, startJd: start, endJd: start + length, antardashas };
    start += length;
    return mahadasha;
  });
}
