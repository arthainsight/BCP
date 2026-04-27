'use client';

import { useEffect, useState } from 'react';
import { ChartDisplaySettings, CalculationSettings, DashaSettings, ChartStyle } from '@/types';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import UpdatesPanel from './UpdatesPanel';

interface Props {
  chartDisplaySettings: ChartDisplaySettings;
  onToggleChartDisplay: (key: keyof ChartDisplaySettings) => void;
  onUpdateChartDisplay?: (update: Partial<ChartDisplaySettings>) => void;
  calculationSettings: CalculationSettings;
  onUpdateCalculationSettings: (update: Partial<CalculationSettings>) => void;
  dashaSettings: DashaSettings;
  onUpdateDashaSettings: (update: Partial<DashaSettings>) => void;
}

const CHART_TOGGLES: { key: keyof ChartDisplaySettings; label: string }[] = [
  { key: 'showSigns', label: 'signs' },
  { key: 'showNatalPlanets', label: 'natal' },
  { key: 'showTransitPlanets', label: 'transit' },
  { key: 'showDegrees', label: 'degrees' },
  { key: 'showNakshatra', label: 'nakshatra' },
  { key: 'showCharaKaraka', label: 'karaka' },
];

const AYANAMSA_OPTIONS = [
  { value: 'tropical', label: 'Tropical (Sayana)' },
  { value: 'lahiri', label: 'Lahiri' },
  { value: 'raman', label: 'Raman' },
  { value: 'krishnamurti', label: 'Krishnamurti / KP' },
];

function persistCalculationCookie(update: Partial<CalculationSettings>, current: CalculationSettings) {
  if (typeof document === 'undefined') return;
  const next = { ...current, ...update };
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `bcp_ayanamsa=${encodeURIComponent(next.ayanamsa)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `bcp_nodeMode=${encodeURIComponent(next.nodeMode)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function MiniToggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border transition-colors focus:outline-none ${value ? 'bg-emerald-500 dark:bg-green-600 border-emerald-500 dark:border-green-600' : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600'}`} role="switch" aria-checked={value}>
      <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform mt-[1px] ${value ? 'translate-x-3' : 'translate-x-0.5'}`} />
    </button>
  );
}

function CollapsibleSection({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-2">
      <button type="button" onClick={onToggle} className="flex items-center gap-2 w-full text-left">
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex-1">&gt; {label}</span>
        <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  );
}

const SELECT = 'w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500';

function getStoredChartStyle(fallback: ChartStyle): ChartStyle {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem('chartDisplaySettings');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ChartDisplaySettings>;
    return parsed.chartStyle === 'south' ? 'south' : 'north';
  } catch { return fallback; }
}

export default function SettingsPanel({ chartDisplaySettings, onToggleChartDisplay, onUpdateChartDisplay, calculationSettings, onUpdateCalculationSettings, dashaSettings, onUpdateDashaSettings }: Props) {
  const [chartsOpen, setChartsOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [dashaOpen, setDashaOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [localChartStyle, setLocalChartStyle] = useState<ChartStyle>(() => getStoredChartStyle(chartDisplaySettings.chartStyle ?? 'north'));

  useEffect(() => { setLocalChartStyle(getStoredChartStyle(chartDisplaySettings.chartStyle ?? 'north')); }, [chartDisplaySettings.chartStyle]);

  const updateCalculation = (update: Partial<CalculationSettings>) => {
    persistCalculationCookie(update, calculationSettings);
    onUpdateCalculationSettings(update);
  };

  const setChartStyle = (chartStyle: ChartStyle) => {
    setLocalChartStyle(chartStyle);
    try { localStorage.setItem('chartDisplaySettings', JSON.stringify({ ...chartDisplaySettings, chartStyle })); } catch {}
    onUpdateChartDisplay?.({ chartStyle });
    window.dispatchEvent(new CustomEvent('bcp:chart-style-change', { detail: chartStyle }));
  };

  const persistDashaSettings = (next: DashaSettings) => {
    onUpdateDashaSettings(next);
    try { localStorage.setItem('dashaSettings', JSON.stringify(next)); } catch {}
  };

  const toggleDasha = (key: keyof DashaSettings['dashas']) => {
    persistDashaSettings({ ...dashaSettings, dashas: { ...dashaSettings.dashas, [key]: !dashaSettings.dashas[key] } });
  };

  const updateCharaOption = <K extends keyof DashaSettings['charaOptions']>(key: K, value: DashaSettings['charaOptions'][K]) => {
    persistDashaSettings({ ...dashaSettings, charaOptions: { ...dashaSettings.charaOptions, [key]: value } });
  };

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; settings</div>

      <CollapsibleSection label="charts" open={chartsOpen} onToggle={() => setChartsOpen((v) => !v)}>
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">chart style</div>
            <div className="grid grid-cols-2 gap-2">
              {([{ value: 'north' as const, label: 'North Indian' }, { value: 'south' as const, label: 'South Indian' }]).map((option) => (
                <button key={option.value} type="button" onClick={() => setChartStyle(option.value)} className={`px-3 py-2 rounded-md border text-xs font-mono transition-colors ${localChartStyle === option.value ? 'border-emerald-400 dark:border-green-600 bg-emerald-50 dark:bg-green-900/20 text-emerald-700 dark:text-green-300' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>{option.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {CHART_TOGGLES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3"><span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{label}</span><MiniToggle value={Boolean(chartDisplaySettings[key])} onToggle={() => onToggleChartDisplay(key)} /></div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="calculations" open={calcOpen} onToggle={() => setCalcOpen((v) => !v)}>
        <div className="space-y-3">
          <div><label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">ayanamsa</label><select className={SELECT} value={calculationSettings.ayanamsa} onChange={(e) => updateCalculation({ ayanamsa: e.target.value })}>{AYANAMSA_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
          <div><label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">rahu / ketu</label><select className={SELECT} value={calculationSettings.nodeMode} onChange={(e) => updateCalculation({ nodeMode: e.target.value })}><option value="mean">Mean Node</option><option value="true">True Node</option></select></div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="dasha" open={dashaOpen} onToggle={() => setDashaOpen((v) => !v)}>
        <div className="space-y-4">
          <div className="space-y-2">
            {([{ key: 'bcp' as const, label: 'Bhrigu Chakra Paddhati' }, { key: 'vimshottari' as const, label: 'Vimsottari' }, { key: 'vds' as const, label: 'Vimsottari Original' }, { key: 'charaBeta' as const, label: 'Chara Dasha (beta)' }, { key: 'chara' as const, label: 'Chara Dasha' }]).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3"><span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">{label}</span><MiniToggle value={Boolean(dashaSettings.dashas[key])} onToggle={() => toggleDasha(key)} /></div>
            ))}
          </div>

          {dashaSettings.dashas.chara && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">chara dasha config</div>
              <select className={SELECT} value={dashaSettings.charaOptions.start} onChange={(e) => updateCharaOption('start', e.target.value as DashaSettings['charaOptions']['start'])}><option value="lagna">Start: Lagna</option><option value="ak">Start: Atmakaraka</option></select>
              <select className={SELECT} value={dashaSettings.charaOptions.mahadashaDirection} onChange={(e) => updateCharaOption('mahadashaDirection', e.target.value as DashaSettings['charaOptions']['mahadashaDirection'])}><option value="rashi-type">MD Direction: Rashi Type</option><option value="odd-even">MD Direction: Odd / Even</option></select>
              <select className={SELECT} value={dashaSettings.charaOptions.durationCount} onChange={(e) => updateCharaOption('durationCount', e.target.value as DashaSettings['charaOptions']['durationCount'])}><option value="inclusive">Duration: Inclusive</option><option value="exclusive">Duration: Exclusive</option></select>
              <select className={SELECT} value={dashaSettings.charaOptions.antardashaStart} onChange={(e) => updateCharaOption('antardashaStart', e.target.value as DashaSettings['charaOptions']['antardashaStart'])}><option value="next-dasha-rasi">AD Start: Next Dasha Rasi</option><option value="same-dasha-rasi">AD Start: Same Dasha Rasi</option></select>
              <select className={SELECT} value={dashaSettings.charaOptions.antardashaDirection} onChange={(e) => updateCharaOption('antardashaDirection', e.target.value as DashaSettings['charaOptions']['antardashaDirection'])}><option value="dasha-rasi-9h">AD Direction: Dasha Rasi 9H</option><option value="dasha-rasi">AD Direction: Dasha Rasi</option></select>
              <select className={SELECT} value={dashaSettings.charaOptions.strongerLordRule} onChange={(e) => updateCharaOption('strongerLordRule', e.target.value as DashaSettings['charaOptions']['strongerLordRule'])}><option value="graha">Stronger Lord: Graha</option><option value="rashi">Stronger Lord: Rashi</option></select>
              <select className={SELECT} value={dashaSettings.charaOptions.scorpioLord} onChange={(e) => updateCharaOption('scorpioLord', e.target.value as DashaSettings['charaOptions']['scorpioLord'])}><option value="Ketu">Scorpio Lord: Ketu</option><option value="Mars">Scorpio Lord: Mars</option></select>
              <select className={SELECT} value={dashaSettings.charaOptions.aquariusLord} onChange={(e) => updateCharaOption('aquariusLord', e.target.value as DashaSettings['charaOptions']['aquariusLord'])}><option value="Saturn">Aquarius Lord: Saturn</option><option value="Rahu">Aquarius Lord: Rahu</option></select>
              <div className="flex items-center justify-between gap-3 pt-1"><span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">Exalt / debil adjustment</span><MiniToggle value={dashaSettings.charaOptions.exaltDebilAdjust} onToggle={() => updateCharaOption('exaltDebilAdjust', !dashaSettings.charaOptions.exaltDebilAdjust)} /></div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      <UpdatesPanel />
      <CollapsibleSection label="about" open={aboutOpen} onToggle={() => setAboutOpen((v) => !v)}><div className="space-y-1.5 pt-1"><div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">{APP_NAME} <span className="text-zinc-400 dark:text-zinc-500">{APP_VERSION}</span></div><div className="text-xs font-mono text-zinc-400 dark:text-zinc-500">by Riku Forsell</div><div className="text-xs font-mono text-zinc-300 dark:text-zinc-700">discord — coming later</div></div></CollapsibleSection>
    </div>
  );
}
