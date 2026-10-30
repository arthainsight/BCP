'use client';

import type { ChartData } from '@/types';
import { buildShadbalaRows } from '@/lib/shadbala';
import type { BalaOptions } from '@/lib/balaOptions';
import { buildClassicalBhavaBala } from '@/lib/bhavaBala';
import { formatScore } from '@/lib/vargaMatrix';
import { BHAVA_PARTS, STATUS_ICON, bhavaAgainstAverage, bhavaComposition, type BalaStatus, type BhavaPart } from '@/lib/balaView';
import { useT } from '@/lib/i18n';
import { HorizontalBars, SERIES_COLORS, STATUS_COLORS, StackedColumns } from './BalaCharts';
import { Heading, ManualLink, NAME_CELL, ROW, ScrollTable, TOTAL_CELL, VALUE_CELL } from './balaShared';

const STATUS_COLOR: Record<BalaStatus, string> = { weak: STATUS_COLORS.critical, ok: STATUS_COLORS.warning, strong: STATUS_COLORS.good };
const PART_LABEL: Record<BhavaPart, string> = { bhavesha: 'Bhavesha', dig: 'Dig', drigBenefic: 'Drig+', drigMalefic: 'Drig−', occupants: 'Occupants', kala: 'Kāla' };

/** Bhāva Bala: the strength of each of the twelve houses, as a column for each house and the table. */
export default function BhavaBalaPanel({ chart, options }: { chart: ChartData; options?: BalaOptions }) {
  const t = useT();
  const rows = buildClassicalBhavaBala(chart, buildShadbalaRows(chart, options), options);
  const { average, houses } = bhavaAgainstAverage(rows);
  const series = BHAVA_PARTS.map((key, index) => ({ key, label: key === 'occupants' ? t('Occupants') : PART_LABEL[key], color: SERIES_COLORS[index] }));

  return (
    <div className="min-w-0 space-y-4">
      <HorizontalBars
        title={t('Bhāva Bala against the average')}
        note={t('Each house in one colour: its total as a percentage of the average of the twelve houses of this chart (the line at 100 %). The verses give no minimum strength for a house, so this is the chart against itself: under 90 % is weak, from 110 % strong, and between ok.')}
        legend={(['weak', 'ok', 'strong'] as BalaStatus[]).map(status => ({ label: `${STATUS_ICON[status]} ${t(status)}`, color: STATUS_COLOR[status] }))}
        ariaLabel={t('Bhāva Bala against the average')}
        max={150}
        referenceAt={100}
        referenceLabel="100 %"
        formatTick={value => `${value} %`}
        rows={rows.map((row, index) => {
          const { ratio, status } = houses[index];
          const percent = Math.round(ratio * 100);
          return {
            key: String(row.house),
            label: `H${row.house} ${row.sign}`,
            value: percent,
            display: `${STATUS_ICON[status]} ${percent} % ${t(status)}`,
            color: STATUS_COLOR[status],
            title: `H${row.house} · ${row.sign} · ${row.lord}`,
            lines: [
              { label: t('Total'), value: `${Math.round(row.total)} vp` },
              { label: t('Average'), value: `${Math.round(average)} vp` },
              { label: t('Status'), value: `${STATUS_ICON[status]} ${t(status)}` },
            ],
          };
        })}
      />

      <StackedColumns
        title={t('What the Bhāva Bala of the houses is made of')}
        note={t("The strength of each house in virūpa: its lord's Ṣaḍbala, its Dig Bala, the aspects of benefics (Drig+) and malefics (Drig−, below the zero), the grahas in it and its Kāla Bala. The number over a column is the total.")}
        ariaLabel={t('Bhāva Bala of the houses')}
        series={series}
        rows={rows.map(row => ({
          key: String(row.house),
          label: `H${row.house}`,
          values: bhavaComposition(row),
          total: row.total,
          title: `H${row.house} · ${row.sign} · ${row.lord}`,
        }))}
      />

      <div className="space-y-2">
        <Heading command="bhava.bala.beta">{t("Values in virūpa, by BPHS 27.26–31. Bhavesha = the lord's Ṣaḍbala. Dig = the distance of the middle of the house from the angle where it is powerless, divided by three. Drig = the aspects on the middle of the house. Occupants: Mercury and Jupiter +60, Saturn, Mars and the Sun −60. Kāla: +15 for the way the sign rises at the time of birth. The houses and the other choices are set above.")}</Heading>
        <ScrollTable minWidth="min-w-[760px]" headers={[t('House'), t('Sign'), t('Lord'), 'Bhavesha', 'Dig', 'Drig+', 'Drig−', t('Occupants'), 'Kāla', t('Total')]}>
          {rows.map(row => (
            <tr key={row.house} className={ROW}>
              <td className={NAME_CELL}>H{row.house}</td>
              <td className={VALUE_CELL}>{row.sign}</td>
              <td className={VALUE_CELL}>{row.lord}</td>
              <td className={VALUE_CELL}>{formatScore(row.bhavesha)}</td>
              <td className={VALUE_CELL} title={row.digPoint ? `Dig from the ${row.digPoint === 'asc' ? 'Ascendant' : row.digPoint === 'desc' ? 'Descendant' : row.digPoint === 'mc' ? 'Midheaven' : 'Nadir'}` : undefined}>{formatScore(row.dig)}</td>
              <td className={VALUE_CELL}>{formatScore(row.drigBenefic)}</td>
              <td className={VALUE_CELL}>{formatScore(row.drigMalefic)}</td>
              <td className={VALUE_CELL} title={row.occupants.map(occupant => `${occupant.name} ${occupant.contribution}`).join(', ') || undefined}>{formatScore(row.occupantTotal)}</td>
              <td className={VALUE_CELL} title={row.kalaNote}>{formatScore(row.kala)}</td>
              <td className={TOTAL_CELL}>{formatScore(row.total)}</td>
            </tr>
          ))}
        </ScrollTable>
        <ManualLink label={t('How every number is calculated (manual)')} />
      </div>
    </div>
  );
}
