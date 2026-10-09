// Argala: the Jaimini and Parāśara intervention of the grahas on a house or graha.
//
// Counted from the house (or the sign of the graha) that is read, the grahas in
// the 2nd, 4th and 11th cause argala (the 5th too, as a secondary one). Each is
// opposed by virodhargala from the house opposite it in the count: the 12th
// opposes the 2nd, the 10th the 4th, the 3rd the 11th and the 9th the 5th.
// An argala stands when the grahas causing it outnumber those opposing it; when
// the opposing grahas are as many or more, the argala is obstructed, and with
// no grahas in the argala house there is none to speak of. Rāhu and Ketu count
// as grahas like the rest.

export type ArgalaKind = 'primary' | 'secondary';
export type ArgalaStatus = 'none' | 'effective' | 'obstructed';

/** Argala house from the one read, and the house whose grahas oppose it. */
export const ARGALA_HOUSES: { house: number; virodha: number; kind: ArgalaKind }[] = [
  { house: 2, virodha: 12, kind: 'primary' },
  { house: 4, virodha: 10, kind: 'primary' },
  { house: 11, virodha: 3, kind: 'primary' },
  { house: 5, virodha: 9, kind: 'secondary' },
];

export interface ArgalaPlanet {
  name: string;
  /** Sign 1–12. */
  sign: number;
}

export interface ArgalaCell {
  kind: ArgalaKind;
  /** The argala house and the virodha house, counted from the one read. */
  house: number;
  virodhaHouse: number;
  /** The signs they fall in. */
  sign: number;
  virodhaSign: number;
  planets: string[];
  virodhaPlanets: string[];
  status: ArgalaStatus;
}

const signFrom = (sign: number, house: number) => ((sign - 1 + house - 1) % 12) + 1;

/** The argalas on a sign: one cell for each argala house. */
export function argalaOnSign(sign: number, planets: ArgalaPlanet[]): ArgalaCell[] {
  return ARGALA_HOUSES.map(({ house, virodha, kind }) => {
    const argalaSign = signFrom(sign, house);
    const virodhaSign = signFrom(sign, virodha);
    const causing = planets.filter(planet => planet.sign === argalaSign).map(planet => planet.name);
    const opposing = planets.filter(planet => planet.sign === virodhaSign).map(planet => planet.name);
    const status: ArgalaStatus = causing.length === 0 ? 'none' : opposing.length >= causing.length ? 'obstructed' : 'effective';
    return { kind, house, virodhaHouse: virodha, sign: argalaSign, virodhaSign, planets: causing, virodhaPlanets: opposing, status };
  });
}

export interface ArgalaRow {
  /** The house (1–12 from the Lagna) or the graha that is read. */
  label: string;
  sign: number;
  cells: ArgalaCell[];
}

/** The argalas on each of the twelve houses, counted from the Lagna. */
export function argalaOnHouses(ascendantSign: number, planets: ArgalaPlanet[]): ArgalaRow[] {
  return Array.from({ length: 12 }, (_, index) => {
    const sign = signFrom(ascendantSign, index + 1);
    return { label: String(index + 1), sign, cells: argalaOnSign(sign, planets) };
  });
}

/** The argalas on each graha, counted from the sign it stands in. */
export function argalaOnGrahas(planets: ArgalaPlanet[]): ArgalaRow[] {
  return planets.map(planet => ({ label: planet.name, sign: planet.sign, cells: argalaOnSign(planet.sign, planets) }));
}
