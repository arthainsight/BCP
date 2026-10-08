'use client';

import { useEffect, useState } from 'react';
import { VARGA_DIVISIONS } from '@/lib/vargaChart';

const KEY = 'chartDivisions';

/** The divisional charts shown on the main chart (D1 alone by default), remembered between visits. */
export function useChartDivisions(): [number[], (next: number[]) => void] {
  const [divisions, setState] = useState<number[]>([1]);

  // localStorage is only readable after mount.
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) ?? 'null');
      if (Array.isArray(stored) && stored.length > 0 && stored.every(d => (VARGA_DIVISIONS as readonly number[]).includes(d))) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState([...new Set<number>(stored)].sort((a, b) => a - b));
      }
    } catch {}
  }, []);

  const setDivisions = (next: number[]) => {
    setState(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  return [divisions, setDivisions];
}
