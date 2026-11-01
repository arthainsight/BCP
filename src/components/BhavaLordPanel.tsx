'use client';

import { useMemo } from 'react';
import type { ChartData } from '@/types';
import { BHAVA_LORD_RULES, bhavaLordReadings, type BhavaLordVerse } from '@/lib/bhavaLordEffects';
import { SIGN_NAMES } from '@/lib/signs';
import { fill, useLanguage, useT } from '@/lib/i18n';
import { ordinal } from '@/lib/ordinal';
import { useGrahaNames } from '@/lib/grahaNames';

function Verse({ verse, label }: { verse: BhavaLordVerse; label: string }) {
  const t = useT();
  return (
    <details className="mt-1 rounded border border-zinc-200 px-2 py-1 dark:border-zinc-700" data-bhavesha-verse={verse.verse}>
      <summary className="cursor-pointer text-[10px] text-zinc-500 dark:text-zinc-400">{label} · BPHS 24.{verse.verse}</summary>
      <div className="mt-1 space-y-0.5 text-[11px]">
        <div lang="sa">{verse.sanskrit[0]}</div>
        <div lang="sa">{verse.sanskrit[1]}</div>
        <div className="italic text-zinc-500 dark:text-zinc-400">{verse.iast[0]}</div>
        <div className="italic text-zinc-500 dark:text-zinc-400">{verse.iast[1]}</div>
        {verse.note && <div className="text-amber-700 dark:text-amber-400">{t(verse.note)}</div>}
      </div>
    </details>
  );
}

/**
 * The effect of the lord of each house in the house it stands in, Bṛhat Parāśara Horā Śāstra chapter 24 (verses 1–144), each with the verse as the text has it and a short summary. A lord of two signs
 * gives both effects (24.146). The strength of the lord decides how much of the effect is given (24.147–148); that is not worked out here.
 */
export default function BhavaLordPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const language = useLanguage();
  const { name: grahaName } = useGrahaNames();
  const readings = useMemo(() => bhavaLordReadings(chart.planets, chart.ascendant.sign), [chart]);
  return (
    <div className="min-w-0 space-y-3" data-bhavesha="panel">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Bhāveśa — the lord of each house in its house (BPHS 24)')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The 144 verses of Bṛhat Parāśara Horā Śāstra chapter 24: for each house the effect of its lord in the house it stands in, from the Lagna. The Sanskrit is the text; the English line is a short summary of it and the verse decides. A lord of two signs gives the effects of both. How much of an effect is given by the strength of the lord (full, a half, a quarter, 24.147–148) is not worked out here. Rāhu and Ketu have no verses.')}
        </p>
      </div>
      <div className="space-y-2">
        {readings.map(reading => (
          <div key={reading.house} className="rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700" data-bhavesha-house={reading.house}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                {fill(t('Lord of the {house} house: {lord} in the {inHouse} house ({sign})'), { house: ordinal(reading.house, language), lord: grahaName(reading.lord), inHouse: ordinal(reading.inHouse, language), sign: SIGN_NAMES[reading.sign - 1] })}
              </span>
              {reading.alsoLordOf !== null && <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{fill(t('also lord of the {house} house'), { house: ordinal(reading.alsoLordOf, language) })}</span>}
            </div>
            <p className="mt-1 text-zinc-700 dark:text-zinc-200">{reading.verse.gloss}</p>
            <Verse verse={reading.verse} label={t('the verse')} />
            {reading.alsoVerse && (
              <>
                <p className="mt-2 text-zinc-700 dark:text-zinc-200"><span className="text-[10px] text-zinc-500 dark:text-zinc-400">{fill(t('and, as lord of the {house} house:'), { house: ordinal(reading.alsoVerse.lordOf, language) })}</span> {reading.alsoVerse.gloss}</p>
                <Verse verse={reading.alsoVerse} label={t('the verse')} />
              </>
            )}
          </div>
        ))}
      </div>
      <details className="rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700" data-bhavesha="rules">
        <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{t('How the effects are to be used (24.145–148)')}</summary>
        <div className="mt-2 space-y-2">
          {BHAVA_LORD_RULES.map(rule => (
            <div key={rule.verse}>
              <div className="text-zinc-700 dark:text-zinc-200">24.{rule.verse}: {rule.gloss}</div>
              <div lang="sa" className="text-[11px]">{rule.sanskrit[0]} {rule.sanskrit[1]}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
