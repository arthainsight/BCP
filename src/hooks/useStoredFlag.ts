'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * A yes/no choice that is remembered in the browser: the default until the stored value has been read
 * (it can only be read after the page has loaded; false unless another default is given), and a function
 * that turns it over. What has been chosen once, on or off, is what the next visit starts with.
 */
export function useStoredFlag(key: string, defaultValue = false): [boolean, () => void] {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === 'true' || stored === 'false') setValue(stored === 'true');
    } catch {}
  }, [key]);
  const toggle = useCallback(() => setValue(current => {
    try { localStorage.setItem(key, String(!current)); } catch {}
    return !current;
  }), [key]);
  return [value, toggle];
}
