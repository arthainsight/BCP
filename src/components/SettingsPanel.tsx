'use client';

import { useState } from 'react';
import { ChartDisplaySettings, CalculationSettings, CharaOptions, DashaSettings, DEFAULT_DASHA_SETTINGS, RasiDashaOptions } from '@/types';
import { type DegreePrecision } from '@/lib/formatDegree';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import { DASHA_REGISTRY, DashaKey } from '@/lib/dashaRegistry';
import { AYANAMSA_OPTIONS, normalizeAyanamsaOffset } from '@/lib/ayanamsas';
import UpdatesPanel from './UpdatesPanel';
import BackupPanel from './BackupPanel';

interface Props {
  chartDisplaySettings: ChartDisplaySettings;
  onToggleChartDisplay: (key: keyof ChartDisplaySettings) => void;
  onUpdateChartDisplay?: (update: Partial<ChartDisplaySettings>) => void;
  calculationSettings: CalculationSettings;
  onUpdateCalculationSettings: (update: Partial<CalculationSettings>) => void;
  dashaSettings: DashaSettings;
  onUpdateDashaSettings: (update: Partial<DashaSettings>) => void;
}

const SELECT = 'w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300';

const BASIC_TOGGLES: { key: keyof ChartDisplaySettings; label: string }[] = [
  { key: 'showSigns', label: 'signs' },
  { key: 'showNatalPlanets', label: 'natal' },
  { key: 'showNakshatra', label: 'nakshatra' },
  { key: 'showCharaKaraka', label: 'karaka' },
  { key: 'showWorkspace', label: 'workspace mode' },
  { key: 'showTransitPlanets', label: 'transit' },
  { key: 'showOuterPlanets', label: 'outer planets' },
  { key: 'showSpecialLagnas', label: 'special lagnas' },
  { key: 'showPanchang', label: 'panchang' },
  { key: 'showGrahaDrishti', label: 'graha dṛṣṭi' },
  { key: 'showRashiDrishti', label: 'rāśi dṛṣṭi' },
];

const PRECISION_OPTIONS: [DegreePrecision, string][] = [
  ['off', 'Off'],
  ['degree', '12°'],
  ['minute', "12°34'"],
  ['second', "12°34'56\""],
];

const CORE_DASHAS = DASHA_REGISTRY.filter(d => d.group === 'Core');

function MiniToggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      role="switch"
      aria-checked={value}
      className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border transition-colors ${value ? 'bg-emerald-500 dark:bg-green-600 border-emerald-500 dark:border-green-600' : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600'}`}
    >
      <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform mt-[1px] ${value ? 'translate-x-3' : 'translate-x-0.5'}`} />
    </button>
  );
}

function Section({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
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

export default function SettingsPanel(props: Props) {
  const {
    chartDisplaySettings, onToggleChartDisplay, onUpdateChartDisplay,
    calculationSettings, onUpdateCalculationSettings,
    dashaSettings, onUpdateDashaSettings,
  } = props;

  const [displayOpen, setDisplayOpen] = useState(true);
  const [methodsOpen, setMethodsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const selectedChartStyle = chartDisplaySettings.chartStyle ?? 'north';

  const normalizedDashas = { ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas };
  const charaOptions = { ...DEFAULT_DASHA_SETTINGS.charaOptions, ...dashaSettings.charaOptions };
  const rasiOptions = { ...DEFAULT_DASHA_SETTINGS.rasiOptions, ...dashaSettings.rasiOptions };

  const saveDashaSettings = (next: DashaSettings) => {
    onUpdateDashaSettings(next);
    try { localStorage.setItem('dashaSettings', JSON.stringify(next)); } catch {}
  };

  const updateCharaOption = <K extends keyof CharaOptions,>(key: K, value: CharaOptions[K]) => {
    saveDashaSettings({ ...dashaSettings, dashas: normalizedDashas, charaOptions: { ...charaOptions, [key]: value }, rasiOptions });
  };

  const updateRasiOption = <K extends keyof RasiDashaOptions,>(key: K, value: RasiDashaOptions[K]) => {
    saveDashaSettings({ ...dashaSettings, dashas: normalizedDashas, charaOptions, rasiOptions: { ...rasiOptions, [key]: value } });
  };

  const updateChartStyle = (chartStyle: 'north' | 'south') => {
    onUpdateChartDisplay?.({ chartStyle });
    try {
      localStorage.setItem('chartDisplaySettings', JSON.stringify({ ...chartDisplaySettings, chartStyle }));
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcp:chart-style-change', { detail: chartStyle }));
    }
  };

  const toggleDasha = (key: DashaKey) => {
    const next: DashaSettings = {
      ...dashaSettings,
      dashas: { ...normalizedDashas, [key]: !normalizedDashas[key] },
      charaOptions,
      rasiOptions,
    };
    saveDashaSettings(next);
    if (key === 'bcp' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bcp:dasha-bcp-toggle', { detail: next.dashas.bcp }));
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; settings</div>

      {/* ── DISPLAY (basic — open by default) ────────────────── */}
      <Section label="display" open={displayOpen} onToggle={() => setDisplayOpen(v => !v)}>
        <div className="space-y-4">

          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              calculations
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">ayanamsa</label>
              <select className={SELECT} value={calculationSettings.ayanamsa} onChange={(e) => onUpdateCalculationSettings({ ayanamsa: e.target.value })}>
                {['Zodiac', 'Custom', 'Requested', 'Common'].map((group) => (
                  <optgroup key={group} label={group}>
                    {AYANAMSA_OPTIONS.filter((option) => option.group === group).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </optgroup>
                ))}
              </select>
              {calculationSettings.ayanamsa === 'custom-lahiri' && (
                <div className="mt-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-2">
                  <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                    Lahiri adjustment (degrees)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button type="button" className="px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-xs font-mono" onClick={() => onUpdateCalculationSettings({ ayanamsaOffsetDegrees: normalizeAyanamsaOffset((calculationSettings.ayanamsaOffsetDegrees ?? 0) - 0.1) })}>−0.1°</button>
                    <input
                      className={`${SELECT} min-w-0 text-center`}
                      type="number"
                      min="-180"
                      max="180"
                      step="0.000001"
                      value={calculationSettings.ayanamsaOffsetDegrees ?? 0}
                      onChange={(e) => onUpdateCalculationSettings({ ayanamsaOffsetDegrees: normalizeAyanamsaOffset(e.target.valueAsNumber) })}
                      aria-label="Custom Lahiri adjustment in degrees"
                    />
                    <button type="button" className="px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-xs font-mono" onClick={() => onUpdateCalculationSettings({ ayanamsaOffsetDegrees: normalizeAyanamsaOffset((calculationSettings.ayanamsaOffsetDegrees ?? 0) + 0.1) })}>+0.1°</button>
                  </div>
                  <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                    Negative subtracts from Lahiri; positive adds. Decimals are allowed (1′ = 0.016667°).
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">nakshatra zodiac</label>
              <select
                className={SELECT}
                value={calculationSettings.nakshatraMode ?? 'sidereal'}
                onChange={(e) => onUpdateCalculationSettings({ nakshatraMode: e.target.value as 'sidereal' | 'tropical' })}
              >
                <option value="sidereal">Sidereal (Lahiri)</option>
                <option value="tropical">Tropical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">rahu / ketu</label>
              <select className={SELECT} value={calculationSettings.nodeMode} onChange={(e) => onUpdateCalculationSettings({ nodeMode: e.target.value })}>
                <option value="mean">Mean Node</option>
                <option value="true">True Node</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">chara karaka ranking</label>
              <select
                className={SELECT}
                value={calculationSettings.charaKarakaRankMode ?? 'degree'}
                onChange={(e) => onUpdateCalculationSettings({ charaKarakaRankMode: e.target.value as 'degree' | 'minute' })}
              >
                <option value="degree">Highest degree (classical)</option>
                <option value="minute">Highest minute</option>
              </select>
              <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                Minute mode compares the minute–second remainder; Rahu is measured in reverse.
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
              chart style
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => updateChartStyle('north')}
                className={`px-3 py-2 rounded-md border text-xs font-mono ${selectedChartStyle === 'north' ? 'border-emerald-500 text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-950/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                North Indian
              </button>
              <button type="button" onClick={() => updateChartStyle('south')}
                className={`px-3 py-2 rounded-md border text-xs font-mono ${selectedChartStyle === 'south' ? 'border-emerald-500 text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-950/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                South Indian
              </button>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
              chart overlays
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {BASIC_TOGGLES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{label}</span>
                  <MiniToggle value={Boolean(chartDisplaySettings[key])} onToggle={() => onToggleChartDisplay(key)} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 shrink-0">degrees</span>
              <div className="flex gap-0.5">
                {PRECISION_OPTIONS.map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onUpdateChartDisplay?.({ degreePrecision: val })}
                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded-sm border transition-colors ${
                      (chartDisplaySettings.degreePrecision ?? 'off') === val
                        ? 'bg-emerald-500 dark:bg-green-600 border-emerald-500 dark:border-green-600 text-white'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
              dasha systems
            </div>
            <div className="space-y-1.5">
              {CORE_DASHAS.map(({ key, label, kind, conditional, status }) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 dark:border-zinc-800 px-2 py-2">
                  <span className="min-w-0 text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{label}{kind && <span className="ml-1.5 text-[9px] uppercase text-zinc-400">{kind === 'rasi' ? 'Rāśi' : kind}</span>}{status === 'beta' && <span className="ml-1.5 rounded border border-violet-300 px-1 py-0.5 text-[8px] uppercase text-violet-700 dark:border-violet-700 dark:text-violet-300">Beta</span>}{conditional && <span className="ml-1.5 rounded border border-amber-300 px-1 py-0.5 text-[8px] uppercase text-amber-700 dark:border-amber-700 dark:text-amber-300">Conditional</span>}</span>
                  <MiniToggle value={Boolean(normalizedDashas[key])} onToggle={() => toggleDasha(key)} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </Section>

      <Section label="dasha methods" open={methodsOpen} onToggle={() => setMethodsOpen(v => !v)}>
        <div className="space-y-4">
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Method choices update Dasha panels, the shared timeline and Event List together.</p>
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Chara Dasha</div>
            <label className="block text-xs font-mono text-zinc-500">Start sign<select className={`${SELECT} mt-1`} value={charaOptions.start} onChange={e => updateCharaOption('start', e.target.value as CharaOptions['start'])}><option value="lagna">Lagna</option><option value="ak">Atmakaraka</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">Mahadasha direction<select className={`${SELECT} mt-1`} value={charaOptions.mahadashaDirection} onChange={e => updateCharaOption('mahadashaDirection', e.target.value as CharaOptions['mahadashaDirection'])}><option value="rashi-type">Rashi type</option><option value="odd-even">Odd / even</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">Antardasha start<select className={`${SELECT} mt-1`} value={charaOptions.antardashaStart} onChange={e => updateCharaOption('antardashaStart', e.target.value as CharaOptions['antardashaStart'])}><option value="next-dasha-rasi">Next Dasha rashi</option><option value="same-dasha-rasi">Same Dasha rashi</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">Duration count<select className={`${SELECT} mt-1`} value={charaOptions.durationCount} onChange={e => updateCharaOption('durationCount', e.target.value as CharaOptions['durationCount'])}><option value="inclusive">Inclusive</option><option value="exclusive">Exclusive</option></select></label>
            <div className="flex items-center justify-between gap-3 rounded border border-zinc-200 px-2 py-2 dark:border-zinc-700"><span className="text-xs font-mono text-zinc-500">Exaltation / debilitation adjustment</span><MiniToggle value={charaOptions.exaltDebilAdjust} onToggle={() => updateCharaOption('exaltDebilAdjust', !charaOptions.exaltDebilAdjust)} /></div>
            <div className="grid grid-cols-2 gap-2"><label className="text-xs font-mono text-zinc-500">Scorpio lord<select className={`${SELECT} mt-1`} value={charaOptions.scorpioLord} onChange={e => updateCharaOption('scorpioLord', e.target.value as CharaOptions['scorpioLord'])}><option value="Ketu">Ketu</option><option value="Mars">Mars</option></select></label><label className="text-xs font-mono text-zinc-500">Aquarius lord<select className={`${SELECT} mt-1`} value={charaOptions.aquariusLord} onChange={e => updateCharaOption('aquariusLord', e.target.value as CharaOptions['aquariusLord'])}><option value="Saturn">Saturn</option><option value="Rahu">Rahu</option></select></label></div>
          </div>
          <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Rashi Dasha seeds</div>
            <label className="block text-xs font-mono text-zinc-500">Narayana<select className={`${SELECT} mt-1`} value={rasiOptions.narayanaSeed} onChange={e => updateRasiOption('narayanaSeed', e.target.value as RasiDashaOptions['narayanaSeed'])}><option value="stronger-lagna-seventh">PVR / JHora: stronger Lagna or 7th</option><option value="lagna">Research variant: Lagna only</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">Mula<select className={`${SELECT} mt-1`} value={rasiOptions.moolaSeed} onChange={e => updateRasiOption('moolaSeed', e.target.value as RasiDashaOptions['moolaSeed'])}><option value="stronger-lagna-seventh">PVR / JHora: stronger Lagna or 7th</option><option value="lagna">Research variant: Lagna only</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">Sthira<select className={`${SELECT} mt-1 opacity-70`} value={rasiOptions.sthiraMethod} disabled><option value="brahma-pvr">PVR / JHora: Brahma seed</option></select></label>
            <p className="text-[9px] font-mono text-amber-600 dark:text-amber-400">Research variants are exploratory and are identified in the result audit.</p>
          </div>
        </div>
      </Section>

      <UpdatesPanel />

      <BackupPanel />

      <Section label="about" open={aboutOpen} onToggle={() => setAboutOpen(v => !v)}>
        <div className="space-y-1.5 pt-1">
          <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
            {APP_NAME} <span className="text-zinc-400 dark:text-zinc-500">{APP_VERSION}</span>
          </div>
          <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500">by Riku Forsell</div>
          <div className="text-xs font-mono text-zinc-300 dark:text-zinc-700">discord — coming later</div>
        </div>
      </Section>
    </div>
  );
}
