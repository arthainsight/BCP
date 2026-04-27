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

// (rest unchanged until dasha section)

// --- inside dasha section replace list with this ---

{([
  { key: 'bcp' as const, label: 'Bhrigu Chakra Paddhati' },
  { key: 'vimshottari' as const, label: 'Vimsottari' },
  { key: 'vds' as const, label: 'Vimsottari Original' },
  { key: 'chara' as const, label: 'Chara Dasha' },

  { key: 'kalaChakra' as const, label: 'Kala Chakra Dasha' },
  { key: 'drig' as const, label: 'Drig Dasha' },
  { key: 'mandook' as const, label: 'Mandook Dasha' },
  { key: 'sthira' as const, label: 'Sthira Dasha' },
  { key: 'narayana' as const, label: 'Narayana Dasha' },
  { key: 'shoola' as const, label: 'Shoola Dasha' },
  { key: 'trikona' as const, label: 'Trikona Dasha' },

  { key: 'muktashtaka' as const, label: 'Muktashtaka Dasha' },
  { key: 'gangadhar' as const, label: 'Gangadhar Dasha' },
  { key: 'tara' as const, label: 'Tara Dasha' },
  { key: 'yogaVimshottari' as const, label: 'Yoga Vimsottari' },
  { key: 'ashtottari' as const, label: 'Ashtottari Dasha' }
]).map(({ key, label }) => (
  <div key={key} className="flex items-center justify-between gap-3">
    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">{label}</span>
    <button
      onClick={() => onUpdateDashaSettings({
        ...dashaSettings,
        dashas: { ...dashaSettings.dashas, [key]: !dashaSettings.dashas[key] }
      })}
      className="text-xs"
    >
      {dashaSettings.dashas[key] ? 'ON' : 'OFF'}
    </button>
  </div>
))}
