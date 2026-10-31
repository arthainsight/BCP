'use client';

import { parseClock } from '@/lib/specialSphutas';
import { useState } from 'react';
import { readNakshatraMode } from '@/lib/nakshatraZodiac';
import { ChartDisplaySettings, ChartStyle, CalculationSettings, CharaOptions, DashaSettings, DEFAULT_DASHA_SETTINGS, RasiDashaOptions } from '@/types';
import { APP_NAME, APP_VERSION, SOURCE_URL } from '@/lib/config';
import { DASHA_REGISTRY, DashaKey } from '@/lib/dashaRegistry';
import { PARAYA_BODIES } from '@/lib/bnn/nadiParaya';
import ParayaChips from './ParayaChips';
import { ChartFontScaleField, DashaMarkSelect, DegreePrecisionPicker } from './ChartDisplayControls';
import { VARGA_DIVISIONS, VARGA_NAMES } from '@/lib/vargaChart';
import type { VimshottariVariantChoice } from '@/lib/vimshottariVariants';
import { DASHA_YEAR_KEYS, DASHA_YEAR_LENGTHS, type DashaYearLength } from '@/lib/time';
import { AYANAMSA_OPTIONS, normalizeAyanamsaOffset } from '@/lib/ayanamsas';
import UpdatesPanel from './UpdatesPanel';
import BackupPanel from './BackupPanel';
import { CHART_LAYER_LABELS, CHART_LAYER_SETTINGS, type ChartLayerKey } from './chartLayers';
import { LANGUAGES, useT, type Language } from '@/lib/i18n';

const YEAR_LABELS: Record<DashaYearLength, string> = {
  julian: 'Julian year',
  sidereal: 'sidereal year (PyJHora)',
  tropical: 'tropical year',
  savana: 'savana year',
};

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
  { key: 'showOuterPlanets', label: 'outer planets' },
  { key: 'showSpecialLagnas', label: 'special lagnas' },
  { key: 'showTargetBar', label: 'target date bar' },
];

// The coloured layers listed in the chart legend.
const LAYER_TOGGLES = (Object.keys(CHART_LAYER_SETTINGS) as ChartLayerKey[]).map(layer => ({
  key: CHART_LAYER_SETTINGS[layer],
  label: CHART_LAYER_LABELS[layer],
}));

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

/** A group inside a section, collapsed until opened. */
function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} className="flex w-full items-center gap-2 text-left">
        <span className="flex-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t(label)}</span>
        <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function Section({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-2">
      <button type="button" onClick={onToggle} className="flex items-center gap-2 w-full text-left">
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex-1">&gt; {t(label)}</span>
        <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{open ? '▼' : '▶'}</span>
      </button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  );
}

export default function SettingsPanel(props: Props) {
  const t = useT();
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

  const updateYearLength = (yearLength: DashaYearLength) => {
    saveDashaSettings({ ...dashaSettings, dashas: normalizedDashas, charaOptions, rasiOptions, yearLength });
  };

  const updateVariantChoice = (variantChoice: VimshottariVariantChoice) => {
    saveDashaSettings({ ...dashaSettings, dashas: normalizedDashas, charaOptions, rasiOptions, variantChoice });
  };

  const updateRasiOption = <K extends keyof RasiDashaOptions,>(key: K, value: RasiDashaOptions[K]) => {
    saveDashaSettings({ ...dashaSettings, dashas: normalizedDashas, charaOptions, rasiOptions: { ...rasiOptions, [key]: value } });
  };

  const updateChartStyle = (chartStyle: ChartStyle) => {
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
  };

  return (
    <div className="space-y-5">
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">{t('> settings')}</div>

      {/* ── DISPLAY (basic — open by default) ────────────────── */}
      <Section label="display" open={displayOpen} onToggle={() => setDisplayOpen(v => !v)}>
        <div className="space-y-4">

          <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {t('language')}
            <select
              className={`${SELECT} mt-1`}
              value={chartDisplaySettings.language ?? 'en'}
              onChange={e => onUpdateChartDisplay?.({ language: e.target.value as Language })}
            >
              {LANGUAGES.map(language => <option key={language.value} value={language.value}>{language.label}</option>)}
            </select>
          </label>

          <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {t('graha names')}
            <select
              className={`${SELECT} mt-1`}
              value={chartDisplaySettings.grahaNames ?? 'english'}
              onChange={e => onUpdateChartDisplay?.({ grahaNames: e.target.value as 'english' | 'sanskrit' })}
            >
              <option value="english">{t('English (Sun, Moon, Mars …)')}</option>
              <option value="sanskrit">{t('Sanskrit (Sūrya, Candra, Maṅgala …)')}</option>
            </select>
          </label>

          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              {t('calculations')}
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">{t('ayanamsa')}</label>
              <select className={SELECT} value={calculationSettings.ayanamsa} onChange={(e) => onUpdateCalculationSettings({ ayanamsa: e.target.value })}>
                {['Zodiac', 'Custom', 'Requested', 'Common'].map((group) => (
                  <optgroup key={group} label={t(group)}>
                    {AYANAMSA_OPTIONS.filter((option) => option.group === group).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </optgroup>
                ))}
              </select>
              {calculationSettings.ayanamsa === 'custom-lahiri' && (
                <div className="mt-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-2">
                  <label className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                    {t('Lahiri adjustment (degrees)')}
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
                      aria-label={t('Custom Lahiri adjustment in degrees')}
                    />
                    <button type="button" className="px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 text-xs font-mono" onClick={() => onUpdateCalculationSettings({ ayanamsaOffsetDegrees: normalizeAyanamsaOffset((calculationSettings.ayanamsaOffsetDegrees ?? 0) + 0.1) })}>+0.1°</button>
                  </div>
                  <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                    {t('Negative subtracts from Lahiri; positive adds. Decimals are allowed (1′ = 0.016667°).')}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">{t('nakshatra zodiac')}</label>
              <select
                className={SELECT}
                value={calculationSettings.nakshatraMode ?? 'same'}
                onChange={(e) => onUpdateCalculationSettings({ nakshatraMode: readNakshatraMode(e.target.value) })}
              >
                <option value="same">{t('Same ayanamsa as the grahas')}</option>
                {['Zodiac', 'Custom', 'Requested', 'Common'].map((group) => (
                  <optgroup key={group} label={t(group)}>
                    {AYANAMSA_OPTIONS.filter((option) => option.group === group).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </optgroup>
                ))}
              </select>
              <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                {t('The nakshatras follow the ayanamsa of the grahas unless you choose another here.')}
                {calculationSettings.nakshatraMode === 'custom-lahiri' && ` ${t('Custom Lahiri here uses the Lahiri adjustment of the ayanamsa above.')}`}
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">{t('rahu / ketu')}</label>
              <select className={SELECT} value={calculationSettings.nodeMode} onChange={(e) => onUpdateCalculationSettings({ nodeMode: e.target.value })}>
                <option value="mean">{t('Mean Node')}</option>
                <option value="true">{t('True Node')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">{t('chara karaka ranking')}</label>
              <select
                className={SELECT}
                value={calculationSettings.charaKarakaRankMode ?? 'degree'}
                onChange={(e) => onUpdateCalculationSettings({ charaKarakaRankMode: e.target.value as 'degree' | 'minute' })}
              >
                <option value="degree">{t('Highest degree (classical)')}</option>
                <option value="minute">{t('Highest minute')}</option>
              </select>
              <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                {t('Minute mode compares the minute–second remainder; Rahu is measured in reverse.')}
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">{t('chara karaka scheme')}</label>
              <select
                className={SELECT}
                value={String(calculationSettings.charaKarakaCount ?? 8)}
                onChange={(e) => onUpdateCalculationSettings({ charaKarakaCount: e.target.value === '7' ? 7 : 8 })}
              >
                <option value="8">{t('8 karakas (with Rahu and Pitṛkāraka)')}</option>
                <option value="7">{t('7 karakas (without Rahu)')}</option>
              </select>
              <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                {t('Either scheme can be ranked by degrees or by minutes. The seven-karaka scheme has no Pitṛkāraka. The charts, the grahas table and the Chara daśā follow the choice.')}
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">{t('paraya Saturn')}</label>
              <select
                className={SELECT}
                value={calculationSettings.parayaSaturn ?? 'alternating'}
                onChange={(e) => onUpdateCalculationSettings({ parayaSaturn: e.target.value as 'alternating' | 'even' })}
              >
                <option value="alternating">{t('3 / 2 years alternating')}</option>
                <option value="even">{t('2.5 years per sign')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">{t('paraya Rahu / Ketu')}</label>
              <select
                className={SELECT}
                value={calculationSettings.parayaRahu ?? 'alternating'}
                onChange={(e) => onUpdateCalculationSettings({ parayaRahu: e.target.value as 'alternating' | 'even' })}
              >
                <option value="alternating">{t('2 / 1 years alternating')}</option>
                <option value="even">{t('1.5 years per sign')}</option>
              </select>
              <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                {t('How long the Paraya graha stays in each sign. Either way a round takes 30 years for Saturn and 18 for Rahu; the chart and the Paraya tab follow the choice.')}
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">{t('paraya retrograde')}</label>
              <select
                className={SELECT}
                value={calculationSettings.parayaRetro ?? 'previous'}
                onChange={(e) => onUpdateCalculationSettings({ parayaRetro: e.target.value as 'previous' | 'same' })}
              >
                <option value="previous">{t('one sign back')}</option>
                <option value="same">{t('the natal sign')}</option>
              </select>
              <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                {t('Where a Paraya Jupiter, Saturn, Mars, Mercury or Venus that was retrograde at birth begins: in the sign before its natal sign, or in the natal sign itself, at its natal degree either way. Rahu and Ketu are not moved.')}
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1">{t('sunrise for the special sphutas')}</label>
              <select
                className={SELECT}
                value={calculationSettings.sunriseMode ?? 'true'}
                onChange={(e) => onUpdateCalculationSettings({ sunriseMode: e.target.value as 'true' | 'mean' })}
              >
                <option value="true">{t('True sunrise')}</option>
                <option value="mean">{t('Mean-time sunrise (true sunrise + equation of time)')}</option>
              </select>
              <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                {t('The Bhava, Hora, Ghati, Vighati and Prana lagnas and the other special sphutas run on the time since sunrise. Mean-time reckoning adds the equation of time to the true sunrise, about 12 minutes in October.')}
              </div>
              <label className="mt-2 flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span>{t('Use another sunrise (HH:MM:SS)')}</span>
                <input
                  value={calculationSettings.sunriseManual ?? ''}
                  onChange={(e) => onUpdateCalculationSettings({ sunriseManual: e.target.value })}
                  aria-label={t('manual sunrise')}
                  placeholder="06:28:31"
                  inputMode="numeric"
                  className="w-24 rounded border border-zinc-300 bg-white px-1.5 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800"
                />
                {(calculationSettings.sunriseManual ?? '').trim() !== '' && parseClock(calculationSettings.sunriseManual) === null && (
                  <span className="text-rose-500">{t('Not a time of day')}</span>
                )}
              </label>
              <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
                {t('For example the sunrise another program or a book uses. It replaces the calculated sunrise in the charts, the graha table and the Special Sphutas; leave it empty to use the choice above.')}
              </div>
            </div>
          </div>

          <SubSection label="chart style">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => updateChartStyle('north')}
                className={`px-3 py-2 rounded-md border text-xs font-mono ${selectedChartStyle === 'north' ? 'border-emerald-500 text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-950/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                {t('North Indian')}
              </button>
              <button type="button" onClick={() => updateChartStyle('south')}
                className={`px-3 py-2 rounded-md border text-xs font-mono ${selectedChartStyle === 'south' ? 'border-emerald-500 text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-950/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                {t('South Indian')}
              </button>
              <button type="button" onClick={() => updateChartStyle('both')}
                className={`px-3 py-2 rounded-md border text-xs font-mono ${selectedChartStyle === 'both' ? 'border-emerald-500 text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-950/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                {t('North + South')}
              </button>
              <button type="button" onClick={() => updateChartStyle('mixedNorth')}
                className={`px-3 py-2 rounded-md border text-xs font-mono ${selectedChartStyle === 'mixedNorth' ? 'border-emerald-500 text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-950/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                {t('Mixed (North)')}
              </button>
              <button type="button" onClick={() => updateChartStyle('mixedSouth')}
                className={`px-3 py-2 rounded-md border text-xs font-mono ${selectedChartStyle === 'mixedSouth' ? 'border-emerald-500 text-emerald-700 dark:text-green-400 bg-emerald-50 dark:bg-green-950/20' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                {t('Mixed (South)')}
              </button>
            </div>
            {(selectedChartStyle === 'mixedNorth' || selectedChartStyle === 'mixedSouth') && (
              <label className="mt-2 block text-xs font-mono text-zinc-500 dark:text-zinc-400">
                {t('outer chart')}
                <select
                  className={`${SELECT} mt-1`}
                  value={chartDisplaySettings.mixedOuterDivision}
                  onChange={(e) => onUpdateChartDisplay?.({ mixedOuterDivision: Number(e.target.value) })}
                >
                  {VARGA_DIVISIONS.map(division => <option key={division} value={division}>D{division} {VARGA_NAMES[division]}</option>)}
                </select>
                <span className="mt-1 block text-[9px] text-zinc-400 dark:text-zinc-600">{t('The D1 chart is drawn in the inner part of every house, and this varga chart in the outer part.')}</span>
              </label>
            )}
            <ChartFontScaleField
              className="mt-3"
              label={t('text size of the charts')}
              value={chartDisplaySettings.chartFontScale}
              onChange={chartFontScale => onUpdateChartDisplay?.({ chartFontScale })}
            />
            <div className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
              {t('The text of the full-size charts. In North + South both charts are drawn with the same size of text.')}
            </div>
          </SubSection>

          <SubSection label="chart overlays">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {BASIC_TOGGLES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{t(label)}</span>
                  <MiniToggle value={Boolean(chartDisplaySettings[key])} onToggle={() => onToggleChartDisplay(key)} />
                </div>
              ))}
            </div>
            <div className="mt-2">
              <DegreePrecisionPicker value={chartDisplaySettings.degreePrecision} onChange={degreePrecision => onUpdateChartDisplay?.({ degreePrecision })} />
            </div>
          </SubSection>

          <SubSection label="chart layers">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {LAYER_TOGGLES.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{t(label)}</span>
                  <MiniToggle value={Boolean(chartDisplaySettings[key])} onToggle={() => onToggleChartDisplay(key)} />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <ParayaChips
                bodies={chartDisplaySettings.parayaBodies ?? PARAYA_BODIES}
                onChange={next => onUpdateChartDisplay?.({ parayaBodies: next, ...(next.length > 0 ? { showNadiParaya: true } : {}) })}
              />
            </div>
            <div className="mt-2 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
              {t('RSN is the Rao Sir System of Nadi: the major (Jupiterian round) and minor progressions, and the Paraya.')}
            </div>
            <DashaMarkSelect
              value={chartDisplaySettings.dashaMarkSystem}
              onChange={dashaMarkSystem => onUpdateChartDisplay?.({ dashaMarkSystem })}
              note={t('ᴹ marks the mahādaśā lord, ᴬ the antardaśā lord, at the target date. Rāśi daśās run by signs, so they are not offered.')}
            />
          </SubSection>

          <SubSection label="dasha systems">
            <div className="space-y-1.5">
              {CORE_DASHAS.map(({ key, label, kind, conditional, status }) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-md border border-zinc-100 dark:border-zinc-800 px-2 py-2">
                  <span className="min-w-0 text-xs font-mono text-zinc-600 dark:text-zinc-300 truncate">{label}{kind && <span className="ml-1.5 text-[9px] uppercase text-zinc-400">{kind === 'rasi' ? 'Rāśi' : kind}</span>}{status === 'beta' && <span className="ml-1.5 rounded border border-violet-300 px-1 py-0.5 text-[8px] uppercase text-violet-700 dark:border-violet-700 dark:text-violet-300">{t('Beta')}</span>}{conditional && <span className="ml-1.5 rounded border border-amber-300 px-1 py-0.5 text-[8px] uppercase text-amber-700 dark:border-amber-700 dark:text-amber-300">{t('Conditional')}</span>}</span>
                  <MiniToggle value={Boolean(normalizedDashas[key])} onToggle={() => toggleDasha(key)} />
                </div>
              ))}
            </div>
          </SubSection>

        </div>
      </Section>

      <Section label="dasha methods" open={methodsOpen} onToggle={() => setMethodsOpen(v => !v)}>
        <div className="space-y-4">
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{t('Method choices update Dasha panels, the shared timeline and Event List together.')}</p>
          <div className="space-y-2" data-setting="dasha-year">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{t('Year of a dasha')}</div>
            <label className="block text-xs font-mono text-zinc-500">
              {t('a year counts as')}
              <select className={`${SELECT} mt-1`} value={dashaSettings.yearLength ?? 'julian'} onChange={e => updateYearLength(e.target.value as DashaYearLength)} aria-label={t('Year of a dasha')}>
                {DASHA_YEAR_KEYS.map(key => <option key={key} value={key}>{t(YEAR_LABELS[key])} ({DASHA_YEAR_LENGTHS[key]} {t('days')})</option>)}
              </select>
              <span className="mt-1 block text-[9px] text-zinc-400 dark:text-zinc-600">
                {t('The texts give the years of a dasha and not the length of a year. The Julian year is the start; the sidereal year is the one of PyJHora; the savana year of 360 days is the old reckoning. Over a Vimsottari of 120 years the dates differ by up to 1.8 years between 360 and 365.25 days.')}
              </span>
            </label>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{t('Vimsottari Utpanna / Kshema / Adhana')}</div>
            <label className="block text-xs font-mono text-zinc-500">
              {t('start from')}
              <select className={`${SELECT} mt-1`} value={dashaSettings.variantChoice ?? 'auto'} onChange={e => updateVariantChoice(e.target.value as VimshottariVariantChoice)}>
                <option value="auto">{t('by the Moon (auto)')}</option>
                <option value="utpanna">Utpanna ({t('5th nakshatra')})</option>
                <option value="kshema">Kshema ({t('4th nakshatra')})</option>
                <option value="adhana">Adhana ({t('8th nakshatra')})</option>
              </select>
              <span className="mt-1 block text-[9px] text-zinc-400 dark:text-zinc-600">
                {t('Counted from the Moon, the Vimsottari can start from the lord of the Utpanna, Kshema or Adhana nakshatra. Auto follows the house of the Moon (3 or 11 Utpanna, 2 or 6 Kshema, 8 or 12 Adhana, by Sanjay Rath); with the Moon in any other house the daśā is not used.')}
              </span>
            </label>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{t('Chara Dasha')}</div>
            <label className="block text-xs font-mono text-zinc-500">{t('Chara method')}
              <select className={`${SELECT} mt-1`} value={charaOptions.method} onChange={e => updateCharaOption('method', e.target.value as CharaOptions['method'])} aria-label={t('Chara method')}>
                <option value="jaimini">{t('the Jaimini Sutras (the text)')}</option>
                <option value="custom">{t('my own choices')}</option>
              </select>
              <span className="mt-1 block text-[9px] text-zinc-400 dark:text-zinc-600">{t('The Jaimini Sutras: the signs run direct if the 9th from the start is in an odd pada, the years are the count to the lord less one in the direction of the pada of the sign, and the sub-periods follow the kind of the sign (2.3 and 2.4, with BPHS 46.155-165). The choices below are for another convention.')}</span>
            </label>
            <label className="block text-xs font-mono text-zinc-500">{t('Start sign')}<select className={`${SELECT} mt-1`} value={charaOptions.start} onChange={e => updateCharaOption('start', e.target.value as CharaOptions['start'])}><option value="lagna">Lagna</option><option value="ak">Atmakaraka</option></select></label>
            {charaOptions.method === 'custom' && <>
            <label className="block text-xs font-mono text-zinc-500">{t('Mahadasha direction')}<select className={`${SELECT} mt-1`} value={charaOptions.mahadashaDirection} onChange={e => updateCharaOption('mahadashaDirection', e.target.value as CharaOptions['mahadashaDirection'])}><option value="rashi-type">{t('Rashi type')}</option><option value="odd-even">{t('Odd / even')}</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">{t('Antardasha start')}<select className={`${SELECT} mt-1`} value={charaOptions.antardashaStart} onChange={e => updateCharaOption('antardashaStart', e.target.value as CharaOptions['antardashaStart'])}><option value="next-dasha-rasi">{t('Next Dasha rashi')}</option><option value="same-dasha-rasi">{t('Same Dasha rashi')}</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">{t('Duration count')}<select className={`${SELECT} mt-1`} value={charaOptions.durationCount} onChange={e => updateCharaOption('durationCount', e.target.value as CharaOptions['durationCount'])}><option value="inclusive">{t('Inclusive')}</option><option value="exclusive">{t('Exclusive')}</option></select></label>
            <div className="flex items-center justify-between gap-3 rounded border border-zinc-200 px-2 py-2 dark:border-zinc-700"><span className="text-xs font-mono text-zinc-500">{t('Exaltation / debilitation adjustment')}</span><MiniToggle value={charaOptions.exaltDebilAdjust} onToggle={() => updateCharaOption('exaltDebilAdjust', !charaOptions.exaltDebilAdjust)} /></div>
            <div className="grid grid-cols-2 gap-2"><label className="text-xs font-mono text-zinc-500">{t('Scorpio lord')}<select className={`${SELECT} mt-1`} value={charaOptions.scorpioLord} onChange={e => updateCharaOption('scorpioLord', e.target.value as CharaOptions['scorpioLord'])}><option value="Ketu">Ketu</option><option value="Mars">Mars</option></select></label><label className="text-xs font-mono text-zinc-500">{t('Aquarius lord')}<select className={`${SELECT} mt-1`} value={charaOptions.aquariusLord} onChange={e => updateCharaOption('aquariusLord', e.target.value as CharaOptions['aquariusLord'])}><option value="Saturn">Saturn</option><option value="Rahu">Rahu</option></select></label></div>
            </>}
          </div>
          <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{t('Rashi Dasha seeds')}</div>
            <label className="block text-xs font-mono text-zinc-500">Narayana<select className={`${SELECT} mt-1`} value={rasiOptions.narayanaSeed} onChange={e => updateRasiOption('narayanaSeed', e.target.value as RasiDashaOptions['narayanaSeed'])}><option value="stronger-lagna-seventh">{t('PVR / JHora: stronger Lagna or 7th')}</option><option value="lagna">{t('Research variant: Lagna only')}</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">Mula<select className={`${SELECT} mt-1`} value={rasiOptions.moolaMethod ?? 'jaimini'} onChange={e => updateRasiOption('moolaMethod', e.target.value as NonNullable<RasiDashaOptions['moolaMethod']>)} aria-label="Mula"><option value="jaimini">{t('Jaimini Sutras 2.4.11-14: Kendradi from the Atmakaraka')}</option><option value="pyjhora">{t('PVR / JHora: from the Lagna, by position')}</option></select></label>
            {rasiOptions.moolaMethod === 'pyjhora' && <label className="block text-xs font-mono text-zinc-500">{t('Mula seed')}<select className={`${SELECT} mt-1`} value={rasiOptions.moolaSeed} onChange={e => updateRasiOption('moolaSeed', e.target.value as RasiDashaOptions['moolaSeed'])}><option value="stronger-lagna-seventh">{t('PVR / JHora: stronger Lagna or 7th')}</option><option value="lagna">{t('Research variant: Lagna only')}</option></select></label>}
            <label className="block text-xs font-mono text-zinc-500">{t('Brahma graha')}<select className={`${SELECT} mt-1`} value={rasiOptions.brahmaMethod ?? 'jaimini'} onChange={e => updateRasiOption('brahmaMethod', e.target.value as NonNullable<RasiDashaOptions['brahmaMethod']>)} aria-label="Brahma graha"><option value="jaimini">{t('Jaimini Sutras 2.1.49-54: lords of the 6th, 8th, 12th, by degrees')}</option><option value="pyjhora">{t('PVR / JHora: scoring of the lords')}</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">{t('Sula daśā for')}<select className={`${SELECT} mt-1`} value={rasiOptions.shulaFor ?? 'self'} onChange={e => updateRasiOption('shulaFor', e.target.value as NonNullable<RasiDashaOptions['shulaFor']>)} aria-label="Sula dasa for"><option value="self">{t('The native (the 8th)')}</option><option value="father">{t('The father (the 9th)')}</option><option value="mother">{t('The mother (the 4th)')}</option><option value="younger-brother">{t('A younger brother (the 3rd)')}</option><option value="sister-or-child">{t('A sister or a child (the 5th)')}</option><option value="elder-brother">{t('An elder brother (the 11th)')}</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">{t('Sula daśā years')}<select className={`${SELECT} mt-1`} value={rasiOptions.shulaYears ?? 'chara'} onChange={e => updateRasiOption('shulaYears', e.target.value as NonNullable<RasiDashaOptions['shulaYears']>)} aria-label="Sula dasa years"><option value="chara">{t('Chara years (Jaimini Sutras, the commentary)')}</option><option value="sthira">{t('Sthira years (BPHS 46.182)')}</option></select></label>
            <label className="block text-xs font-mono text-zinc-500">Sthira<select className={`${SELECT} mt-1`} value={rasiOptions.sthiraMethod} onChange={e => updateRasiOption('sthiraMethod', e.target.value as RasiDashaOptions['sthiraMethod'])} aria-label="Sthira"><option value="jaimini">{t('Jaimini Sutras 2.3: odd Brahma sign direct, even reverse')}</option><option value="brahma-pvr">{t('PVR / JHora: Brahma seed')}</option></select></label>
            <p className="text-[9px] font-mono text-amber-600 dark:text-amber-400">{t('Research variants are exploratory and are identified in the result audit.')}</p>
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
          <div className="text-xs font-mono">
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline dark:text-green-400">{t('Source code (AGPL-3.0)')}</a>
          </div>
          <div className="text-xs font-mono text-zinc-300 dark:text-zinc-700">{t('discord — coming later')}</div>
        </div>
      </Section>
    </div>
  );
}
