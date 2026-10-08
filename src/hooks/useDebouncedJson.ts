'use client';

import { useEffect, useState } from 'react';

type Loaded<T> = { url: string; data?: T; error?: string };

/**
 * Fetches JSON once the address has stayed the same for a moment (the target
 * date is stepped quickly), and never shows the result of an older address.
 * A null address fetches nothing.
 */
export function useDebouncedJson<T>(url: string | null, delay = 400): { data: T | null; error: string; loading: boolean } {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? 'Request failed');
        setLoaded({ url, data: json });
      } catch (caught) {
        if (!controller.signal.aborted) setLoaded({ url, error: caught instanceof Error ? caught.message : 'Request failed' });
      }
    }, delay);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [url, delay]);

  const current = url && loaded?.url === url ? loaded : null;
  return { data: current?.data ?? null, error: current?.error ?? '', loading: Boolean(url) && !current };
}
