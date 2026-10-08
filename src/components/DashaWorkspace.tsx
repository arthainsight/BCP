'use client';
import { useState } from 'react';
import type { BcpResult, CalculationSettings, ChartData, ChartDisplaySettings, DashaSettings, PlanetData } from '@/types';
import type { TransitLocation } from '@/hooks/useEventTransits';
import DashaPanel from './DashaPanel';
import DashaEventList from './DashaEventList';
import DashaOverlap from './DashaOverlap';
import DashaEventTimeline from './DashaEventTimeline';
import DashaYearly from './DashaYearly';
import DashaSlider from './DashaSlider';

type Tab = 'timeline' | 'slider' | 'yearly' | 'finder' | 'events' | 'history' | 'patterns' | 'overlap' | 'systems';
const TABS: { key: Tab; label: string }[] = [{ key: 'timeline', label: 'Timeline' }, { key: 'slider', label: 'Slider' }, { key: 'yearly', label: 'Yearly' }, { key: 'finder', label: 'Finder' }, { key: 'events', label: 'Events' }, { key: 'history', label: 'History' }, { key: 'patterns', label: 'Patterns' }, { key: 'overlap', label: 'Overlap' }, { key: 'systems', label: 'Systems' }];
interface Props { chart?: ChartData; chartDisplaySettings?: ChartDisplaySettings; transitLocation?: TransitLocation; calculationSettings?: CalculationSettings; targetDate?: string; bcp: BcpResult; planets: PlanetData[]; ascendant: { longitude: number; sign: number; degree: number }; birthDatetime: string; dashaSettings: DashaSettings; transitPlanets?: PlanetData[]; transitDatetime?: string; onSetTransitDatetime?: (value: string) => void; onOpenVargaMatrix?: () => void; onOpenDateInChart?: (date: string) => void; }
export default function DashaWorkspace(props: Props) {
  const [tab, setTab] = useState<Tab>('timeline');
  return <div className="min-w-0 space-y-3"><div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 sm:flex sm:overflow-x-auto dark:bg-zinc-800">{TABS.map(item => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`min-h-11 min-w-0 rounded-md px-2 py-2 text-[11px] font-mono sm:min-w-max sm:flex-1 sm:px-3 sm:text-xs ${tab === item.key ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-emerald-300' : 'text-zinc-500 dark:text-zinc-400'}`}>{item.label}</button>)}</div>
    {tab === 'slider' ? <DashaSlider planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} targetDate={props.targetDate} /> : tab === 'yearly' ? <DashaYearly planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} targetDate={props.targetDate} /> : (tab === 'events' || tab === 'patterns') ? <DashaEventList chart={props.chart} chartDisplaySettings={props.chartDisplaySettings} transitLocation={props.transitLocation} calculationSettings={props.calculationSettings} key={props.birthDatetime} planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} transitPlanets={props.transitPlanets} transitDatetime={props.transitDatetime} onSetTransitDatetime={props.onSetTransitDatetime} onOpenVargaMatrix={props.onOpenVargaMatrix} onOpenDateInChart={props.onOpenDateInChart} mode={tab} /> : tab === 'history' ? <DashaEventTimeline planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} /> : tab === 'overlap' ? <DashaOverlap planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} /> : <DashaPanel targetDate={props.targetDate} bcp={props.bcp} planets={props.planets} ascendant={props.ascendant} birthDatetime={props.birthDatetime} dashaSettings={props.dashaSettings} view={tab} />}
  </div>;
}
