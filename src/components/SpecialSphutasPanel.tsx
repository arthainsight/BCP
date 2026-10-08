'use client';

import { useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import {
  calculateSpecialSphutas, equationOfTimeMinutes, formatDms, ishtaGhatis, nakshatraAndPada,
} from '@/lib/specialSphutas';
import { useT } from '@/lib/i18n';

type Props = {
  chart: ChartData;
  calculationSettings?: CalculationSettings;
  nakshatraAdjust?: number;
};

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
/** The two points shown in the divisional sign they fall in; their nakshatra is that of the point in the zodiac. */
const KHARA_KEYS = ['D22', 'N64'];

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
    </div>
  );
}
