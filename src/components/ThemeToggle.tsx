'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle({ className, icon }: { className?: string; icon?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`px-2 py-1 rounded text-xs font-mono border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-500 dark:hover:border-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors ${className ?? ''}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {icon ? '◐' : (isDark ? 'light' : 'dark')}
    </button>
  );
}
