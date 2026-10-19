'use client';

import type { JointModelResult } from '@/lib/research/jointModel';
import type { SplitBy } from '@/lib/research/validation';
import type { WindowChoice } from '@/lib/research/eventStudy';
import { fill, useT } from '@/lib/i18n';
import { BODY_CELL, HEAD_CELL, ROW } from './balaShared';
import { formatP } from './ResearchMatrix';
import { FeatureLabel, chip } from './researchUi';

/** What the joint model leaves for the view. */
export interface ModelOutcome {
  /** Null when there were too few charts or events to split in two. */
  result: JointModelResult | null;
  by: SplitBy;
  share: number;
  seed: number;
  windowDays: WindowChoice;
  failed: string[];
}

const auc = (value: number | null) => (value === null ? '—' : value.toFixed(2));

/**
 * What a few features explain together: the features that the model built on the training part uses, how much each raises the odds of an event, and how well the model
 * tells the events from ordinary moments of the same chart on the test part (0.5 is chance, 1 is perfect), with the chance of an AUC as high by chance.
 */
export default function ResearchModel({ outcome, onAnother }: { outcome: ModelOutcome; onAnother: () => void }) {
  const t = useT();
  const { result, by, share, windowDays, failed } = outcome;
  return (
    <div className="space-y-3" data-research-result data-research-model>
      {failed.length > 0 && <p className="text-[10px] font-mono text-zinc-400">{t('Left out for want of a place or time zone:')} {failed.join(', ')}</p>}
      {result === null ? (
        <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400" data-research-model-empty>
          {by === 'charts' ? t('Too few charts to split in two: choose to split by events, or add charts.') : t('Too few events to split in two.')}
        </p>
      ) : (
        <>
          <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-200" data-research-summary>
            {t('training')}: {result.trainingEvents} {t('events')} · {result.trainingCharts} {t('charts')} · {t('test')}: {result.testEvents} {t('events')} · {result.testCharts} {t('charts')} · {result.candidates} {t('candidates')}
          </p>
          {result.steps.length === 0 ? (
            <p className="text-[10px] font-mono text-zinc-400" data-research-model-none>{t('No feature improved the fit enough to be worth adding, so the model is no better than chance: nothing in the training part explains the events.')}</p>
          ) : (
            <>
              <p className="text-[11px] font-mono" data-research-auc={result.testAuc?.toFixed(3)}>
                <span className={result.testP !== null && result.testP <= 0.05 && (result.testAuc ?? 0) > 0.5 ? 'font-bold text-emerald-700 dark:text-green-400' : 'text-zinc-700 dark:text-zinc-200'}>
                  {fill(t('On the test part the model has an AUC of {auc} (0.5 is chance), p {p}.'), { auc: auc(result.testAuc), p: result.testP === null ? '—' : formatP(result.testP) })}
                </span>
              </p>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="w-full min-w-[560px] border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                      <th className={HEAD_CELL}>#</th>
                      <th className={HEAD_CELL}>{t('Feature')}</th>
                      <th className={HEAD_CELL} title={t('how many times the odds of an event rise where the feature is there, the other features being the same')}>{t('odds ×')}</th>
                      <th className={HEAD_CELL} title={t('the improvement of the fit on the training part when it was added')}>{t('fit gain')}</th>
                      <th className={HEAD_CELL} title={t('the AUC on the test part of the model up to this feature')}>{t('test AUC')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.steps.map((step, i) => (
                      <tr key={step.id} className={ROW} data-feature={step.id} data-step={i + 1}>
                        <td className={BODY_CELL}>{i + 1}</td>
                        <td className={BODY_CELL}><FeatureLabel feature={step.feature} /></td>
                        <td className={BODY_CELL}>{step.oddsRatio.toFixed(1)}</td>
                        <td className={BODY_CELL}>{step.gain.toFixed(1)}</td>
                        <td className={BODY_CELL}>{auc(step.testAuc)}</td>
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
              {fill(t('Split by {by}, {share} % for training.'), { by: t(by === 'charts' ? 'charts' : 'events'), share: String(Math.round(share * 100)) })}
              {windowDays === 'auto' && ` ${t('The window followed the accuracy of each date.')}`}
            </span>
          </div>
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
            {t('A logistic model is built on the training part from its best features, adding the one that improves the fit most for as long as that is worth more than a penalty for choosing among so many, and is then tried as it stands on the test part, which it was not built from. The AUC is the chance that an event scores higher than a random moment of its own chart; p is how often events moved to random moments would score as high. With few events the test is weak, and another split can give another answer.')}
          </p>
        </>
      )}
    </div>
  );
}
