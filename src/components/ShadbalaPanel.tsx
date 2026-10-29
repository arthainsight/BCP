'use client';

import type { ChartData } from '@/types';
import { buildShadbalaRows } from '@/lib/shadbala';
import type { BalaOptions } from '@/lib/balaOptions';
import { formatScore } from '@/lib/vargaMatrix';
import { SHADBALA_PARTS, STATUS_ICON, shadbalaComposition, shadbalaStatus, type BalaStatus, type ShadbalaPart } from '@/lib/balaView';
import { useT } from '@/lib/i18n';
import { HorizontalBars, SERIES_COLORS, STATUS_COLORS, StackedBars } from './BalaCharts';
import { BODY_CELL, Heading, ManualLink, NAME_CELL, ROW, ScrollTable, TOTAL_CELL, VALUE_CELL } from './balaShared';

const STATUS_COLOR: Record<BalaStatus, string> = { weak: STATUS_COLORS.critical, ok: STATUS_COLORS.warning, strong: STATUS_COLORS.good };
const STATUS_TEXT: Record<BalaStatus, string> = { weak: 'text-red-600 dark:text-red-400', ok: 'text-amber-600 dark:text-amber-400', strong: 'text-emerald-600 dark:text-emerald-400' };
const PART_LABEL: Record<ShadbalaPart, string> = { sthana: 'Sthāna', dig: 'Dig', kala: 'Kāla', cheshta: 'Cheṣṭā', naisargika: 'Naisargika', drik: 'Dṛg' };

/** Ṣaḍbala: the strength of each graha against what it needs, how it is made of the six balas, and the table. */
export default function ShadbalaPanel({ chart, options }: { chart: ChartData; options?: BalaOptions }) {
  const t = useT();
  const rows = buildShadbalaRows(chart, options);
  const series = SHADBALA_PARTS.map((key, index) => ({ key, label: PART_LABEL[key], color: SERIES_COLORS[index] }));

  return (
    <div className="min-w-0 space-y-4">
      <HorizontalBars
        title={t('Ṣaḍbala against the required')}
        note={t('Total Ṣaḍbala as a percentage of the strength the graha needs (the line at 100 %). Under 100 % is weak, up to 120 % ok, more strong.')}
        legend={(['weak', 'ok', 'strong'] as BalaStatus[]).map(status => ({ label: `${STATUS_ICON[status]} ${t(status)}`, color: STATUS_COLOR[status] }))}
        ariaLabel={t('Ṣaḍbala against the required')}
        max={150}
        referenceAt={100}
        referenceLabel="100 %"
        formatTick={value => `${value} %`}
        rows={rows.map(row => {
          const status = shadbalaStatus(row.ratio);
          const percent = Math.round(row.ratio * 100);
          return {
            key: row.planet,
            label: `${row.planet}${row.retrograde ? ' ℞' : ''}`,
            value: percent,
            display: `${STATUS_ICON[status]} ${percent} % ${t(status)}`,
            color: STATUS_COLOR[status],
            title: row.planet,
            lines: [
              { label: t('Total'), value: `${Math.round(row.totalVirupa)} vp` },
              { label: t('Required'), value: `${row.requiredVirupa} vp` },
              { label: t('Status'), value: `${STATUS_ICON[status]} ${t(status)}` },
            ],
          };
        })}
      />

      <StackedBars
        title={t('What the Ṣaḍbala is made of')}
        note={t('The six balas in virūpa, added up to the total. Dṛg can be negative, which goes to the left of the zero.')}
        ariaLabel={t('What the Ṣaḍbala is made of')}
        series={series}
        markerLabel={t('Required strength')}
        unit=" vp"
        rows={rows.map(row => {
          const parts = shadbalaComposition(row);
          return {
            key: row.planet,
            label: `${row.planet}${row.retrograde ? ' ℞' : ''}`,
            values: parts,
            display: `${Math.round(row.totalVirupa)}`,
            title: row.planet,
            markerAt: row.requiredVirupa,
            extra: [
              { label: t('Total'), value: `${Math.round(row.totalVirupa)} vp` },
              { label: t('Required'), value: `${row.requiredVirupa} vp` },
            ],
          };
        })}
      />

      <div className="space-y-2">
        <Heading command="shadbala.beta">{t('Values in virūpa, by the Sanskrit text of BPHS 27, unless a calculation choice above says otherwise. Yuddha Bala is not included.')}</Heading>
        <ScrollTable minWidth="min-w-[1100px]" headers={[t('Planet'), 'Sthāna', 'Dig', 'Kāla', 'Cheṣṭā', 'Naisargika', 'Dṛg', 'Total vp', 'Req vp', '%', t('Status')]}>
          {rows.map(row => {
            const status = shadbalaStatus(row.ratio);
            const sthana = row.sthanaBreakdown;
            const kala = row.kalaBreakdown;
            return (
              <tr key={row.planet} className={ROW}>
                <td className={NAME_CELL}>{row.planet}{row.retrograde ? ' ℞' : ''}</td>
                <td className={VALUE_CELL} title={`Uccha ${formatScore(sthana.uccha)} + Sapt ${formatScore(sthana.saptavargaja)} + Ojhayugma ${formatScore(sthana.ojhayugma)} + Kendradi ${formatScore(sthana.kendradi)} + Drekkana ${formatScore(sthana.drekkana)} vp`}>{formatScore(sthana.total)}</td>
                <td className={VALUE_CELL}>{formatScore(row.digVirupa)}</td>
                <td className={VALUE_CELL} title={`Nat ${formatScore(kala.natonnata)} + Pksh ${formatScore(kala.paksha)} + Tri ${formatScore(kala.tribhaaga)} + Abda/Masa/Vara/Hora ${formatScore(kala.varsheshadi)} + Ayn ${formatScore(kala.ayana)} vp${kala.varsheshadiLords ? ` · Abda ${kala.varsheshadiLords.abda}, Masa ${kala.varsheshadiLords.masa}, Vara ${kala.varsheshadiLords.vara}, Hora ${kala.varsheshadiLords.hora}` : ''}`}>{formatScore(kala.total)}</td>
                <td className={VALUE_CELL}>{formatScore(row.cheshtaVirupa)}</td>
                <td className={VALUE_CELL}>{formatScore(row.naisargikaVirupa)}</td>
                <td className={VALUE_CELL}>{formatScore(row.drikVirupa)}</td>
                <td className={TOTAL_CELL}>{Math.round(row.totalVirupa)} vp</td>
                <td className={`${BODY_CELL} text-zinc-500 dark:text-zinc-400`}>{row.requiredVirupa} vp</td>
                <td className={`${BODY_CELL} font-bold text-cyan-700 dark:text-cyan-300`}>{Math.round(row.ratio * 100)}%</td>
                <td className={`${BODY_CELL} font-bold ${STATUS_TEXT[status]}`}>{STATUS_ICON[status]} {t(status)}</td>
              </tr>
            );
          })}
        </ScrollTable>
        <ManualLink label={t('How every number is calculated (manual)')} />
      </div>
    </div>
  );
}
