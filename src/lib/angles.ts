/**
 * Wrap a longitude into [0, 360).
 *
 * The obvious spelling, `((deg % 360) + 360) % 360`, is subtly wrong for values
 * that are already in range: pushing them up near 363 and back down costs the
 * low mantissa bits. 360/27 came back as 13.333333333333314 instead of
 * 13.333333333333334 — one ULP-cluster below the boundary — so a Moon sitting
 * exactly on a nakṣatra cusp was filed under the previous nakṣatra. The same
 * shift moved planets across sign boundaries and varga part boundaries.
 *
 * Wrapping only when the value is actually out of range keeps in-range inputs
 * bit-exact. Out-of-range inputs still lose precision in the addition, but that
 * is unavoidable and they are the rare case.
 */
export function normalizeDegrees(value: number): number {
  const wrapped = value % 360;
  if (wrapped < 0) return wrapped + 360;
  // A negative whole turn leaves -0 behind, which compares unequal to 0 under
  // Object.is and shows up as "-0" in debug output. Normalize it away.
  return wrapped === 0 ? 0 : wrapped;
}
