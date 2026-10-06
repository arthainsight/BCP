'use client';

import { useMemo } from 'react';
import type { CalculationSettings, ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { calculateBnnHouses, calculateParayaHouses } from '@/lib/bnn/bnnHouses';
import { parseTargetDateString } from '@/lib/dateInput';
import { calculateCharaKarakas, type CharaKaraka } from '@/lib/karakas';
import { runningVimshottariLords } from '@/lib/vimshottari';

/** Values worked out from the calculated chart and the target date. */
export function useChartDerived(
  chartData: ChartData | null,
  birthDatetime: string,
  targetDate: string,
  calculationSettings: CalculationSettings,
) {
  const charaKarakas: CharaKaraka[] = useMemo(
    () => (chartData ? calculateCharaKarakas(chartData.planets, calculationSettings.charaKarakaRankMode) : []),
    [chartData, calculationSettings.charaKarakaRankMode]
  );

  const karakaByPlanet = useMemo(() => {
    const map: Record<string, string> = {};
    charaKarakas.forEach((k) => { map[k.planet] = k.karaka; });
    return map;
  }, [charaKarakas]);

  // Nakshatra longitude adjustment: converts stored planet longitude to effective nakshatra longitude.
  // Formula: tropicalLon = lon + mainAyanamsa; siderealLon (Lahiri) = tropicalLon - siderealAyanamsa
  const nakshatraAdjust = useMemo(() => {
    const mainAyanamsa = chartData?.debug?.ayanamsa ?? 0;
    const siderealAyanamsa = chartData?.debug?.siderealAyanamsa ?? mainAyanamsa;
    if (calculationSettings.nakshatraMode === 'tropical') return mainAyanamsa;
    return mainAyanamsa - siderealAyanamsa;
  }, [chartData?.debug, calculationSettings.nakshatraMode]);

  // BNN: age at the target date
  const bnnAge = useMemo(() => {
    const birth = parseDateTime(birthDatetime);
    const target = parseTargetDateString(targetDate);
    if (!birth || !target) return 0;
    return Math.max(0, (target.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }, [birthDatetime, targetDate]);

  const effectiveBnnHouses = useMemo(() => calculateBnnHouses(chartData, bnnAge), [chartData, bnnAge]);
  const effectiveNadiParayaHouses = useMemo(() => calculateParayaHouses(chartData, bnnAge), [chartData, bnnAge]);

  // Vimshottari lords running at the target date, marked on the charts.
  const dashaLords = useMemo(() => {
    const moon = chartData?.planets.find(p => p.name === 'Moon');
    const birth = parseDateTime(birthDatetime);
    const target = parseTargetDateString(targetDate);
    if (!moon || !birth || !target) return null;
    return runningVimshottariLords(moon.longitude, birth, target);
  }, [chartData, birthDatetime, targetDate]);

  return { karakaByPlanet, nakshatraAdjust, effectiveBnnHouses, effectiveNadiParayaHouses, dashaLords };
}
