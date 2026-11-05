'use client';

import { useMemo, useState } from 'react';
import {
  analyzeIncomeYears,
  compareIncomeYearPatterns,
  type AnnualProgressionFeatureRow,
  type IncomeObservation,
  type IncomeYearStatus,
} from '@/lib/incomeYearAnalysis';

type Props = {
  incomeRows: readonly IncomeObservation[];
  annualProgressions: readonly AnnualProgressionFeatureRow[];
  keyLordRoles: Readonly<Record<string, readonly string[]>>;
};

const euro = (value: number) => new Intl.NumberFormat('fi-FI', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
}).format(value);

const STATUS: Record<IncomeYearStatus, { label: string; color: string; bar: string }> = {
  excellent: { label: 'Erinomainen', color: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-600' },
  good: { label: 'Hyvä', color: 'text-teal-700 dark:text-teal-300', bar: 'bg-teal-500' },
  normal: { label: 'Normaali', color: 'text-zinc-600 dark:text-zinc-300', bar: 'bg-zinc-400' },
  weak: { label: 'Heikko', color: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
  'very-weak': { label: 'Erittäin heikko', color: 'text-rose-700 dark:text-rose-300', bar: 'bg-rose-600' },
  partial: { label: 'Osavuosi', color: 'text-sky-700 dark:text-sky-300', bar: 'bg-sky-500' },
  insufficient: { label: 'Ei vertailutasoa', color: 'text-zinc-500', bar: 'bg-zinc-300' },
};

export default function IncomeYearAnalysis({ incomeRows, annualProgressions, keyLordRoles }: Props) {
  const [showAllPatterns, setShowAllPatterns] = useState(false);
  const analysis = useMemo(() => analyzeIncomeYears(incomeRows), [incomeRows]);
  const patterns = useMemo(
    () => compareIncomeYearPatterns(analysis, annualProgressions, keyLordRoles),
    [analysis, annualProgressions, keyLordRoles],
  );
  const goodYears = analysis.filter(row => row.status === 'excellent' || row.status === 'good');
  const badYears = analysis.filter(row => row.status === 'weak' || row.status === 'very-weak');
  const maxIncome = Math.max(1, ...analysis.map(row => row.amount));
  const maxRate = Math.max(1, goodYears.length, badYears.length);
  const visiblePatterns = showAllPatterns ? patterns : patterns.slice(0, 12);

  if (analysis.length === 0) return null;

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800" data-income-year-analysis>
      <header className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400">Income research · 1–3</p>
        <h3 className="text-sm font-semibold">Tulovuosien analyysi</h3>
        <p className="max-w-3xl text-[11px] leading-relaxed text-zinc-500">
          Luokitus vertaa täyttä kalenterivuotta edeltävien viiden kalenterivuoden mediaaniin.
          Vähintään kolme aiempaa täyttä vuotta tarvitaan. Rajat: erinomainen ≥150 %, hyvä ≥115 %,
          normaali 85–115 %, heikko 50–85 % ja erittäin heikko alle 50 % vertailutasosta.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/30">
          <p className="text-[10px] uppercase text-emerald-800 dark:text-emerald-300">Hyvät vuodet</p>
          <p className="mt-1 text-xl font-semibold text-emerald-800 dark:text-emerald-200">{goodYears.length}</p>
          <p className="text-[10px] text-emerald-800/70 dark:text-emerald-300/70">{goodYears.map(row => row.year).join(', ') || 'Ei luokiteltuja vuosia'}</p>
        </div>
        <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-950/30">
          <p className="text-[10px] uppercase text-rose-800 dark:text-rose-300">Heikot vuodet</p>
          <p className="mt-1 text-xl font-semibold text-rose-800 dark:text-rose-200">{badYears.length}</p>
          <p className="text-[10px] text-rose-800/70 dark:text-rose-300/70">{badYears.map(row => row.year).join(', ') || 'Ei luokiteltuja vuosia'}</p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
          <p className="text-[10px] uppercase text-zinc-500">Vertailukelpoiset vuodet</p>
          <p className="mt-1 text-xl font-semibold">{goodYears.length + badYears.length + analysis.filter(row => row.status === 'normal').length}</p>
          <p className="text-[10px] text-zinc-500">Osavuodet ja liian varhaiset vuodet erotellaan</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold">1. Income Timeline · tulokehitys</h4>
        <div className="flex h-36 items-end gap-1 overflow-x-auto border-b border-zinc-200 pb-1 dark:border-zinc-700">
          {analysis.map(row => {
            const meta = STATUS[row.status];
            return (
              <div key={row.year} title={row.year + ': ' + euro(row.amount) + ' · ' + meta.label}
                className="flex h-full min-w-[22px] flex-1 flex-col items-center justify-end gap-1">
                <div className={`w-full min-w-[8px] rounded-t-sm ${meta.bar}`}
                  style={{ height: Math.max(2, (row.amount / maxIncome) * 104) + 'px', opacity: row.status === 'partial' ? 0.45 : 0.9 }} />
                <span className="text-[8px] text-zinc-400 [writing-mode:vertical-rl]">{row.year}</span>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(['excellent', 'good', 'normal', 'weak', 'very-weak', 'partial', 'insufficient'] as IncomeYearStatus[]).map(status => (
            <span key={status} className={`text-[9px] ${STATUS[status].color}`}>● {STATUS[status].label}</span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[10px]">
            <thead className="text-[9px] uppercase text-zinc-400">
              <tr><th className="px-2 py-2">Vuosi</th><th className="px-2 py-2">Bruttotulot</th><th className="px-2 py-2">Vertailutaso</th><th className="px-2 py-2">Suhde</th><th className="px-2 py-2">Muutos edellisestä</th><th className="px-2 py-2">Luokitus</th></tr>
            </thead>
            <tbody>
              {analysis.map(row => (
                <tr key={row.year} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-2 py-2 font-mono">{row.year}</td>
                  <td className="px-2 py-2 font-mono">{euro(row.amount)}</td>
                  <td className="px-2 py-2 font-mono">{row.baseline === null ? '—' : euro(row.baseline)}</td>
                  <td className="px-2 py-2 font-mono">{row.ratio === null ? '—' : (row.ratio * 100).toFixed(0) + '%'}</td>
                  <td className="px-2 py-2 font-mono">{row.changeFromPrevious === null ? '—' : (row.changeFromPrevious > 0 ? '+' : '') + (row.changeFromPrevious * 100).toFixed(0) + '%'}</td>
                  <td className={`px-2 py-2 font-medium ${STATUS[row.status].color}`}>{STATUS[row.status].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <h4 className="text-xs font-semibold">2. Good vs. Bad Years · hyvien ja huonojen vuosien vertailu</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Hyvät vuodet', rows: goodYears, color: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-300' },
            { title: 'Heikot vuodet', rows: badYears, color: 'bg-rose-600', text: 'text-rose-700 dark:text-rose-300' },
          ].map(group => (
            <div key={group.title} className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <p className={`text-[11px] font-semibold ${group.text}`}>{group.title} ({group.rows.length})</p>
              {group.rows.length ? group.rows.map(row => (
                <div key={row.year} className="flex items-center gap-2 text-[10px]">
                  <span className="w-10 font-mono">{row.year}</span>
                  <div className="h-2 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div className={`h-2 rounded-full ${group.color}`} style={{ width: (row.amount / maxIncome * 100) + '%' }} />
                  </div>
                  <span className="w-24 text-right font-mono">{euro(row.amount)}</span>
                </div>
              )) : <p className="text-[10px] text-zinc-500">Ei vielä luokiteltuja vuosia tässä ryhmässä.</p>}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500">
          Normaalit vuodet eivät kuulu kumpaankaan ääriryhmään. Luokitus kertoo suhteellisesta tulotasosta,
          ei yksin siitä, oliko vuoden tulotaso riittävä elämiseen.
        </p>
      </div>

      <div className="space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <div>
          <h4 className="text-xs font-semibold">3. Pattern Analysis · astrologisten tekijöiden vertailu</h4>
          <p className="text-[10px] text-zinc-500">
            Näyttää, kuinka monessa hyvässä ja heikossa tulovuodessa kukin tekijä esiintyi.
            Prosentit lasketaan vuosista, eivät yksittäisistä grahoista tai osumista.
          </p>
        </div>
        {goodYears.length === 0 || badYears.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-3 text-[11px] text-zinc-500 dark:bg-zinc-900">
            Vertailu tarvitsee vähintään yhden hyvän ja yhden heikon vuoden. Vuosia, joille ei ole
            riittävästi aiempaa tulohistoriaa, ei luokitella automaattisesti.
          </p>
        ) : patterns.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-3 text-[11px] text-zinc-500 dark:bg-zinc-900">
            Näille vuosille ei löytynyt vertailtavia progression piirteitä.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-[10px]">
                <thead className="text-[9px] uppercase text-zinc-400">
                  <tr><th className="px-2 py-2">Tekijä</th><th className="px-2 py-2">Hyvät vuodet</th><th className="px-2 py-2">Heikot vuodet</th><th className="px-2 py-2">Ero</th><th className="px-2 py-2">Painotus</th></tr>
                </thead>
                <tbody>
                  {visiblePatterns.map(pattern => (
                    <tr key={pattern.key} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="px-2 py-2">{pattern.label}</td>
                      <td className="px-2 py-2 font-mono">{pattern.goodCount}/{pattern.goodTotal} ({(pattern.goodRate * 100).toFixed(0)}%)</td>
                      <td className="px-2 py-2 font-mono">{pattern.badCount}/{pattern.badTotal} ({(pattern.badRate * 100).toFixed(0)}%)</td>
                      <td className={`px-2 py-2 font-mono font-semibold ${pattern.difference >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                        {pattern.difference > 0 ? '+' : ''}{(pattern.difference * 100).toFixed(0)} %-yks.
                      </td>
                      <td className="px-2 py-2">
                        <div className="h-2 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div className={`h-2 rounded-full ${pattern.difference >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}
                            style={{ width: (Math.abs(pattern.difference) * 100) + '%' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {patterns.length > 12 && <button type="button" onClick={() => setShowAllPatterns(value => !value)} className="text-[10px] font-medium text-sky-700 hover:underline dark:text-sky-300">
              {showAllPatterns ? 'Näytä vähemmän' : `Näytä kaikki ${patterns.length} tekijää`}
            </button>}
            <p className="text-[10px] text-zinc-500">
              Positiivinen ero tarkoittaa, että tekijä esiintyi suhteellisesti useammin hyvissä vuosissa;
              negatiivinen ero tarkoittaa useampaa esiintymistä heikoissa vuosissa. Pienet aineistot
              voivat tuottaa suuria prosenttieroja. Tämä on kuvaileva vertailu, ei tilastollinen merkitsevyystesti.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
