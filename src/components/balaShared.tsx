import type { ReactNode } from 'react';
import { SOURCE_URL } from '@/lib/config';
import { useLanguage } from '@/lib/i18n';

export const HEAD_CELL = 'text-left p-2 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400';
export const BODY_CELL = 'p-2 border border-zinc-100 dark:border-zinc-800';
export const ROW = 'border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50';
export const NAME_CELL = `${BODY_CELL} font-bold text-emerald-700 dark:text-green-400`;
export const VALUE_CELL = `${BODY_CELL} text-zinc-700 dark:text-zinc-300`;
export const TOTAL_CELL = `${BODY_CELL} font-bold text-amber-700 dark:text-amber-300`;

/** A "> command" heading with its explanation under it. */
export function Heading({ command, children }: { command: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; {command}</div>
      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-1">{children}</div>
    </div>
  );
}

export function ScrollTable({ minWidth, headers, children }: { minWidth: string; headers: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
      <table className={`w-full ${minWidth} border-collapse text-xs font-mono`}>
        <thead>
          <tr className="bg-zinc-100 dark:bg-zinc-800">
            {headers.map((header, index) => <th key={index} className={HEAD_CELL}>{header}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** A link to the manual that says how every number of the Ṣaḍbala and the Bhāva Bala is calculated, in the language of the app. */
export function ManualLink({ label }: { label: string }) {
  const language = useLanguage();
  const file = language === 'fi' ? 'shadbala-manuaali.md' : 'shadbala-manual.md';
  return (
    <div className="text-xs font-mono">
      <a href={`${SOURCE_URL}/blob/main/docs/${file}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline dark:text-green-400">{label}</a>
    </div>
  );
}
