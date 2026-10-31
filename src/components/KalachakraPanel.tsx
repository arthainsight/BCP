'use client';

import { useMemo, useState } from 'react';
import type { PlanetData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateKalachakra, calculateKalachakraSubDashas, type KalachakraEntry } from '@/lib/kalachakra';
import { formatDate } from '@/lib/dateFormat';
import { evaluateKalachakraCondition, KALACHAKRA_CONDITION } from '@/lib/kalachakraCondition';
import type { ConditionFact } from '@/lib/nakshatraSystems';
import { fill } from '@/lib/i18n';

import { useT } from '@/lib/i18n';
const ABBR: Record<string, string> = { Aries:'Ar', Taurus:'Ta', Gemini:'Ge', Cancer:'Cn', Leo:'Le', Virgo:'Vi', Libra:'Li', Scorpio:'Sc', Sagittarius:'Sg', Capricorn:'Cp', Aquarius:'Aq', Pisces:'Pi' };

const LEVELS = ['md', 'ad', 'pd', 'sd', 'prana', 'deha'] as const;
type Level = (typeof LEVELS)[number];
const LEVEL_LABEL: Record<Level, string> = { md: 'MD', ad: 'AD', pd: 'PD', sd: 'SD', prana: 'PR', deha: 'DE' };

function active(entry: KalachakraEntry, now: Date) {
  return entry.startDate <= now && now < entry.endDate;
}

export default function KalachakraPanel({ planets, birthDatetime, rule = 'text' }: { planets: PlanetData[]; birthDatetime: string; rule?: 'text' | 'always' }) {
  const t = useT();
  const [forced, setForced] = useState(false);
  const condition = useMemo(() => evaluateKalachakraCondition(planets), [planets]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [path, setPath] = useState<KalachakraEntry[]>([]);
  const now = useMemo(() => new Date(), []);
  const result = useMemo(() => {
    const moon = planets.find((planet) => planet.name === 'Moon');
    const birth = parseDateTime(birthDatetime);
    if (!moon || moon.longitude == null || !birth) return null;
    return calculateKalachakra(moon.longitude, birth);
  }, [planets, birthDatetime]);

  if (!result) return <div className="text-xs font-mono text-zinc-400 italic">{t('Moon longitude and valid birth datetime required.')}</div>;

  // Phaladīpikā 22.30: the Kālachakra is taken when the lord of the Moon's navāṁśa is strong; PyJHora shows it always.
  const factText = (fact: ConditionFact) => fill(t(fact.template), Object.fromEntries(Object.entries(fact.values ?? {}).map(([name, value]) => [name, t(value)])));
  const met = condition.met === true;
  const badgeClass = met
    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
    : 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300';
  const conditionBlock = (
    <div className="space-y-2 font-mono">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded border px-1.5 py-0.5 text-[9px] uppercase ${badgeClass}`}>{met ? t('Condition met') : condition.met === false ? t('Condition not met') : t('Condition cannot be read')}</span>
        <span className="text-[9px] text-zinc-400">{t('Phaladīpikā 22.30')}</span>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-[10px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="font-semibold">{t('When the daśā applies')}: {t(KALACHAKRA_CONDITION)}</div>
        {condition.facts.map(fact => <div key={factText(fact)}>· {factText(fact)}</div>)}
      </div>
    </div>
  );
  if (rule === 'text' && condition.met === false && !forced) return (
    <div className="space-y-3">
      {conditionBlock}
      <button type="button" onClick={() => setForced(true)} className="rounded border border-zinc-300 px-2.5 py-1.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">{t('Calculate anyway')}</button>
    </div>
  );

  const parent = levelIndex > 0 ? path[levelIndex - 1] : null;
  const rows = parent ? calculateKalachakraSubDashas(parent, result.cycle) : result.entries;
  const activePath: KalachakraEntry[] = [];
  let activeRows = result.entries;
  for (let index = 0; index < LEVELS.length; index++) {
    const current = activeRows.find(item => active(item, now));
    if (!current) break;
    activePath.push(current);
    activeRows = calculateKalachakraSubDashas(current, result.cycle);
  }
  const currentLevel = LEVELS[levelIndex];
  const deep = levelIndex >= 2;

  const openEntry = (entry: KalachakraEntry) => {
    if (levelIndex >= LEVELS.length - 1) return;
    setPath(previous => [...previous.slice(0, levelIndex), entry]);
    setLevelIndex(levelIndex + 1);
  };

  const goBack = () => {
    if (levelIndex === 0) return;
    setLevelIndex(levelIndex - 1);
    setPath(previous => previous.slice(0, levelIndex - 1));
  };

  const openNow = () => {
    if (activePath.length === 0) return;
    const target = Math.min(activePath.length - 1, LEVELS.length - 1);
    setPath(activePath.slice(0, target));
    setLevelIndex(target);
  };

  return (
    <div className="space-y-3 min-w-0">
      {conditionBlock}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 break-words font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">&gt; kālachakra daśā</div>
        <button type="button" onClick={openNow} className="min-h-11 rounded border border-cyan-300 px-3 py-2 text-[10px] font-mono text-cyan-700 dark:border-cyan-700 dark:text-cyan-300">{t('NOW')}</button>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        <div>{result.nakshatra} {t('· pada')} {result.pada} · {result.motion}</div>
        <div>Deha: {ABBR[result.dehaSign]} · Jīva: {ABBR[result.jeevaSign]}</div>
        {activePath.length > 0 && <div className="mt-1 break-words leading-relaxed text-cyan-700 dark:text-cyan-300">{t('Now:')} {activePath.map((entry, index) => `${ABBR[entry.signName]} ${LEVEL_LABEL[LEVELS[index]]}`).join(' › ')}</div>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={goBack} disabled={levelIndex === 0} className="min-h-11 rounded border border-zinc-300 px-3 py-2 text-[10px] font-mono disabled:opacity-30 dark:border-zinc-700">{t('← back')}</button>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{LEVEL_LABEL[currentLevel]} · {rows.length} {t('periods')}</div>
      </div>
      {path.length > 0 && <div className="break-words text-[10px] font-mono leading-relaxed text-emerald-700 dark:text-emerald-300">{path.map((entry, index) => `${ABBR[entry.signName]} ${LEVEL_LABEL[LEVELS[index]]}`).join(' › ')} › {LEVEL_LABEL[currentLevel]}</div>}
      <div className="space-y-1">
        {rows.map((item) => {
          const isNow = active(item, now);
          return (
            <button key={`${item.sign}-${item.startDate.getTime()}`} type="button" onClick={() => openEntry(item)} className={`grid min-h-11 w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 rounded-md border px-3 py-2 text-left font-mono text-xs ${isNow ? 'border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-300' : 'border-zinc-200 text-zinc-700 dark:border-zinc-700 dark:text-zinc-200'}`}>
              <span className="row-span-2 font-bold">{ABBR[item.signName]}</span>
              <span className="break-words text-[10px] sm:text-xs">{formatDate(item.startDate, deep)}–{formatDate(item.endDate, deep)}</span>
              <span className="text-[10px] text-zinc-400">{item.durationYears.toFixed(2)} y</span>
            </button>
          );
        })}
      </div>
      <p className="text-[9px] font-mono leading-relaxed text-zinc-400 dark:text-zinc-600">{t('Moon-pāda PVR/BPHS table method. Birth balance is the unelapsed portion of the first rāśi period.')}</p>
    </div>
  );
}
