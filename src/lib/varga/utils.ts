// Only wrap when actually out of range. The naive ((x % 360) + 360) % 360 form
// pushes an already-valid longitude up to ~363 and back, losing the low mantissa
// bits: 10/3 came back as 3.33333333333331, one ULP-cluster below the exact
// 3°20′ navamsa boundary, which floors every varga part index one step early.
export function normalizeLongitude(longitude: number): number {
  const wrapped = longitude % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

export function getSignIndex(longitude: number): number {
  return Math.floor(normalizeLongitude(longitude) / 30);
}

export function getDegreesInSign(longitude: number): number {
  return normalizeLongitude(longitude) % 30;
}

// Jyotish "odd" signs: 1st, 3rd, 5th… = Aries(0), Gemini(2), Leo(4), Libra(6), Sag(8), Aq(10)
// Note: 0-indexed even index = Jyotish odd sign
export function isOddSign(signIndex: number): boolean {
  return signIndex % 2 === 0;
}

// Movable (Chara): Aries(0), Cancer(3), Libra(6), Capricorn(9) → index % 3 === 0
export function isMovableSign(signIndex: number): boolean {
  return signIndex % 3 === 0;
}

// Fixed (Sthira): Taurus(1), Leo(4), Scorpio(7), Aquarius(10) → index % 3 === 1
export function isFixedSign(signIndex: number): boolean {
  return signIndex % 3 === 1;
}

// Dual (Dwiswabhava): Gemini(2), Virgo(5), Sag(8), Pisces(11) → index % 3 === 2
export function isDualSign(signIndex: number): boolean {
  return signIndex % 3 === 2;
}

// Element by index % 4: 0=Fire(Ar,Le,Sg), 1=Earth(Ta,Vi,Cp), 2=Air(Ge,Li,Aq), 3=Water(Cn,Sc,Pi)
export function getElement(signIndex: number): number {
  return signIndex % 4;
}
