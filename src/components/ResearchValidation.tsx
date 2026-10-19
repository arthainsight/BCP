'use client';

import type { ValidationResult } from '@/lib/research/validation';
import type { SplitBy } from '@/lib/research/validation';
import type { WindowChoice } from '@/lib/research/eventStudy';
import { fill, useT } from '@/lib/i18n';
import { BODY_CELL, HEAD_CELL, ROW } from './balaShared';
import { formatP } from './ResearchMatrix';
import { FeatureLabel, chip } from './researchUi';

/** What the check on a part of the data that was not looked at leaves for the view. */
export interface ValidationOutcome {
  /** Null when there were too few charts or events to split in two. */
  result: ValidationResult | null;
  by: SplitBy;
  share: number;
  top: number;
  seed: number;
  windowDays: WindowChoice;
  failed: string[];
}

/**
 * The check on a part of the data that was not looked at: the best features of the training part, and how each stands in the test part. A pattern that is real
 * holds there; one that chance made does not, and the few that pass by chance are what the "by chance" line promises.
 */
export default function ResearchValidation({ outcome, onAnother }: { outcome: ValidationOutcome; onAnother: () => void }) {
  const t = useT();
  const { result, by, share, top, windowDays, failed } = outcome;
  return (
    <div className="space-y-3" data-research-result data-research-validation>
      {failed.length > 0 && <p className="text-[10px] font-mono text-zinc-400">{t('Left out for want of a place or time zone:')} {failed.join(', ')}</p>}
      {result === null ? (
        <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400" data-research-validation-empty>
          {by === 'charts' ? t('Too few charts to split in two: choose to split by events, or add charts.') : t('Too few events to split in two.')}
        </p>
      ) : (
        <>
          <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200" data-research-summary>
            {t('training')}: {result.trainingEvents} {t('events')} · {result.trainingCharts} {t('charts')} · {t('test')}: {result.testEvents} {t('events')} · {result.testCharts} {t('charts')}
          </p>
          {result.rows.length === 0 ? (
            <p className="text-[10px] font-mono text-zinc-400" data-research-validation-none>{t('Nothing in the training part happened more often than by chance, so there is nothing to test.')}</p>
          ) : (
            <>
              <p className="text-[11px] font-mono" data-research-held={result.held}>
                <span className={result.held > 0 ? 'font-bold text-emerald-700 dark:text-green-400' : 'text-zinc-700 dark:text-zinc-200'}>
                  {fill(t('{held} of {count} features held in the test part.'), { held: String(result.held), count: String(result.rows.length) })}
                </span>{' '}
                <span className="text-zinc-400">{fill(t('By chance alone about {expected} would pass at p 0.05 without the correction.'), { expected: result.expectedByChance.toFixed(1) })}</span>
              </p>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="w-full min-w-[620px] border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                      <th className={HEAD_CELL}>{t('Feature')}</th>
                      <th className={HEAD_CELL}>{t('training')}</th>
                      <th className={HEAD_CELL}>{t('test')}</th>
                      <th className={HEAD_CELL} title={t('the exact p of the test part times the number of features carried over')}>{t('corrected p')}</th>
                      <th className={HEAD_CELL}>{t('held')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map(row => (
                      <tr key={row.id} className={ROW} data-feature={row.id} data-held={row.holds}>
                        <td className={BODY_CELL}><FeatureLabel feature={row.feature} /></td>
                        <td className={BODY_CELL}>
                          {row.training.observed}/{row.training.total}
                          {row.training.lift !== null && <span className="text-zinc-400"> ×{row.training.lift.toFixed(1)}</span>}
                          <span className="text-zinc-400"> p {formatP(row.training.p)}</span>
                        </td>
                        <td className={BODY_CELL}>
                          {row.test.observed}/{row.test.total}
                          {row.test.lift !== null && <span className="text-zinc-400"> ×{row.test.lift.toFixed(1)}</span>}
                          <span className="text-zinc-400"> p {formatP(row.test.p)}</span>
                        </td>
                        <td className={BODY_CELL}>{formatP(row.adjustedP)}</td>
                        <td className={`${BODY_CELL} ${row.holds ? 'font-bold text-emerald-700 dark:text-green-400' : 'text-zinc-400'}`}>{row.holds ? '✓' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onAnother} className={chip(false)}>{t('Another split')}</button>
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
              {fill(t('Split by {by}, {share} % for training, the best {top} features carried over.'), { by: t(by === 'charts' ? 'charts' : 'events'), share: String(Math.round(share * 100)), top: String(top) })}
              {windowDays === 'auto' && ` ${t('The window followed the accuracy of each date.')}`}
            </span>
          </div>
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('The best features were found in the training part the usual way (the smallest p of all those looked at) and then tested exactly in the test part, which they were not chosen from; the correction counts only the features carried over. A real pattern holds there, a chance one rarely does. With few events the test is weak, and another split can give another answer.')}
          </p>
        </>
      )}
    </div>
  );
}
