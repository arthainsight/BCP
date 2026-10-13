import { fill } from './i18n';

/**
 * Notes and reasons that the dasha code writes in English ("Conditional: not
 * applicable (11H Rahu from Lagna lord)") put into the interface language.
 * The sentences with numbers in them are matched and filled into a translated
 * template; the rest are translated whole.
 */
export function translateDashaText(text: string, t: (text: string) => string): string {
  let m = /^Conditional: not applicable \((\S+)H Rahu from Lagna lord\)$/.exec(text);
  if (m) return fill(t('Conditional: not applicable ({house}H Rahu from Lagna lord)'), { house: m[1] });
  m = /^Conditional: not applicable \(Moon in (\S+)H; used with the Moon in (.+)\)$/.exec(text);
  if (m) return fill(t('Conditional: not applicable (Moon in {house}H; used with the Moon in {houses})'), { house: m[1], houses: m[2] });
  m = /^Rahu is outside Lagna \(sign (\d+)\)$/.exec(text);
  if (m) return fill(t('Rahu is outside Lagna (sign {sign})'), { sign: m[1] });
  m = /^Rahu is (\d+)H from Lagna lord (\S+)$/.exec(text);
  if (m) return fill(t('Rahu is {house}H from Lagna lord {lord}'), { house: m[1], lord: m[2] });
  m = /^(\S+) position unavailable$/.exec(text);
  if (m && m[1] !== 'Rahu') return fill(t('{planet} position unavailable'), { planet: m[1] });
  return t(text);
}
