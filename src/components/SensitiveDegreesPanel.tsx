'use client';

import { useMemo } from 'react';
import type { ChartData } from '@/types';
import { formatDegree } from '@/lib/formatDegree';
import { nakshatraAndPada } from '@/lib/specialSphutas';
import { upagrahaPoints } from '@/lib/chartPoints';
import { useChartPoints } from '@/hooks/useChartPoints';
import {
  MRITYU_BHAGA, MRITYU_ORB, MRITYU_POINTS, PUSHKARA_BHAGA, pushkaraNavamsaRanges, sensitiveDegreesOf, type MrityuPoint, type SensitiveDegrees,
} from '@/lib/sensitiveDegrees';
import { ordinal } from '@/lib/ordinal';
import { SIGN_NAMES } from '@/lib/signs';
import { useLanguage, useT } from '@/lib/i18n';
import { BODY_CELL, HEAD_CELL, Heading, NAME_CELL, ROW, ScrollTable, VALUE_CELL } from './balaShared';

interface Props {
  chart: ChartData;
  nakshatraAdjust?: number;
}

interface Row {
  point: MrityuPoint;
  name: string;
  longitude: number;
  found: SensitiveDegrees;
}

const MARKS = ['sandhi', 'gandanta', 'mrityu'] as const;
const WEAK = 'text-amber-700 dark:text-amber-400';
const GOOD = 'text-emerald-700 dark:text-emerald-400';
const minutes = (degrees: number) => formatDegree(degrees, 'minute');
/** A bound of a range, to the nearest minute: 10° and not 10°0', and 23°20' although 20 + 10/3 is a hair under it. */
const bound = (degrees: number) => {
  const total = Math.round(degrees * 60);
  return total % 60 === 0 ? `${total / 60}°` : `${Math.floor(total / 60)}°${total % 60}'`;
};

/** True for a row on at least one weakening degree (Sandhi, Gandanta, Mṛtyu Bhāga) or one favourable (Puṣkara). */
const weakening = (found: SensitiveDegrees) => MARKS.filter(mark => found[mark]).length;
const favourable = (found: SensitiveDegrees) => Number(Boolean(found.pushkaraNavamsa)) + Number(Boolean(found.pushkaraBhaga));

/**
 * The sensitive degrees of the Lagna, the grahas and Māndi: Sandhi (within a degree of a sign boundary), Gandanta (the last pada of
 * Ashlesha, Jyeshtha and Revati and the first of Magha, Mula and Ashwini), Mṛtyu Bhāga (the degree of death), and the Puṣkara navāṁśa and
 * Puṣkara Bhāga (the favourable ones).
 */
export default function SensitiveDegreesPanel({ chart, nakshatraAdjust = 0 }: Props) {
  const t = useT();
  const language = useLanguage();
  const { maandiAt, gulikaAt } = useChartPoints();

  const rows = useMemo<Row[]>(() => {
    const list: Row[] = [{ point: 'Lagna', name: 'Lagna', longitude: chart.ascendant.longitude, found: sensitiveDegreesOf('Lagna', chart.ascendant.longitude, nakshatraAdjust) }];
    for (const point of MRITYU_POINTS) {
      if (point === 'Lagna' || point === 'Maandi') continue;
      const planet = chart.planets.find(candidate => candidate.name === point);
      if (planet) list.push({ point, name: planet.name, longitude: planet.longitude, found: sensitiveDegreesOf(point, planet.longitude, nakshatraAdjust) });
    }
    const maandi = upagrahaPoints(chart, gulikaAt, maandiAt).find(candidate => candidate.key === 'Md');
    if (maandi) list.push({ point: 'Maandi', name: 'Maandi', longitude: maandi.longitude, found: sensitiveDegreesOf('Maandi', maandi.longitude, nakshatraAdjust) });
    return list;
  }, [chart, nakshatraAdjust, gulikaAt, maandiAt]);

  const flagged = rows.filter(row => weakening(row.found) + favourable(row.found) > 0);
  const weak = rows.filter(row => weakening(row.found) > 0);
  const good = rows.filter(row => favourable(row.found) > 0);

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-1" data-sensitive-summary>
        <Heading command="graha.sensitive.degrees">
          {t('Sandhi, Gandanta and Mṛtyu Bhāga weaken a point; Puṣkara Navāṁśa and Puṣkara Bhāga strengthen it.')}
        </Heading>
        <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
          {flagged.length === 0
            ? t('No point is on a sensitive degree.')
            : <>
                {weak.length > 0 && <span className={WEAK}>⚠ {t('On a weakening degree')}: {weak.map(row => row.name).join(', ')}. </span>}
                {good.length > 0 && <span className={GOOD}>✦ {t('On a Puṣkara degree')}: {good.map(row => row.name).join(', ')}.</span>}
              </>}
        </p>
      </div>

      <ScrollTable
        minWidth="min-w-[960px]"
        headers={[t('Point'), t('Position'), t('Nakshatra'), t('Sandhi'), t('Gandanta'), t('Mṛtyu Bhāga'), t('Puṣkara Navāṁśa'), t('Puṣkara Bhāga')]}
      >
        {rows.map(row => {
          const { found } = row;
          const sign = Math.floor(row.longitude / 30);
          const { nakshatra, pada } = nakshatraAndPada(row.longitude, nakshatraAdjust);
          const none = <span className="text-zinc-300 dark:text-zinc-600">—</span>;
          return (
            <tr key={row.point} className={ROW} data-point={row.point}>
              <td className={NAME_CELL}>{row.name}</td>
              <td className={`${VALUE_CELL} whitespace-nowrap`}>{SIGN_NAMES[sign]} {minutes(row.longitude % 30)}</td>
              <td className={`${BODY_CELL} whitespace-nowrap text-cyan-700 dark:text-cyan-300`}>{nakshatra} {pada}</td>
              <td className={`${BODY_CELL} ${WEAK}`} data-mark="sandhi">
                {found.sandhi
                  ? `⚠ ${minutes(found.sandhi.distance)} ${found.sandhi.edge === 'start' ? t('from the start of the sign') : t('from the end of the sign')}`
                  : none}
              </td>
              <td className={`${BODY_CELL} ${WEAK}`} data-mark="gandanta">
                {found.gandanta
                  ? `⚠ ${found.gandanta.side === 'before' ? `${found.gandanta.nakshatra} → ${found.gandanta.across}` : `${found.gandanta.across} → ${found.gandanta.nakshatra}`}, ${minutes(found.gandanta.distance)} ${t('from the junction')}${found.gandanta.core ? ` (${t('core')})` : ''}`
                  : none}
              </td>
              <td className={`${BODY_CELL} ${WEAK}`} data-mark="mrityu">
                {found.mrityu ? `⚠ ${ordinal(found.mrityu.degree, language)} ${t('degree')}, ${minutes(found.mrityu.distance)} ${t('from it')}` : none}
              </td>
              <td className={`${BODY_CELL} ${GOOD}`} data-mark="pushkaraNavamsa">
                {found.pushkaraNavamsa
                  ? `✦ ${ordinal(found.pushkaraNavamsa.navamsa, language)} ${t('navamsa')} (${bound(found.pushkaraNavamsa.from)}–${bound(found.pushkaraNavamsa.to)})`
                  : none}
              </td>
              <td className={`${BODY_CELL} ${GOOD}`} data-mark="pushkaraBhaga">
                {found.pushkaraBhaga ? `✦ ${ordinal(found.pushkaraBhaga.degree, language)} ${t('degree')}` : none}
              </td>
            </tr>
          );
        })}
      </ScrollTable>

      <ul className="space-y-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        <li>{t('Sandhi: within 1° of the start or the end of a sign.')}</li>
        <li>{t("Gandanta: the last 3°20' of Cancer, Scorpio and Pisces (the last pada of Ashlesha, Jyeshtha and Revati) and the first 3°20' of Leo, Sagittarius and Aries (the first pada of Magha, Mula and Ashwini), counted in the nakshatra zodiac. The core is within 0°26'40\" (two ghatis) of the junction.")}</li>
        <li>{t('Mṛtyu Bhāga: the degree of death of the point in its sign, with the orb of Jagannatha Hora: the Sun ⅓°, the Moon, Mercury and the Lagna ⅔°, the others ¼°. Māndi is the Gulika-Maandi point of the upagrahas.')}</li>
        <li>{t("Puṣkara Navāṁśa: two navamsas of 3°20' in every sign, from 20° in fire signs, 6°40' in earth signs, 16°40' in air signs and 0° in water signs, and 6°40' after that. Puṣkara Bhāga: the one degree of each sign, the 21st, 14th, 24th and 7th in turn.")}</li>
      </ul>

      <details className="rounded-lg border border-zinc-200 dark:border-zinc-700">
        <summary className="cursor-pointer px-3 py-2 text-xs font-mono text-zinc-600 dark:text-zinc-300">{t('The sensitive degrees of every sign')}</summary>
        <div className="overflow-x-auto p-2">
          <table className="w-full min-w-[900px] border-collapse text-[10px] font-mono">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-800">
                <th className={HEAD_CELL}>{t('Sign')}</th>
                <th className={HEAD_CELL}>{t('Puṣkara Navāṁśa')}</th>
                <th className={HEAD_CELL}>{t('Puṣkara Bhāga')}</th>
                {MRITYU_POINTS.map(point => <th key={point} className={HEAD_CELL}>{point === 'Maandi' ? 'Māndi' : point}</th>)}
              </tr>
            </thead>
            <tbody>
              {SIGN_NAMES.map((name, sign) => (
                <tr key={name} className={ROW}>
                  <td className={NAME_CELL}>{name}</td>
                  <td className={`${BODY_CELL} whitespace-nowrap text-zinc-700 dark:text-zinc-300`}>{pushkaraNavamsaRanges(sign).map(range => `${bound(range.from)}–${bound(range.to)}`).join(' · ')}</td>
                  <td className={`${BODY_CELL} text-zinc-700 dark:text-zinc-300`}>{PUSHKARA_BHAGA[sign]}°</td>
                  {MRITYU_POINTS.map((point, column) => <td key={point} className={`${BODY_CELL} text-zinc-700 dark:text-zinc-300`}>{MRITYU_BHAGA[sign][column]}°</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            {t('The orbs of the Mṛtyu Bhāga:')} {MRITYU_POINTS.map(point => `${point === 'Maandi' ? 'Māndi' : point} ${minutes(MRITYU_ORB[point])}`).join(', ')}.
          </p>
        </div>
      </details>
    </div>
  );
}
