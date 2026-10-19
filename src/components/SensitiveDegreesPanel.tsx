'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { formatDegree } from '@/lib/formatDegree';
import { nakshatraAndPada } from '@/lib/specialSphutas';
import { favourableCount, marksOf, weakeningCount, type PlanetMarks } from '@/lib/planetMarks';
import { boundText, markTexts } from '@/lib/planetMarksText';
import { project, VARGA_DIVISIONS, VARGA_NAMES } from '@/lib/vargaChart';
import { upagrahaPoints } from '@/lib/chartPoints';
import { useChartPoints } from '@/hooks/useChartPoints';
import { MRITYU_BHAGA, MRITYU_ORB, MRITYU_POINTS, PUSHKARA_BHAGA, pushkaraNavamsaRanges, type MrityuPoint } from '@/lib/sensitiveDegrees';
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
  /** The longitude in the chart that is tested: the rāśi chart's, or the projected one in a varga. */
  longitude: number;
  marks: PlanetMarks;
}

const WEAK = 'text-amber-700 dark:text-amber-400';
const GOOD = 'text-emerald-700 dark:text-emerald-400';
const minutes = (degrees: number) => formatDegree(degrees, 'minute');

/**
 * The sensitive degrees of the Lagna, the grahas and Māndi: Sandhi (within a degree of a sign boundary), Gandanta (the last pada of
 * Ashlesha, Jyeshtha and Revati and the first of Magha, Mula and Ashwini), Mṛtyu Bhāga (the degree of death), the Puṣkara navāṁśa and
 * Puṣkara Bhāga (the favourable ones), and combustion. The tests are made in the rāśi chart or in a divisional chart (the navāṁśa, say),
 * on the position the point has there; combustion is only in the rāśi chart.
 */
export default function SensitiveDegreesPanel({ chart, nakshatraAdjust = 0 }: Props) {
  const t = useT();
  const language = useLanguage();
  const { maandiAt, gulikaAt } = useChartPoints();
  const [division, setDivision] = useState(1);
  const rasi = division === 1;

  const rows = useMemo<Row[]>(() => {
    // A point at a longitude of the rāśi chart, put in the division chosen.
    const place = (longitude: number) => project(longitude, division).longitude;
    const sun = chart.planets.find(candidate => candidate.name === 'Sun');
    const list: Row[] = [];
    const add = (point: MrityuPoint, name: string, rasiLongitude: number, retrograde = false) => {
      const longitude = place(rasiLongitude);
      list.push({
        point, name, longitude,
        marks: marksOf(point, longitude, {
          nakshatraAdjust: rasi ? nakshatraAdjust : 0,
          sunLongitude: rasi && point !== 'Sun' ? sun?.longitude : undefined,
          retrograde,
        }),
      });
    };
    add('Lagna', 'Lagna', chart.ascendant.longitude);
    for (const point of MRITYU_POINTS) {
      if (point === 'Lagna' || point === 'Maandi') continue;
      const planet = chart.planets.find(candidate => candidate.name === point);
      if (planet) add(point, planet.name, planet.longitude, planet.isRetrograde === true);
    }
    const maandi = upagrahaPoints(chart, gulikaAt, maandiAt).find(candidate => candidate.key === 'Md');
    if (maandi) add('Maandi', 'Maandi', maandi.longitude);
    return list;
  }, [chart, division, rasi, nakshatraAdjust, gulikaAt, maandiAt]);

  const flagged = rows.filter(row => weakeningCount(row.marks) + favourableCount(row.marks) > 0);
  const weak = rows.filter(row => weakeningCount(row.marks) > 0);
  const good = rows.filter(row => favourableCount(row.marks) > 0);
  const combust = rows.filter(row => row.marks.combust);

  const headers = [t('Point'), t('Position'), t('Nakshatra'), t('Sandhi'), t('Gandanta'), t('Mṛtyu Bhāga'), t('Puṣkara Navāṁśa'), t('Puṣkara Bhāga'), ...(rasi ? [t('Combust')] : [])];

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-1" data-sensitive-summary>
        <Heading command="graha.sensitive.degrees">
          {t('Sandhi, Gandanta and Mṛtyu Bhāga weaken a point; Puṣkara Navāṁśa and Puṣkara Bhāga strengthen it. A combust graha has lost its light in the Sun.')}
        </Heading>
        <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
          {flagged.length === 0 && combust.length === 0
            ? t('No point is on a sensitive degree.')
            : <>
                {weak.length > 0 && <span className={WEAK}>⚠ {t('On a weakening degree')}: {weak.map(row => row.name).join(', ')}. </span>}
                {good.length > 0 && <span className={GOOD}>✦ {t('On a Puṣkara degree')}: {good.map(row => row.name).join(', ')}. </span>}
                {combust.length > 0 && <span className={WEAK}>☼ {t('Combust')}: {combust.map(row => row.name).join(', ')}.</span>}
              </>}
        </p>
      </div>

      <label className="inline-flex items-center gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        {t('Chart')}
        <select
          value={division}
          onChange={event => setDivision(Number(event.target.value))}
          aria-label={t('chart to test')}
          className="rounded-md border border-zinc-200 bg-white px-1.5 py-1.5 text-[10px] font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {VARGA_DIVISIONS.map(value => <option key={value} value={value}>D{value} {VARGA_NAMES[value]}</option>)}
        </select>
      </label>
      {!rasi && (
        <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          {t('The positions are those of the divisional chart: the sign it stands in there and its degree in that sign. Combustion is only counted in the rāśi chart.')}
        </p>
      )}

      <ScrollTable minWidth={rasi ? 'min-w-[1080px]' : 'min-w-[960px]'} headers={headers}>
        {rows.map(row => {
          const { sensitive } = row.marks;
          const texts = markTexts(row.marks, t, language);
          const sign = Math.floor(row.longitude / 30);
          const { nakshatra, pada } = nakshatraAndPada(row.longitude, rasi ? nakshatraAdjust : 0);
          const none = <span className="text-zinc-300 dark:text-zinc-600">—</span>;
          return (
            <tr key={row.point} className={ROW} data-point={row.point}>
              <td className={NAME_CELL}>{row.name}</td>
              <td className={`${VALUE_CELL} whitespace-nowrap`}>{SIGN_NAMES[sign]} {minutes(row.longitude % 30)}</td>
              <td className={`${BODY_CELL} whitespace-nowrap text-cyan-700 dark:text-cyan-300`}>{nakshatra} {pada}</td>
              <td className={`${BODY_CELL} ${WEAK}`} data-mark="sandhi">{sensitive.sandhi ? `⚠ ${texts.sandhi}` : none}</td>
              <td className={`${BODY_CELL} ${WEAK}`} data-mark="gandanta">{sensitive.gandanta ? `⚠ ${texts.gandanta}` : none}</td>
              <td className={`${BODY_CELL} ${WEAK}`} data-mark="mrityu">{sensitive.mrityu ? `⚠ ${texts.mrityu}` : none}</td>
              <td className={`${BODY_CELL} ${GOOD}`} data-mark="pushkaraNavamsa">{sensitive.pushkaraNavamsa ? `✦ ${texts.pushkaraNavamsa}` : none}</td>
              <td className={`${BODY_CELL} ${GOOD}`} data-mark="pushkaraBhaga">{sensitive.pushkaraBhaga ? `✦ ${texts.pushkaraBhaga}` : none}</td>
              {rasi && <td className={`${BODY_CELL} ${WEAK}`} data-mark="combust">{row.marks.combust ? `☼ ${texts.combust}` : none}</td>}
            </tr>
          );
        })}
      </ScrollTable>

      <ul className="space-y-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        <li>{t('Sandhi: within 1° of the start or the end of a sign.')}</li>
        <li>{t("Gandanta: the last 3°20' of Cancer, Scorpio and Pisces (the last pada of Ashlesha, Jyeshtha and Revati) and the first 3°20' of Leo, Sagittarius and Aries (the first pada of Magha, Mula and Ashwini), counted in the nakshatra zodiac. The core is within 0°26'40\" (two ghatis) of the junction.")}</li>
        <li>{t('Mṛtyu Bhāga: the degree of death of the point in its sign, with the orb of Jagannatha Hora: the Sun ⅓°, the Moon, Mercury and the Lagna ⅔°, the others ¼°. Māndi is the Gulika-Maandi point of the upagrahas.')}</li>
        <li>{t("Puṣkara Navāṁśa: two navamsas of 3°20' in every sign, from 20° in fire signs, 6°40' in earth signs, 16°40' in air signs and 0° in water signs, and 6°40' after that. Puṣkara Bhāga: the one degree of each sign, the 21st, 14th, 24th and 7th in turn.")}</li>
        <li>{t('Combust: within 12° of the Sun for the Moon, 17° for Mars, 14° for Mercury (12° when retrograde), 11° for Jupiter, 10° for Venus (8° when retrograde) and 15° for Saturn. The Sun, Rahu and Ketu are never combust.')}</li>
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
                  <td className={`${BODY_CELL} whitespace-nowrap text-zinc-700 dark:text-zinc-300`}>{pushkaraNavamsaRanges(sign).map(range => `${boundText(range.from)}–${boundText(range.to)}`).join(' · ')}</td>
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
