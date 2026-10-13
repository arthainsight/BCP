import type { Language } from './i18n';

/** 1st, 2nd, 3rd, 4th … 11th, 12th, 21st; Finnish writes a number and a full stop: "5.". */
export function ordinal(n: number, language: Language = 'en'): string {
  if (language === 'fi') return `${n}.`;
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return `${n}${teen ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}
