'use client';

import { useState } from 'react';
import { ChartDisplaySettings, CalculationSettings, DashaSettings, DEFAULT_DASHA_SETTINGS } from '@/types';
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

type DashaKey = keyof DashaSettings['dashas'];

const SELECT = 'w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300';

const CHART_TOGGLES: { key: keyof ChartDisplaySettings; label: string }[] = [
  { key: 'showSigns', label: 'signs' },
  { key: 'showNatalPlanets', label: 'natal' },
  { key: 'showTransitPlanets', label: 'transit' },
  { key: 'showDegrees', label: 'degrees' },
  { key: 'showNakshatra', label: 'nakshatra' },
  { key: 'showCharaKaraka', label: 'karaka' },
];

const DASHA_GROUPS: { title: string; items: { key: DashaKey; label: string; note?: string }[] }[] = [
  {
    title: 'Core',
    items: [
      { key: 'bcp', label: 'Bhrigu Chakra Paddhati' },
      { key: 'vimshottari', label: 'Vimsottari' },
      { key: 'vds', label: 'Vimsottari Original' },
    ],
  },
  {
    title: 'Jaimini / Advanced',
    items: [
      { key: 'chara', label: 'Chara Dasha' },
      { key: 'charaBeta', label: 'Chara Dasha (beta)' },
      { key: 'kalaChakra', label: 'Kala Chakra Dasha', note: 'Coming soon' },
      { key: 'drig', label: 'Drig Dasha', note: 'Coming soon' },
      { key: 'mandook', label: 'Mandook Dasha', note: 'Coming soon' },
      { key: 'sthira', label: 'Sthira Dasha', note: 'Coming soon' },
      { key: 'narayana', label: 'Narayana Dasha', note: 'Coming soon' },
      { key: 'shoola', label: 'Shoola Dasha', note: 'Coming soon' },
      { key: 'trikona', label: 'Trikona Dasha', note: 'Coming soon' },
    ],
  },
  {
    title: 'Rare / Experimental',
    items: [
      { key: 'muktashtaka', label: 'Muktashtaka Dasha', note: 'Coming soon' },
      { key: 'gangadhar', label: 'Gangadhar Dasha', note: 'Coming soon' },
      { key: 'tara', label: 'Tara Dasha', note: 'Coming soon' },
      { key: 'yogaVimshottari', label: 'Yoga Vimsottari', note: 'Coming soon' },
      { key: 'ashtottari', label: 'Ashtottari Dasha', note: 'Coming soon' },
    ],
  },
];

function MiniToggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border transition-colors ${value ? 'bg-emerald-500 dark:bg-green-600 border-emerald-500 dark:border-green-600' : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600'}`} role="switch" aria-checked={value}>
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

export default function SettingsPanel({ chartDisplaySettings, onToggleChartDisplay, onUpdateChartDisplay, calculationSettings, onUpdateCalculationSettings, dashaSettings, onUpdateDashaSettings }: Props) {
  const [chartsOpen, setChartsOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [dashaOpen, setDashaOpen] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  const normalizedDashas = { ...DEFAULT_DASHA_SETTINGS.dashas, ...dashaSettings.dashas };

  const toggleDasha = (key: DashaKey) => {
    const next: DashaSettings = {
      ...dashaSettings,
      dashas: { ...normalizedDashas, [key]: !normalizedDashas[key] },
      charaOptions: dashaSettings.charaOptions ?? DEFAULT_DASHA_SETTINGS.charaOptions,
    };
    onUpdateDashaSettings(next);
    try { localStorage.setItem('dashaSettings', JSON.stringify(next)); } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; settings</div>

      <Section label="charts" open={chartsOpen} onToggle={() => setChartsOpen((v) => !v)}>
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">chart style</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onUpdateChartDisplay?.({ chartStyle: 'north' })} className="px-3 py-2 rounded-md border text-xs font-mono border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">North Indian</button>
              <button type="button" onClick={() => onUpdateChartDisplay?.({ chartStyle: 'south' })} className="px-3 py-2 rounded-md border text-xs font-mono border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">South Indian</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {CHART_TOGGLES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3"><span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{label}</span><MiniToggle value={Boolean(chartDisplaySettings[key])} onToggle={() => onToggleChartDisplay(key)} /></div>
            ))}
          </div>
        </div>
      </Section>

      <Section label="calculations" open={calcOpen} onToggle={() => setCalcOpen((v) => !v)}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">ayanamsa</label>
            <select className={SELECT} value={calculationSettings.ayanamsa} onChange={(e) => onUpdateCalculationSettings({ ayanamsa: e.target.value })}>
              <option value="tropical">Tropical (Sayana)</option>
              <option value="lahiri">Lahiri</option>
              <option value="raman">Raman</option>
              <option value="krishnamurti">Krishnamurti / KP</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">rahu / ketu</label>
            <select className={SELECT} value={calculationSettings.nodeMode} onChange={(e) => onUpdateCalculationSettings({ nodeMode: e.target.value })}>
              <option value="mean">Mean Node</option>
              <option value="true">True Node</option>
            </select>
          </div>
        </div>
      </Section>

      <Section label="dasha" open={dashaOpen} onToggle={() => setDashaOpen((v) => !v)}>
        <div className="space-y-4">
          {DASHA_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{group.title}</div>
              {group.items.map(({ key, label, note }) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 dark:border-zinc-800 px-2 py-2">
                  <div className="min-w-0">
                    <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{label}</div>
                    {note && <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{note}</div>}
                  </div>
                  <MiniToggle value={Boolean(normalizedDashas[key])} onToggle={() => toggleDasha(key)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      <UpdatesPanel />
      <Section label="about" open={aboutOpen} onToggle={() => setAboutOpen((v) => !v)}>
        <div className="space-y-1.5 pt-1"><div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">{APP_NAME} <span className="text-zinc-400 dark:text-zinc-500">{APP_VERSION}</span></div><div className="text-xs font-mono text-zinc-400 dark:text-zinc-500">by Riku Forsell</div><div className="text-xs font-mono text-zinc-300 dark:text-zinc-700">discord — coming later</div></div>
      </Section>
    </div>
  );
}
