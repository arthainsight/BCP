'use client';

import { ChartData, PlanetData } from '@/types';
import {
  buildBnnChains,
  getActiveBnnChains,
  BnnChain,
  BnnActivation,
  BnnActivationOptions,
  CircuitName,
} from '@/lib/bnnPro';

const SIGN_NAMES = ['', 'Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

const CIRCUIT_COLOR: Record<CircuitName, string> = {
  Fire:  'text-red-600 dark:text-red-400',
  Earth: 'text-amber-700 dark:text-amber-500',
  Air:   'text-sky-600 dark:text-sky-400',
  Water: 'text-blue-600 dark:text-blue-400',
};

const LEVEL_COLOR: Record<BnnActivation['activationLevel'], string> = {
  major:    'text-red-600 dark:text-red-400',
  focused:  'text-amber-600 dark:text-amber-400',
  specific: 'text-sky-600 dark:text-sky-400',
  transit:  'text-violet-600 dark:text-violet-400',
};

interface Props {
  chart: ChartData;
  transitPlanets?: PlanetData[];
  mahaDashaPlanet?: string;
  antarDashaPlanet?: string;
  pratyantarDashaPlanet?: string;
}

function ChainCard({ chain }: { chain: BnnChain }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-md p-3 space-y-2 bg-white dark:bg-zinc-900">
      <div className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${CIRCUIT_COLOR[chain.circuitName]}`}>
        {chain.circuitName} trine · signs {chain.signs.join(', ')}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-xs font-mono font-bold text-emerald-700 dark:text-green-400">
        {chain.planets.flatMap((p, i) => {
          const items: React.ReactNode[] = [];
          if (i > 0) {
            items.push(
              <span key={`arrow-${i}`} className="text-zinc-400 dark:text-zinc-600 font-normal">→</span>,
            );
          }
          items.push(
            <span key={p.name}>
              {p.name}{' '}
              <span className="text-zinc-400 dark:text-zinc-500 font-normal text-[10px]">
                {Math.floor(p.degree)}°{SIGN_NAMES[p.sign]}
              </span>
            </span>,
          );
          return items;
        })}
      </div>

      <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        {chain.links.map((link) => (
          <div key={`${link.from.name}-${link.to.name}`}>
            <div className="text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 mb-0.5">
              {link.from.name} → {link.to.name}
            </div>
            <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {link.meaning}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivationCard({ activation }: { activation: BnnActivation }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-md p-3 space-y-1.5 bg-zinc-50 dark:bg-zinc-900/60">
      <div className={`text-[10px] font-mono uppercase tracking-widest font-semibold ${LEVEL_COLOR[activation.activationLevel]}`}>
        {activation.activationLevel} · {activation.chain.circuitName} trine
      </div>
      <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200">
        {activation.chain.planets.map((p) => p.name).join(' → ')}
      </div>
      <div className="space-y-0.5">
        {activation.activatedBy.map((reason, i) => (
          <div key={i} className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            · {reason}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BnnProPanel({
  chart,
  transitPlanets,
  mahaDashaPlanet,
  antarDashaPlanet,
  pratyantarDashaPlanet,
}: Props) {
  const chains = buildBnnChains(chart);

  const opts: BnnActivationOptions = {
    mahaDashaPlanet,
    antarDashaPlanet,
    pratyantarDashaPlanet,
    transitPlanets: transitPlanets ?? [],
  };
  const activations = getActiveBnnChains(chart, opts);

  const totalLinks = chains.reduce((s, c) => s + c.links.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-500">&gt; bnn.pro</div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 border border-violet-300 dark:border-violet-700">
          PRO
        </span>
      </div>

      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 leading-relaxed">
        Ordered trinal chains. Degree sequence matters.
      </div>

      {chains.length === 0 ? (
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic py-4">
          No trinal chains — fewer than 2 planets share any trinal circuit.
        </div>
      ) : (
        <div className="space-y-3">
          {chains.map((chain) => (
            <ChainCard key={chain.circuitName} chain={chain} />
          ))}
        </div>
      )}

      {activations.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-zinc-200 dark:border-zinc-700">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Active now
          </div>
          <div className="space-y-2">
            {activations.map((act) => (
              <ActivationCard key={act.chain.circuitName} activation={act} />
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] font-mono text-zinc-300 dark:text-zinc-700">
        {chains.length} chain{chains.length !== 1 ? 's' : ''} · {totalLinks} link{totalLinks !== 1 ? 's' : ''}
        {activations.length > 0 ? ` · ${activations.length} active` : ''}
      </div>
    </div>
  );
}
