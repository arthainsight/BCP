'use client';

import { useState } from 'react';
import { ChartDisplaySettings, CalculationSettings } from '@/types';
import { APP_NAME, APP_VERSION } from '@/lib/config';
import ThemeToggle from './ThemeToggle';
import UpdatesPanel from './UpdatesPanel';

interface Props {
  chartDisplaySettings: ChartDisplaySettings;
  onToggleChartDisplay: (key: keyof ChartDisplaySettings) => void;
  calculationSettings: CalculationSettings;
  onUpdateCalculationSettings: (update: Partial<CalculationSettings>) => void;
}

const CHART_TOGGLES: { key: keyof ChartDisplaySettings; label: string }[] = [
  { key: 'showSigns',          label: 'signs' },
  { key: 'showNatalPlanets',   label: 'natal' },
  { key: 'showTransitPlanets', label: 'transit' },
  { key: 'showDegrees',        label: 'degrees' },
  { key: 'showNakshatra',      label: 'nakshatra' },
  { key: 'showCharaKaraka',    label: 'karaka' },
  { key: 'showSanskrit',       label: 'sanskrit' },
];

function MiniToggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border transition-colors focus:outline-none ${
        value
          ? 'bg-emerald-500 dark:bg-green-600 border-emerald-500 dark:border-green-600'
          : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600'
      }`}
      role="switch"
      aria-checked={value}
    >
      <span
        className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform mt-[1px] ${
          value ? 'translate-x-3' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function CollapsibleSection({
  label, open, onToggle, children,
}: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-2">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full text-left"
      >
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex-1">
          &gt; {label}
        </span>
        <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  );
}

const SELECT =
  'w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:focus:ring-green-500';

export default function SettingsPanel({
  chartDisplaySettings, onToggleChartDisplay,
  calculationSettings, onUpdateCalculationSettings,
}: Props) {
  const [chartsOpen, setChartsOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; settings</div>

      {/* Theme */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">theme</span>
        <ThemeToggle />
      </div>

      {/* Charts — collapsible, compact 2-col grid */}
      <CollapsibleSection label="charts" open={chartsOpen} onToggle={() => setChartsOpen((v) => !v)}>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {CHART_TOGGLES.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">{label}</span>
              <MiniToggle value={chartDisplaySettings[key]} onToggle={() => onToggleChartDisplay(key)} />
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Calculations — collapsible */}
      <CollapsibleSection label="calculations" open={calcOpen} onToggle={() => setCalcOpen((v) => !v)}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
              ayanamsa
            </label>
            <select
              className={SELECT}
              value={calculationSettings.ayanamsa}
              onChange={(e) => onUpdateCalculationSettings({ ayanamsa: e.target.value })}
            >
              <option value="lahiri">Lahiri (Chitrapaksha)</option>
              <option value="raman" disabled>Raman — coming soon</option>
              <option value="kp" disabled>KP — coming soon</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">
              rahu / ketu
            </label>
            <select
              className={SELECT}
              value={calculationSettings.nodeMode}
              onChange={(e) => onUpdateCalculationSettings({ nodeMode: e.target.value })}
            >
              <option value="mean">Mean Node</option>
              <option value="true" disabled>True Node — coming soon</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Updates */}
      <UpdatesPanel />

      {/* About — collapsible */}
      <CollapsibleSection label="about" open={aboutOpen} onToggle={() => setAboutOpen((v) => !v)}>
        <div className="space-y-1.5 pt-1">
          <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
            {APP_NAME} <span className="text-zinc-400 dark:text-zinc-500">{APP_VERSION}</span>
          </div>
          <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500">by Riku Forsell</div>
          <div className="text-xs font-mono text-zinc-300 dark:text-zinc-700">discord — coming later</div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
