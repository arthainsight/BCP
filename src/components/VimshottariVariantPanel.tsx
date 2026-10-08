'use client';

import { useMemo } from 'react';
import type { PlanetData } from '@/types';
import {
  decideVariant, variantCandidates, VARIANT_HOUSES, VARIANT_LABELS, VARIANT_POSITION, type VimshottariVariantChoice,
} from '@/lib/vimshottariVariants';
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
 * Vimśottarī from the Utpanna, Kṣema or Ādhāna nakṣatra of the Moon. The house
 * of the Moon decides which of the three applies (Sanjay Rath); with the Moon in
 * a house that calls for none, the daśā is not used. The candidates are listed
 * with the one in use marked, then the daśās of that one.
 */
export default function VimshottariVariantPanel({ planets, birthDatetime, choice = 'auto', ascendantSign }: Props) {
  const t = useT();
  const moon = planets.find(planet => planet.name === 'Moon');

  const analysis = useMemo(() => {
    if (!moon) return null;
    const candidates = variantCandidates(moon.longitude);
    const decision = decideVariant(moon.longitude, ascendantSign, choice);
    const used = candidates.find(item => item.variant === decision.variant);
    // The daśās start from the lord of that nakṣatra with the Moon's own balance, so the Moon is turned on to it.
    const shifted = used ? planets.map(planet => (planet.name === 'Moon' ? { ...planet, longitude: used.longitude } : planet)) : null;
    return { candidates, decision, shifted };
  }, [moon, planets, choice, ascendantSign]);

  if (!moon || !analysis) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">&gt; vimshottari</div>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">{t('Moon data required.')}</div>
      </div>
    );
  }

  const { candidates, decision, shifted } = analysis;

  return (
    <div className="space-y-3 min-w-0">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 min-w-0">
        <div className="mb-1 text-[9px] font-mono uppercase tracking-widest text-zinc-500">
          {decision.basis === 'chosen' && `${t('chosen in Settings')}: ${decision.variant ? VARIANT_LABELS[decision.variant] : ''}`}
          {decision.basis === 'house' && decision.variant && `${t('Moon in house')} ${decision.moonHouse} → ${VARIANT_LABELS[decision.variant]}`}
          {decision.basis === 'house' && !decision.variant && `${t('Moon in house')} ${decision.moonHouse ?? '?'}: ${t('this daśā is not used')} (${t('used with the Moon in houses')} ${VARIANT_HOUSES.join(', ')})`}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[10px]">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="py-1 pr-2">{t('Start')}</th>
                <th className="py-1 pr-2">{t('From Moon')}</th>
                <th className="py-1 pr-2">{t('Nakshatra')}</th>
                <th className="py-1">{t('Lord')}</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map(item => (
                <tr
                  key={item.variant}
                  data-variant={item.variant}
                  className={item.variant === decision.variant ? 'font-bold text-cyan-700 dark:text-cyan-300' : 'text-zinc-600 dark:text-zinc-400'}
                >
                  <td className="py-1 pr-2">{VARIANT_LABELS[item.variant]}{item.variant === decision.variant ? ' ●' : ''}</td>
                  <td className="py-1 pr-2">{VARIANT_POSITION[item.variant]}.</td>
                  <td className="py-1 pr-2 whitespace-nowrap">{item.nakshatra}</td>
                  <td className="py-1">{item.lord}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The nakshatra counted from the Moon, with the balance taken from the Moon. By Sanjay Rath the Moon in the 3rd or 11th house gives Utpanna, in the 2nd or 6th Kshema and in the 8th or 12th Adhana; in the other houses none of them is used.')}
        </div>
      </div>
      {shifted && decision.variant && (
        <VimshottariPanel planets={shifted} birthDatetime={birthDatetime} title={`vimshottari ${VARIANT_LABELS[decision.variant].toLowerCase()}`} />
      )}
    </div>
  );
}
