'use client';

import { FormEvent, useState } from 'react';
import { astroDatabankSearchUrl, PUBLIC_CHART_SERVICES } from '@/lib/publicCharts';

export default function PublicChartsPanel() {
  const [query, setQuery] = useState('');

  const search = (event: FormEvent) => {
    event.preventDefault();
    window.open(astroDatabankSearchUrl(query), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">&gt; public charts</div>
        <h2 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Public-figure charts</h2>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">Search documented birth records and open the ready-made chart at its source.</p>
      </div>

      <form onSubmit={search} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60">
        <label htmlFor="public-chart-search" className="block text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Search Astro-Databank by name</label>
        <div className="mt-2 flex gap-2">
          <input id="public-chart-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Albert Einstein" className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100" />
          <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">Open</button>
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-3">
        {PUBLIC_CHART_SERVICES.map((service) => (
          <a key={service.name} href={service.url} target="_blank" rel="noopener noreferrer" className="group rounded-lg border border-zinc-200 p-4 transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-zinc-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-zinc-800 group-hover:text-emerald-700 dark:text-zinc-100 dark:group-hover:text-emerald-400">{service.name}</span>
              {'recommended' in service && service.recommended && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-mono text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">recommended</span>}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{service.description}</p>
            <div className="mt-3 text-[10px] font-mono text-emerald-700 dark:text-emerald-400">Open database ↗</div>
          </a>
        ))}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        Prefer Astro-Databank entries rated AA or A. A chart can look exact even when its recorded birth time is speculative; check the source notes and Rodden rating before interpreting houses, Lagna or daśās.
      </div>
    </div>
  );
}