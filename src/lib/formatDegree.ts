export type DegreePrecision = 'off' | 'degree' | 'minute' | 'second';

export function formatDegree(value: number, precision: DegreePrecision): string {
  const d = Math.floor(value);
  if (precision === 'degree') return `${d}°`;
  const minFloat = (value - d) * 60;
  const m = Math.floor(minFloat);
  if (precision === 'minute') return `${d}°${m}'`;
  const s = Math.round((minFloat - m) * 60);
  return `${d}°${m}'${s}"`;
}
