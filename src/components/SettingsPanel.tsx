'use client';

import { useEffect, useState } from 'react';
import { ChartDisplaySettings, CalculationSettings, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import { DASHA_REGISTRY, DashaKey } from '@/lib/dashaRegistry';
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

const SELECT = 'w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300';

const BASIC_TOGGLES: { key: keyof ChartDisplaySettings; label: string }[] = [
  { key: 'showSigns',        label: 'signs' },
  { key: 'showNatalPlanets', label: 'natal' },
  { key: 'showTransitPlanets', label: 'transit' },
  { key: 'showDegrees', label: 'degrees' },
  { key: 'showNakshatra', label: 'nakshatra' },
  { key: 'showNakshatraPada', label: 'pada + pada108' },
  { key: 'showD108', label: 'D108 (experimental)' },
  { key: 'showCharaKaraka', label: 'karaka' },
  { key: 'showOuterPlanets', label: 'outer planets' },
  { key: 'showSpecialLagnas', label: 'special lagnas' },
  { key: 'showPanchang', label: 'panchang' },
=======
  { key: 'showDegrees',      label: 'degrees' },
  { key: 'showNakshatra',    label: 'nakshatra' },
  { key: 'showCharaKaraka',  label: 'karaka' },
>>>>>>> 66a30bc (feat: UI modes (Simple/Research/Debug) + settings restructure, v1.25)
];

const ADVANCED_TOGGLES: { key: keyof ChartDisplaySettings; label: string }[] = [
  { key: 'showTransitPlanets', label: 'transit' },
  { key: 'showOuterPlanets',   label: 'outer planets' },
  { key: 'showSpecialLagnas',  label: 'special lagnas' },
  { key: 'showPanchang',       label: 'panchang' },
];

const CORE_DASHAS        = DASHA_REGISTRY.filter(d => d.group === 'Core');
const EXPERIMENTAL_DASHAS = DASHA_REGISTRY.filter(d => d.group === 'Experimental');
const PLACEHOLDER_DASHAS  = DASHA_REGISTRY.filter(d => d.group === 'Other systems');

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

  const [displayOpen,  setDisplayOpen]  = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [aboutOpen,    setAboutOpen]    = useState(false);
  const [selectedChartStyle, setSelectedChartStyle] = useState<'north' | 'south'>(
    chartDisplaySettings.chartStyle ?? 'north'
  );

  const normalizedDashas = { ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas };

  useEffect(() => {
    setSelectedChartStyle(chartDisplaySettings.chartStyle ?? 'north');
  }, [chartDisplaySettings.chartStyle]);

  const updateChartStyle = (chartStyle: 'north' | 'south') => {
    setSelectedChartStyle(chartStyle);
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
      charaOptions: dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions,
    };
    onUpdateDashaSettings(next);
    try { localStorage.setItem('dashaSettings', JSON.stringify(next)); } catch {}
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
                <option value="tropical">Tropical (Sayana)</option>
                <option value="lahiri">Lahiri</option>
                <option value="raman">Raman</option>
                <option value="krishnamurti">Krishnamurti / KP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">rahu / ketu</label>
              <select className={SELECT} value={calculationSettings.nodeMode} onChange={(e) => onUpdateCalculationSettings({ nodeMode: e.target.value })}>
                <option value="mean">Mean Node</option>
                <option value="true">True Node</option>
              </select>
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
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
              dasha systems
            </div>
            <div className="space-y-1.5">
              {CORE_DASHAS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 dark:border-zinc-800 px-2 py-2">
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{label}</span>
                  <MiniToggle value={Boolean(normalizedDashas[key])} onToggle={() => toggleDasha(key)} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </Section>

      {/* ── ADVANCED (collapsed by default) ──────────────────── */}
      <Section label="advanced" open={advancedOpen} onToggle={() => setAdvancedOpen(v => !v)}>
        <div className="space-y-4">

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
              chart overlays
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {ADVANCED_TOGGLES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{label}</span>
                  <MiniToggle value={Boolean(chartDisplaySettings[key])} onToggle={() => onToggleChartDisplay(key)} />
                </div>
              ))}
            </div>
          </div>

          {EXPERIMENTAL_DASHAS.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
                experimental dasha systems
              </div>
              <div className="space-y-1.5">
                {EXPERIMENTAL_DASHAS.map(({ key, label, status }) => (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 dark:border-zinc-800 px-2 py-2">
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">
                      {label}{status === 'beta' ? ' (beta)' : ''}
                    </span>
                    <MiniToggle value={Boolean(normalizedDashas[key])} onToggle={() => toggleDasha(key)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1">
              coming soon
            </div>
            <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700 leading-relaxed">
              {PLACEHOLDER_DASHAS.map(d => d.label).join(' · ')}
            </div>
          </div>

        </div>
      </Section>

      <UpdatesPanel />

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
