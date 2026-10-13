'use client';

import { useEffect, useMemo, useState } from 'react';
import { dashaEventsStorageKey, parseStoredDashaEvents, type StoredDashaEvent } from '@/lib/dashaEventStore';

/**
 * The events of one chart: read from the browser when the chart changes and, unless the view only shows them, kept there
 * as they change.
 */
export function useDashaEvents(birthDatetime: string, { persist = true }: { persist?: boolean } = {}) {
  const storageKey = useMemo(() => dashaEventsStorageKey(birthDatetime), [birthDatetime]);
  const [events, setEvents] = useState<StoredDashaEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  // The browser's storage cannot be read before the first render, so the events come in a moment after it.
  useEffect(() => {
    queueMicrotask(() => {
      try { setEvents(parseStoredDashaEvents(localStorage.getItem(storageKey))); } catch { setEvents([]); }
      setLoaded(true);
    });
  }, [storageKey]);
  useEffect(() => {
    if (!persist || !loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(events)); } catch { /* storage full or not allowed: the list stays in memory */ }
  }, [events, loaded, persist, storageKey]);

  return [events, setEvents] as const;
}
