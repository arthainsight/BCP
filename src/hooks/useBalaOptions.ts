'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { BalaOptions } from '@/lib/balaOptions';
import {
  getBalaOptionsSnapshot, getServerBalaOptionsSnapshot, resetBalaOptions, setBalaOptions, subscribeBalaOptions,
} from '@/lib/balaOptionsStore';

/** The choices of the Ṣaḍbala and the Bhāva Bala, kept in the browser, with the functions to change and reset them. */
export function useBalaOptions() {
  const options = useSyncExternalStore(subscribeBalaOptions, getBalaOptionsSnapshot, getServerBalaOptionsSnapshot);
  const update = useCallback((change: Partial<BalaOptions>) => setBalaOptions(change), []);
  const reset = useCallback(() => resetBalaOptions(), []);
  return { options, update, reset };
}
