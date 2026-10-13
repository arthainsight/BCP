'use client';

import { useEffect, useState } from 'react';

type Loaded<T> = { url: string; data?: T; error?: string };

// What has been fetched, so that a panel opened again, or another one asking for the same address, does not ask again.
// An address (the date, the place and the settings are all in it) always gives the same answer.
const answers = new Map<string, unknown>();
const MAX_ANSWERS = 24;
function remember(url: string, data: unknown) {
  answers.delete(url);
  answers.set(url, data);
  if (answers.size > MAX_ANSWERS) answers.delete(answers.keys().next().value as string);
}

/**
 * Fetches JSON once the address has stayed the same for a moment (the target
 * date is stepped quickly), and never shows the result of an older address.
 * A null address fetches nothing.
 */
export function useDebouncedJson<T>(url: string | null, delay = 400): { data: T | null; error: string; loading: boolean } {
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);

  useEffect(() => {
    if (!url || answers.has(url)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? 'Request failed');
        remember(url, json);
        setLoaded({ url, data: json });
      } catch (caught) {
        if (!controller.signal.aborted) setLoaded({ url, error: caught instanceof Error ? caught.message : 'Request failed' });
      }
    }, delay);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [url, delay]);

  const known = url && answers.has(url) ? (answers.get(url) as T) : null;
  const current = url && loaded?.url === url ? loaded : null;
  const data = known ?? current?.data ?? null;
  return { data, error: data ? '' : current?.error ?? '', loading: Boolean(url) && !data && !current?.error };
}
