'use client';

import { useMemo } from 'react';
import type { ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { SIGN_NAMES } from '@/lib/signs';
import {
  calculateBhriguIncomePeriods,
  FINANCIAL_ROLE_LABELS,
  FINANCIAL_TARGET_LABELS,
  type BhriguIncomePeriod,
} from '@/lib/bhriguIncomePeriods';

type Props = { chart: ChartData; birthDatetime: string; maxAge: number };

function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat('fi-FI', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function signLabel(sign: number): string {
  return SIGN_NAMES[sign - 1] ?? '—';
}

function priorityLabel(period: BhriguIncomePeriod): string {
  if (period.adIn11th) return 'Korkein: AD 11. huoneessa';
  if (period.pdIn11th) return 'Erittäin vahva: PD 11. huoneessa';
  return 'Muu tulotekijän aktivaatio';
}

function targetText(targets: BhriguIncomePeriod['adTargets']): string {
  return targets.length ? targets.map(target => FINANCIAL_TARGET_LABELS[target]).join(', ') : '—';
}

export default function BhriguIncomePeriods({ chart, birthDatetime, maxAge }: Props) {
  const birth = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const periods = useMemo(
    () => birth ? calculateBhriguIncomePeriods(chart, birth, maxAge) : [],
    [chart, birth, maxAge],
  );
  const topPriority = periods.filter(period => period.priority >= 3);
  const displayed = periods.slice(0, 160);

  if (!birth) return <p className="rounded-lg border border-amber-300 p-3 text-xs text-amber-800">Syntymäaika puuttuu tai on virheellinen.</p>;

  return (
    <section className="space-y-3 rounded-xl border-2 border-emerald-700/30 p-3 dark:border-emerald-500/30" data-bhrigu-income-ad-pd>
      <header className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Oletusanalyysi · Bhṛgu Pada</p>
        <h3 className="text-sm font-semibold">Tulotekijöiden MD–AD–PD-kaudet</h3>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          MD = grahan nataalinen merkki (kiinteä). AD = progression merkki. PD = AD-merkin alajakso.
          Mukana ovat kaudet, joissa 2L, 11L, A2L tai A11L aktivoi 2. huoneen, 11. huoneen, A2:n tai A11:n.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
          <p className="text-[10px] text-emerald-800 dark:text-emerald-300">Kaikki osumat</p>
          <p className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">{periods.length}</p>
        </div>
        <div className="rounded-lg bg-teal-50 p-3 dark:bg-teal-950/30">
          <p className="text-[10px] text-teal-800 dark:text-teal-300">AD siirtyy 11. huoneeseen</p>
          <p className="text-xl font-semibold text-teal-900 dark:text-teal-100">{periods.filter(period => period.adIn11th).length}</p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <p className="text-[10px] text-zinc-500">PD siirtyy 11. huoneeseen</p>
          <p className="text-xl font-semibold">{periods.filter(period => period.pdIn11th).length}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold">Tärkeimmät kaudet ensin</h4>
          <span className="text-[10px] text-zinc-500">11. huoneen AD/PD-osumia {topPriority.length} · näytetään {displayed.length} / {periods.length}</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[1050px] text-left text-[10px]">
            <thead className="bg-zinc-50 text-[9px] uppercase text-zinc-400 dark:bg-zinc-900/60">
              <tr>
                <th className="px-2 py-2">Prioriteetti</th><th className="px-2 py-2">MD-graha / nataali</th>
                <th className="px-2 py-2">AD</th><th className="px-2 py-2">PD</th><th className="px-2 py-2">Aikaväli</th>
                <th className="px-2 py-2">Hallitsijarooli</th><th className="px-2 py-2">AD-aktivaatio</th><th className="px-2 py-2">PD-aktivaatio</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(period => (
                <tr key={period.body + '-' + period.startAge.toFixed(8)} className={period.priority >= 3 ? 'border-t border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-t border-zinc-100 dark:border-zinc-800'}>
                  <td className="px-2 py-2 font-medium">{priorityLabel(period)}</td>
                  <td className="px-2 py-2"><strong>{period.body}</strong><div className="text-zinc-500">{signLabel(period.mdSign)} · H{period.mdHouse}</div></td>
                  <td className="px-2 py-2"><strong>{signLabel(period.adSign)}</strong><div className="text-zinc-500">H{period.adHouse}</div></td>
                  <td className="px-2 py-2"><strong>{signLabel(period.pdSign)}</strong><div className="text-zinc-500">H{period.pdHouse} · PD {period.pdNumber}</div></td>
                  <td className="px-2 py-2 whitespace-nowrap">{dateLabel(period.startDate)} – {dateLabel(period.endDate)}</td>
                  <td className="px-2 py-2">{period.roles.map(role => FINANCIAL_ROLE_LABELS[role]).join(', ')}</td>
                  <td className="px-2 py-2">{targetText(period.adTargets)}</td>
                  <td className="px-2 py-2">{targetText(period.pdTargets)}</td>
                </tr>
              ))}
              {periods.length === 0 && <tr><td colSpan={8} className="px-2 py-5 text-center text-zinc-500">Ei osumia tällä aikavälillä.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-zinc-500">
        11. huoneeseen siirtyminen tarkoittaa AD- tai PD-merkin sijaintia 11. huoneessa Lagna-merkistä laskettuna.
        AD:n 11. huoneeseen siirtyminen on ensisijainen. Aikavälit lasketaan grahan kierrospituudesta (cycle/12 AD:lle, cycle/144 PD:lle).
        Tämä on tutkimuslista, ei validoitu tulonennuste.
      </p>
    </section>
  );
}
