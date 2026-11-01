'use client';

import { useMemo } from 'react';
import type { ChartData } from '@/types';
import { LAGNA_PHALA_VERSES, lagnaPhalaReading } from '@/lib/lagnaPhala';
import { SIGN_NAMES } from '@/lib/signs';
import { fill, useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

function Verse({ number }: { number: number }) {
  const t = useT();
  const verse = LAGNA_PHALA_VERSES.find(item => item.verse === number);
  if (!verse) return null;
  return (
    <details className="mt-1 rounded border border-zinc-200 px-2 py-1 dark:border-zinc-700" data-lagna-verse={number}>
      <summary className="cursor-pointer text-[10px] text-zinc-500 dark:text-zinc-400">{t('the verse')} · Phaladīpikā 9.{number}</summary>
      <div className="mt-1 space-y-0.5 text-[11px]">{verse.sanskrit.map(line => <div key={line} lang="sa">{line}</div>)}</div>
      {verse.note && <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">{t(verse.note)}</p>}
    </details>
  );
}

const gloss = (number: number) => LAGNA_PHALA_VERSES.find(item => item.verse === number)?.gloss ?? '';

/**
 * Phaladīpikā 9, "Lagnaphalabheda": the lagna by its sign, the same for the Moon sign, and the result of each graha by its dignity (exalted, own, friend's, enemy's sign, fall, neutral sign), with the combust, retrograde and vargottama graha.
 */
export default function LagnaPhalaPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const { name: grahaName } = useGrahaNames();
  const reading = useMemo(() => lagnaPhalaReading({
    ascendantSign: chart.ascendant.sign,
    planets: chart.planets.map(planet => ({ name: planet.name, sign: planet.sign, longitude: planet.longitude, isRetrograde: planet.isRetrograde })),
  }), [chart]);
  const box = 'rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700';
  const heading = 'text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600';

  return (
    <div className="min-w-0 space-y-3" data-lagna="panel">
      <div>
        <div className={heading}>{t('The lagna and the dignity of the grahas (Phaladīpikā 9)')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Phaladīpikā chapter 9: the lagna by its sign, the same for the Moon sign, and the result of a graha by its dignity. The summaries are short and the verse decides; the Sanskrit is the text layer of the edition, a scan of the print, with the plain misreadings corrected. The commentary quotes the Jātakābharaṇa and other books for each graha; those are not used here. The friend and the enemy are the natural ones.')}
        </p>
      </div>
      <div className={box} data-lagna="sign">
        <div className={heading}>{fill(t('The lagna: {sign} (9.{verse})'), { sign: SIGN_NAMES[chart.ascendant.sign - 1], verse: String(reading.lagnaVerse) })}</div>
        <p className="mt-1 text-[11px] text-zinc-700 dark:text-zinc-200">{gloss(reading.lagnaVerse)}</p>
        <Verse number={reading.lagnaVerse} />
      </div>
      {reading.moonVerse !== null && (
        <div className={box} data-lagna="moon-sign">
          <div className={heading}>{fill(t('The Moon sign: {sign}, told like a lagna (9.13)'), { sign: SIGN_NAMES[reading.moonVerse - 1] })}</div>
          <p className="mt-1 text-[11px] text-zinc-700 dark:text-zinc-200">{gloss(reading.moonVerse)}</p>
          <Verse number={reading.moonVerse} />
          <Verse number={13} />
        </div>
      )}
      <div className="space-y-2" data-lagna="dignities">
        {reading.grahas.map(item => (
          <div key={item.graha} className={box} data-lagna-graha={item.graha} data-dignity={item.dignity}>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">{grahaName(item.graha)}</span>
              <span className="text-zinc-500">{SIGN_NAMES[item.sign - 1]} · {t(item.dignity === 'exalted' ? 'in its exaltation' : item.dignity === 'own' ? 'in its own sign' : item.dignity === 'friend' ? 'in the sign of a friend' : item.dignity === 'enemy' ? 'in the sign of an enemy' : item.dignity === 'debilitated' ? 'in its fall' : 'in a neutral sign')} (9.{item.verse})</span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-700 dark:text-zinc-200">{gloss(item.verse)}</div>
            <Verse number={item.verse} />
            {item.combust && <div className="mt-1 text-[11px] text-rose-700 dark:text-rose-400" data-lagna-combust>{t('Combust: the result of 9.19 applies.')}</div>}
            {item.retrograde && <div className="mt-1 text-[11px] text-sky-700 dark:text-sky-400" data-lagna-retrograde>{t('Retrograde: it gives the result of exaltation, even in the sign of an enemy or its fall (9.20).')}</div>}
            {item.vargottama && <div className="mt-1 text-[11px] text-sky-700 dark:text-sky-400" data-lagna-vargottama>{t('Vargottama: it gives the results told for its own sign (9.20).')}</div>}
          </div>
        ))}
      </div>
      <div className={box}>
        <div className={heading}>{t('The verses on the retrograde and the vargottama graha (9.20)')}</div>
        <Verse number={20} />
      </div>
    </div>
  );
}
