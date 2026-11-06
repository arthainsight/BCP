import { getSignIndex, getDegreesInSign } from './utils';

// The Parivṛtti ("turning round") ways of placing the parts of a division in the signs.
//
// The Parāśara rule starts the parts of each sign afresh from a sign that follows from the natal sign's kind (movable, fixed
// or dual, odd or even). The Parivṛtti rules instead let the parts of the twelve signs run on one after another round the
// zodiac, so that the parts of the whole circle make `division × 12` places that fall on the signs in turn. There are three
// ways of letting them run, those of PyJHora (and of the Nāḍī and Jaimini-minded teachers it follows):
//
//   cyclic        the parts of every sign run forward, and the next sign goes on from where the last stopped:
//                 sign s, part p → (s × division + p) mod 12.
//   even-reverse  as cyclic, but the parts of an even sign (Taurus, Cancer, …) are taken backwards, from the last to the first,
//                 the running on being the same: odd sign (s × division + p), even sign (s × division + division − 1 − p).
//   alternate     (Somanātha) the odd signs run forward from Aries, the even signs run backward from Pisces, each from where
//                 the earlier sign of its kind stopped: for the k-th odd sign (k = 0, 1, …) (k × division + p) mod 12, for the
//                 k-th even sign (11 − k × division − p) mod 12.
//
// These are not in BPHS. PyJHora has them for some divisions only, and so does the app: where PyJHora has no rule for a
// division (D1, D24, D30, D60, and D9 but for the alternate one) the Parāśara rule stays. The signs of every division and
// scheme are checked against PyJHora in pyjhoraVargas.test.ts.

export type ParivrittiScheme = 'cyclic' | 'even-reverse' | 'alternate';
export type VargaMethod = 'parasara' | `parivritti-${ParivrittiScheme}`;

export const VARGA_METHODS: readonly VargaMethod[] = ['parasara', 'parivritti-cyclic', 'parivritti-even-reverse', 'parivritti-alternate'];
export const isVargaMethod = (value: unknown): value is VargaMethod => typeof value === 'string' && (VARGA_METHODS as readonly string[]).includes(value);

/** The divisions each Parivṛtti scheme is defined for. */
export const PARIVRITTI_DIVISIONS: Record<ParivrittiScheme, readonly number[]> = {
  cyclic: [2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 16, 20, 40, 45],
  'even-reverse': [2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 16, 20, 27, 40, 45],
  alternate: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 27, 40, 45],
};

/** The scheme of a method, or null for the Parāśara rule. */
export function parivrittiScheme(method: VargaMethod): ParivrittiScheme | null {
  return method === 'parasara' ? null : (method.slice('parivritti-'.length) as ParivrittiScheme);
}

/** Whether a method gives a rule of its own for a division (otherwise the Parāśara rule is used). */
export function methodAppliesTo(method: VargaMethod, division: number): boolean {
  const scheme = parivrittiScheme(method);
  return scheme !== null && PARIVRITTI_DIVISIONS[scheme].includes(division);
}

const mod12 = (value: number) => ((value % 12) + 12) % 12;

/** The sign (0 = Aries … 11 = Pisces) a longitude takes in a division by one of the Parivṛtti schemes. */
export function parivrittiSign(longitude: number, division: number, scheme: ParivrittiScheme): number {
  const sign = getSignIndex(longitude);
  const part = Math.min(Math.floor(getDegreesInSign(longitude) / (30 / division)), division - 1);
  const evenSign = sign % 2 === 1; // Taurus, Cancer … (the 2nd, 4th … sign)
  switch (scheme) {
    case 'cyclic':
      return mod12(sign * division + part);
    case 'even-reverse':
      return mod12(sign * division + (evenSign ? division - 1 - part : part));
    case 'alternate': {
      const kind = Math.floor(sign / 2); // how many signs of its kind came before it
      return evenSign ? mod12(11 - kind * division - part) : mod12(kind * division + part);
    }
  }
}
