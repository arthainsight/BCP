'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { parseTargetDateString } from '@/lib/dateInput';
import { JULIAN_YEAR_MS } from '@/lib/time';
import { SIGN_ABBR, SIGN_NAMES } from '@/lib/signs';
import { useGrahaNames } from '@/lib/grahaNames';
import BhriguPeriodExplorer from '@/components/BhriguPeriodExplorer';
import { useT } from '@/lib/i18n';
import {
  calculateBhriguPadaActivations,
  calculateBhriguPadaPratyantardashas,
  calculateBhriguPadas,
  calculateBhriguProgressions,
  type BhriguPadaVersion,
} from '@/lib/bhriguPadaProgression';

type Props = {
  chart: ChartData;
  birthDatetime: string;
  targetDate: string;
  onSetTarget?: (value: string) => void;
};

const VERSIONS: { value: BhriguPadaVersion; label: string }[] = [
  { value: 'nadi-praveshika-8', label: 'Nāḍī Praveśikā (2019) · 8 grahas' },
  { value: 'sundaram-7', label: 'K. P. Vaani / A. V. Sundaram · 7 grahas' },
];

const HEAD = 'px-2 py-2 text-left text-[9px] font-mono uppercase tracking-wide text-zinc-400';
const CELL = 'px-2 py-2 text-[11px] font-mono text-zinc-700 dark:text-zinc-200';

function ageLabel(age: number): string {
  const years = Math.floor(age);
  const months = Math.floor((age - years) * 12 + 1e-8);
  return years + ' y ' + months + ' m';
}

function periodDateLabel(birth: Date | null, ageYears: number): string {
  if (!birth) return ageLabel(ageYears);
  const date = new Date(birth.getTime() + ageYears * JULIAN_YEAR_MS);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function durationLabel(durationYears: number): string {
  const totalMonths = durationYears * 12;
  const months = Math.floor(totalMonths + 1e-9);
  const days = Math.round((totalMonths - months) * 30.436875);
  return months + 'm ' + days + 'd';
}

function relationLabel(kind: 'same' | 'kendra' | 'trikona' | 'other', relation: number, t: (text: string) => string): string {
  if (kind === 'same') return t('Same sign') + ' (1)';
  if (kind === 'kendra') return t('Kendra') + ' (' + relation + ')';
  if (kind === 'trikona') return t('Trikona') + ' (' + relation + ')';
  return '—';
}

function localMomentString(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return pad(date.getDate()) + '.' + pad(date.getMonth() + 1) + '.' + date.getFullYear()
    + ' 12.00.00';
}

export default function BhriguPadaProgressionPanel({ chart, birthDatetime, targetDate, onSetTarget }: Props) {
  const t = useT();
  const { name } = useGrahaNames();
  const [version, setVersion] = useState<BhriguPadaVersion>('nadi-praveshika-8');

  const birth = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const target = useMemo(() => parseTargetDateString(targetDate), [targetDate]);
  const ageFromTarget = birth
    ? ((target ?? new Date()).getTime() - birth.getTime()) / JULIAN_YEAR_MS
    : null;

  // The progression is always calculated for the shared, explicitly selected target date.
  const ageYears = Math.max(0, ageFromTarget ?? 0);
  const beforeBirth = ageFromTarget !== null && ageFromTarget < 0;

  const progressions = useMemo(
    () => calculateBhriguProgressions(chart, ageYears, version),
    [chart, ageYears, version],
  );
  const pratyantardashas = useMemo(
    () => version === 'nadi-praveshika-8' ? calculateBhriguPadaPratyantardashas(progressions, ageYears) : [],
    [progressions, ageYears, version],
  );
  const padas = useMemo(() => calculateBhriguPadas(chart, version), [chart, version]);
  const activations = useMemo(
    () => calculateBhriguPadaActivations(padas, progressions),
    [padas, progressions],
  );
  const byLord = useMemo(() => new Map<string, (typeof progressions)[number]>(progressions.map(row => [row.body, row] as const)), [progressions]);
  const padasByLord = useMemo(() => {
    const result = new Map<string, string[]>();
    for (const pada of padas) {
      result.set(pada.lord, [...(result.get(pada.lord) ?? []), pada.name]);
    }
    return result;
  }, [padas]);

  const selectedVersion = VERSIONS.find(item => item.value === version)!;
  const targetDescription = target
    ? target.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : t('Today');

  return (
    <section className="min-w-0 space-y-4" aria-label="Bhrigu Pada Progression" data-bhrigu-pada-progression>
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">{t('Bhṛgu Pada Progression')}</h2>
        <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {t('A sign-only age progression of the grahas, read together with the twelve Arudha Padas. It is separate from Paraya and Sudarśana.')}
        </p>
      </div>

      <div className="grid gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
        <label className="block space-y-1">
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">{t('Source / rule set')}</span>
          <select
            value={version}
            onChange={event => setVersion(event.target.value as BhriguPadaVersion)}
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
            aria-label={t('Bhrigu Pada version')}
          >
            {VERSIONS.map(item => <option key={item.value} value={item.value}>{t(item.label)}</option>)}
          </select>
          <span className="block text-[10px] text-zinc-500">
            {version === 'nadi-praveshika-8'
              ? t('Includes Rahu, uses a 29-year Saturn cycle, and calculates Arudhas without the standard exceptions.')
              : t('Uses seven grahas, a 30-year Saturn cycle, and shifts any Arudha that falls in a kendra to the 10th from itself.')}
          </span>
        </label>

        <div className="space-y-2">
          <label className="block space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">{t('Progression date')}</span>
            <input
              type="date"
              value={targetDate}
              onChange={event => {
                const selected = parseTargetDateString(event.target.value);
                if (selected) onSetTarget?.(localMomentString(selected));
              }}
              disabled={!onSetTarget}
              className="w-full rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs tabular-nums disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
              aria-label={t('Progression date')}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
            <span className="text-zinc-500">{t('Age at selected date')}: <strong className="font-mono text-zinc-700 dark:text-zinc-200">{ageLabel(ageYears)}</strong></span>
            <span className="text-zinc-400">{targetDescription}</span>
          </div>
          <p className="text-[9px] text-zinc-400">{t('The progression is calculated for the selected date, not by manually changing the age.')}</p>
        </div>
      </div>

      {beforeBirth && (
        <p className="rounded-md border border-amber-300 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:text-amber-300">
          {t('The selected target date is before birth. The progression is shown at age zero.')}
        </p>
      )}
      {!birth && (
        <p className="text-xs text-amber-700 dark:text-amber-300">{t('Birth date is unavailable; check the birth data.')}</p>
      )}

      <BhriguPeriodExplorer chart={chart} birthDatetime={birthDatetime} version={version} />

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold">{t('Antardasha (AD) progressions')}</h3>
          <span className="text-[9px] font-mono text-zinc-400">{t(selectedVersion.label)}</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[620px] border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60">
              <tr>
                <th className={HEAD}>{t('Graha')}</th>
                <th className={HEAD}>{t('Cycle')}</th>
                <th className={HEAD}>{t('From natal sign')}</th>
                <th className={HEAD}>{t('Antardasha (AD) sign')}</th>
                <th className={HEAD}>{t('House from Lagna')}</th>
                <th className={HEAD}>{t('Padas ruled')}</th>
              </tr>
            </thead>
            <tbody>
              {progressions.map(row => {
                const natal = chart.planets.find(planet => planet.name === row.body);
                return (
                  <tr key={row.body} className="border-t border-zinc-100 dark:border-zinc-800" data-bhrigu-progression={row.body}>
                    <td className={CELL + ' font-semibold'}>{name(row.body)}</td>
                    <td className={CELL}>{row.cycleYears} {t('yr')}</td>
                    <td className={CELL}>{row.houseFromNatal}/12</td>
                    <td className={CELL}>
                      <span className="font-semibold">{SIGN_ABBR[row.sign - 1]}</span>
                      <span className="ml-1 text-zinc-400">{natal ? SIGN_ABBR[natal.sign - 1] + ' → ' : ''}</span>
                      <span>{SIGN_NAMES[row.sign - 1]}</span>
                    </td>
                    <td className={CELL}>{row.houseFromLagna}</td>
                    <td className={CELL}>{(padasByLord.get(row.body) ?? []).join(', ') || '—'}</td>
                  </tr>
                );
              })}
              {progressions.length === 0 && (
                <tr><td className={CELL} colSpan={6}>{t('No supported natal grahas were found in this chart.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {version === 'nadi-praveshika-8' ? (
        <div className="space-y-2" data-bhrigu-pratyantardashas>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-xs font-semibold">{t('MD–AD–PD')}</h3>
            <span className="text-[9px] text-zinc-400">{t('MD is fixed at the natal sign')}</span>
          </div>
          <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {t('MD stays in the graha’s natal sign. AD is the current progressed sign. PD is the active 12-part sub-period within AD, counted forward from the AD sign.')}
          </p>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-900/60">
                <tr>
                  <th className={HEAD}>{t('Graha')}</th>
                  <th className={HEAD}>{t('Mahadasha (natal) sign')}</th>
                  <th className={HEAD}>{t('Antardasha (AD) sign')}</th>
                  <th className={HEAD}>{t('Pratyantardasha (PD) sign')}</th>
                  <th className={HEAD}>{t('PD sub-period')}</th>
                  <th className={HEAD}>{t('Duration')}</th>
                  <th className={HEAD}>{t('Period dates')}</th>
                </tr>
              </thead>
              <tbody>
                {pratyantardashas.map(item => (
                  <tr key={item.body} className="border-t border-zinc-100 dark:border-zinc-800" data-bhrigu-pratyantardasha={item.body}>
                    <td className={CELL + ' font-semibold'}>{name(item.body)}</td>
                    <td className={CELL}>{SIGN_NAMES[item.mahaDashaSign - 1]}</td>
                    <td className={CELL}>{SIGN_NAMES[item.antardashaSign - 1]}</td>
                    <td className={CELL + ' font-semibold text-violet-700 dark:text-violet-300'}>{SIGN_NAMES[item.pratyantardashaSign - 1]}</td>
                    <td className={CELL}>{item.pratyantardashaNumber}/12</td>
                    <td className={CELL}>{durationLabel(item.pratyantardashaDurationYears)}</td>
                    <td className={CELL}>
                      {periodDateLabel(birth, item.startAgeYears)} – {periodDateLabel(birth, item.endAgeYears)}
                    </td>
                  </tr>
                ))}
                {pratyantardashas.length === 0 && (
                  <tr><td className={CELL} colSpan={7}>{t('No pratyantardashas can be calculated for this chart.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] leading-relaxed text-zinc-400">
            {t('PD duration is one one-hundred-and-forty-fourth of the graha cycle. Dates are calculated from birth using the full sign-periods, irrespective of the natal degree.')}
          </p>
        </div>
      ) : (
        <p className="rounded-md border border-zinc-200 px-3 py-2 text-[10px] leading-relaxed text-zinc-500 dark:border-zinc-800">
          {t('The MD–AD–PD subdivision is available in the 2019 Nadi Praveshika version; the older seven-graha source does not specify it. Select the 2019 version to see it.')}
        </p>
      )}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-xs font-semibold">{t('Arudha Padas')}</h3>
          <span className="text-[9px] text-zinc-400">{t('Natal Arudha map and its lord progression')}</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[680px] border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-900/60">
              <tr>
                <th className={HEAD}>{t('Pada')}</th>
                <th className={HEAD}>{t('Natal house')}</th>
                <th className={HEAD}>{t('Arudha sign')}</th>
                <th className={HEAD}>{t('Pada lord')}</th>
                <th className={HEAD}>{t('AD position of lord')}</th>
                <th className={HEAD}>{t('Relation from Pada')}</th>
              </tr>
            </thead>
            <tbody>
              {activations.map(item => {
                const lordProgression = byLord.get(item.pada.lord);
                return (
                  <tr key={item.pada.house} className="border-t border-zinc-100 dark:border-zinc-800" data-bhrigu-pada={item.pada.name}>
                    <td className={CELL + ' font-semibold'}>{item.pada.name}</td>
                    <td className={CELL}>H{item.pada.house} · {SIGN_ABBR[item.pada.houseSign - 1]}</td>
                    <td className={CELL}>{SIGN_NAMES[item.pada.sign - 1]}</td>
                    <td className={CELL}>{name(item.pada.lord)}</td>
                    <td className={CELL}>{lordProgression ? SIGN_NAMES[lordProgression.sign - 1] : '—'}</td>
                    <td className={CELL}>
                      <span className={item.kind === 'other' ? 'text-zinc-400' : 'font-semibold text-emerald-700 dark:text-emerald-300'}>
                        {relationLabel(item.kind, item.relationFromPada, t)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {activations.length === 0 && (
                <tr><td className={CELL} colSpan={6}>{t('Arudha Padas cannot be calculated for this chart.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[9px] leading-relaxed text-zinc-400">
          {t('The relation column compares each Pada with the AD sign of its own lord. Same sign, Kendra and Trikona are shown as reference relationships, not as an automatic event prediction.')}
        </p>
      </div>

      <details className="rounded-lg border border-zinc-200 px-3 py-2 text-[10px] dark:border-zinc-800">
        <summary className="cursor-pointer font-semibold text-zinc-600 dark:text-zinc-300">{t('Calculation notes')}</summary>
        <div className="space-y-1 pt-2 leading-relaxed text-zinc-500">
          <p>{t('Sign steps are calculated as floor(age × 12 ÷ graha cycle), counted forward from each graha natal sign, wrapping every twelve signs.')}</p>
          <p>{t('This is sign-only. The source tables do not supply a continuously progressed longitude or degree, so natal degrees are not advanced.')}</p>
          <p>{t('The 2019 and 2008/2014 variants are kept separate because their cycle lengths, graha set and Arudha exception rules differ.')}</p>
        </div>
      </details>
    </section>
  );
}
