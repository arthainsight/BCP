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
type DashaStatus = 'implemented' | 'beta' | 'placeholder';
type DashaItem = { key: DashaKey; label: string; status: DashaStatus };

const SELECT = 'w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300';

const CHART_TOGGLES: { key: keyof ChartDisplaySettings; label: string }[] = [
  { key: 'showSigns', label: 'signs' },
  { key: 'showNatalPlanets', label: 'natal' },
  { key: 'showTransitPlanets', label: 'transit' },
  { key: 'showDegrees', label: 'degrees' },
  { key: 'showNakshatra', label: 'nakshatra' },
  { key: 'showCharaKaraka', label: 'karaka' },
];

const DASHA_GROUPS: { title: string; items: DashaItem[] }[] = [
  {
    title: 'Core',
    items: [
      { key: 'bcp', label: 'Bhrigu Chakra Paddhati', status: 'implemented' },
      { key: 'vimshottari', label: 'Vimsottari', status: 'implemented' },
      { key: 'vds', label: 'Vimsottari Original', status: 'implemented' },
    ],
  },
  {
    title: 'Experimental',
    items: [
      { key: 'chara', label: 'Chara Dasha', status: 'beta' },
    ],
  },
  {
    title: 'Other systems',
    items: [
      { key: 'tara', label: 'Tara Dasha', status: 'placeholder' },
      { key: 'yogini', label: 'Yogini Dasha', status: 'placeholder' },
      { key: 'ashtottari', label: 'Ashtottari Dasha', status: 'placeholder' },
      { key: 'shodashottari', label: 'Shodashottari Dasha', status: 'placeholder' },
      { key: 'dwadashottari', label: 'Dwadashottari Dasha', status: 'placeholder' },
      { key: 'panchottari', label: 'Panchottari Dasha', status: 'placeholder' },
      { key: 'shatabdika', label: 'Shatabdika Dasha', status: 'placeholder' },
      { key: 'chaturashitiSama', label: 'Chaturashiti Sama Dasha', status: 'placeholder' },
      { key: 'dwisaptatiSama', label: 'Dwisaptati Sama Dasha', status: 'placeholder' },
      { key: 'shashtihayani', label: 'Shashtihayani Dasha', status: 'placeholder' },
      { key: 'shattrimshaSama', label: 'Shattrimsha Sama Dasha', status: 'placeholder' },
      { key: 'charaBeta', label: 'Chara Dasha old beta', status: 'placeholder' },
      { key: 'narayana', label: 'Narayana Dasha', status: 'placeholder' },
      { key: 'kaalChakra', label: 'Kaal Chakra Dasha', status: 'placeholder' },
      { key: 'kalaChakra', label: 'Kalachakra Dasha', status: 'placeholder' },
      { key: 'sudarshanaChakra', label: 'Sudarshana Chakra Dasha', status: 'placeholder' },
      { key: 'moola', label: 'Moola Dasha', status: 'placeholder' },
      { key: 'naisargika', label: 'Naisargika Dasha', status: 'placeholder' },
      { key: 'pinda', label: 'Pinda Dasha', status: 'placeholder' },
      { key: 'mandooka', label: 'Mandooka Dasha', status: 'placeholder' },
      { key: 'manduka', label: 'Manduka Dasha', status: 'placeholder' },
      { key: 'sthira', label: 'Sthira Dasha', status: 'placeholder' },
      { key: 'brahma', label: 'Brahma Dasha', status: 'placeholder' },
      { key: 'drig', label: 'Drig Dasha', status: 'placeholder' },
      { key: 'trikona', label: 'Trikona Dasha', status: 'placeholder' },
      { key: 'kendradi', label: 'Kendradi Dasha', status: 'placeholder' },
      { key: 'karaka', label: 'Karaka Dasha', status: 'placeholder' },
      { key: 'lagnaKendradiRashi', label: 'Lagna Kendradi Rashi Dasha', status: 'placeholder' },
      { key: 'atmakarakaKendradiRashi', label: 'Atmakaraka Kendradi Rashi Dasha', status: 'placeholder' },
    ],
  },
];

function MiniToggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} role="switch" aria-checked={value} className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border transition-colors ${value ? 'bg-emerald-500 dark:bg-green-600 border-emerald-500 dark:border-green-600' : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600'}`}>
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
  const { chartDisplaySettings, onToggleChartDisplay, onUpdateChartDisplay, calculationSettings, onUpdateCalculationSettings, dashaSettings, onUpdateDashaSettings } = props;
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

      <Section label="charts" open={chartsOpen} onToggle={() => setChartsOpen(v => !v)}>
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
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{label}</span>
                <MiniToggle value={Boolean(chartDisplaySettings[key])} onToggle={() => onToggleChartDisplay(key)} />
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section label="calculations" open={calcOpen} onToggle={() => setCalcOpen(v => !v)}>
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

      <Section label="dasha" open={dashaOpen} onToggle={() => setDashaOpen(v => !v)}>
        <div className="space-y-4">
          <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">
            Only implemented and beta dashas can be enabled. Other systems are listed for future support.
          </div>
          {DASHA_GROUPS.map(group => (
            <div key={group.title} className="space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{group.title}</div>
              {group.items.map(({ key, label, status }) => {
                const isPlaceholder = status === 'placeholder';
                return (
                  <div key={key} className={`flex items-center justify-between gap-3 rounded-md border px-2 py-2 ${isPlaceholder ? 'border-zinc-100 dark:border-zinc-800 opacity-60' : 'border-zinc-100 dark:border-zinc-800'}`}>
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">
                        {label}{status === 'beta' ? ' (beta)' : ''}
                      </div>
                      {isPlaceholder && <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">Coming soon</div>}
                    </div>
                    {isPlaceholder ? (
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 whitespace-nowrap">Coming soon</span>
                    ) : (
                      <MiniToggle value={Boolean(normalizedDashas[key])} onToggle={() => toggleDasha(key)} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Section>

      <UpdatesPanel />

      <Section label="about" open={aboutOpen} onToggle={() => setAboutOpen(v => !v)}>
        <div className="space-y-1.5 pt-1">
          <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300">{APP_NAME} <span className="text-zinc-400 dark:text-zinc-500">{APP_VERSION}</span></div>
          <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500">by Riku Forsell</div>
          <div className="text-xs font-mono text-zinc-300 dark:text-zinc-700">discord — coming later</div>
        </div>
      </Section>
    </div>
  );
}
