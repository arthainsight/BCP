'use client';

import { useMemo } from 'react';
import type { ChartData } from '@/types';
import { DVIGRAHA_VERSES, dvigrahaReading } from '@/lib/dvigrahaPhala';
import type { TopicContext } from '@/lib/topicCore';
import { SIGN_NAMES } from '@/lib/signs';
import { fill, useT } from '@/lib/i18n';

function Verse({ number }: { number: number }) {
  const t = useT();
  const verse = DVIGRAHA_VERSES.find(item => item.verse === number);
  if (!verse) return null;
  return (
    <details className="mt-1 rounded border border-zinc-200 px-2 py-1 dark:border-zinc-700">
      <summary className="cursor-pointer text-[10px] text-zinc-500 dark:text-zinc-400">{t('the verse')} · Phaladīpikā 18.{number}</summary>
      <div className="mt-1 space-y-0.5 text-[11px]">{verse.sanskrit.map(line => <div key={line} lang="sa">{line}</div>)}</div>
    </details>
  );
}

/**
 * Phaladīpikā 18, "Dvigrahayoga-phala": two grahas in one sign, the Moon in its sign seen by the others, and the Moon in its navāṁśa seen by the others. The summaries are short and the verse decides; the verses are printed
 * as the text layer of the edition has them.
 */
export default function DvigrahaPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const reading = useMemo(() => {
    const context: TopicContext = {
      ascendantSign: chart.ascendant.sign,
      ratio: {},
      planets: chart.planets.map(planet => ({ name: planet.name, sign: planet.sign, degree: planet.degree, longitude: planet.longitude, isRetrograde: planet.isRetrograde })),
    };
    return dvigrahaReading(context);
  }, [chart]);
  const box = 'rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700';
  const heading = 'text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600';

  return (
    <div className="min-w-0 space-y-3" data-dvigraha="panel">
      <div>
        <div className={heading}>{t('Two grahas together, and the Moon seen by the others (Phaladīpikā 18)')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Phaladīpikā chapter 18: the results of two grahas in one sign, of the Moon in each sign seen by the other six grahas, and of the Moon in the navāṁśa of each graha seen by the others. The aspects are counted by whole signs, Rāhu and Ketu left out. The summaries are short and the verse decides; the Sanskrit is the text layer of the edition, a scan of the print, with some letters misread.')}
        </p>
      </div>

      <div className={box} data-dvigraha="pairs">
        <div className={heading}>{t('Grahas in one sign (18.1–5)')}</div>
        {reading.pairs.length === 0 && <p className="mt-1 text-zinc-500">{t('No two of the seven grahas are in one sign.')}</p>}
        {reading.pairs.map(item => (
          <div key={item.pair} className="mt-1" data-pair={item.pair}>
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{item.pair.replace('+', ' + ')}</span> <span className="text-zinc-500">({SIGN_NAMES[item.sign - 1]})</span>: {item.gloss}
            <Verse number={item.verse} />
          </div>
        ))}
        {reading.crowdedSigns.length > 0 && <p className="mt-1 text-amber-700 dark:text-amber-400">{fill(t('More than two grahas in {signs}: the results of the pairs are combined (18.5).'), { signs: reading.crowdedSigns.map(sign => SIGN_NAMES[sign - 1]).join(', ') })}</p>}
      </div>

      {reading.moon && (
        <>
          <div className={box} data-dvigraha="moon-sign">
            <div className={heading}>{fill(t('The Moon in {sign}, seen by (18.6–11)'), { sign: SIGN_NAMES[reading.moon.sign - 1] })}</div>
            {reading.moon.seenBy.length === 0 && <p className="mt-1 text-zinc-500">{t('No graha aspects the Moon.')}</p>}
            {reading.moon.seenBy.map(item => <div key={item.graha} className="mt-1"><span className="font-semibold text-zinc-700 dark:text-zinc-200">{item.graha}</span>: {item.gloss} <span className="text-[10px] text-zinc-500">(18.{item.verse})</span></div>)}
            {reading.moon.seenBy.length > 0 && <Verse number={reading.moon.seenBy[0].verse} />}
          </div>
          <div className={box} data-dvigraha="moon-navamsha">
            <div className={heading}>{fill(t('The Moon in the navāṁśa of {lord}, seen by (18.12–15)'), { lord: reading.moon.navamshaLord })}</div>
            {reading.moon.seenInNavamsha.length === 0 && <p className="mt-1 text-zinc-500">{t('No graha aspects the Moon.')}</p>}
            {reading.moon.seenInNavamsha.map(item => <div key={item.graha} className="mt-1"><span className="font-semibold text-zinc-700 dark:text-zinc-200">{item.graha}</span>: {item.gloss} <span className="text-[10px] text-zinc-500">(18.{item.verse})</span></div>)}
            {reading.moon.seenInNavamsha.length > 0 && <Verse number={reading.moon.seenInNavamsha[0].verse} />}
            <p className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400" data-placement={reading.moon.placement}>
              {t(reading.moon.placement === 'vargottama' ? 'The Moon is vargottama: the good results above are the greatest, the bad ones the least (18.17).' : reading.moon.placement === 'own' ? 'The Moon is in its own navāṁśa: the good results are middling and so are the bad (18.17).' : 'The Moon is in the navāṁśa of another graha: the good results are the least, the bad ones the greatest (18.17).')}
            </p>
            <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">{t('If the lord of the navāṁśa is strong, the results by the sign are held back and only those of the navāṁśa come (18.17); the results by the sign are the dvādaśāṁśa ones and those by the navāṁśa the navāṁśa ones (18.16).')}</p>
            <Verse number={16} />
            <Verse number={17} />
          </div>
        </>
      )}
    </div>
  );
}
