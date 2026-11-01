'use client';

import { useMemo } from 'react';
import type { ChartData } from '@/types';
import { GRAHA_BHAVA_VERSES, grahaBhavaReading } from '@/lib/grahaBhavaPhala';
import { moonWaxing } from '@/lib/topicCore';
import { SIGN_NAMES } from '@/lib/signs';
import { fill, useT } from '@/lib/i18n';
import { useGrahaNames } from '@/lib/grahaNames';

function Verse({ number }: { number: number }) {
  const t = useT();
  const verse = GRAHA_BHAVA_VERSES.find(item => item.verse === number);
  if (!verse) return null;
  return (
    <details className="mt-1 rounded border border-zinc-200 px-2 py-1 dark:border-zinc-700" data-bhava-verse={number}>
      <summary className="cursor-pointer text-[10px] text-zinc-500 dark:text-zinc-400">{t('the verse')} · Phaladīpikā 8.{number}</summary>
      <div className="mt-1 space-y-0.5 text-[11px]">{verse.sanskrit.map(line => <div key={line} lang="sa">{line}</div>)}</div>
      {verse.note && <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">{t(verse.note)}</p>}
    </details>
  );
}

/**
 * Phaladīpikā 8, "Grahabhāvaphalabheda": the result of each graha, Rāhu and Ketu in the house of the chart from the lagna, with the verse; and, by 8.34–35, how far the graha is from the middle of the house, the degree of the lagna repeated in each sign.
 */
export default function GrahaBhavaPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const { name: grahaName } = useGrahaNames();
  const reading = useMemo(() => {
    const planets = chart.planets.map(planet => ({ name: planet.name, sign: planet.sign, degree: planet.degree, longitude: planet.longitude }));
    return grahaBhavaReading({
      ascendantSign: chart.ascendant.sign,
      ascendantLongitude: chart.ascendant.longitude,
      planets,
      moonWaxing: moonWaxing({ ascendantSign: chart.ascendant.sign, ratio: {}, planets: planets.map(planet => ({ ...planet })) }),
    });
  }, [chart]);
  const heading = 'text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600';

  return (
    <div className="min-w-0 space-y-3" data-bhava="panel">
      <div>
        <div className={heading}>{t('Grahas in the houses (Phaladīpikā 8)')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Phaladīpikā chapter 8: the result of each graha, and of Rāhu and Ketu, in the house it stands in from the lagna. The summaries are short and the verse decides; the Sanskrit is the text layer of the edition, a scan of the print, with the plain misreadings corrected. The commentary also quotes the Sārāvalī and the Jātakābharaṇa; those are not used here.')}
        </p>
        {reading.middleDegree !== null && (
          <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {fill(t('By 8.34–35 a graha gives the whole result of its house at the middle of the house, which is the degree of the lagna ({degree}°) in each sign, and less or more the farther or nearer it is; the text gives no measure. Rāhu acts like Saturn and Ketu like Mars.'), { degree: reading.middleDegree.toFixed(1) })}
          </p>
        )}
      </div>
      <div className="space-y-2">
        {reading.rows.map(row => (
          <div key={row.graha} className="rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700" data-bhava-graha={row.graha} data-house={row.house}>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-zinc-700 dark:text-zinc-200">{grahaName(row.graha)}</span>
              <span className="text-zinc-500">{fill(t('in the {house} house ({sign}), 8.{verse}'), { house: String(row.house), sign: SIGN_NAMES[row.sign - 1], verse: String(row.verse) })}</span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-700 dark:text-zinc-200">{row.result}</div>
            {row.variant && <div className="mt-0.5 text-[11px] text-sky-700 dark:text-sky-400" data-bhava-variant>{row.variant}</div>}
            {row.fromMiddle !== null && (
              <div className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400" data-bhava-middle>{fill(t('{degrees}° from the middle of the house (8.34–35)'), { degrees: row.fromMiddle.toFixed(1) })}</div>
            )}
            <Verse number={row.verse} />
          </div>
        ))}
      </div>
      <details className="rounded-lg border border-zinc-200 p-2 font-mono text-xs dark:border-zinc-700">
        <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{t('The verses on the strength by degrees (8.34–35)')}</summary>
        <div className="mt-2"><Verse number={34} /><Verse number={35} /></div>
      </details>
    </div>
  );
}
