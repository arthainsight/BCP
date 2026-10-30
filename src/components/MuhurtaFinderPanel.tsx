'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { AnnualPlaceControl, type AnnualPlace } from './annualShared';
import { calculationParams } from '@/lib/apiParams';
import { pad2 } from '@/lib/dateFormat';
import { SIGN_ABBR, SIGN_NAMES } from '@/lib/signs';
import { NAKSHATRA_NAMES } from '@/lib/nakshatras';
import { YOGA_NAMES } from '@/lib/panchang';
import {
  BENEFICS, CHANDRABALA_USUAL, FINDER_GRAHAS, FINDER_SIZES, KARANA_NAMES, MALEFICS, RULE_GRAHAS, TARABALA_USUAL, TARA_NAMES, effectiveRules, formatChandra, formatRule, formatTara, isImpossible, isImpossibleRule,
  SANKRANTI_HOURS, isLimited, localParts, nakshatraOf, tithiLabel, type FinderCriteria, type FinderGraha, type FinderRule,
} from '@/lib/muhurtaFinder';
import { DOSHAS, DOSHAS_NOT_WORKED_OUT, DOSHA_IDS, isDoshaId, type DoshaId } from '@/lib/mahadosha';
import { FINDER_PRESETS, type FinderPreset } from '@/lib/muhurtaFinderPresets';
import type { FinderResult } from '@/lib/muhurtaFinderRun';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  /** The day the search starts from, YYYY-MM-DD (the target date of the chart). */
  targetDate: string;
  /** The time zone of the birthplace, for the clock times of the results. */
  ianaTimezone?: string;
  calculationSettings?: CalculationSettings;
  /** Sets the moment of the target of the chart, DD.MM.YYYY HH.MM.SS. */
  onSetTarget?: (value: string) => void;
};

const STORAGE_KEY = 'muhurtaFinderChoices';
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const GRAHA_HEAD: Record<FinderGraha, string> = { Asc: 'As', Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const DAYS = [7, 30, 90, 180, 366] as const;
const MAX_RULES = 12;

const range = (size: number, first = 0) => Array.from({ length: size }, (_, index) => first + index);

/** What is chosen in each group: every item at first, which is no condition. */
type Choices = {
  vara: number[]; tithi: number[]; nakshatra: number[]; yoga: number[]; karana: number[];
  signs: Record<FinderGraha, number[]>;
  rules: FinderRule[];
  /** The houses from the Moon at birth that suit (Chandrabala); every house is no condition. */
  chandra: number[];
  /** The tārās (1 to 9) of the Moon's nakṣatra from the birth nakṣatra that suit (Tarabala); every tārā is no condition. */
  tara: number[];
  /** The Mahādoṣas to keep clear of. */
  avoid: DoshaId[];
  /** Hours on each side of a Saṅkrānti. */
  sankrantiHours: number;
};

const allChoices = (): Choices => ({
  vara: range(FINDER_SIZES.vara), tithi: range(FINDER_SIZES.tithi, 1), nakshatra: range(FINDER_SIZES.nakshatra),
  yoga: range(FINDER_SIZES.yoga), karana: range(FINDER_SIZES.karana),
  signs: Object.fromEntries(FINDER_GRAHAS.map(graha => [graha, range(12)])) as Record<FinderGraha, number[]>,
  rules: [],
  chandra: range(12, 1),
  tara: range(9, 1),
  avoid: [],
  sankrantiHours: SANKRANTI_HOURS,
});

/** The choices of a preset: everything, with what the preset names set. */
function presetChoices(preset: FinderPreset): Choices {
  const choices = allChoices();
  for (const key of ['vara', 'tithi', 'nakshatra', 'yoga', 'karana'] as const) choices[key] = preset[key] ?? choices[key];
  for (const graha of FINDER_GRAHAS) choices.signs[graha] = preset.signs?.[graha] ?? choices.signs[graha];
  choices.chandra = preset.chandra ?? choices.chandra;
  choices.tara = preset.tara ?? choices.tara;
  choices.rules = (preset.rules ?? []).map(rule => ({ ...rule, grahas: [...rule.grahas], houses: [...rule.houses] }));
  return choices;
}

/** The choices kept in the browser, each list read back only as far as it is made of numbers that exist. */
function readChoices(): Choices {
  const choices = allChoices();
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<Record<string, unknown>> | null;
    if (!saved || typeof saved !== 'object') return choices;
    const list = (value: unknown, first: number, size: number): number[] | null =>
      Array.isArray(value) && value.every(item => Number.isInteger(item) && item >= first && item < first + size) ? [...new Set(value as number[])] : null;
    choices.vara = list(saved.vara, 0, 7) ?? choices.vara;
    choices.tithi = list(saved.tithi, 1, 30) ?? choices.tithi;
    choices.nakshatra = list(saved.nakshatra, 0, 27) ?? choices.nakshatra;
    choices.yoga = list(saved.yoga, 0, 27) ?? choices.yoga;
    choices.karana = list(saved.karana, 0, 11) ?? choices.karana;
    choices.chandra = list(saved.chandra, 1, 12) ?? choices.chandra;
    choices.tara = list(saved.tara, 1, 9) ?? choices.tara;
    if (Array.isArray(saved.avoid)) choices.avoid = [...new Set((saved.avoid as unknown[]).filter((item): item is DoshaId => typeof item === 'string' && isDoshaId(item)))];
    if (typeof saved.sankrantiHours === 'number' && saved.sankrantiHours >= 0 && saved.sankrantiHours <= 48) choices.sankrantiHours = saved.sankrantiHours;
    const signs = saved.signs as Partial<Record<string, unknown>> | undefined;
    for (const graha of FINDER_GRAHAS) choices.signs[graha] = list(signs?.[graha], 0, 12) ?? choices.signs[graha];
    if (Array.isArray(saved.rules)) {
      const rules: FinderRule[] = [];
      for (const item of saved.rules.slice(0, MAX_RULES) as Partial<Record<string, unknown>>[]) {
        const grahas = Array.isArray(item?.grahas) && item.grahas.every(name => (RULE_GRAHAS as readonly unknown[]).includes(name)) ? [...new Set(item.grahas as FinderGraha[])] : null;
        const houses = list(item?.houses, 1, 12);
        if ((item?.kind === 'any' || item?.kind === 'none') && grahas && houses) rules.push({ kind: item.kind, grahas, houses });
      }
      choices.rules = rules;
    }
  } catch {
    // No storage, or something else in it: the choices are all.
  }
  return choices;
}

const chip = (on: boolean) =>
  `rounded-md border px-2 py-1 text-[10px] font-mono ${on
    ? 'border-emerald-500 bg-emerald-500 text-white dark:border-green-600 dark:bg-green-600'
    : 'border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400'}`;
const smallButton = 'rounded border border-zinc-300 px-1.5 py-0.5 text-[9px] font-mono uppercase text-zinc-600 dark:border-zinc-600 dark:text-zinc-300';

/** One group of choices: a title, the buttons that choose all, flip or none, and the items. */
function Group({
  title, items, size, first = 0, chosen, onChange, columns = 'flex flex-wrap gap-1', note, extra,
}: {
  title: string;
  items: { value: number; label: string; title?: string }[];
  size: number;
  first?: number;
  chosen: number[];
  onChange: (values: number[]) => void;
  columns?: string;
  note?: string;
  /** More buttons in the line of the title. */
  extra?: ReactNode;
}) {
  const t = useT();
  const set = new Set(chosen);
  const values = range(size, first);
  return (
    <section className="min-w-0 space-y-1.5 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700" data-finder-group={title}>
      <div className="flex flex-wrap items-center gap-1.5">
        <h3 className="mr-1 text-xs font-mono font-semibold text-emerald-700 dark:text-green-400">{title}</h3>
        <button type="button" className={smallButton} onClick={() => onChange(values)}>{t('all')}</button>
        <button type="button" className={smallButton} onClick={() => onChange(values.filter(value => !set.has(value)))}>{t('flip')}</button>
        <button type="button" className={smallButton} onClick={() => onChange([])}>{t('none')}</button>
        {extra}
        {isLimited(chosen, size) && <span className="text-[9px] font-mono text-amber-700 dark:text-amber-400">{chosen.length} / {size}</span>}
      </div>
      {note && <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{note}</p>}
      <div className={columns}>
        {items.map(item => (
          <button
            key={item.value}
            type="button"
            aria-pressed={set.has(item.value)}
            title={item.title}
            className={chip(set.has(item.value))}
            onClick={() => onChange(set.has(item.value) ? chosen.filter(value => value !== item.value) : [...chosen, item.value].sort((a, b) => a - b))}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function clock(parts: { hour: number; minute: number }) {
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/**
 * The Muhūrta Finder: choose the vāra, tithi, nakṣatra, yoga and karaṇa that suit, and the signs the Ascendant and the
 * grahas may be in, and it lists the stretches of time, in a span of days at a place, in which all of them hold at once.
 */
export default function MuhurtaFinderPanel({ chart, targetDate, ianaTimezone, calculationSettings, onSetTarget }: Props) {
  const t = useT();
  // The panel opens after the page has, never in the page the server builds, so the browser's choices can be read at once.
  const [choices, setChoices] = useState<Choices>(readChoices);
  const [place, setPlace] = useState<AnnualPlace>(null);
  const [start, setStart] = useState(() => (/^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : new Date().toISOString().slice(0, 10)));
  const [days, setDays] = useState<number>(30);
  const [state, setState] = useState<{ loading: boolean; error?: string; result?: FinderResult; zone?: string; tz: number }>({ loading: false, tz: 0 });
  const [showAll, setShowAll] = useState(false);
  const [presetId, setPresetId] = useState<string | null>(null);
  const request = useRef(0);

  // The choices are kept in the browser, and written back as they change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choices));
    } catch {
      // The choices are then for this visit only.
    }
  }, [choices]);

  // The sign (0 to 11) of the Moon at birth, for the Chandrabala.
  const natalMoon = chart.planets.find(planet => planet.name === 'Moon');
  const natalMoonSign = natalMoon ? natalMoon.sign - 1 : undefined;
  const natalNakshatra = natalMoon ? nakshatraOf(natalMoon.longitude) : undefined;
  const natalAscSign = chart.ascendant ? chart.ascendant.sign - 1 : undefined;
  const criteria: FinderCriteria = useMemo(() => {
    const signs: FinderCriteria['signs'] = {};
    for (const graha of FINDER_GRAHAS) if (isLimited(choices.signs[graha], 12)) signs[graha] = choices.signs[graha];
    const chandra = natalMoonSign !== undefined && isLimited(choices.chandra, 12) ? { moonSign: natalMoonSign, houses: choices.chandra } : undefined;
    const tara = natalNakshatra !== undefined && isLimited(choices.tara, 9) ? { nakshatra: natalNakshatra, taras: choices.tara } : undefined;
    const natal = natalMoonSign !== undefined && natalAscSign !== undefined ? { ascSign: natalAscSign, moonSign: natalMoonSign } : undefined;
    return { vara: choices.vara, tithi: choices.tithi, nakshatra: choices.nakshatra, yoga: choices.yoga, karana: choices.karana, signs, rules: choices.rules, chandra, tara, avoid: choices.avoid, natal, sankrantiHours: choices.sankrantiHours };
  }, [choices, natalMoonSign, natalAscSign, natalNakshatra]);
  const impossible = isImpossible(criteria);
  const anyCondition = isLimited(choices.vara, 7) || isLimited(choices.tithi, 30) || isLimited(choices.nakshatra, 27) || isLimited(choices.yoga, 27) || isLimited(choices.karana, 11) || Object.keys(criteria.signs).length > 0 || effectiveRules(criteria).length > 0 || criteria.chandra !== undefined || criteria.tara !== undefined || choices.avoid.length > 0;

  const zone = place ? place.timezone : ianaTimezone;
  const lat = place ? place.latitude : chart.debug?.latitude;
  const lng = place ? place.longitude : chart.debug?.longitude;
  const tz = chart.debug?.utcOffset ?? 0;
  const canSearch = typeof lat === 'number' && typeof lng === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(start) && !impossible;

  const search = async () => {
    if (!canSearch) return;
    const params = new URLSearchParams({ start, days: String(days), lat: String(lat), lng: String(lng), tz: String(tz), ...(zone ? { zone } : {}), ...calculationParams(calculationSettings) });
    const lists: [string, number[], number][] = [
      ['vara', choices.vara, 7], ['tithi', choices.tithi, 30], ['nakshatra', choices.nakshatra, 27], ['yoga', choices.yoga, 27], ['karana', choices.karana, 11],
    ];
    for (const [key, list, size] of lists) if (isLimited(list, size)) params.set(key, list.join(','));
    for (const graha of FINDER_GRAHAS) if (isLimited(choices.signs[graha], 12)) params.set(`sign_${graha}`, choices.signs[graha].join(','));
    for (const rule of choices.rules) params.append('rule', formatRule(rule));
    if (criteria.chandra) params.set('chandra', formatChandra(criteria.chandra));
    if (criteria.tara) params.set('tara', formatTara(criteria.tara));
    if (choices.avoid.length > 0) {
      params.set('avoid', choices.avoid.join(','));
      if (criteria.natal) params.set('natal', `${criteria.natal.ascSign}:${criteria.natal.moonSign}`);
      if (choices.avoid.includes('sankranti')) params.set('sankrantiHours', String(choices.sankrantiHours));
    }
    const id = ++request.current;
    setState({ loading: true, tz });
    setShowAll(false);
    try {
      const response = await fetch(`/api/muhurta-finder?${params}`);
      const data = await response.json();
      if (id !== request.current) return;
      setState(data.error ? { loading: false, error: String(data.error), tz } : { loading: false, result: data as FinderResult, zone, tz });
    } catch (error) {
      if (id === request.current) setState({ loading: false, error: String(error), tz });
    }
  };

  const set = <K extends keyof Choices>(key: K, value: Choices[K]) => setChoices(current => ({ ...current, [key]: value }));
  const setRule = (index: number, value: FinderRule) => setChoices(current => ({ ...current, rules: current.rules.map((rule, at) => (at === index ? value : rule)) }));
  const removeRule = (index: number) => setChoices(current => ({ ...current, rules: current.rules.filter((_, at) => at !== index) }));
  const setSigns = (graha: FinderGraha, value: number[]) => setChoices(current => ({ ...current, signs: { ...current.signs, [graha]: value } }));

  const shown = state.result ? (showAll ? state.result.windows : state.result.windows.slice(0, 60)) : [];
  const local = (ms: number) => localParts(ms, state.zone, state.tz);
  const emptyGroups = [
    ['Vāra', choices.vara], ['Tithi', choices.tithi], ['Nakṣatra', choices.nakshatra], ['Yoga', choices.yoga], ['Karaṇa', choices.karana],
    ...FINDER_GRAHAS.map(graha => [GRAHA_HEAD[graha], choices.signs[graha]] as [string, number[]]),
  ].filter(([, list]) => (list as number[]).length === 0).map(([name]) => name as string);
  if (choices.rules.some(isImpossibleRule)) emptyGroups.push(t('a placement rule'));
  if (natalMoonSign !== undefined && choices.chandra.length === 0) emptyGroups.push('Chandrabala');
  if (natalNakshatra !== undefined && choices.tara.length === 0) emptyGroups.push('Tarabala');

  return (
    <div className="min-w-0 space-y-3" data-testid="muhurta-finder">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Muhurta Finder')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Choose what suits and press search: the stretches of time in which every choice holds at once are listed. A group with everything chosen puts no condition. The vāra changes at sunrise. Times are local to the place.')}
        </p>
      </div>

      <AnnualPlaceControl place={place} onChange={setPlace} />

      <section className="min-w-0 space-y-1.5 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700" data-finder-group="Presets">
        <h3 className="text-xs font-mono font-semibold text-emerald-700 dark:text-green-400">{t('Ready-made choices')}</h3>
        <div className="flex flex-wrap gap-1">
          {FINDER_PRESETS.map(preset => (
            <button key={preset.id} type="button" className={chip(preset.id === presetId)} aria-pressed={preset.id === presetId} onClick={() => { setChoices(presetChoices(preset)); setPresetId(preset.id); }}>
              {t(preset.label)}
            </button>
          ))}
        </div>
        {FINDER_PRESETS.filter(preset => preset.id === presetId).map(preset => (
          <p key={preset.id} className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t(preset.note)}</p>
        ))}
      </section>

      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        <label className="flex items-center gap-1.5">
          <span className="uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('from')}</span>
          <input
            type="date"
            value={start}
            onChange={event => setStart(event.target.value)}
            className="rounded border border-zinc-300 bg-white px-1.5 py-1 text-xs text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            aria-label={t('Search from')}
          />
        </label>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t('Days to search')}>
          {DAYS.map(count => (
            <button key={count} type="button" aria-pressed={days === count} className={chip(days === count)} onClick={() => setDays(count)}>{count} {t('d')}</button>
          ))}
        </div>
        <button
          type="button"
          onClick={search}
          disabled={!canSearch || state.loading}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wide text-white disabled:opacity-40 dark:bg-green-700"
        >
          {state.loading ? t('searching…') : t('search')}
        </button>
      </div>
      {impossible && (
        <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400">{t('Nothing is chosen in')} {emptyGroups.join(', ')}.</p>
      )}

      <div className="grid gap-2 lg:grid-cols-2">
        <Group
          title={t('Vāra')} size={7} chosen={choices.vara} onChange={value => set('vara', value)}
          items={WEEKDAYS.map((label, value) => ({ value, label, title: WEEKDAY_FULL[value] }))}
        />
        <Group
          title={t('Karaṇa')} size={11} chosen={choices.karana} onChange={value => set('karana', value)}
          items={KARANA_NAMES.map((label, value) => ({ value, label }))}
        />
        <Group
          title={t('Tithi')} size={30} first={1} chosen={choices.tithi} onChange={value => set('tithi', value)}
          columns="grid grid-cols-5 gap-1"
          items={range(30, 1).map(value => ({ value, label: tithiLabel(value), title: value <= 15 ? t('bright half') : t('dark half') }))}
        />
        <Group
          title={t('Yoga')} size={27} chosen={choices.yoga} onChange={value => set('yoga', value)}
          items={YOGA_NAMES.map((label, value) => ({ value, label }))}
        />
        <Group
          title={t('Nakṣatra')} size={27} chosen={choices.nakshatra} onChange={value => set('nakshatra', value)}
          items={NAKSHATRA_NAMES.map((label, value) => ({ value, label }))}
        />
        {natalMoonSign !== undefined && (
          <Group
            title="Chandrabala" size={12} first={1} chosen={choices.chandra} onChange={value => set('chandra', value)}
            note={`${t('The house of the Moon from the sign of the Moon at birth')} (${SIGN_NAMES[natalMoonSign]}). ${t('The 1st, 3rd, 6th, 7th, 10th and 11th are the houses usually taken to suit; the 8th is the Candrāṣṭama to avoid.')}`}
            extra={<button type="button" className={smallButton} onClick={() => set('chandra', CHANDRABALA_USUAL)}>{t('usual six')}</button>}
            items={range(12, 1).map(value => ({ value, label: String(value), title: SIGN_NAMES[(natalMoonSign + value - 1) % 12] }))}
          />
        )}
        {natalNakshatra !== undefined && (
          <Group
            title="Tarabala" size={9} first={1} chosen={choices.tara} onChange={value => set('tara', value)}
            note={`${t("The tārā of the Moon's nakṣatra, counted from the nakṣatra of the Moon at birth")} (${NAKSHATRA_NAMES[natalNakshatra]}). ${t('Sampat, Kshema, Sadhana, Mitra and Parama Mitra are the tārās usually taken to suit; Janma, Vipat, Pratyak and Naidhana are the ones to avoid.')}`}
            extra={<button type="button" className={smallButton} onClick={() => set('tara', TARABALA_USUAL)}>{t('usual five')}</button>}
            items={range(9, 1).map(value => ({
              value,
              label: `${value} ${TARA_NAMES[value - 1]}`,
              title: [0, 1, 2].map(round => NAKSHATRA_NAMES[(natalNakshatra + value - 1 + 9 * round) % 27]).join(', '),
            }))}
          />
        )}
        <section className="min-w-0 space-y-1.5 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700" data-finder-group="Graha">
          <h3 className="text-xs font-mono font-semibold text-emerald-700 dark:text-green-400">{t('Graha')}</h3>
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('The signs the Ascendant and each graha may be in. A column header chooses or clears the whole column.')}</p>
          <div className="overflow-x-auto">
            <table className="border-collapse text-[10px] font-mono">
              <thead>
                <tr>
                  {FINDER_GRAHAS.map(graha => (
                    <th key={graha} className="p-0.5">
                      <button
                        type="button"
                        className={`${smallButton} w-full ${isLimited(choices.signs[graha], 12) ? 'border-amber-500 text-amber-700 dark:text-amber-400' : ''}`}
                        aria-label={`${GRAHA_HEAD[graha]}: ${t('choose or clear all')}`}
                        onClick={() => setSigns(graha, choices.signs[graha].length === 12 ? [] : range(12))}
                      >
                        {GRAHA_HEAD[graha]}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {range(12).map(sign => (
                  <tr key={sign}>
                    {FINDER_GRAHAS.map(graha => {
                      const on = choices.signs[graha].includes(sign);
                      return (
                        <td key={graha} className="p-0.5">
                          <button
                            type="button"
                            aria-pressed={on}
                            aria-label={`${GRAHA_HEAD[graha]} ${SIGN_ABBR[sign]}`}
                            className={`${chip(on)} w-full`}
                            onClick={() => setSigns(graha, on ? choices.signs[graha].filter(value => value !== sign) : [...choices.signs[graha], sign].sort((a, b) => a - b))}
                          >
                            {SIGN_ABBR[sign]}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="min-w-0 space-y-1.5 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700 lg:col-span-2" data-finder-group="Placements">
          <h3 className="text-xs font-mono font-semibold text-emerald-700 dark:text-green-400">{t('Placements')}</h3>
          <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{t('Rules about the houses, counted from the sign of the Ascendant (the 1st house). Every rule must hold at once. With a rule the search looks every 5 minutes.')}</p>
          {choices.rules.map((rule, index) => (
            <div key={index} className="space-y-1 rounded-md border border-zinc-200 p-2 dark:border-zinc-700" data-finder-rule={index}>
              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  aria-label={`${t('Rule')} ${index + 1}`}
                  value={rule.kind}
                  onChange={event => setRule(index, { ...rule, kind: event.target.value as FinderRule['kind'] })}
                  className="rounded border border-zinc-300 bg-white px-1.5 py-1 text-[10px] text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <option value="any">{t('at least one of')}</option>
                  <option value="none">{t('none of')}</option>
                </select>
                <button type="button" className={smallButton} onClick={() => setRule(index, { ...rule, grahas: [...BENEFICS] })}>{t('benefics')}</button>
                <button type="button" className={smallButton} onClick={() => setRule(index, { ...rule, grahas: [...MALEFICS] })}>{t('malefics')}</button>
                <button type="button" className={smallButton} onClick={() => removeRule(index)} aria-label={`${t('remove rule')} ${index + 1}`}>{t('remove rule')}</button>
                {isImpossibleRule(rule) && <span className="text-[9px] font-mono text-rose-600 dark:text-rose-400">{t('this rule can never hold')}</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {RULE_GRAHAS.map(graha => {
                  const on = rule.grahas.includes(graha);
                  return (
                    <button
                      key={graha}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${t('Rule')} ${index + 1} ${graha}`}
                      className={chip(on)}
                      onClick={() => setRule(index, { ...rule, grahas: on ? rule.grahas.filter(name => name !== graha) : [...rule.grahas, graha] })}
                    >
                      {GRAHA_HEAD[graha]}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">{rule.kind === 'any' ? t('in one of the houses') : t('in none of the houses')}</span>
                {range(12, 1).map(house => {
                  const on = rule.houses.includes(house);
                  return (
                    <button
                      key={house}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${t('Rule')} ${index + 1} ${t('house')} ${house}`}
                      className={chip(on)}
                      onClick={() => setRule(index, { ...rule, houses: on ? rule.houses.filter(value => value !== house) : [...rule.houses, house].sort((a, b) => a - b) })}
                    >
                      {house}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            type="button"
            className={smallButton}
            disabled={choices.rules.length >= MAX_RULES}
            onClick={() => setChoices(current => ({ ...current, rules: [...current.rules, { kind: 'any', grahas: [], houses: [] }] }))}
          >
            {t('add a rule')}
          </button>
        </section>
      </div>

      <section className="min-w-0 space-y-1.5 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-700" data-finder-group="Mahadoshas">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="mr-1 text-xs font-mono font-semibold text-emerald-700 dark:text-green-400">{t('Mahādoṣas to keep clear of')}</h3>
          <button type="button" className={smallButton} onClick={() => set('avoid', [...DOSHA_IDS])}>{t('all')}</button>
          <button type="button" className={smallButton} onClick={() => set('avoid', [])}>{t('none')}</button>
          {choices.avoid.length > 0 && <span className="text-[9px] font-mono text-amber-700 dark:text-amber-400">{choices.avoid.length} / {DOSHA_IDS.length}</span>}
        </div>
        <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The great faults of a muhūrta, to be avoided for all important occasions. The stretches found are free of the ones chosen. Together they leave very little, so choose the ones that matter. With one that depends on the Ascendant the search looks every 5 minutes.')}
        </p>
        <div className="grid gap-1 lg:grid-cols-2">
          {[...DOSHA_IDS].sort((a, b) => DOSHAS[a].number - DOSHAS[b].number).map(id => {
            const on = choices.avoid.includes(id);
            return (
              <label key={id} className="flex min-w-0 cursor-pointer items-start gap-2 rounded-md border border-zinc-200 p-1.5 dark:border-zinc-700" data-finder-dosha={id}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => set('avoid', on ? choices.avoid.filter(item => item !== id) : [...choices.avoid, id])}
                  className="mt-0.5"
                  aria-label={`${DOSHAS[id].number}. ${DOSHAS[id].name}`}
                />
                <span className="min-w-0 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">{DOSHAS[id].number}. {DOSHAS[id].name}</span>
                  <span className="block text-[9px] text-zinc-500 dark:text-zinc-400">{t(DOSHAS[id].what)}</span>
                  {DOSHAS[id].notApplied && <span className="block text-[9px] text-zinc-400 dark:text-zinc-600">{t('Not applied')}: {t(DOSHAS[id].notApplied!)}</span>}
                </span>
              </label>
            );
          })}
        </div>
        {choices.avoid.includes('sankranti') && (
          <label className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>{t('Hours on each side of the Sun entering a sign')}</span>
            <input
              type="number" min={0} max={48} step={0.1} value={choices.sankrantiHours}
              onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0 && value <= 48) set('sankrantiHours', value); }}
              className="w-20 rounded border border-zinc-300 bg-white px-1.5 py-1 text-xs text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              aria-label={t('Hours on each side of the Sun entering a sign')}
            />
            <span className="text-[9px] text-zinc-400 dark:text-zinc-600">{t('The text gives no length: 16 ghaṭīs (6.4 hours) is the default.')}</span>
          </label>
        )}
        <details className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          <summary className="cursor-pointer">{t('Not worked out')} ({DOSHAS_NOT_WORKED_OUT.length})</summary>
          <ul className="mt-1 space-y-0.5">
            {DOSHAS_NOT_WORKED_OUT.map(item => (
              <li key={item.number}>{item.number}. {item.name}: {t(item.reason)}</li>
            ))}
          </ul>
        </details>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={smallButton} onClick={() => { setChoices(allChoices()); setPresetId(null); }}>{t('choose everything again')}</button>
      </div>

      {state.error && <p className="text-xs font-mono text-rose-600 dark:text-rose-400" role="alert">{state.error}</p>}
      {state.result && (
        <section className="space-y-1.5" data-testid="muhurta-finder-results" aria-live="polite">
          <div className="text-xs font-mono text-zinc-700 dark:text-zinc-200">
            {state.result.windows.length === 0
              ? t('No time in the span meets every choice.')
              : `${state.result.windows.length}${state.result.truncated ? '+' : ''} ${t('stretches')}`}
            {!anyCondition && state.result.windows.length > 0 && <span className="ml-2 text-[10px] text-zinc-400 dark:text-zinc-600">{t('No choice limits anything: the whole span.')}</span>}
          </div>
          {state.result.truncated && <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{t('Only the first stretches are listed: narrow the choices or the days.')}</p>}
          {shown.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[640px] border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-zinc-100 text-left text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <th className="p-2">#</th><th className="p-2">{t('Date')}</th><th className="p-2">{t('From – to')}</th><th className="p-2">{t('Length')}</th><th className="p-2">{t('At the start')}</th><th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((window, index) => {
                    const from = local(Math.round(window.start / 60000) * 60000);
                    const to = local(Math.round(window.end / 60000) * 60000);
                    const minutes = Math.round((window.end - window.start) / 60000);
                    const sameDay = from.year === to.year && from.month === to.month && from.day === to.day;
                    const length = minutes >= 1440 ? `${Math.floor(minutes / 1440)} d ${Math.floor((minutes % 1440) / 60)} h` : `${Math.floor(minutes / 60)} h ${pad2(minutes % 60)} min`;
                    return (
                      <tr key={window.start} data-finder-window={index} className="border-t border-zinc-100 align-top dark:border-zinc-800">
                        <td className="p-2 text-zinc-400 dark:text-zinc-600">{index + 1}</td>
                        <td className="whitespace-nowrap p-2 text-emerald-700 dark:text-green-400">
                          {t(WEEKDAY_FULL[from.weekday])} {pad2(from.day)}.{pad2(from.month)}.{from.year}
                        </td>
                        <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-200">
                          {clock(from)} – {sameDay ? '' : `${pad2(to.day)}.${pad2(to.month)}. `}{clock(to)}
                        </td>
                        <td className="whitespace-nowrap p-2 text-zinc-500 dark:text-zinc-400">{length}</td>
                        <td className="p-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                          {tithiLabel(window.at.tithi)} · {NAKSHATRA_NAMES[window.at.nakshatra]} · {YOGA_NAMES[window.at.yoga]} · {KARANA_NAMES[window.at.karana]} · {t('Asc')} {SIGN_ABBR[window.at.ascendantSign]}
                        </td>
                        <td className="p-2">
                          {onSetTarget && (
                            <button
                              type="button"
                              className={smallButton}
                              onClick={() => {
                                const at = local(Math.ceil(window.start / 60000) * 60000);
                                onSetTarget(`${pad2(at.day)}.${pad2(at.month)}.${at.year} ${pad2(at.hour)}.${pad2(at.minute)}.00`);
                              }}
                            >
                              {t('use as target')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {state.result.windows.length > shown.length && (
            <button type="button" className={smallButton} onClick={() => setShowAll(true)}>{t('show all')} ({state.result.windows.length})</button>
          )}
        </section>
      )}
    </div>
  );
}
