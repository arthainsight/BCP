import {
  calculateVimshottari,
  calculateAntardashas,
  calculatePratyantardashas,
  MahadashaEntry,
} from '@/lib/vimshottari';
import { parseDateTime } from '@/lib/bcp';
import { PlanetData } from '@/types';

interface Props {
  planets: PlanetData[];
  birthDatetime: string;
  showMd: boolean;
  showAd: boolean;
  showPd: boolean;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtDuration(years: number): string {
  const y = Math.floor(years);
  const m = Math.round((years - y) * 12);
  if (m === 0) return `${y}y`;
  if (y === 0) return `${m}m`;
  return `${y}y ${m}m`;
}

function isActive(entry: MahadashaEntry, now: Date): boolean {
  return entry.startDate <= now && now < entry.endDate;
}

const HEADER_CLS =
  'grid gap-x-2 px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-700 ' +
  'text-[10px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-wider';

const ROW_BASE =
  'grid gap-x-2 px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 text-xs font-mono';

const ROW_ACTIVE = 'bg-amber-50 dark:bg-amber-900/20';

function DashaTable({
  title,
  entries,
  now,
  cols = 'grid-cols-4',
}: {
  title: string;
  entries: MahadashaEntry[];
  now: Date;
  cols?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-wider px-0.5">
        {title}
      </div>
      <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden">
        <div className={`${HEADER_CLS} ${cols}`}>
          <span>lord</span>
          <span>start</span>
          <span>end</span>
          <span>dur</span>
        </div>
        {entries.map((entry, i) => {
          const active = isActive(entry, now);
          return (
            <div key={entry.lord + i} className={`${ROW_BASE} ${cols} ${active ? ROW_ACTIVE : ''}`}>
              <span
                className={
                  active
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-amber-600 dark:text-amber-400 font-semibold'
                }
              >
                {entry.lord}
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">{fmtDate(entry.startDate)}</span>
              <span className="text-zinc-600 dark:text-zinc-400">{fmtDate(entry.endDate)}</span>
              <span className="text-zinc-500 dark:text-zinc-500">{fmtDuration(entry.durationYears)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VimshottariPanel({ planets, birthDatetime, showMd, showAd, showPd }: Props) {
  const moon = planets.find((p) => p.name === 'Moon');

  if (!moon || moon.longitude == null) {
    return (
      <div className="space-y-3">
        <h3 className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          &gt; vimshottari.md
        </h3>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
          Vimshottari Dasha requires Moon nakshatra data.
        </div>
      </div>
    );
  }

  const birthDate = parseDateTime(birthDatetime);
  if (!birthDate) {
    return (
      <div className="space-y-3">
        <h3 className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          &gt; vimshottari.md
        </h3>
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic">
          Invalid birth datetime.
        </div>
      </div>
    );
  }

  const result = calculateVimshottari(moon.longitude, birthDate);
  const now = new Date();

  const activeMd = result.entries.find((e) => isActive(e, now)) ?? null;
  const antardashas = showAd && activeMd ? calculateAntardashas(activeMd) : [];
  const activeAd = antardashas.find((e) => isActive(e, now)) ?? null;
  const pratyantardashas = showPd && activeAd ? calculatePratyantardashas(activeAd) : [];

  return (
    <div className="space-y-3">
      <h3 className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
        &gt; vimshottari.md
      </h3>

      <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 space-y-0.5">
        <span className="text-zinc-400 dark:text-zinc-600">nakshatra: </span>
        <span className="text-zinc-700 dark:text-zinc-300">{result.nakshatra}</span>
        <span className="text-zinc-400 dark:text-zinc-600 ml-3">lord: </span>
        <span className="text-zinc-700 dark:text-zinc-300">{result.nakshatraLord}</span>
      </div>

      {showMd && (
        <DashaTable title="mahadasha" entries={result.entries} now={now} />
      )}

      {showAd && activeMd && (
        <DashaTable
          title={`antardasha — ${activeMd.lord} MD`}
          entries={antardashas}
          now={now}
        />
      )}

      {showAd && !activeMd && (
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic px-0.5">
          No active Mahadasha found for AD display.
        </div>
      )}

      {showPd && activeAd && (
        <DashaTable
          title={`pratyantardasha — ${activeAd.lord} AD`}
          entries={pratyantardashas}
          now={now}
        />
      )}

      {showPd && activeMd && !activeAd && (
        <div className="text-xs font-mono text-zinc-400 dark:text-zinc-600 italic px-0.5">
          No active Antardasha found for PD display.
        </div>
      )}
    </div>
  );
}
