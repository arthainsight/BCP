'use client';

import { useEffect, useState } from 'react';
import type { CalculationSettings, PlanetData } from '@/types';

export interface TransitLocation {
  lat: number;
  lng: number;
  /** Natal time zone offset in hours; the events are taken at noon in it. */
  tzOffset: number;
}

type Loaded = { key: string; planets?: PlanetData[]; error?: string };

// The positions of a past day never change, so a day is fetched once.
const cache = new Map<string, PlanetData[]>();

/**
 * The transiting grahas at noon on an event's date (YYYY-MM-DD), counted in
 * the natal time zone. A null date fetches nothing.
 */
export function useEventTransits(
  date: string | null,
  location: TransitLocation | undefined,
  settings: CalculationSettings | undefined,
  natalAscendantSign: number,
): { planets: PlanetData[] | null; loading: boolean; error: string } {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const key = date && location
    ? [date, location.lat, location.lng, location.tzOffset, settings?.ayanamsa ?? 'lahiri', settings?.ayanamsaOffsetDegrees ?? 0, settings?.nodeMode ?? 'mean'].join('|')
    : null;

  useEffect(() => {
    if (!key || !date || !location) return;
    const cached = cache.get(key);
    if (cached) { queueMicrotask(() => setLoaded({ key, planets: cached })); return; }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      year: match[1], month: match[2], day: match[3], hour: '12', minute: '00', second: '00',
      lat: String(location.lat), lng: String(location.lng), tz: String(location.tzOffset),
      ayanamsa: settings?.ayanamsa ?? 'lahiri',
      ayanamsaOffset: String(settings?.ayanamsaOffsetDegrees ?? 0),
      nodeMode: settings?.nodeMode ?? 'mean',
    });
    (async () => {
      try {
        const response = await fetch(`/api/chart?${params}`, { signal: controller.signal });
        const json = await response.json();
        if (json.error) throw new Error(json.error);
        const planets = (json.planets as PlanetData[]).map(p => ({ ...p, house: ((p.sign - natalAscendantSign + 12) % 12) + 1 }));
        cache.set(key, planets);
        setLoaded({ key, planets });
      } catch (caught) {
        if (!controller.signal.aborted) setLoaded({ key, error: caught instanceof Error ? caught.message : 'Request failed' });
      }
    })();
    return () => controller.abort();
  }, [key, date, location, settings, natalAscendantSign]);

  const current = key && loaded?.key === key ? loaded : null;
  return { planets: current?.planets ?? null, loading: Boolean(key) && !current, error: current?.error ?? '' };
}
