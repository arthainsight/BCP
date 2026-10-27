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
  targetDate: string;
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

/** Daily narrative based on a freshly calculated chart for local noon at the selected place. */
export default function DailyPanchangPanel({ chart, targetDate, ianaTimezone, calculationSettings, nakshatraAdjust = 0 }: Props) {
  const t = useT();
  const [dailyChart, setDailyChart] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const geo = useMemo(() => {
    const match = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(targetDate);
    if (!match || !chart.debug) return null;
    const [year, month, day] = match.slice(1).map(Number);
    const localNoon = new Date(Date.UTC(year, month - 1, day, 12));
    const zone = ianaTimezone;
    const tz = zone ? getUtcOffsetHours(zone, localNoon) : chart.debug.utcOffset;
    return { year, month, day, tz, lat: chart.debug.latitude, lng: chart.debug.longitude };
  }, [chart.debug, ianaTimezone, targetDate]);

  useEffect(() => {
    let cancelled = false;
    if (!geo) {
      setDailyChart(null);
      setError(targetDate ? 'A valid date and calculated chart with a location are required.' : 'Select a date to calculate the daily Panchang.');
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      year: String(geo.year), month: String(geo.month), day: String(geo.day),
      hour: '12', minute: '0', second: '0',
      lat: String(geo.lat), lng: String(geo.lng), tz: String(geo.tz),
      ...calculationParams(calculationSettings),
    });
    fetch(`/api/chart?${params.toString()}`)
      .then(async response => {
        if (!response.ok) throw new Error('Daily chart calculation failed.');
        return response.json() as Promise<ChartData>;
      })
      .then(result => { if (!cancelled) setDailyChart(result); })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to calculate the daily Panchang.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [geo, targetDate, calculationSettings]);

  const panchang = useMemo<PanchangResult | null>(() => {
    if (!dailyChart || !geo) return null;
    const dateTime = `${String(geo.day).padStart(2, '0')}.${String(geo.month).padStart(2, '0')}.${geo.year} 12.00.00`;
    return calculatePanchang(dailyChart, dateTime, geo.tz, calculationSettings?.ayanamsa ?? 'lahiri', nakshatraAdjust);
  }, [dailyChart, geo, calculationSettings?.ayanamsa, nakshatraAdjust]);

  const narrative = useMemo(() => panchang ? generateDailyPanchangNarrative(panchang) : null, [panchang]);

  if (loading) return <div className="py-8 text-center text-xs font-mono text-zinc-500">{t('Calculating Daily Panchang…')}</div>;
  if (error) return <div role="alert" className="rounded-lg border border-amber-200 p-4 text-sm text-amber-800 dark:border-amber-900 dark:text-amber-300">{t(error)}</div>;
  if (!panchang || !narrative) return null;

  return (
    <div className="max-w-3xl space-y-5">
      <header className="space-y-2 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{t('Daily Panchang')} · {targetDate}</div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t(panchang.tithi)} · {t(panchang.vara)} · {t(panchang.nakshatra)}</h2>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-500">
          {[panchang.paksha + ' Paksha', panchang.yoga + ' Yoga', panchang.karana + ' Karana', 'Pada ' + panchang.nakshatraPada].map(item =>
            <span key={item} className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">{t(item)}</span>
          )}
        </div>
        <p className="text-[10px] text-zinc-400">{t('Calculated for local noon at the chart location. Panchang elements can change during the day.')}</p>
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
