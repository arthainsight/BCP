'use client';
import { useState } from 'react';
import type { BcpResult, DashaSettings, PlanetData } from '@/types';
import DashaPanel from './DashaPanel';
import DashaEventList from './DashaEventList';

type Tab = 'timeline' | 'finder' | 'events' | 'patterns' | 'systems';
const TABS: { key: Tab; label: string }[] = [{ key: 'timeline', label: 'Timeline' }, { key: 'finder', label: 'Finder' }, { key: 'events', label: 'Events' }, { key: 'patterns', label: 'Patterns' }, { key: 'systems', label: 'Systems' }];
interface Props { bcp: BcpResult; planets: PlanetData[]; ascendant: { longitude: number; sign: number; degree: number }; birthDatetime: string; dashaSettings: DashaSettings; transitPlanets?: PlanetData[]; transitDatetime?: string; onSetTransitDatetime?: (value: string) => void; onOpenVargaMatrix?: () => void; collapsible?: boolean; }
export default function DashaWorkspace(props: Props) {
  const [tab, setTab] = useState<Tab>('timeline');
  return <div className="space-y-3"><div className="flex gap-1 overflow-x-auto rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">{TABS.map(item => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`min-w-max flex-1 rounded-md px-3 py-1.5 text-xs font-mono ${tab === item.key ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-emerald-300' : 'text-zinc-500 dark:text-zinc-400'}`}>{item.label}</button>)}</div>
    {(tab === 'events' || tab === 'patterns') ? <DashaEventList key={props.birthDatetime} planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} transitPlanets={props.transitPlanets} transitDatetime={props.transitDatetime} onSetTransitDatetime={props.onSetTransitDatetime} onOpenVargaMatrix={props.onOpenVargaMatrix} mode={tab} /> : <DashaPanel bcp={props.bcp} planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} collapsible={props.collapsible} view={tab} />}
  </div>;
}
