'use client';

import type { ChartData } from '@/types';
import { buildShadbalaRows } from '@/lib/shadbala';
import { buildClassicalBhavaBala } from '@/lib/bhavaBala';
import { formatScore } from '@/lib/vargaMatrix';
import { BHAVA_PARTS, bhavaComposition, type BhavaPart } from '@/lib/balaView';
import { useT } from '@/lib/i18n';
import { SERIES_COLORS, StackedColumns } from './BalaCharts';
import { Heading, ManualLink, NAME_CELL, ROW, ScrollTable, TOTAL_CELL, VALUE_CELL } from './balaShared';

const PART_LABEL: Record<BhavaPart, string> = { bhavesha: 'Bhavesha', dig: 'Dig', drigBenefic: 'Drig+', drigMalefic: 'Drig−', occupants: 'Occupants', kala: 'Kāla' };

/** Bhāva Bala: the strength of each of the twelve houses, as a column for each house and the table. */
export default function BhavaBalaPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const rows = buildClassicalBhavaBala(chart, buildShadbalaRows(chart));
  const series = BHAVA_PARTS.map((key, index) => ({ key, label: key === 'occupants' ? t('Occupants') : PART_LABEL[key], color: SERIES_COLORS[index] }));

  return (
    <div className="min-w-0 space-y-4">
      <StackedColumns
        title={t('Bhāva Bala of the houses')}
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
        <Heading command="bhava.bala.beta">{t("Values in virūpa, by BPHS 27.26–31. Bhavesha = the lord's Ṣaḍbala. Dig = the distance of the middle of the house from the angle where it is powerless, divided by three. Drig = a quarter of the aspects, those of Mercury and Jupiter in full. Occupants: Mercury and Jupiter +60, Saturn, Mars and the Sun −60. Kāla: +15 for the way the sign rises at the time of birth. The house is the whole sign from the Lagna sign.")}</Heading>
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
