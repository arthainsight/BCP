'use client';
import { useState } from 'react';
import type { BcpResult, DashaSettings, PlanetData } from '@/types';
import DashaPanel from './DashaPanel';
import DashaEventList from './DashaEventList';
import DashaOverlap from './DashaOverlap';

type Tab = 'timeline' | 'finder' | 'events' | 'patterns' | 'overlap' | 'systems';
const TABS: { key: Tab; label: string }[] = [{ key: 'timeline', label: 'Timeline' }, { key: 'finder', label: 'Finder' }, { key: 'events', label: 'Events' }, { key: 'patterns', label: 'Patterns' }, { key: 'overlap', label: 'Overlap' }, { key: 'systems', label: 'Systems' }];
interface Props { bcp: BcpResult; planets: PlanetData[]; ascendant: { longitude: number; sign: number; degree: number }; birthDatetime: string; dashaSettings: DashaSettings; transitPlanets?: PlanetData[]; transitDatetime?: string; onSetTransitDatetime?: (value: string) => void; onOpenVargaMatrix?: () => void; collapsible?: boolean; }
export default function DashaWorkspace(props: Props) {
  const [tab, setTab] = useState<Tab>('timeline');
  return <div className="min-w-0 space-y-3"><div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 sm:flex sm:overflow-x-auto dark:bg-zinc-800">{TABS.map(item => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`min-h-11 min-w-0 rounded-md px-2 py-2 text-[11px] font-mono sm:min-w-max sm:flex-1 sm:px-3 sm:text-xs ${tab === item.key ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-emerald-300' : 'text-zinc-500 dark:text-zinc-400'}`}>{item.label}</button>)}</div>
    {(tab === 'events' || tab === 'patterns') ? <DashaEventList key={props.birthDatetime} planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} transitPlanets={props.transitPlanets} transitDatetime={props.transitDatetime} onSetTransitDatetime={props.onSetTransitDatetime} onOpenVargaMatrix={props.onOpenVargaMatrix} mode={tab} /> : tab === 'overlap' ? <DashaOverlap planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} /> : <DashaPanel bcp={props.bcp} planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} collapsible={props.collapsible} view={tab} />}
  </div>;
}
