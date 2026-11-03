'use client';

import { useMemo, useState } from 'react';
import type { ChartData } from '@/types';
import { parseDateTime } from '@/lib/bcp';
import { dashaYearMsFor, type DashaYearLength } from '@/lib/time';
import { SIGN_NAMES } from '@/lib/signs';
import { useGrahaNames } from '@/lib/grahaNames';
import { BHRIGU_PADA_CYCLES, BHRIGU_PADA_BODIES, type BhriguPadaVersion } from '@/lib/bhriguPadaProgression';

type Props = { chart: ChartData; birthDatetime: string; version: BhriguPadaVersion; yearLength: DashaYearLength };
type Period = { body: string; sign: number; start: Date; end: Date; label: string };
const wrap = (n: number) => ((n - 1) % 12 + 12) % 12 + 1;
const addYears = (birth: Date, years: number, yearLength: DashaYearLength) => new Date(birth.getTime() + years * dashaYearMsFor(yearLength));
const fmt = (date: Date) => date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
const inputDate = (date: Date) => { const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return d.toISOString().slice(0, 10); };

function makePeriods(body: string, natalSign: number, cycle: number, birth: Date, level: 'AD' | 'PD', yearLength: DashaYearLength): Period[] {
  const count = level === 'AD' ? 12 : 144;
  const duration = cycle / count;
  return Array.from({ length: count }, (_, i) => ({
    body, sign: level === 'AD' ? wrap(natalSign + i) : wrap(natalSign + Math.floor(i / 12) + (i % 12)),
    start: addYears(birth, i * duration, yearLength), end: addYears(birth, (i + 1) * duration, yearLength),
    label: level === 'AD' ? 'AD ' + (i + 1) + '/12' : 'PD ' + (i + 1) + '/144',
  }));
}

export default function BhriguPeriodExplorer({ chart, birthDatetime, version, yearLength }: Props) {
  const birth = useMemo(() => parseDateTime(birthDatetime), [birthDatetime]);
  const { name } = useGrahaNames();
  const bodies = BHRIGU_PADA_BODIES[version];
  const [from, setFrom] = useState(() => inputDate(new Date()));
  const [to, setTo] = useState(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 10); return inputDate(d); });
  const [level, setLevel] = useState<'AD' | 'PD'>('AD');
  const [sign, setSign] = useState(1);
  const [selected, setSelected] = useState<string[]>([...bodies]);
  const [searched, setSearched] = useState(false);

  const { results, common } = useMemo(() => {
    if (!birth || !searched || !from || !to) return { results: [], common: [] as { start: Date; end: Date }[] };
    const fromDate = new Date(from + 'T00:00:00');
    const toDate = new Date(to + 'T23:59:59.999');
    if (fromDate > toDate) return { results: [], common: [] as { start: Date; end: Date }[] };
    const lists = selected.map(body => {
      const natal = chart.planets.find(p => p.name === body);
      const cycle = BHRIGU_PADA_CYCLES[version][body];
      if (!natal || !cycle) return [];
      return makePeriods(body, natal.sign, cycle, birth, level, yearLength).filter(p => p.sign === sign && p.end > fromDate && p.start <= toDate);
    });
    const rows = lists.flat().sort((a, b) => a.start.getTime() - b.start.getTime());
    let overlaps: { start: Date; end: Date }[] = [];
    if (lists.length > 1 && lists.every(x => x.length)) {
      const points = lists.flat().flatMap(p => [p.start, p.end]).sort((a, b) => a.getTime() - b.getTime());
      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i], end = points[i + 1], mid = new Date((start.getTime() + end.getTime()) / 2);
        if (lists.every(list => list.some(p => p.start <= mid && p.end > mid))) {
          const last = overlaps[overlaps.length - 1];
          if (last && last.end.getTime() === start.getTime()) last.end = end;
          else overlaps.push({ start, end });
        }
      }
      overlaps = overlaps.map(p => ({ start: p.start < fromDate ? fromDate : p.start, end: p.end > toDate ? toDate : p.end }));
    }
    return { results: rows, common: overlaps };
  }, [birth, chart, from, to, level, searched, selected, sign, version, yearLength]);

  return <section className="space-y-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800" data-bhrigu-period-explorer>
    <div><h3 className="text-xs font-semibold">AD / PD -ajanjaksohaku</h3><p className="text-[10px] text-zinc-500">Etsi, milloin yksi tai useampi graha on valitussa merkissä AD- tai PD-tasolla.</p></div>
    <div className="grid gap-2 sm:grid-cols-4">
      <label className="space-y-1 text-[10px] text-zinc-500">Alkaa<input type="date" value={from} onChange={e => setFrom(e.target.value)} className="block w-full rounded border p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900" /></label>
      <label className="space-y-1 text-[10px] text-zinc-500">Päättyy<input type="date" value={to} onChange={e => setTo(e.target.value)} className="block w-full rounded border p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900" /></label>
      <label className="space-y-1 text-[10px] text-zinc-500">Taso<select value={level} onChange={e => setLevel(e.target.value as 'AD' | 'PD')} className="block w-full rounded border p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"><option value="AD">AD</option><option value="PD">PD</option></select></label>
      <label className="space-y-1 text-[10px] text-zinc-500">Merkki<select value={sign} onChange={e => setSign(Number(e.target.value))} className="block w-full rounded border p-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">{SIGN_NAMES.map((s, i) => <option key={s} value={i + 1}>{s}</option>)}</select></label>
    </div>
    <div className="flex flex-wrap gap-x-3 gap-y-2">{bodies.map(body => <label key={body} className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={selected.includes(body)} onChange={e => setSelected(old => e.target.checked ? [...old, body] : old.filter(x => x !== body))} />{name(body)}</label>)}</div>
    <button type="button" onClick={() => setSearched(true)} disabled={!birth || selected.length === 0} className="rounded-md bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900">Hae ajanjaksot</button>
    {searched && <><p className="text-[10px] text-zinc-500">{results.length} osumaa · {level} merkissä {SIGN_NAMES[sign - 1]}</p>
      <div className="overflow-x-auto rounded-lg border dark:border-zinc-800"><table className="w-full min-w-[500px] text-left text-[11px]"><thead className="bg-zinc-50 text-[9px] uppercase text-zinc-400 dark:bg-zinc-900"><tr><th className="p-2">Graha</th><th className="p-2">Jakso</th><th className="p-2">Merkki</th><th className="p-2">Alkaa</th><th className="p-2">Päättyy</th></tr></thead><tbody>{results.map((p, i) => <tr key={p.body + p.start.toISOString() + i} className="border-t dark:border-zinc-800"><td className="p-2 font-semibold">{name(p.body)}</td><td className="p-2">{p.label}</td><td className="p-2">{SIGN_NAMES[p.sign - 1]}</td><td className="p-2">{fmt(p.start)}</td><td className="p-2">{fmt(p.end)}</td></tr>)}{!results.length && <tr><td colSpan={5} className="p-3 text-zinc-500">Ei osumia valitulla ajanjaksolla.</td></tr>}</tbody></table></div>
      {selected.length > 1 && <div className="rounded-md bg-emerald-50 p-2 text-[10px] text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><strong>Kaikkien valittujen grahojen yhteinen jakso:</strong>{common.length ? common.map((p, i) => <div key={i}>{fmt(p.start)} – {fmt(p.end)}</div>) : <div>Ei yhteistä päällekkäistä ajanjaksoa.</div>}</div>}
    </>}
  </section>;
}
