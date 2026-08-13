'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True once the component has hydrated on the client, false during the server
 * render and the first client pass.
 *
 * The usual way to write this is `const [m, setM] = useState(false)` plus
 * `useEffect(() => setM(true), [])`, but that is a setState inside an effect —
 * an extra render every mount, and the thing react-hooks/set-state-in-effect
 * exists to flag. useSyncExternalStore expresses the same idea directly:
 * the server snapshot is false, the client snapshot is true, and the value
 * never changes afterwards so the subscription is a no-op.
 *
 * Used by the components that read the resolved theme, which is unknowable
 * until hydration and would otherwise cause a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
