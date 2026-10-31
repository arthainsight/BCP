'use client';
import { useMemo } from 'react';
import type { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateAyurdayaDasha, calculateAyurdayaSubDashas, type AyurdayaKind } from '@/lib/ayurdaya';
import { fill, useT } from '@/lib/i18n';
import NakshatraDashaPanel from './NakshatraDashaPanel';

/**
 * The Paiṇḍī and Aṃśī daśās (BPHS 46.201–202): each graha's daśā is as long as the span of life it gives (43.5–22), in the order of the strongest of the
 * Lagna, Sun and Moon and the angles from it. The panel shows how the order and each graha's years were found.
 */
export default function AyurdayaPanel({ kind, planets, ascendant, birthDatetime }: {
  kind: AyurdayaKind;
  planets: PlanetData[];
  ascendant: { sign: number };
  birthDatetime: string;
}) {
  const t = useT();
  const result = useMemo(() => {
    const birth = parseDateTime(birthDatetime);
    return birth ? calculateAyurdayaDasha(kind, planets, ascendant.sign, birth) : null;
  }, [kind, planets, ascendant.sign, birthDatetime]);
  if (!result) return <div className="text-xs font-mono text-zinc-400">{t('Valid birth datetime required.')}</div>;
  const title = kind === 'paindi' ? 'paiṇḍī daśā' : 'aṃśī daśā';
  return <div className="space-y-2">
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 font-mono text-[10px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
      <div className="font-semibold">{kind === 'paindi' ? t('The daśā of each graha is as long as its Piṇḍāyu (BPHS 43.5–11, 46.201)') : t('The daśā of each graha is as long as its Aṃśāyu (BPHS 43.18–22, 46.201)')}</div>
      <p className="mt-1">{t('The first daśā is that of the strongest of the Lagna, the Sun and the Moon, then the grahas in the angles from it and so on, by strength (46.202). One round, with no Lagna row; the points the text leaves open are in docs/ayurdaya-vs-sources.md.')}</p>
      <details className="mt-2">
        <summary className="cursor-pointer">{t('How the order and the years were found')}</summary>
        <div className="mt-1 space-y-1">{result.audit.map(line => <div key={line}>· {line}</div>)}</div>
      </details>
    </div>
    <NakshatraDashaPanel
      title={title}
      subtitle={fill(t('{count} grahas · {years} years in all'), { count: result.definitions.length, years: Math.round(result.totalYears * 100) / 100 })}
      entries={result.entries}
      calculateChildren={parent => calculateAyurdayaSubDashas(parent, result.definitions)}
    />
  </div>;
}
