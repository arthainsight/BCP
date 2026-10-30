'use client';

import { BALA_OPTION_DEFINITIONS, balaOptionsAreCustom, type BalaOptions } from '@/lib/balaOptions';
import { useT } from '@/lib/i18n';
import { ManualLink } from './balaShared';

const SELECT = 'w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded text-xs font-mono text-zinc-700 dark:text-zinc-300';

/**
 * The choices where the verses are silent or the sources disagree, for the view that is open: a select for each,
 * with the source of every alternative, a note, and a link to the manual that explains the choice point.
 */
export default function BalaOptionsPanel({
  view, options, onChange, onReset,
}: {
  view: 'shadbala' | 'bhava' | 'vimsopaka';
  options: BalaOptions;
  onChange: (change: Partial<BalaOptions>) => void;
  onReset: () => void;
}) {
  const t = useT();
  const custom = balaOptionsAreCustom(options);
  // Bhāva Bala is made from the Ṣaḍbala of the lords, so its view shows the Ṣaḍbala choices too.
  // Vimśopaka Bala has its own choices and the temporary friendship that it shares with the Ṣaḍbala.
  const definitions = BALA_OPTION_DEFINITIONS.filter((definition) => view === 'vimsopaka' ? definition.view === 'vimsopaka' || definition.alsoFor === 'vimsopaka' : view === 'bhava' || definition.view === 'shadbala');

  return (
    <details className="group rounded-lg border border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20" data-testid="bala-options">
      <summary className="flex cursor-pointer select-none flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 text-xs font-mono text-emerald-800 dark:text-green-300">
        <span aria-hidden="true">⚙</span>
        <span className="font-semibold">{t('Calculation choices')}</span>
        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-800 dark:bg-emerald-900/40 dark:text-green-300">{definitions.length}</span>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{t('Tap to change how the numbers are calculated')}</span>
        {custom && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{t('changed from the Sanskrit reading')}</span>}
        <span aria-hidden="true" className="ml-auto text-[10px] text-zinc-500 transition-transform group-open:rotate-180 dark:text-zinc-400">▼</span>
      </summary>
      <div className="space-y-3 border-t border-zinc-200 px-3 py-3 dark:border-zinc-700">
        <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          {t('Where the verses are silent or the sources disagree, the first choice of each is the reading of the Sanskrit text. The choices change only these three views and are kept in this browser.')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {definitions.map((definition) => (
            <label key={definition.key} className="block space-y-1">
              <span className="block text-[11px] font-mono text-emerald-700 dark:text-green-400">{definition.choicePoint} · {t(definition.label)}</span>
              <select
                className={SELECT}
                value={options[definition.key]}
                onChange={(event) => onChange({ [definition.key]: event.target.value } as Partial<BalaOptions>)}
                aria-label={t(definition.label)}
              >
                {definition.choices.map((choice) => <option key={choice.value} value={choice.value}>{t(choice.label)}</option>)}
              </select>
              <span className="block text-[10px] font-mono text-emerald-700 dark:text-green-400" data-testid="bala-option-chosen">{t(definition.choices.find((choice) => choice.value === options[definition.key])?.label ?? '')}</span>
              <span className="block text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{t(definition.note)}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onReset}
            disabled={!custom}
            className="rounded border border-zinc-300 px-2 py-1.5 text-xs font-mono text-zinc-700 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-300"
          >
            {t('Back to the Sanskrit reading')}
          </button>
          <ManualLink label={t('How every number is calculated (manual)')} />
        </div>
      </div>
    </details>
  );
}
