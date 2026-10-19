'use client';

import { ALL_PARAYA_BODIES, PARAYA_BETA_BODIES, PARAYA_BODIES, type ParayaBody } from '@/lib/bnn/nadiParaya';
import { useT } from '@/lib/i18n';

const CODES: Record<ParayaBody, string> = { Jupiter: 'Ju', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke', Mars: 'Ma', Mercury: 'Me', Venus: 'Ve' };
// The colours the charts draw each Paraya graha in.
const COLORS: Record<ParayaBody, string> = { Jupiter: '#92400e', Saturn: '#1d4ed8', Rahu: '#6d28d9', Ketu: '#c2410c', Mars: '#be123c', Mercury: '#0f766e', Venus: '#4d7c0f' };

type Props = {
  /** The grahas that are drawn. */
  bodies: readonly ParayaBody[];
  onChange: (next: ParayaBody[]) => void;
};

/** Chips to draw the Paraya grahas one at a time, with all (the four) and none; Mars, Mercury and Venus are a second row, in beta. */
export default function ParayaChips({ bodies, onChange }: Props) {
  const t = useT();
  const isAll = bodies.length === PARAYA_BODIES.length && PARAYA_BODIES.every(body => bodies.includes(body));
  const chip = (body: ParayaBody) => {
    const on = bodies.includes(body);
    return (
      <button
        key={body}
        type="button"
        aria-pressed={on}
        title={body}
        onClick={() => onChange(on ? bodies.filter(item => item !== body) : ALL_PARAYA_BODIES.filter(item => item === body || bodies.includes(item)))}
        className={`rounded-sm border px-2 py-1.5 text-[10px] font-mono sm:px-1.5 sm:py-0.5 sm:text-[9px] ${on ? 'text-white' : 'border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'}`}
        style={on ? { backgroundColor: COLORS[body], borderColor: COLORS[body] } : undefined}
      >
        {CODES[body]}
      </button>
    );
  };
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <div className="text-[9px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('paraya grahas')}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange([...PARAYA_BODIES])}
            disabled={isAll}
            className="text-[9px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
          >
            {t('all')}
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={bodies.length === 0}
            className="text-[9px] font-mono text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
          >
            {t('none')}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label={t('paraya grahas')}>
        {PARAYA_BODIES.map(chip)}
      </div>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('paraya grahas beta')} title={t('Mars two months, Mercury and Venus a month in each sign, moved by age')}>
        <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('beta')}</span>
        {PARAYA_BETA_BODIES.map(chip)}
      </div>
    </div>
  );
}
