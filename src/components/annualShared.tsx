'use client';

// Pieces shared by the two annual-chart panels, Tithi Praveśa and Varṣaphala:
// building the request, fetching it, the place of residence, the year
// stepper, the compressed daśā list and the graha table.

import { useEffect, useState } from 'react';
import type { CalculationSettings, ChartData, ChartDisplaySettings, DegreePrecision, GeoResult, PlanetData } from '@/types';
import { formatDegree } from '@/lib/formatDegree';

export type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

/** Where the annual chart is cast. null means the birthplace. */
export type AnnualPlace = { name: string; latitude: number; longitude: number; timezone: string } | null;

export type LocalPeriod = { lord: string; startJd: number; endJd: number; start: LocalParts; end: LocalParts };
export type LocalMahadasha = LocalPeriod & { antardashas: LocalPeriod[] };

export const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

const pad = (n: number) => String(n).padStart(2, '0');
export const fmtLocal = (p: LocalParts) => `${pad(p.day)}.${pad(p.month)}.${p.year} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
export const fmtDate = (p: LocalParts) => `${pad(p.day)}.${pad(p.month)}.${p.year}`;
export const fmtOffset = (h: number) => {
  const sign = h < 0 ? '−' : '+';
  const abs = Math.abs(h);
  return `UTC${sign}${Math.floor(abs)}${abs % 1 ? `:${pad(Math.round((abs % 1) * 60))}` : ''}`;
};

export function ordinal(n: number): string {
  const teen = n % 100 >= 11 && n % 100 <= 13;
  return `${n}${teen ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="w-24 shrink-0 text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{label}</span>
      <span className="min-w-0 break-words text-xs font-mono text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  );
}

export const toggleClass = (active: boolean) =>
  `rounded-md px-2.5 py-1 text-[10px] font-mono ${active ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`;

/** Julian day (UT) of local noon on yyyy-mm-dd, or of now. Used to mark the running daśā. */
export function referenceJd(targetDate: string | undefined, tzOffset: number): number {
  const m = (targetDate ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const ms = m ? Date.UTC(+m[1], +m[2] - 1, +m[3], 12) - tzOffset * 3600000 : Date.now();
  return ms / 86400000 + 2440587.5;
}

/**
 * Query string for an annual-chart route, or '' when the birth data is
 * incomplete. The place is the residence when one is set, else the birthplace.
 */
export function buildAnnualParams(opts: {
  chart: ChartData;
  birthDatetime: string;
  ianaTimezone?: string;
  calculationSettings?: CalculationSettings;
  place: AnnualPlace;
  year: number | null;
  targetDate?: string;
  extra?: Record<string, string>;
}): string {
  const match = opts.birthDatetime.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s(\d{2})\.(\d{2})\.(\d{2})$/);
  const debug = opts.chart.debug;
  if (!match || !debug) return '';
  const [, dd, mm, yyyy, hh, min, ss] = match;
  const params = new URLSearchParams({
    year: yyyy, month: mm, day: dd, hour: hh, minute: min, second: ss,
    tz: String(debug.utcOffset),
    lat: String(opts.place?.latitude ?? debug.latitude),
    lng: String(opts.place?.longitude ?? debug.longitude),
    ayanamsa: opts.calculationSettings?.ayanamsa ?? 'lahiri',
    ayanamsaOffset: String(opts.calculationSettings?.ayanamsaOffsetDegrees ?? 0),
    nodeMode: opts.calculationSettings?.nodeMode ?? 'mean',
    ...opts.extra,
  });
  const iana = opts.place ? opts.place.timezone : opts.ianaTimezone;
  if (iana) params.set('iana', iana);
  if (opts.year !== null) params.set('tpYear', String(opts.year));
  else params.set('target', opts.targetDate || new Date().toISOString().slice(0, 10));
  return params.toString();
}

/**
 * Fetch `endpoint?query` whenever the query changes. While a new answer loads
 * the previous one stays on screen, so stepping through years does not jump.
 */
export function useAnnualFetch<T>(endpoint: string, query: string) {
  const [result, setResult] = useState<{ key: string; data?: T; error?: string } | null>(null);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${endpoint}?${query}`);
        const data = await res.json();
        if (cancelled) return;
        setResult(data.error ? { key: query, error: data.error } : { key: query, data });
      } catch (e) {
        if (!cancelled) setResult({ key: query, error: String(e) });
      }
    })();
    return () => { cancelled = true; };
  }, [endpoint, query]);

  const current = result?.key === query ? result : null;
  return {
    data: current?.data ?? result?.data,
    error: current?.error,
    loading: !!query && !current,
  };
}

export function YearStepper({ shownYear, year, onChange }: { shownYear?: number; year: number | null; onChange: (y: number | null) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/50">
      <button type="button" className={toggleClass(false)} disabled={!shownYear} onClick={() => shownYear && onChange(shownYear - 1)} aria-label="Previous year">‹</button>
      <span className="px-1 text-[11px] font-mono tabular-nums text-zinc-700 dark:text-zinc-300">{shownYear ?? '····'}</span>
      <button type="button" className={toggleClass(false)} disabled={!shownYear} onClick={() => shownYear && onChange(shownYear + 1)} aria-label="Next year">›</button>
      <button type="button" className={toggleClass(year === null)} onClick={() => onChange(null)} title="The year in force at the target date">current</button>
    </div>
  );
}

/**
 * Birthplace or a place of residence for the year. Tradition casts the annual
 * chart where the native lives during that year.
 */
export function AnnualPlaceControl({ place, onChange }: { place: AnnualPlace; onChange: (p: AnnualPlace) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [status, setStatus] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setStatus('searching…');
    setResults([]);
    try {
      const res = await fetch('/api/geocode?city=' + encodeURIComponent(query));
      const data = await res.json();
      if (data.error) { setStatus(data.error); return; }
      setResults(data.results ?? []);
      setStatus(data.results?.length ? '' : 'No place found.');
    } catch {
      setStatus('Lookup failed.');
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
        <span className="uppercase tracking-widest text-zinc-400 dark:text-zinc-600">place</span>
        <span className="text-zinc-700 dark:text-zinc-300">
          {place ? `${place.name} (${place.latitude.toFixed(2)}, ${place.longitude.toFixed(2)})` : 'birthplace'}
        </span>
        <button type="button" className="underline decoration-dotted" onClick={() => setOpen((v) => !v)}>
          {open ? 'close' : 'residence…'}
        </button>
        {place && <button type="button" className="underline decoration-dotted" onClick={() => onChange(null)}>use birthplace</button>}
      </div>
      {open && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="City of residence that year"
              className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-mono text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button type="button" onClick={search} className="rounded border border-emerald-600 px-3 py-1 text-[10px] font-mono text-emerald-700 dark:border-cyan-700 dark:text-cyan-400">
              lookup
            </button>
          </div>
          {status && <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{status}</div>}
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { onChange({ name: `${r.name}, ${r.country}`, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone }); setOpen(false); }}
              className="block w-full truncate rounded px-2 py-1 text-left text-[11px] font-mono text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {r.name}, {r.country} · {r.latitude.toFixed(2)}, {r.longitude.toFixed(2)} · {r.timezone}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Mahādaśās of the year, the running one open on its antardaśās. */
export function AnnualDashaList({ title, note, dasha, referenceJd: refJd }: {
  title: string;
  note: string;
  dasha: LocalMahadasha[];
  referenceJd: number;
}) {
  const running = dasha.findIndex((md) => refJd >= md.startJd && refJd < md.endJd);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const shownOpen = openIndex ?? (running >= 0 ? running : null);
  return (
    <div className="space-y-1.5">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{title}</div>
        <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600">{note}</div>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {dasha.map((md, i) => (
          <div key={md.lord + md.startJd}>
            <button
              type="button"
              onClick={() => setOpenIndex(shownOpen === i ? -1 : i)}
              className={`flex w-full items-baseline justify-between gap-2 py-1 text-left text-[11px] font-mono ${i === running ? 'text-emerald-700 dark:text-green-400 font-semibold' : 'text-zinc-700 dark:text-zinc-300'}`}
            >
              <span>{md.lord}</span>
              <span className="tabular-nums">{fmtDate(md.start)} → {fmtDate(md.end)}</span>
            </button>
            {shownOpen === i && (
              <div className="mb-1 ml-3 border-l border-zinc-200 pl-2 dark:border-zinc-700">
                {md.antardashas.map((ad) => {
                  const active = refJd >= ad.startJd && refJd < ad.endJd;
                  return (
                    <div key={ad.lord + ad.startJd} className={`flex justify-between gap-2 text-[10px] font-mono tabular-nums ${active ? 'text-emerald-700 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      <span>{md.lord}–{ad.lord}</span>
                      <span>{fmtDate(ad.start)} → {fmtDate(ad.end)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Planets of an annual chart with their house there and in the natal chart. */
export function AnnualPlanetTable({ annual, natal, showOuterPlanets }: { annual: ChartData; natal: ChartData; showOuterPlanets: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] font-mono">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            <th className="py-1 pr-3 font-normal">graha</th>
            <th className="py-1 pr-3 font-normal">sign</th>
            <th className="py-1 pr-3 font-normal">degree</th>
            <th className="py-1 pr-3 font-normal">house</th>
            <th className="py-1 font-normal">natal house</th>
          </tr>
        </thead>
        <tbody className="text-zinc-700 dark:text-zinc-300">
          {annual.planets
            .filter((p) => showOuterPlanets || !['Uranus', 'Neptune', 'Pluto'].includes(p.name))
            .map((p) => (
              <tr key={p.name} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-1 pr-3">{p.name}{p.isRetrograde && p.name !== 'Rahu' && p.name !== 'Ketu' ? ' ℞' : ''}</td>
                <td className="py-1 pr-3">{SIGN_ABBR[p.sign - 1]}</td>
                <td className="py-1 pr-3 tabular-nums">{formatDegree(p.degree, 'minute')}</td>
                <td className="py-1 pr-3 tabular-nums">{p.house}</td>
                <td className="py-1 tabular-nums">{((p.sign - natal.ascendant.sign + 12) % 12) + 1}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/** Props for the chart components drawing an annual chart, optionally with the natal planets overlaid. */
export function annualChartProps(annual: ChartData, natal: ChartData, showNatal: boolean, settings: ChartDisplaySettings, nakshatraAdjust: number) {
  const natalOverlay: PlanetData[] = showNatal
    ? natal.planets.map((p) => ({ ...p, house: ((p.sign - annual.ascendant.sign + 12) % 12) + 1 }))
    : [];
  return {
    activeYearHouse: 0,
    activeMonthHouse: 0,
    ascendantSign: annual.ascendant.sign,
    planets: annual.planets,
    specialLagnas: settings.showSpecialLagnas ? annual.specialLagnas ?? [] : [],
    transitPlanets: natalOverlay,
    showTransitPlanets: natalOverlay.length > 0,
    showSigns: settings.showSigns,
    showNatalPlanets: true,
    degreePrecision: (settings.degreePrecision ?? 'off') as DegreePrecision,
    showCharaKaraka: false,
    showNakshatra: settings.showNakshatra,
    showOuterPlanets: settings.showOuterPlanets,
    showSpecialLagnas: settings.showSpecialLagnas,
    showBcpHighlights: false,
    nakshatraAdjust,
  };
}
