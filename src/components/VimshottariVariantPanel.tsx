'use client';

import { useMemo } from 'react';
import type { PlanetData } from '@/types';
import { decideVariant, variantStrengths, VARIANT_LABELS, VARIANT_POSITION, type VimshottariVariantChoice } from '@/lib/vimshottariVariants';
import { useT } from '@/lib/i18n';
import VimshottariPanel from './VimshottariPanel';

type Props = {
  planets: PlanetData[];
  birthDatetime: string;
  choice?: VimshottariVariantChoice;
  /** Sign of the Lagna, for the house of the Moon. */
  ascendantSign?: number;
};

/**
 * Vimśottarī from the Utpanna, Kṣema or Ādhāna nakṣatra of the Moon: the three
 * candidates with the strength that decides between them, then the daśās of the
 * one in use (the chosen one, or the strongest when the choice is auto).
 */
export default function VimshottariVariantPanel({ planets, birthDatetime, choice = 'auto', ascendantSign }: Props) {
  const t = useT();
  const moon = planets.find(planet => planet.name === 'Moon');

  const analysis = useMemo(() => {
    if (!moon) return null;
    const strengths = variantStrengths(moon.longitude, planets);
    const { variant, basis, moonHouse } = decideVariant(moon.longitude, planets, ascendantSign, choice);
    const used = strengths.find(item => item.variant === variant)!;
    // The daśās start from the lord of that nakṣatra with the Moon's own balance, so the Moon is turned on to it.
    const shifted = planets.map(planet => (planet.name === 'Moon' ? { ...planet, longitude: used.longitude } : planet));
    return { strengths, variant, basis, moonHouse, shifted };
  }, [moon, planets, choice, ascendantSign]);

  if (!moon || !analysis) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; vimshottari</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">{t('Moon data required.')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 min-w-0">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 min-w-0">
        <div className="mb-1 text-[9px] font-mono uppercase tracking-widest text-zinc-500">
          {analysis.basis === 'house' && `${t('Moon in house')} ${analysis.moonHouse} → `}
          {analysis.basis === 'strength' && `${analysis.moonHouse ? `${t('Moon in house')} ${analysis.moonHouse}: ${t('no rule, so')} ` : ''}${t('strongest of the three')}: `}
          {analysis.basis === 'chosen' && `${t('chosen in Settings')}: `}
          {VARIANT_LABELS[analysis.variant]}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[10px]">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-1 pr-2">{t('Start')}</th>
                <th className="py-1 pr-2">{t('From Moon')}</th>
                <th className="py-1 pr-2">{t('Nakshatra')}</th>
                <th className="py-1 pr-2">{t('Lord')}</th>
                <th className="py-1 pr-2">{t('Grahas in angles')}</th>
                <th className="py-1">{t('Lord, Jupiter, Mercury')}</th>
              </tr>
            </thead>
            <tbody>
              {analysis.strengths.map(item => (
                <tr
                  key={item.variant}
                  data-variant={item.variant}
                  className={item.variant === analysis.variant ? 'font-bold text-cyan-700 dark:text-cyan-300' : 'text-zinc-600 dark:text-zinc-400'}
                >
                  <td className="py-1 pr-2">{VARIANT_LABELS[item.variant]}{item.variant === analysis.variant ? ' ●' : ''}</td>
                  <td className="py-1 pr-2">{VARIANT_POSITION[item.variant]}.</td>
                  <td className="py-1 pr-2 whitespace-nowrap">{item.nakshatra}</td>
                  <td className="py-1 pr-2">{item.lord}</td>
                  <td className="py-1 pr-2">{item.kendraGrahas}</td>
                  <td className="py-1">{item.supporters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The nakshatra counted from the Moon, with the balance taken from the Moon. By Sanjay Rath the Moon in the 3rd or 11th house gives Utpanna, in the 2nd or 6th Kshema and in the 8th or 12th Adhana. In the other houses the strongest is used: the most grahas in the angles from its sign; ties go to the one the lord of its nakshatra, Jupiter or Mercury joins or aspects, then to Utpanna, Kshema, Adhana in that order.')}
        </div>
      </div>
      <VimshottariPanel planets={analysis.shifted} birthDatetime={birthDatetime} title={`vimshottari ${VARIANT_LABELS[analysis.variant].toLowerCase()}`} />
    </div>
  );
}
