'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { calculatePanchang, type PanchangResult } from '@/lib/panchang';
import { calculationParams } from '@/lib/apiParams';
import { getUtcOffsetHours } from '@/lib/timezone';
import { generateDailyPanchangNarrative } from '@/lib/panchang/dailyNarrative';
import { useT } from '@/lib/i18n';

interface Props {
  chart: ChartData;
  ianaTimezone?: string;
  calculationSettings?: CalculationSettings;
  nakshatraAdjust?: number;
}

function Section({ title, children }: { title: string; children: string }) {
  const t = useT();
  return (
    <section className="space-y-1.5">
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 dark:text-green-400">{t(title)}</h3>
      <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{children}</p>
    </section>
  );
}

/** Daily narrative based on the selected place's local sunrise; falls back to noon if sunrise is unavailable. */
export default function DailyPanchangPanel({ chart, ianaTimezone, calculationSettings, nakshatraAdjust = 0 }: Props) {
  const t = useT();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [latitudeOverride, setLatitudeOverride] = useState<number | null>(null);
  const [longitudeOverride, setLongitudeOverride] = useState<number | null>(null);
  const [timezoneOffsetOverride, setTimezoneOffsetOverride] = useState<number | null>(null);
  const latitude = latitudeOverride ?? chart.debug?.latitude ?? 0;
  const longitude = longitudeOverride ?? chart.debug?.longitude ?? 0;
  const timezoneOffset = timezoneOffsetOverride ?? chart.debug?.utcOffset ?? 0;
  const [dailyChart, setDailyChart] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const geo = useMemo(() => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(selectedDate);
    if (!match || !chart.debug || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(timezoneOffset) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || timezoneOffset < -12 || timezoneOffset > 14) return null;
    const [year, month, day] = match.slice(1).map(Number);
    const localNoon = new Date(Date.UTC(year, month - 1, day, 12));
    const zone = ianaTimezone;
    const isNatalLocation = latitude === chart.debug.latitude && longitude === chart.debug.longitude;
    const tz = isNatalLocation && zone ? getUtcOffsetHours(zone, localNoon) : timezoneOffset;
    return { year, month, day, tz, lat: latitude, lng: longitude };
  }, [chart.debug, ianaTimezone, selectedDate, latitude, longitude, timezoneOffset]);

  useEffect(() => {
    let cancelled = false;
    if (!geo) {
      return;
    }
    const params = new URLSearchParams({
      year: String(geo.year), month: String(geo.month), day: String(geo.day),
      hour: '12', minute: '0', second: '0',
      lat: String(geo.lat), lng: String(geo.lng), tz: String(geo.tz),
      ...calculationParams(calculationSettings),
    });
    // First calculate the date at noon to obtain the ephemeris-backed local sunrise.
    // Then calculate the actual Panchang chart at sunrise, when the Vedic day begins.
    const fetchChart = async (hour: number, minute: number) => {
      const chartParams = new URLSearchParams(params);
      chartParams.set('hour', String(hour));
      chartParams.set('minute', String(minute));
      const response = await fetch(`/api/chart?${chartParams.toString()}`);
      if (!response.ok) throw new Error('Daily chart calculation failed.');
      return response.json() as Promise<ChartData>;
    };

    // Defer state updates to the promise chain so the effect itself stays side-effect free.
    Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setLoading(true);
          setError(null);
        }
        return fetchChart(12, 0);
      })
      .then(async noonChart => {
        const sunrise = noonChart.debug?.sunriseLocalHours;
        if (typeof sunrise !== 'number' || !Number.isFinite(sunrise)) {
          // Polar day/night or unavailable sunrise: retain a noon snapshot.
          return noonChart;
        }
        const hour = Math.floor(sunrise);
        const minute = Math.round((sunrise - hour) * 60);
        return fetchChart(hour + (minute === 60 ? 1 : 0), minute === 60 ? 0 : minute);
      })
      .then(result => { if (!cancelled) setDailyChart(result); })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to calculate the daily Panchang.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [geo, selectedDate, calculationSettings]);

  const panchang = useMemo<PanchangResult | null>(() => {
    if (!dailyChart || !geo) return null;
    const sunrise = dailyChart.debug?.sunriseLocalHours;
    const localHour = typeof sunrise === 'number' && Number.isFinite(sunrise) ? sunrise : 12;
    const hour = Math.floor(localHour);
    const minute = Math.round((localHour - hour) * 60);
    const normalizedHour = hour + (minute === 60 ? 1 : 0);
    const normalizedMinute = minute === 60 ? 0 : minute;
    const dateTime = `${String(geo.day).padStart(2, '0')}.${String(geo.month).padStart(2, '0')}.${geo.year} ${String(normalizedHour).padStart(2, '0')}.${String(normalizedMinute).padStart(2, '0')}.00`;
    return calculatePanchang(dailyChart, dateTime, geo.tz, calculationSettings?.ayanamsa ?? 'lahiri', nakshatraAdjust);
  }, [dailyChart, geo, calculationSettings?.ayanamsa, nakshatraAdjust]);

  const narrative = useMemo(() => panchang ? generateDailyPanchangNarrative(panchang) : null, [panchang]);

  const dateSelector = (
    <div className="space-y-3">
      <label className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-500">
        <span>{t('Date')}</span>
        <input
          aria-label={t('Panchang date')}
          type="date"
          value={selectedDate}
          onChange={event => setSelectedDate(event.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>
      <div className="flex flex-wrap items-end gap-3 text-xs font-mono text-zinc-500">
        <label className="flex flex-col gap-1">
          <span>{t('Latitude')}</span>
          <input aria-label={t('Latitude')} type="number" min="-90" max="90" step="any"
            value={latitude} onChange={event => setLatitudeOverride(event.target.value === '' ? null : Number(event.target.value))}
            className="w-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="flex flex-col gap-1">
          <span>{t('Longitude')}</span>
          <input aria-label={t('Longitude')} type="number" min="-180" max="180" step="any"
            value={longitude} onChange={event => setLongitudeOverride(event.target.value === '' ? null : Number(event.target.value))}
            className="w-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
        <label className="flex flex-col gap-1">
          <span>{t('UTC offset')}</span>
          <input aria-label={t('UTC offset')} type="number" min="-12" max="14" step="0.25"
            value={timezoneOffset} onChange={event => setTimezoneOffsetOverride(event.target.value === '' ? null : Number(event.target.value))}
            className="w-28 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </label>
      </div>
    </div>
  );

  if (!geo) return <div className="max-w-3xl space-y-3">{dateSelector}<div role="alert" className="rounded-lg border border-amber-200 p-4 text-sm text-amber-800 dark:border-amber-900 dark:text-amber-300">{t('A calculated chart with a valid location is required.')}</div></div>;
  if (loading) return <div className="max-w-3xl space-y-3">{dateSelector}<div className="py-8 text-center text-xs font-mono text-zinc-500">{t('Calculating Daily Panchang…')}</div></div>;
  if (error) return <div className="max-w-3xl space-y-3">{dateSelector}<div role="alert" className="rounded-lg border border-amber-200 p-4 text-sm text-amber-800 dark:border-amber-900 dark:text-amber-300">{t(error)}</div></div>;
  if (!panchang || !narrative) return <div className="max-w-3xl space-y-3">{dateSelector}</div>;

  return (
    <div className="max-w-3xl space-y-5">
      {dateSelector}
      <header className="space-y-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{t('Daily Panchang')} · {selectedDate}</div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t(panchang.tithi)} · {t(panchang.vara)} · {t(panchang.nakshatra)}</h2>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-500">
          {[panchang.paksha + ' Paksha', panchang.yoga + ' Yoga', panchang.karana + ' Karana', 'Pada ' + panchang.nakshatraPada].map(item =>
            <span key={item} className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">{t(item)}</span>
          )}
        </div>
        <p className="text-[10px] text-zinc-400">{t('Calculated for local sunrise at the chart location. Panchang elements can change during the day.')}</p>
      </header>
      <Section title="The day ahead">{narrative.overview}</Section>
      <Section title="Work and accomplishment">{narrative.work}</Section>
      <Section title="Money and decisions">{narrative.finances}</Section>
      <Section title="Relationships">{narrative.relationships}</Section>
      <Section title="Inner work">{narrative.spiritual}</Section>
      <Section title="Practical focus">{narrative.practicalAdvice}</Section>
    </div>
  );
}
