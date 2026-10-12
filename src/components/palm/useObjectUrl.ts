'use client';

import { useEffect, useState } from 'react';

/** An object URL for a blob that is released when the blob changes or the component goes. */
export function useObjectUrl(blob: Blob | null): string {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) return;
    const created = URL.createObjectURL(blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [blob]);
  return blob ? url : '';
}
