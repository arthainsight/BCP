'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import {
  calculateSpecialSphutas, equationOfTimeMinutes, formatDms, ishtaGhatis, nakshatraAndPada,
} from '@/lib/specialSphutas';
import { calculateArudhaPadas } from '@/lib/arudhaPadas';
import { calculateCharaKarakas } from '@/lib/karakas';
import { aprakashaUpagrahas, SATURN_PORTION_MOMENTS, type SaturnPortionMoment } from '@/lib/upagrahas';
import { getVargaSignIndex } from '@/lib/varga';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  calculationSettings?: CalculationSettings;
  nakshatraAdjust?: number;
};

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
/** The two points shown in the divisional sign they fall in; their nakshatra is that of the point in the zodiac. */
const KHARA_KEYS = ['D22', 'N64'];

const MOMENT_LABELS: Record<SaturnPortionMoment, string> = {
  begin: 'beginning of the part',
  middle: 'middle of the part',
  end: 'end of the part',
};

const houseFrom = (lagnaSign: number, sign: number) => ((sign - lagnaSign + 12) % 12) + 1;

const pad = (value: number) => String(value).padStart(2, '0');

/** "06:28:31" or "6:28" as decimal hours, or null when it is not a time of day. */
function parseClock(text: string): number | null {
  const match = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/.exec(text);
  if (!match) return null;
  const [hours, minutes, seconds] = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
  return hours < 24 && minutes < 60 && seconds < 60 ? hours + minutes / 60 + seconds / 3600 : null;
}
const clock = (hours: number) => {
  const total = Math.round((((hours % 24) + 24) % 24) * 3600);
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
};

/**
 * The special sphuṭas of the natal chart: the lagnas that run on the time since
 * sunrise, Śrī Lagna, Bhṛgu Bindu, Āruḍha, Indu, Varṇada and the 22nd Drekkana
 * and 64th Navamsa, each with its sign, longitude, nakṣatra and pada.
 */
export default function SpecialSphutasPanel({ chart, calculationSettings, nakshatraAdjust = 0 }: Props) {
  const t = useT();
  const mode = calculationSettings?.sunriseMode ?? 'mean';
  // A sunrise typed in (for example the one another program shows) replaces the calculated one in this table.
  const [manualText, setManualText] = useState('');
  const manual = parseClock(manualText);
  // Traditions take the Lagna at different moments of Saturn's part for Gulika and Maandi.
  const [gulikaAt, setGulikaAt] = useState<SaturnPortionMoment>('begin');
  const [maandiAt, setMaandiAt] = useState<SaturnPortionMoment>('middle');

  const result = useMemo(() => {
    const debug = chart.debug;
    const match = debug?.inputDateTime ? /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(debug.inputDateTime) : null;
    const sun = chart.planets.find(planet => planet.name === 'Sun');
    const moon = chart.planets.find(planet => planet.name === 'Moon');
    const rahu = chart.planets.find(planet => planet.name === 'Rahu');
    if (!debug || !match || !sun || !moon || !rahu) return null;

    const [, year, month, day, hour, minute, second] = match.map(Number);
    const localHours = hour + minute / 60 + second / 3600;
    const utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second) - debug.utcOffset * 3600000);
    const eot = equationOfTimeMinutes(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate(), utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600);
    const sunrise = debug.sunriseLocalHours ?? 6;
    const ishta = manual !== null ? ishtaGhatis(localHours, manual, 'true', 0) : ishtaGhatis(localHours, sunrise, mode, eot);
    const sphutas = calculateSpecialSphutas({
      ascendantLongitude: chart.ascendant.longitude,
      sunLongitude: sun.longitude,
      moonLongitude: moon.longitude,
      rahuLongitude: rahu.longitude,
      planets: chart.planets.map(planet => ({ name: planet.name, sign: planet.sign, degree: planet.degree })),
      ishta,
    });
    return { sphutas, ishta, sunriseUsed: manual !== null ? manual : sunrise + (mode === 'mean' ? eot / 60 : 0), calculated: sunrise + (mode === 'mean' ? eot / 60 : 0) };
  }, [chart, mode, manual]);

  // Gulika, Maandi and the Sun-based upagrahas.
  const upagrahas = useMemo(() => {
    const sun = chart.planets.find(planet => planet.name === 'Sun');
    const portion = chart.saturnPortion;
    const points: { key: string; name: string; longitude: number }[] = [];
    if (portion) {
      points.push({ key: 'Gu', name: 'Gulika', longitude: portion.ascendants[gulikaAt] });
      points.push({ key: 'Ma', name: 'Maandi', longitude: portion.ascendants[maandiAt] });
    }
    if (sun) points.push(...aprakashaUpagrahas(sun.longitude));
    return points.map(point => {
      const sign = Math.floor(point.longitude / 30) + 1;
      return { ...point, sign, degree: point.longitude % 30, house: houseFrom(chart.ascendant.sign, sign) };
    });
  }, [chart, gulikaAt, maandiAt]);

  // Karakamsa and Svamsa: the sign the Atmakaraka holds in the Navamsa.
  const karakamsa = useMemo(() => {
    const ak = calculateCharaKarakas(chart.planets, calculationSettings?.charaKarakaRankMode, calculationSettings?.charaKarakaCount).find(item => item.karaka === 'AK');
    const planet = ak ? chart.planets.find(item => item.name === ak.planet) : undefined;
    if (!planet) return null;
    const sign = getVargaSignIndex(planet.longitude, 9) + 1;
    const navamsaLagna = getVargaSignIndex(chart.ascendant.longitude, 9) + 1;
    const stride = 30 / 9;
    return {
      planet: planet.name,
      sign,
      degree: ((planet.longitude % 30) % stride) / stride * 30,
      houseFromLagna: houseFrom(chart.ascendant.sign, sign),
      houseFromNavamsaLagna: houseFrom(navamsaLagna, sign),
    };
  }, [chart, calculationSettings?.charaKarakaRankMode, calculationSettings?.charaKarakaCount]);

  const padas = useMemo(
    () => calculateArudhaPadas(chart.ascendant.sign, chart.planets.map(planet => ({ name: planet.name, sign: planet.sign, degree: planet.degree }))),
    [chart],
  );

  if (!result) return <p className="text-xs font-mono text-zinc-400">{t('Calculate a chart to see the special sphutas.')}</p>;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Special Sphutas')}</div>
        <p className="mt-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('The lagnas that run on the time since sunrise, Sree Lagna, Bhrigu Bindu, Arudha, Indu and Varnada, and the 22nd Drekkana and 64th Navamsa.')}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-zinc-100 text-left dark:bg-zinc-800">
              <th className="p-2">{t('Sphuta')}</th>
              <th className="p-2">{t('Sign')}</th>
              <th className="p-2">{t('Longitude')}</th>
              <th className="p-2">{t('Nakshatra')}</th>
              <th className="p-2">{t('Pada')}</th>
            </tr>
          </thead>
          <tbody>
            {result.sphutas.map(sphuta => {
              const { nakshatra, pada } = nakshatraAndPada(sphuta.longitude, nakshatraAdjust);
              return (
                <tr key={sphuta.key} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="whitespace-nowrap p-2 font-bold text-emerald-700 dark:text-green-400">{sphuta.name}</td>
                  <td className="whitespace-nowrap p-2 text-zinc-800 dark:text-zinc-100">{SIGNS[sphuta.sign - 1]}</td>
                  <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-300">{formatDms(sphuta.degree)}</td>
                  <td className="whitespace-nowrap p-2 text-cyan-700 dark:text-cyan-300">{nakshatra}</td>
                  <td className="p-2 text-zinc-600 dark:text-zinc-300">{pada}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
        <div>
          {t('Time since sunrise')}: {result.ishta.toFixed(3)} {t('ghatis')} · {manual !== null ? t('manual sunrise') : mode === 'mean' ? t('mean-time sunrise') : t('true sunrise')} {clock(result.sunriseUsed)}
        </div>
        <label className="flex flex-wrap items-center gap-2">
          <span>{t('Use another sunrise (HH:MM:SS)')}</span>
          <input
            value={manualText}
            onChange={event => setManualText(event.target.value)}
            placeholder={clock(result.calculated)}
            aria-label={t('manual sunrise')}
            inputMode="numeric"
            className="w-24 rounded border border-zinc-300 bg-white px-1.5 py-1 text-[10px] dark:border-zinc-700 dark:bg-zinc-900"
          />
          {manualText.trim() !== '' && manual === null && <span className="text-rose-500">{t('Not a time of day')}</span>}
        </label>
        {result.sphutas.some(sphuta => KHARA_KEYS.includes(sphuta.key)) && (
          <div>{t('The 22nd Drekkana and the 64th Navamsa are the Lagna turned 210°: the sign is the D3 / D9 sign of that point, and its nakshatra and pada are those of the point in the zodiac.')}</div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Upagrahas')}</div>
        {upagrahas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-zinc-100 text-left dark:bg-zinc-800">
                  <th className="p-2">{t('Upagraha')}</th>
                  <th className="p-2">{t('Sign')}</th>
                  <th className="p-2">{t('Longitude')}</th>
                  <th className="p-2">{t('House')}</th>
                  <th className="p-2">{t('Nakshatra')}</th>
                  <th className="p-2">{t('Pada')}</th>
                </tr>
              </thead>
              <tbody>
                {upagrahas.map(point => {
                  const { nakshatra, pada } = nakshatraAndPada(point.longitude, nakshatraAdjust);
                  return (
                    <tr key={point.key} data-upagraha={point.key} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="whitespace-nowrap p-2 font-bold text-emerald-700 dark:text-green-400">{point.name}</td>
                      <td className="whitespace-nowrap p-2 text-zinc-800 dark:text-zinc-100">{SIGNS[point.sign - 1]}</td>
                      <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-300">{formatDms(point.degree)}</td>
                      <td className="p-2 text-zinc-600 dark:text-zinc-300">{point.house}</td>
                      <td className="whitespace-nowrap p-2 text-cyan-700 dark:text-cyan-300">{nakshatra}</td>
                      <td className="p-2 text-zinc-600 dark:text-zinc-300">{pada}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="space-y-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {chart.saturnPortion ? (
            <>
              <div>
                {t('Gulika and Maandi are the Lagna rising in the part of the day or night that belongs to Saturn. This chart')}: {chart.saturnPortion.portion + 1}/8 {chart.saturnPortion.night ? t('of the night') : t('of the day')}.
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {([['Gulika', gulikaAt, setGulikaAt], ['Maandi', maandiAt, setMaandiAt]] as const).map(([name, value, setValue]) => (
                  <label key={name} className="flex items-center gap-2">
                    <span>{name}</span>
                    <select
                      value={value}
                      onChange={event => setValue(event.target.value as SaturnPortionMoment)}
                      aria-label={`${name} ${t('moment')}`}
                      className="rounded border border-zinc-300 bg-white px-1.5 py-1 text-[10px] dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {SATURN_PORTION_MOMENTS.map(moment => <option key={moment} value={moment}>{t(MOMENT_LABELS[moment])}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <div>{t('Traditions take the Lagna at the beginning, the middle or the end of Saturn part; choose the one you follow.')}</div>
            </>
          ) : (
            <div>{t('Gulika and Maandi need a sunrise and a sunset; calculate the chart again.')}</div>
          )}
          <div>{t('Dhuma is the Sun + 133°20, Vyatipata 360° − Dhuma, Parivesha Vyatipata + 180°, Indrachapa 360° − Parivesha and Upaketu Indrachapa + 16°40 (the Sun − 30°).')}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{t('Jaimini points')}</div>
        {karakamsa && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-zinc-100 text-left dark:bg-zinc-800">
                  <th className="p-2">{t('Point')}</th>
                  <th className="p-2">{t('Sign')}</th>
                  <th className="p-2">{t('Longitude')}</th>
                  <th className="p-2">{t('House')}</th>
                </tr>
              </thead>
              <tbody>
                <tr data-jaimini="karakamsa" className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="whitespace-nowrap p-2 font-bold text-emerald-700 dark:text-green-400">Karakamsa</td>
                  <td className="whitespace-nowrap p-2 text-zinc-800 dark:text-zinc-100">{SIGNS[karakamsa.sign - 1]}</td>
                  <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-300">{formatDms(karakamsa.degree)}</td>
                  <td className="p-2 text-zinc-600 dark:text-zinc-300">{karakamsa.houseFromLagna}</td>
                </tr>
                <tr data-jaimini="svamsa" className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="whitespace-nowrap p-2 font-bold text-emerald-700 dark:text-green-400">Svamsa</td>
                  <td className="whitespace-nowrap p-2 text-zinc-800 dark:text-zinc-100">{SIGNS[karakamsa.sign - 1]}</td>
                  <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-300">{formatDms(karakamsa.degree)}</td>
                  <td className="p-2 text-zinc-600 dark:text-zinc-300">{karakamsa.houseFromNavamsaLagna}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {karakamsa && <span>{t('Atmakaraka')} {karakamsa.planet}. </span>}
          {t('Karakamsa and Svamsa are the sign the Atmakaraka holds in the Navamsa: Karakamsa is read in the Rasi chart from the Lagna, Svamsa in the Navamsa chart from the Navamsa Lagna.')}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-zinc-100 text-left dark:bg-zinc-800">
                <th className="p-2">{t('Arudha pada')}</th>
                <th className="p-2">{t('Of house')}</th>
                <th className="p-2">{t('Sign')}</th>
                <th className="p-2">{t('Longitude')}</th>
                <th className="p-2">{t('House')}</th>
              </tr>
            </thead>
            <tbody>
              {padas.map(pada => (
                <tr key={pada.name} data-pada={pada.name} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="whitespace-nowrap p-2 font-bold text-emerald-700 dark:text-green-400">{pada.name}{pada.house === 12 ? ' (UL)' : ''}</td>
                  <td className="p-2 text-zinc-600 dark:text-zinc-300">{pada.house}</td>
                  <td className="whitespace-nowrap p-2 text-zinc-800 dark:text-zinc-100">{SIGNS[pada.sign - 1]}</td>
                  <td className="whitespace-nowrap p-2 text-zinc-700 dark:text-zinc-300">{formatDms(pada.degree)}</td>
                  <td className="p-2 text-zinc-600 dark:text-zinc-300">{houseFrom(chart.ascendant.sign, pada.sign)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600">
          {t('Each pada stands as far from the lord of its house as the lord stands from the house; AL12 is the Upapada. The last column is the house from the Lagna the pada falls in.')}
        </div>
      </div>
    </div>
  );
}
