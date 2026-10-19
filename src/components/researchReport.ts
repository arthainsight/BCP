import type { WindowChoice } from '@/lib/research/eventStudy';
import { testFeature } from '@/lib/research/eventStudy';
import { fill } from '@/lib/i18n';
import { formatP, Q_MARK } from './ResearchMatrix';
import { featureIdText } from './researchUi';
import type { ChanceOutcome } from './ResearchResults';
import type { GroupOutcome } from './ResearchGroups';
import type { ValidationOutcome } from './ResearchValidation';
import type { SettingsOutcome } from './ResearchSettings';
import type { ComboOutcome } from './ResearchCombos';
import { kindText } from './ResearchCombos';
import type { ModelOutcome } from './ResearchModel';

// The findings of a run as a page of its own: what the data was, how the comparison was made, the strongest results with their corrected p-values and the cautions that
// go with them. It is a single HTML file with its own style that prints well (to a PDF from the browser's print), so it can be given to a client or kept with the charts.

/** What the run was run on, in the words of the page. */
export interface ReportContext {
  generated: Date;
  version: string;
  /** The charts that were studied and how many events each had. */
  charts: { name: string; events: number }[];
  /** The events chosen, in words; and for two kinds of event the second. */
  events: string;
  eventsB?: string;
  window: WindowChoice;
  /** The kinds of feature, the grahas, the daśā system and the settings of the progressions, in words. */
  kinds: string[];
  bodies: string[];
  dashaSystem: string;
  paraya: string;
  control: 'life' | 'others';
}

export type ReportBody =
  | { mode: 'chance'; outcome: ChanceOutcome }
  | { mode: 'groups'; outcome: GroupOutcome }
  | { mode: 'validate'; outcome: ValidationOutcome }
  | { mode: 'settings'; outcome: SettingsOutcome }
  | { mode: 'combine'; outcome: ComboOutcome }
  | { mode: 'model'; outcome: ModelOutcome };

const ROWS = 25;

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cell = (text: string, className = '') => `<td${className ? ` class="${className}"` : ''}>${escape(text)}</td>`;
const head = (...texts: string[]) => `<tr>${texts.map(text => `<th>${escape(text)}</th>`).join('')}</tr>`;
const table = (header: string, rows: string[]) => `<table>${header}${rows.map(row => `<tr>${row}</tr>`).join('')}</table>`;
const paragraph = (text: string) => `<p>${escape(text)}</p>`;
const percent = (value: number, of: number) => (of > 0 ? `${Math.round((100 * value) / of)} %` : '—');
const windowText = (window: WindowChoice, t: (text: string) => string) => (window === 'auto' ? t('by the accuracy of the date') : window === 0 ? t('the day') : `±${window} ${t('days')}`);

const STYLE = `
  body { font: 14px/1.5 system-ui, sans-serif; color: #1a1a19; max-width: 860px; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.5rem; margin: 0 0 .25rem; } h2 { font-size: 1.05rem; margin: 1.6rem 0 .4rem; border-bottom: 1px solid #d8d7d2; padding-bottom: .2rem; }
  .meta { color: #6b6a64; font-size: .85rem; } table { border-collapse: collapse; width: 100%; margin: .5rem 0; font-size: .85rem; }
  th, td { border: 1px solid #d8d7d2; padding: .3rem .5rem; text-align: left; vertical-align: top; } th { background: #f1f0ec; }
  .strong { font-weight: 700; color: #0a6b3d; } .note { color: #6b6a64; font-size: .8rem; } .warn { border-left: 3px solid #c98500; padding-left: .7rem; }
  button { font: inherit; padding: .3rem .8rem; } @media print { button { display: none; } body { margin: 0; } }`;

/** The report of a run as the text of an HTML file. `t` translates, `code` gives the name of a graha. */
export function buildReport(body: ReportBody, context: ReportContext, t: (text: string) => string, code: (body: string) => string, language: 'en' | 'fi'): string {
  const label = (id: string) => featureIdText(id, t, code);
  const sections: string[] = [];

  // The data: what the run was run on.
  const dataRows = [
    [t('Charts'), context.charts.map(item => `${item.name} (${item.events})`).join(', ')],
    [t('Events'), context.eventsB !== undefined ? `${context.events} / ${context.eventsB}` : context.events],
    [t('Window'), windowText(context.window, t)],
    [t('Features'), context.kinds.join('; ') || '—'],
    [t('Grahas'), context.bodies.map(code).join(', ')],
    [t('daśā system'), context.dashaSystem],
    [t('Paraya settings'), context.paraya],
    ...(body.mode === 'chance' ? [[t('Chance level'), context.control === 'others' ? t('the other charts at the same moment') : t('the same chart at random moments')]] : []),
  ];
  sections.push(`<h2>${escape(t('Data'))}</h2>${table('', dataRows.map(([name, value]) => `<th>${escape(name)}</th>${cell(value)}`))}`);

  // The method and the results.
  const method: string[] = [];
  const results: string[] = [];
  if (body.mode === 'chance') {
    const { result, hypothesis } = body.outcome;
    method.push(body.outcome.control === 'others'
      ? t('Each event was read for the features its moment has, and each feature was set against the other charts at the very same moment: the share of the other charts that have it then is its chance for that event. p is the exact chance of as many events with the feature as there are; q corrects p for the number of features looked at (false discovery rate).')
      : t('Each event was read for the features its moment has, and each feature was set against the same chart at 600 random moments of its life. p is a permutation test (the events moved to random moments of their own chart 2000 times); q corrects p for the number of features looked at (false discovery rate).'));
    results.push(paragraph(`${result.events} ${t('events')} · ${result.charts} ${t('charts')} · ${result.tested} ${t('features tested')}`));
    if (hypothesis) {
      const chosen = testFeature(result.data, hypothesis);
      results.push(`<h3>${escape(t('the feature chosen beforehand'))}</h3>${paragraph(`${label(hypothesis)}: ${chosen.observed}/${chosen.total} ${t('events')} (${percent(chosen.observed, chosen.total)}), ${t('by chance')} ${chosen.expected.toFixed(1)}${chosen.lift !== null ? `, ×${chosen.lift.toFixed(1)}` : ''}, p ${formatP(chosen.p)}`)}<p class="note">${escape(t('One feature chosen before looking at the results needs no correction for the number of features: p is the exact chance of as many events with it as there are, by chance.'))}</p>`);
    }
    results.push(table(head(t('Feature'), t('events'), t('by chance'), '×', 'p', 'q'), result.results.slice(0, ROWS).map(row =>
      `${cell(label(row.id))}${cell(`${row.observed}/${result.events} ${percent(row.observed, result.events)}`)}${cell(row.expected.toFixed(1))}${cell(row.lift === null ? '—' : row.lift.toFixed(1))}${cell(formatP(row.p))}${cell(`${formatP(row.q)}${row.q <= Q_MARK ? ' ✓' : ''}`, row.q <= Q_MARK ? 'strong' : '')}`)));
    results.push(`<p class="note">${escape(fill(t('The {count} most unusual features of {total} are shown.'), { count: String(Math.min(ROWS, result.results.length)), total: String(result.results.length) }))}</p>`);
  } else if (body.mode === 'groups') {
    const { comparison, labels } = body.outcome;
    method.push(t('Each feature was counted in both sets of events and compared with the Fisher exact test; q corrects p for the number of features looked at, because among many some always look striking by chance.'));
    results.push(paragraph(`${labels.a} ${comparison.totalA} · ${labels.b} ${comparison.totalB} · ${comparison.tested} ${t('features tested')}`));
    results.push(table(head(t('Feature'), labels.a, labels.b, 'Δ', 'p', 'q'), comparison.rows.slice(0, ROWS).map(row =>
      `${cell(label(row.id))}${cell(`${row.a}/${comparison.totalA} ${percent(row.a, comparison.totalA)}`)}${cell(`${row.b}/${comparison.totalB} ${percent(row.b, comparison.totalB)}`)}${cell(`${row.difference > 0 ? '+' : ''}${Math.round(row.difference * 100)} %`)}${cell(formatP(row.p))}${cell(`${formatP(row.q)}${row.q <= Q_MARK ? ' ✓' : ''}`, row.q <= Q_MARK ? 'strong' : '')}`)));
  } else if (body.mode === 'validate') {
    const { result, by, share, top } = body.outcome;
    method.push(fill(t('The data was split by {by}, {share} % for training. The best {top} features of the training part were found the usual way and then tested exactly on the test part, which they were not chosen from; the correction counts only the features carried over.'), { by: t(by === 'charts' ? 'charts' : 'events'), share: String(Math.round(share * 100)), top: String(top) }));
    if (!result) results.push(paragraph(by === 'charts' ? t('Too few charts to split in two: choose to split by events, or add charts.') : t('Too few events to split in two.')));
    else {
      results.push(paragraph(`${t('training')}: ${result.trainingEvents} ${t('events')} · ${result.trainingCharts} ${t('charts')} · ${t('test')}: ${result.testEvents} ${t('events')} · ${result.testCharts} ${t('charts')}`));
      results.push(paragraph(`${fill(t('{held} of {count} features held in the test part.'), { held: String(result.held), count: String(result.rows.length) })} ${fill(t('By chance alone about {expected} would pass at p 0.05 without the correction.'), { expected: result.expectedByChance.toFixed(1) })}`));
      results.push(table(head(t('Feature'), t('training'), t('test'), t('corrected p'), t('held')), result.rows.map(row =>
        `${cell(label(row.id))}${cell(`${row.training.observed}/${row.training.total}${row.training.lift !== null ? ` ×${row.training.lift.toFixed(1)}` : ''} p ${formatP(row.training.p)}`)}${cell(`${row.test.observed}/${row.test.total}${row.test.lift !== null ? ` ×${row.test.lift.toFixed(1)}` : ''} p ${formatP(row.test.p)}`)}${cell(formatP(row.adjustedP))}${cell(row.holds ? '✓' : '—', row.holds ? 'strong' : '')}`)));
    }
  } else if (body.mode === 'settings') {
    const { rows } = body.outcome;
    method.push(t('The same study was run under each of the eight settings of the progressions. Strength is the mean of −log10 p (the exact p of each feature) of the five strongest features; the corrected p multiplies the best p by the eight settings tried.'));
    results.push(table(head(t('Setting'), t('strength'), t('holding'), t('features tested'), t('strongest feature'), t('corrected p')), rows.map(row =>
      `${cell(`${row.options.retro ?? 'previous'} · Saturn ${row.options.saturn} · Rahu ${row.options.rahu}`)}${cell(row.score.toFixed(2))}${cell(String(row.significant))}${cell(String(row.tested))}${cell(row.best ? `${label(row.best.id)} ${row.best.observed}/${row.best.total} p ${formatP(row.best.p)}` : '—')}${cell(row.correctedBestP === null ? '—' : formatP(row.correctedBestP))}`)));
  } else if (body.mode === 'combine') {
    const { result, spec } = body.outcome;
    method.push(t('A combination is there when both of its parts are there at the same time. Its chance level is how often both are there at random moments of the same chart, and p is exact; q corrects for the number of combinations looked at. A combination is of interest only if it is more unusual than each of its parts.'));
    results.push(paragraph(`${kindText(spec.left, t)} + ${kindText(spec.right, t)}${spec.sameGraha ? ` · ${t('the same graha')}` : ''} · ${result.events} ${t('events')} · ${result.tested} ${t('combinations tested')}`));
    results.push(table(head(t('Combination'), t('events'), t('by chance'), '×', 'p', 'q', t('parts p'), t('beats parts')), result.rows.slice(0, ROWS).map(row =>
      `${cell(label(row.id))}${cell(`${row.observed}/${result.events}`)}${cell(row.expected.toFixed(1))}${cell(row.lift === null ? '—' : row.lift.toFixed(1))}${cell(formatP(row.p))}${cell(`${formatP(row.q)}${row.q <= Q_MARK ? ' ✓' : ''}`, row.q <= Q_MARK ? 'strong' : '')}${cell(`${formatP(row.partP[0])} · ${formatP(row.partP[1])}`)}${cell(row.beyondParts ? '✓' : '—')}`)));
  } else {
    const { result, by, share } = body.outcome;
    method.push(t('A logistic model was built on the training part from its best features, adding the one that improves the fit most for as long as that is worth more than a penalty for choosing among so many, and tried as it stands on the test part, which it was not built from. The AUC is the chance that an event scores higher than a random moment of its own chart (0.5 is chance); p is how often events moved to random moments would score as high.'));
    if (!result) results.push(paragraph(by === 'charts' ? t('Too few charts to split in two: choose to split by events, or add charts.') : t('Too few events to split in two.')));
    else {
      results.push(paragraph(`${fill(t('Split by {by}, {share} % for training.'), { by: t(by === 'charts' ? 'charts' : 'events'), share: String(Math.round(share * 100)) })} ${t('training')}: ${result.trainingEvents} ${t('events')} · ${t('test')}: ${result.testEvents} ${t('events')} · ${result.candidates} ${t('candidates')}`));
      if (result.steps.length === 0) results.push(paragraph(t('No feature improved the fit enough to be worth adding, so the model is no better than chance: nothing in the training part explains the events.')));
      else {
        results.push(paragraph(fill(t('On the test part the model has an AUC of {auc} (0.5 is chance), p {p}.'), { auc: result.testAuc === null ? '—' : result.testAuc.toFixed(2), p: result.testP === null ? '—' : formatP(result.testP) })));
        results.push(table(head('#', t('Feature'), t('odds ×'), t('fit gain'), t('test AUC')), result.steps.map((step, i) =>
          `${cell(String(i + 1))}${cell(label(step.id))}${cell(step.oddsRatio.toFixed(1))}${cell(step.gain.toFixed(1))}${cell(step.testAuc === null ? '—' : step.testAuc.toFixed(2))}`)));
      }
    }
  }
  sections.push(`<h2>${escape(t('Method'))}</h2>${method.map(paragraph).join('')}`);
  sections.push(`<h2>${escape(t('Results'))}</h2>${results.join('')}`);

  // The cautions that go with any result of this kind.
  const cautions = [
    t('This shows what the events have in common, not why: an association is not a cause, and a pattern found among many features is a hint to test with more events, not a result.'),
    t('Among many features some always look striking by chance; the corrected values (q, or p after the correction) are the ones to read, and a feature found only after looking at the results should be tested again on events that were not looked at.'),
    t('A handful of events can only hint. Dates known only to the month or the year, and the places and times of birth, limit what can be seen.'),
  ];
  sections.push(`<h2>${escape(t('Cautions'))}</h2><div class="warn">${cautions.map(paragraph).join('')}</div>`);

  const stamp = context.generated.toISOString().slice(0, 16).replace('T', ' ');
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(t('Research report'))}</title><style>${STYLE}</style></head><body>
<h1>${escape(t('Research report'))}</h1><div class="meta">${escape(stamp)} UTC · BCP ${escape(context.version)} · ${escape(t('This is a research tool. Use your own judgement.'))}</div>
<p><button type="button" onclick="window.print()">${escape(t('Print or save as PDF'))}</button></p>
${sections.join('\n')}
</body></html>`;
}
