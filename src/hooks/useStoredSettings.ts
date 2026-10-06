'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_CALCULATION_SETTINGS, DEFAULT_CHART_DISPLAY, DEFAULT_DASHA_SETTINGS,
  type CalculationSettings, type ChartDisplaySettings, type DashaSettings,
} from '@/types';
import { migrateChartDisplaySettings } from '@/lib/chartDisplaySettings';
import { migrateDashaSettings } from '@/lib/dashaSettings';

/**
 * Display, calculation and dasha settings, restored from localStorage after
 * mount and saved there on every change. settingsRestored turns true once the
 * stored values are in, so a calculation does not run on the defaults first.
 */
export function useStoredSettings() {
  const [chartDisplaySettings, setChartDisplaySettings] = useState<ChartDisplaySettings>(DEFAULT_CHART_DISPLAY);
  const [calculationSettings, setCalculationSettings] = useState<CalculationSettings>(DEFAULT_CALCULATION_SETTINGS);
  const [dashaSettings, setDashaSettings] = useState<DashaSettings>(DEFAULT_DASHA_SETTINGS);
  const [settingsRestored, setSettingsRestored] = useState(false);

  // Restore persisted display/calculation/dasha settings on mount
  // localStorage cannot be read during the server render, so restoring has to
  // happen after mount. This runs once with an empty dependency list.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const ds = localStorage.getItem('chartDisplaySettings');
      if (ds) {
        setChartDisplaySettings(migrateChartDisplaySettings(JSON.parse(ds)));
      }
      const cs = localStorage.getItem('calculationSettings');
      if (cs) setCalculationSettings({ ...DEFAULT_CALCULATION_SETTINGS, ...JSON.parse(cs) });
      const dash = localStorage.getItem('dashaSettings');
      if (dash) setDashaSettings(migrateDashaSettings(JSON.parse(dash)));
      // The simple / research / debug switcher (v2.25) and the workspace (v2.28) were removed.
      localStorage.removeItem('uiMode');
      localStorage.removeItem('workspace_panels');
    } catch {}
    setSettingsRestored(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleChartDisplay = useCallback((key: keyof ChartDisplaySettings) => {
    setChartDisplaySettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('chartDisplaySettings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateChartDisplay = useCallback((update: Partial<ChartDisplaySettings>) => {
    setChartDisplaySettings((prev) => {
      const next = { ...prev, ...update };
      try { localStorage.setItem('chartDisplaySettings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateCalculationSettings = useCallback((update: Partial<CalculationSettings>) => {
    setCalculationSettings((prev) => {
      const next = { ...prev, ...update };
      try { localStorage.setItem('calculationSettings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateDashaSettings = useCallback((update: Partial<DashaSettings>) => {
    setDashaSettings((prev) => {
      const next = { ...prev, ...update };
      try { localStorage.setItem('dashaSettings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return {
    chartDisplaySettings, calculationSettings, dashaSettings, settingsRestored,
    toggleChartDisplay, updateChartDisplay, updateCalculationSettings, updateDashaSettings,
  };
}
