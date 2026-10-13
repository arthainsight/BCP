'use client';

import { useEffect } from 'react';

/** While a full-screen view is open: the page behind it does not scroll, and Escape closes it. */
export function useOverlay(onClose: () => void): void {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);
}
