import { getDegreesInSign, getSignIndex, isDualSign, isFixedSign, normalizeLongitude } from './varga/utils';

export const NADI_AMSA_COUNT = 150;
export const NADI_AMSA_SIZE_DEGREES = 30 / NADI_AMSA_COUNT;
export const NADI_HALF_SIZE_DEGREES = NADI_AMSA_SIZE_DEGREES / 2;

export type NadiHalf = 'purva' | 'para';

export interface DevaKeralamNadiAmsa {
  system: 'deva-keralam';
  rawDivision: number;
  nadiNumber: number;
  modality: 'movable' | 'fixed' | 'dual';
  offsetDegrees: number;
}

export interface SiddharNadiAmsa {
  system: 'siddhar';
  rawDivision: number;
  signIndex: number;
  half: NadiHalf;
  halfNumber: number;
  offsetDegrees: number;
}

function getRawDivision(longitude: number): number {
  const degrees = getDegreesInSign(longitude);
  // The epsilon keeps exact decimal boundaries (for example 0.2°) from
  // falling into the previous division because of binary floating point.
  return Math.min(NADI_AMSA_COUNT - 1, Math.floor((degrees + 1e-10) / NADI_AMSA_SIZE_DEGREES));
}

/**
 * Deva Keralam / Chandra Kala Nadi equal-division indexing.
 *
 * Each sign has 150 equal 0°12′ divisions. Names/numbers run forward in
 * movable signs, backward in fixed signs, and 76..150 then 1..75 in dual signs.
 */
export function calculateDevaKeralamNadiAmsa(longitude: number): DevaKeralamNadiAmsa {
  const normalized = normalizeLongitude(longitude);
  const signIndex = getSignIndex(normalized);
  const rawDivision = getRawDivision(normalized);
  const degrees = getDegreesInSign(normalized);

  if (isFixedSign(signIndex)) {
    return {
      system: 'deva-keralam',
      rawDivision: rawDivision + 1,
      nadiNumber: NADI_AMSA_COUNT - rawDivision,
      modality: 'fixed',
      offsetDegrees: degrees - rawDivision * NADI_AMSA_SIZE_DEGREES,
    };
  }

  if (isDualSign(signIndex)) {
    return {
      system: 'deva-keralam',
      rawDivision: rawDivision + 1,
      nadiNumber: rawDivision < 75 ? rawDivision + 76 : rawDivision - 74,
      modality: 'dual',
      offsetDegrees: degrees - rawDivision * NADI_AMSA_SIZE_DEGREES,
    };
  }

  return {
    system: 'deva-keralam',
    rawDivision: rawDivision + 1,
    nadiNumber: rawDivision + 1,
    modality: 'movable',
    offsetDegrees: degrees - rawDivision * NADI_AMSA_SIZE_DEGREES,
  };
}

/**
 * Siddhar/Tamil equal D150 harmonic placement.
 *
 * The 150th harmonic maps each 0°12′ division cyclically into a D150 sign.
 * Every division is also exposed as its 0°06′ purva/para half (300 half-nadis).
 */
export function calculateSiddharNadiAmsa(longitude: number): SiddharNadiAmsa {
  const normalized = normalizeLongitude(longitude);
  const signIndex = getSignIndex(normalized);
  const degrees = getDegreesInSign(normalized);
  const rawDivision = getRawDivision(normalized);
  const offsetDegrees = degrees - rawDivision * NADI_AMSA_SIZE_DEGREES;
  const halfIndex = offsetDegrees + 1e-10 >= NADI_HALF_SIZE_DEGREES ? 1 : 0;

  return {
    system: 'siddhar',
    rawDivision: rawDivision + 1,
    signIndex: (signIndex * NADI_AMSA_COUNT + rawDivision) % 12,
    half: halfIndex === 0 ? 'purva' : 'para',
    halfNumber: rawDivision * 2 + halfIndex + 1,
    offsetDegrees,
  };
}
