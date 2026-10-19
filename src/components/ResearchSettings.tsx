'use client';

import type { SettingsRow } from '@/lib/research/settingsStudy';
import { settingsMatter } from '@/lib/research/settingsStudy';
import type { WindowChoice } from '@/lib/research/eventStudy';
import { parseFeatureId } from '@/lib/research/features';
import { useT } from '@/lib/i18n';
import { BODY_CELL, HEAD_CELL, ROW } from './balaShared';
import { formatP } from './ResearchMatrix';
import { FeatureLabel } from './researchUi';

/** What the comparison of the Paraya settings leaves for the view. */
export interface SettingsOutcome {
  rows: SettingsRow[];
  windowDays: WindowChoice;
  failed: string[];
}

/** What a setting of the progressions is called. */
const SETTING_NAMES = {
  retro: { previous: 'retrograde: the sign before', same: 'retrograde: the natal sign' },
  saturn: { alternating: 'Saturn alternating', even: 'Saturn even' },
  rahu: { alternating: 'Rahu alternating', even: 'Rahu even' },
} as const;

/** The same study under each of the eight settings of the progressions, side by side: how strong the pattern is under each, and the strongest feature of each. */
export default function ResearchSettings({ outcome }: { outcome: SettingsOutcome }) {
  const t = useT();
  const { rows, failed } = outcome;
  const matter = settingsMatter(rows);
  return (
    <div className="space-y-3" data-research-result data-research-settings>
      {failed.length > 0 && <p className="text-[10px] font-mono text-zinc-400">{t('Left out for want of a place or time zone:')} {failed.join(', ')}</p>}
      {rows.length === 0 ? (
        <p className="text-[10px] font-mono text-zinc-400">{t('Choose at least one kind of progression feature: the settings only change those.')}</p>
      ) : (
        <>
          <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200" data-research-summary>{rows[0].events} {t('events')} · {rows.length} {t('settings')}</p>
          {!matter && <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400" data-research-settings-same>{t('The settings made no difference to these events: every one found exactly the same.')}</p>}
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[720px] border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800">
                  <th className={HEAD_CELL}>{t('Setting')}</th>
                  <th className={HEAD_CELL} title={t('the mean of −log10 p of the five strongest features')}>{t('strength')}</th>
                  <th className={HEAD_CELL} title={t('features that hold up at q of 0.1')}>{t('holding')}</th>
                  <th className={HEAD_CELL}>{t('features tested')}</th>
                  <th className={HEAD_CELL}>{t('strongest feature')}</th>
                  <th className={HEAD_CELL} title={t('the exact p of the strongest feature times the eight settings tried')}>{t('corrected p')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.options.retro}|${row.options.saturn}|${row.options.rahu}`} className={ROW} data-setting={`${row.options.retro}|${row.options.saturn}|${row.options.rahu}`} data-rank={index + 1}>
                    <td className={BODY_CELL}>
                      <span className="block">{t(SETTING_NAMES.retro[row.options.retro ?? 'previous'])}</span>
                      <span className="block text-zinc-400">{t(SETTING_NAMES.saturn[row.options.saturn])} · {t(SETTING_NAMES.rahu[row.options.rahu])}</span>
                    </td>
                    <td className={`${BODY_CELL} ${index === 0 && matter ? 'font-bold text-emerald-700 dark:text-green-400' : ''}`}>{row.score.toFixed(2)}</td>
                    <td className={BODY_CELL}>{row.significant}</td>
                    <td className={BODY_CELL}>{row.tested}</td>
                    <td className={BODY_CELL}>
                      {row.best ? (
                        <>
                          <FeatureLabel feature={parseFeatureId(row.best.id)} />
                          <span className="text-zinc-400"> {row.best.observed}/{row.best.total} · p {formatP(row.best.p)}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className={BODY_CELL}>{row.correctedBestP === null ? '—' : formatP(row.correctedBestP)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('Strength is the mean of −log10 p (the exact p of each feature) of the five strongest features: the higher, the clearer the pattern under that setting. Picking the best of eight settings is itself a choice among several, so the corrected p multiplies the best p by eight. A setting that comes first only by a little, with few events, is no proof that it is the right one.')}
          </p>
        </>
      )}
    </div>
  );
}
