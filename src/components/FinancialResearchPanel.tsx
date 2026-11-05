'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { SIGN_LORDS, SIGN_NAMES } from '@/lib/signs';
import {
  calculateBhriguPadas,
  calculateBhriguProgressions,
  type BhriguPadaVersion,
} from '@/lib/bhriguPadaProgression';

type IncomeRow = { year: number; amount: number; note?: string };
type Track = { body: string; role: string; isKeyLord: boolean };
const STORAGE_KEY = 'brighu-financial-research-income-v1';
const VERSION: BhriguPadaVersion = 'nadi-praveshika-8';
const BODY_COLORS = ['#0d9488', '#2563eb', '#9333ea', '#d97706', '#dc2626', '#64748b', '#0891b2', '#65a30d'];

function readStoredIncome(): IncomeRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((row): row is IncomeRow =>
          row && Number.isInteger(row.year) && Number.isFinite(row.amount) && row.amount >= 0,
        ).sort((a, b) => a.year - b.year)
      : [];
  } catch {
    return [];
  }
}
function signFromHouse(ascendantSign: number, house: number): number {
  return ((ascendantSign - 1 + house - 1) % 12) + 1;
}
function lordOfSign(sign: number): string {
  return SIGN_LORDS[sign - 1];
}
function ageToYear(birth: Date, age: number): number {
  const date = new Date(birth.getTime() + age * 365.25 * 86400000);
  return date.getFullYear();
}

export default function FinancialResearchPanel({ chart, birthDatetime }: { chart: ChartData; birthDatetime: string }) {
  const [incomeRows, setIncomeRows] = useState<IncomeRow[]>(readStoredIncome);
  const [range, setRange] = useState(80);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(incomeRows)); } catch { /* Storage may be unavailable. */ }
  }, [incomeRows]);

  const birth = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const asc = chart.ascendant.sign;
  const house2Sign = signFromHouse(asc, 2);
  const house11Sign = signFromHouse(asc, 11);
  const padas = useMemo(() => calculateBhriguPadas(chart, VERSION), [chart]);
  const a2 = padas.find(p => p.house === 2);
  const a11 = padas.find(p => p.house === 11);
  const keyLords = useMemo(() => {
    const entries = [
      { body: lordOfSign(house2Sign), role: '2nd-house lord' },
      { body: lordOfSign(house11Sign), role: '11th-house lord' },
      ...(a2 ? [{ body: lordOfSign(a2.sign), role: 'A2 sign lord' }] : []),
      ...(a11 ? [{ body: lordOfSign(a11.sign), role: 'A11 sign lord' }] : []),
    ];
    const map = new Map<string, string[]>();
    for (const item of entries) map.set(item.body, [...(map.get(item.body) ?? []), item.role]);
    return map;
  }, [house2Sign, house11Sign, a2, a11]);

  const tracks: Track[] = useMemo(() => {
    const bodies = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu'];
    return bodies.filter(body => chart.planets.some(p => p.name === body)).map(body => ({
      body,
      role: keyLords.has(body) ? (keyLords.get(body) ?? []).join(' · ') : 'Progressing graha',
      isKeyLord: keyLords.has(body),
    }));
  }, [chart.planets, keyLords]);

  const progressionRows = useMemo(() => {
    const samples: { age: number; body: string; house: number; sign: number }[] = [];
    const step = 1 / 12;
    for (let age = 0; age <= range + 1e-8; age += step) {
      const rows = calculateBhriguProgressions(chart, age, VERSION);
      for (const row of rows) samples.push({ age, body: row.body, house: row.houseFromLagna, sign: row.sign });
    }
    return samples;
  }, [chart, range]);

  const events = useMemo(() => {
    const targets = [
      { label: '2nd house', sign: house2Sign, kind: 'wealth-house' },
      { label: '11th house', sign: house11Sign, kind: 'income-house' },
      ...(a2 ? [{ label: 'A2', sign: a2.sign, kind: 'arudha' }] : []),
      ...(a11 ? [{ label: 'A11', sign: a11.sign, kind: 'arudha' }] : []),
    ];
    const found: { age: number; body: string; target: string; role: string }[] = [];
    const previousByBody = new Map<string, number>();
    for (const point of progressionRows) {
      const previousSign = previousByBody.get(point.body);
      if (previousSign !== point.sign) {
        for (const target of targets) {
          if (point.sign === target.sign) {
            found.push({ age: point.age, body: point.body, target: target.label, role: target.kind });
          }
        }
        if (point.house === 11 && keyLords.has(point.body)) {
          found.push({ age: point.age, body: point.body, target: '11th house', role: (keyLords.get(point.body) ?? []).join(' · ') + ' enters 11th' });
        }
      }
      previousByBody.set(point.body, point.sign);
    }
    const unique = new Map<string, typeof found[number]>();
    for (const event of found) unique.set([event.age.toFixed(4), event.body, event.target, event.role].join('|'), event);
    return [...unique.values()].sort((a, b) => a.age - b.age || a.body.localeCompare(b.body));
  }, [progressionRows, house2Sign, house11Sign, a2, a11, keyLords]);

  const maxIncome = Math.max(1, ...incomeRows.map(row => row.amount));
  const addIncome = () => {
    const year = Number(newYear);
    const amount = Number(newAmount.replace(',', '.'));
    if (!Number.isInteger(year) || year < 1900 || year > 2200 || !Number.isFinite(amount) || amount < 0) return;
    setIncomeRows(current => [...current.filter(row => row.year !== year), { year, amount, ...(newNote.trim() ? { note: newNote.trim() } : {}) }].sort((a, b) => a.year - b.year));
    setNewAmount('');
    setNewNote('');
  };
  const removeIncome = (year: number) => setIncomeRows(current => current.filter(row => row.year !== year));

  return (
    <section className="min-w-0 space-y-4" data-financial-research>
      <header className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-zinc-400">Research · Nāḍī Praveśikā</p>
        <h2 className="text-sm font-semibold">Financial potential — research v1</h2>
        <p className="max-w-3xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Exploratory view of the 2nd and 11th houses, A2 and A11, their sign lords, and Bhṛgu Pada progressions.
          This is a research display, not a validated income prediction or a weighted score.
        </p>
      </header>

      {!birth && <p className="rounded-lg border border-amber-300 p-3 text-xs text-amber-800 dark:border-amber-900 dark:text-amber-300">Birth date is unavailable. Add a valid birth date to connect progression ages with calendar years.</p>}

      <div className="grid gap-2 sm:grid-cols-4">
        {[
          { label: '2nd house', sign: house2Sign, lord: lordOfSign(house2Sign) },
          { label: '11th house', sign: house11Sign, lord: lordOfSign(house11Sign) },
          { label: 'A2', sign: a2?.sign, lord: a2 ? lordOfSign(a2.sign) : '—' },
          { label: 'A11', sign: a11?.sign, lord: a11 ? lordOfSign(a11.sign) : '—' },
        ].map(item => (
          <div key={item.label} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <p className="text-[10px] font-mono uppercase text-zinc-400">{item.label}</p>
            <p className="mt-1 text-sm font-semibold">{item.sign ? SIGN_NAMES[item.sign - 1] : '—'}</p>
            <p className="text-[11px] text-zinc-500">Lord: {item.lord}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <label className="flex items-center gap-2 text-xs">Timeline end age
          <select value={range} onChange={event => setRange(Number(event.target.value))} className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">
            {[40, 60, 80, 100, 120].map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <span className="text-[10px] text-zinc-500">Rule set: Nāḍī Praveśikā (8 grahas)</span>
      </div>

      <div className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold">Progression through natal houses</h3>
          <span className="text-[10px] text-zinc-500">Highlighted rows: 2nd / 11th houses</span>
        </div>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 900 340" role="img" aria-label="Bhṛgu Pada progression by age and natal house" className="min-w-[640px] w-full">
            {[...Array(12)].map((_, i) => {
              const y = 24 + i * 25;
              const house = 12 - i;
              return <g key={house}>
                {(house === 2 || house === 11) && <rect x="78" y={y - 10} width="800" height="22" fill={house === 11 ? '#0d9488' : '#d97706'} opacity="0.10" />}
                <text x="68" y={y + 4} textAnchor="end" fontSize="10" fill="currentColor">{house}</text>
                <line x1="82" y1={y} x2="878" y2={y} stroke="currentColor" opacity="0.10" />
              </g>;
            })}
            {[...Array(9)].map((_, i) => {
              const age = (range / 8) * i;
              const x = 82 + (796 * i) / 8;
              return <g key={i}><line x1={x} y1="12" x2={x} y2="316" stroke="currentColor" opacity="0.10" /><text x={x} y="331" textAnchor="middle" fontSize="10" fill="currentColor">{age.toFixed(0)}</text></g>;
            })}
            {tracks.map((track, index) => {
              const rows = progressionRows.filter(row => row.body === track.body);
              const points = rows.map(row => {
                const x = 82 + (row.age / range) * 796;
                const y = 24 + (12 - row.house) * 25;
                return x + ',' + y;
              }).join(' ');
              return <g key={track.body}>
                <polyline points={points} fill="none" stroke={BODY_COLORS[index % BODY_COLORS.length]} strokeWidth={track.isKeyLord ? 2.5 : 1.5} opacity={track.isKeyLord ? 1 : 0.65} />
                {rows.filter(row => row.house === 11 || row.house === 2).map((row, i) => <circle key={i} cx={82 + (row.age / range) * 796} cy={24 + (12 - row.house) * 25} r={track.isKeyLord ? 3.5 : 2.5} fill={BODY_COLORS[index % BODY_COLORS.length]} />)}
              </g>;
            })}
          </svg>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {tracks.map((track, index) => <span key={track.body} className="text-[10px] text-zinc-500"><span style={{ color: BODY_COLORS[index % BODY_COLORS.length] }}>●</span> {track.body}{track.isKeyLord ? ' *' : ''}</span>)}
        </div>
        <p className="text-[10px] text-zinc-500">* Lord of the 2nd house, 11th house, A2 or A11. Vertical axis = house from Lagna; horizontal axis = age. The 2nd and 11th house bands are highlighted.</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold">Financial activation events</h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[560px] text-left text-[11px]">
            <thead className="bg-zinc-50 text-[9px] uppercase text-zinc-400 dark:bg-zinc-900/60">
              <tr><th className="px-3 py-2">Age</th><th className="px-3 py-2">Calendar year</th><th className="px-3 py-2">Graha</th><th className="px-3 py-2">Activation</th><th className="px-3 py-2">Interpretation field</th></tr>
            </thead>
            <tbody>
              {events.slice(0, 100).map((event, index) => <tr key={index} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-3 py-2 font-mono">{event.age.toFixed(2)}</td>
                <td className="px-3 py-2 font-mono">{birth ? ageToYear(birth, event.age) : '—'}</td>
                <td className="px-3 py-2">{event.body}</td>
                <td className="px-3 py-2">{event.target}</td>
                <td className="px-3 py-2 text-zinc-500">{event.role}</td>
              </tr>)}
              {events.length === 0 && <tr><td colSpan={5} className="px-3 py-5 text-center text-zinc-500">No matching activations in this age range.</td></tr>}
            </tbody>
          </table>
        </div>
        {events.length > 100 && <p className="text-[10px] text-zinc-500">Showing first 100 of {events.length} activation events.</p>}
      </div>

      <div className="space-y-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <div>
          <h3 className="text-xs font-semibold">Historical income data</h3>
          <p className="text-[10px] text-zinc-500">Enter annual gross income. Data is stored only in this browser on this device; it is not uploaded.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[100px_1fr_1fr_auto]">
          <input aria-label="Income year" type="number" min="1900" max="2200" value={newYear} onChange={event => setNewYear(event.target.value)} className="rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900" />
          <input aria-label="Annual gross income in euros" inputMode="decimal" placeholder="Gross income (€)" value={newAmount} onChange={event => setNewAmount(event.target.value)} className="rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900" />
          <input aria-label="Income note" placeholder="Note / income type (optional)" value={newNote} onChange={event => setNewNote(event.target.value)} className="rounded-md border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900" />
          <button type="button" onClick={addIncome} disabled={!newAmount.trim()} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-40">Add year</button>
        </div>
        {incomeRows.length > 0 ? <>
          <div className="flex h-24 items-end gap-1 border-b border-zinc-200 pb-1 dark:border-zinc-700">
            {incomeRows.map(row => <div key={row.year} title={row.year + ': ' + row.amount.toLocaleString() + ' €'} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div className="w-full rounded-t-sm bg-emerald-600/80" style={{ height: Math.max(2, (row.amount / maxIncome) * 76) + 'px' }} />
              <span className="text-[8px] text-zinc-400 [writing-mode:vertical-rl]">{row.year}</span>
            </div>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-[11px]">
              <thead className="text-[9px] uppercase text-zinc-400"><tr><th className="py-1">Year</th><th className="py-1">Gross income</th><th className="py-1">Note</th><th /></tr></thead>
              <tbody>{incomeRows.map(row => <tr key={row.year} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-1.5 font-mono">{row.year}</td>
                <td className="py-1.5 font-mono">{row.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} €</td>
                <td className="py-1.5 text-zinc-500">{row.note ?? '—'}</td>
                <td className="py-1.5 text-right"><button type="button" onClick={() => removeIncome(row.year)} className="text-rose-600 hover:underline">Remove</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        </> : <p className="rounded-md bg-zinc-50 px-3 py-4 text-center text-[11px] text-zinc-500 dark:bg-zinc-900">No income years entered yet.</p>}
      </div>
    </section>
  );
}
