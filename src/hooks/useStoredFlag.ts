'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * A yes/no choice that is remembered in the browser: false until the stored value has been read
 * (it can only be read after the page has loaded), and a function that turns it over.
 */
export function useStoredFlag(key: string): [boolean, () => void] {
  const [value, setValue] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(key) === 'true') setValue(true);
    } catch {}
  }, [key]);
  const toggle = useCallback(() => setValue(current => {
    try { localStorage.setItem(key, String(!current)); } catch {}
    return !current;
  }), [key]);
  return [value, toggle];
}
