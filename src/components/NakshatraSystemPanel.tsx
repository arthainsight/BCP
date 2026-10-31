'use client';
import { useMemo, useState } from 'react';
import type { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateNakshatraSystem, evaluateNakshatraSystem, nakshatraSystem, nakshatraSystemSubDashas, type ConditionFact, type NakshatraSystemKey } from '@/lib/nakshatraSystems';
import { fill, useT } from '@/lib/i18n';
import NakshatraDashaPanel from './NakshatraDashaPanel';

/**
 * One of the conditional nakṣatra daśās of BPHS 46.24–43. The panel says first what the text asks of the birth and whether this chart
 * meets it; a chart that does not is not given the daśā unless asked.
 */
export default function NakshatraSystemPanel({ system: key, planets, ascendant, birthDatetime }: {
  system: NakshatraSystemKey;
  planets: PlanetData[];
  ascendant: { longitude: number; sign: number };
  birthDatetime: string;
}) {
  const t = useT();
  const [forced, setForced] = useState(false);
  const system = nakshatraSystem(key);
  const condition = useMemo(() => evaluateNakshatraSystem(key, { planets, ascendant }), [key, planets, ascendant]);
  const result = useMemo(() => {
    const moon = planets.find(planet => planet.name === 'Moon');
    const birth = parseDateTime(birthDatetime);
    return moon && birth ? calculateNakshatraSystem(key, moon.longitude, birth) : null;
  }, [key, planets, birthDatetime]);
  if (!result) return <div className="text-xs font-mono text-zinc-400">{t('Moon and birth datetime required.')}</div>;

  const text = (fact: ConditionFact) => fill(t(fact.template), Object.fromEntries(Object.entries(fact.values ?? {}).map(([name, value]) => [name, t(value)])));
  const met = condition.met === true;
  const badge = met ? t('Condition met') : condition.met === false ? t('Condition not met') : t('Condition cannot be read');
  const badgeClass = met
    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
    : 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300';
  const header = <div className="space-y-2 font-mono">
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-widest text-zinc-500">&gt; {system.name.toLowerCase()} daśā</span>
      <span className={`rounded border px-1.5 py-0.5 text-[9px] uppercase ${badgeClass}`}>{badge}</span>
      <span className="text-[9px] text-zinc-400">BPHS {system.verses}</span>
    </div>
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-[10px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
      <div className="font-semibold">{t('When the daśā applies')}: {t(system.condition)}</div>
      {condition.facts.map(fact => <div key={text(fact)}>· {text(fact)}</div>)}
      {system.note && <p className="mt-2 text-amber-700 dark:text-amber-400">{t(system.note)}</p>}
    </div>
  </div>;

  if (!met && !forced) return <div className="space-y-3">
    {header}
    <button type="button" onClick={() => setForced(true)} className="rounded border border-zinc-300 px-2.5 py-1.5 text-[10px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">{t('Calculate anyway')}</button>
  </div>;
  return <div className="space-y-2">
    {header}
    {!met && <div className="inline-flex rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[9px] font-mono uppercase text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">{t('Forced · condition not met')}</div>}
    <NakshatraDashaPanel
      title={`${system.name.toLowerCase()} daśā`}
      subtitle={fill(t('{nakshatra} · {lord} birth balance · {years}-year conditional system'), { nakshatra: result.nakshatra, lord: result.startLord, years: result.totalYears })}
      entries={result.entries}
      calculateChildren={parent => nakshatraSystemSubDashas(key, parent)}
    />
  </div>;
}
