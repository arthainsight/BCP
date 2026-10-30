// Iṣṭa Phala and Kaṣṭa Phala of the grahas (BPHS 28.2–6): how much good and how much harm a graha's daśā
// is likely to bring, from two of the strengths it already has, the exaltation (Uccha) and the motion
// (Cheṣṭā).
//
// The verses build both from "rays" (raśmi). The Uccha ray is the graha's distance from its debilitation
// point, taken to 180° at most, as signs plus one (28.2); the Cheṣṭā ray is made from the cheṣṭā-kendra in
// the same way (28.3). For the Sun the kendra is the sāyana Sun and three signs (28.4); for the Moon the
// Moon less the Sun. Take one from each ray, multiply by ten, add them and halve (28.6): that is the Iṣṭa
// Phala, and what is left of sixty is the Kaṣṭa Phala. A ray less one, times ten, is the angle over three,
// so the rays are Uccha Bala and Cheṣṭā Bala in virūpa and the Iṣṭa Phala is their mean.
//
// B. V. Raman (Graha and Bhava Balas, articles 138–139) takes instead the square root of their product,
// and of the product of what each lacks of sixty. The verse is the mean; Raman's is a setting (C15).
//
// The Sun's and the Moon's Cheṣṭā Bala here is the one of the kendra (28.4), not the Ayana Bala and the Pakṣa
// Bala that 27.18 gives them; the setting for their Cheṣṭā Bala in the total of the Ṣaḍbala (C5) does not touch it.

import type { IshtaFormula } from './balaOptions';
import type { ShadbalaChartLike, ShadbalaPlanet, ShadbalaRow } from './shadbala';
import { normalizeLongitude } from './varga/utils';

export type IshtaKashtaVerdict = 'ishta' | 'kashta' | 'equal';

export type IshtaKashtaRow = {
  planet: ShadbalaPlanet;
  /** Uccha Bala in virūpa, the Uccha ray less one, times ten. */
  uccha: number;
  /** Cheṣṭā Bala by the kendra in virūpa, or null where the chart has no Julian day for the mean positions. */
  cheshta: number | null;
  ishta: number | null;
  kashta: number | null;
  verdict: IshtaKashtaVerdict | null;
};

/** A kendra taken to 180° at most (28.4: over six signs, it is taken from the circle). */
export function reducedKendra(degrees: number): number {
  const kendra = normalizeLongitude(degrees);
  return kendra > 180 ? 360 - kendra : kendra;
}

/** The Sun's Cheṣṭā Bala: its sāyana longitude and three signs, reduced, over three (28.4). */
export function sunCheshtaBalaVirupa(sayanaSun: number): number {
  return reducedKendra(sayanaSun + 90) / 3;
}

/** The Moon's Cheṣṭā Bala: the Moon less the Sun, reduced, over three (28.4). */
export function moonCheshtaBalaVirupa(moon: number, sun: number): number {
  return reducedKendra(moon - sun) / 3;
}

/** Iṣṭa and Kaṣṭa Phala from the two strengths in virūpa (0–60 each). */
export function ishtaKashtaPhala(uccha: number, cheshta: number, formula: IshtaFormula): { ishta: number; kashta: number } {
  if (formula === 'raman') {
    return { ishta: Math.sqrt(uccha * cheshta), kashta: Math.sqrt((60 - uccha) * (60 - cheshta)) };
  }
  const ishta = (uccha + cheshta) / 2;
  return { ishta, kashta: 60 - ishta };
}

export function ishtaKashtaVerdict(ishta: number, kashta: number): IshtaKashtaVerdict {
  const difference = ishta - kashta;
  return Math.abs(difference) < 0.005 ? 'equal' : difference > 0 ? 'ishta' : 'kashta';
}

function longitudeOf(chart: ShadbalaChartLike, name: string): number | undefined {
  const longitude = chart?.planets?.find(planet => planet.name === name)?.longitude;
  return typeof longitude === 'number' ? longitude : undefined;
}

/** The Iṣṭa and Kaṣṭa Phala of each graha of the Ṣaḍbala rows (same order), by the given formula. */
export function buildIshtaKashtaRows(chart: ShadbalaChartLike, rows: ShadbalaRow[], formula: IshtaFormula): IshtaKashtaRow[] {
  const sun = longitudeOf(chart, 'Sun');
  const moon = longitudeOf(chart, 'Moon');
  const ayanamsa = chart?.debug?.ayanamsa ?? 0;
  const hasMeanPositions = typeof chart?.debug?.julianDay === 'number';
  return rows.map((row): IshtaKashtaRow => {
    const uccha = row.sthanaBreakdown.uccha;
    let cheshta: number | null = null;
    if (row.planet === 'Sun') cheshta = sun === undefined ? null : sunCheshtaBalaVirupa(sun + ayanamsa);
    else if (row.planet === 'Moon') cheshta = sun === undefined || moon === undefined ? null : moonCheshtaBalaVirupa(moon, sun);
    else if (hasMeanPositions) cheshta = row.cheshtaVirupa; // Mars to Saturn: the kendra's, whatever C5 says
    if (cheshta === null) return { planet: row.planet, uccha, cheshta: null, ishta: null, kashta: null, verdict: null };
    const { ishta, kashta } = ishtaKashtaPhala(uccha, cheshta, formula);
    return { planet: row.planet, uccha, cheshta, ishta, kashta, verdict: ishtaKashtaVerdict(ishta, kashta) };
  });
}
