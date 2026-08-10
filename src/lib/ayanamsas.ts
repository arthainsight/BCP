export const AYANAMSA_OPTIONS = [
  { value: 'tropical', label: 'Tropical (Sāyana)', shortLabel: 'Tropical', mode: null, group: 'Zodiac' },

  { value: 'lahiri', label: 'Lahiri / Chitrapaksha', shortLabel: 'Lahiri', mode: 1, group: 'Common' },
  { value: 'raman', label: 'B.V. Raman', shortLabel: 'Raman', mode: 3, group: 'Common' },
  { value: 'krishnamurti', label: 'Krishnamurti / KP', shortLabel: 'KP', mode: 5, group: 'Common' },
  { value: 'fagan-bradley', label: 'Fagan–Bradley', shortLabel: 'Fagan–Bradley', mode: 0, group: 'Common' },
  { value: 'yukteshwar', label: 'Sri Yukteshwar', shortLabel: 'Yukteshwar', mode: 7, group: 'Common' },
  { value: 'jn-bhasin', label: 'J.N. Bhasin', shortLabel: 'J.N. Bhasin', mode: 8, group: 'Common' },
  { value: 'de-luce', label: 'De Luce', shortLabel: 'De Luce', mode: 2, group: 'Common' },
  { value: 'djwhal-khul', label: 'Djwhal Khul', shortLabel: 'Djwhal Khul', mode: 6, group: 'Common' },
  { value: 'true-chitra', label: 'True Chitra', shortLabel: 'True Chitra', mode: 27, group: 'Common' },
  { value: 'true-revati', label: 'True Revati', shortLabel: 'True Revati', mode: 28, group: 'Common' },

  { value: 'chandra-hari', label: 'Chandra-Hari (True Mūla)', shortLabel: 'Chandra-Hari', mode: 35, group: 'Requested' },
  { value: 'wilhelm-mula', label: 'Wilhelm (Dhruva / Galactic Center / Mūla)', shortLabel: 'Wilhelm Mūla', mode: 36, group: 'Requested' },
  { value: 'mardyks', label: 'Skydram / Mardyks (Galactic Alignment)', shortLabel: 'Mardyks', mode: 34, group: 'Requested' },
  { value: 'babylonian-britton', label: 'Babylonian (Britton)', shortLabel: 'Babylonian Britton', mode: 38, group: 'Requested' },
  { value: 'ushashashi', label: 'Ushāśaśi (Usha-Shashi)', shortLabel: 'Ushāśaśi', mode: 4, group: 'Requested' },
] as const;

export type AyanamsaMode = typeof AYANAMSA_OPTIONS[number]['value'];

const BY_VALUE = new Map<string, typeof AYANAMSA_OPTIONS[number]>(AYANAMSA_OPTIONS.map((option) => [option.value, option]));

export function resolveAyanamsaMode(value: string): AyanamsaMode {
  return (BY_VALUE.has(value) ? value : 'lahiri') as AyanamsaMode;
}

export function ayanamsaModeNumber(value: AyanamsaMode): number | null {
  return BY_VALUE.get(value)?.mode ?? 1;
}

export function ayanamsaLabel(value: string, short = false): string {
  const option = BY_VALUE.get(value) ?? BY_VALUE.get('lahiri')!;
  return short ? option.shortLabel : option.label;
}