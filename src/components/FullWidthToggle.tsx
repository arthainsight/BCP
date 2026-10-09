'use client';

import { useT } from '@/lib/i18n';

/**
 * The ⤢ full button of a workspace on a wide screen: the panel takes the whole width and the chart steps
 * aside; ⤡ narrow brings the chart back. It sits beside the tabs, outside their scrolling row, so it is
 * always in view.
 */
export default function FullWidthToggle({ wide, onToggle }: { wide: boolean; onToggle: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={wide}
      title={t('Use the whole width, hiding the chart')}
      className="hidden shrink-0 rounded-md border border-zinc-200 px-2.5 py-1.5 text-[10px] font-mono text-zinc-500 hover:text-zinc-800 lg:inline-flex dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      {wide ? t('⤡ narrow') : t('⤢ full')}
    </button>
  );
}
