'use client';

import type { ChartData } from '@/types';
import { buildShadbalaRows } from '@/lib/shadbala';
import { buildClassicalBhavaBala } from '@/lib/bhavaBala';
import { formatScore } from '@/lib/vargaMatrix';
import { BHAVA_PARTS, bhavaComposition, type BhavaPart } from '@/lib/balaView';
import { useT } from '@/lib/i18n';
import { SERIES_COLORS, StackedColumns } from './BalaCharts';
import { Heading, NAME_CELL, ROW, ScrollTable, TOTAL_CELL, VALUE_CELL } from './balaShared';

const PART_LABEL: Record<BhavaPart, string> = { bhavesha: 'Bhavesha', drigBenefic: 'Drig+', drigMalefic: 'Drig−', occupants: 'Occupants', kendra: 'Kendra' };

/** Bhāva Bala: the strength of each of the twelve houses, as a column for each house and the table. */
export default function BhavaBalaPanel({ chart }: { chart: ChartData }) {
  const t = useT();
  const rows = buildClassicalBhavaBala(chart, buildShadbalaRows(chart));
  const series = BHAVA_PARTS.map((key, index) => ({ key, label: key === 'occupants' ? t('Occupants') : PART_LABEL[key], color: SERIES_COLORS[index] }));

  return (
    <div className="min-w-0 space-y-4">
      <StackedColumns
        title={t('Bhāva Bala of the houses')}
        note={t("The strength of each house in virūpa: its lord's Ṣaḍbala, the aspects of benefics (Drig+) and malefics (Drig−, below the zero), the grahas in it and its place (Kendra). The number over a column is the total.")}
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
        <Heading command="bhava.bala.beta">{t("Bhavesha = lord's Ṣaḍbala (virupa). Drig = simplified drishti to sign midpoint. Kendra = +15 virupa (H1/4/7/10). Bhava Digbala and Kala Bala not yet included.")}</Heading>
        <ScrollTable minWidth="min-w-[720px]" headers={[t('House'), t('Sign'), t('Lord'), 'Bhavesha', 'Drig+', 'Drig−', t('Occupants'), 'Kendra', t('Total')]}>
          {rows.map(row => (
            <tr key={row.house} className={ROW}>
              <td className={NAME_CELL}>H{row.house}</td>
              <td className={VALUE_CELL}>{row.sign}</td>
              <td className={VALUE_CELL}>{row.lord}</td>
              <td className={VALUE_CELL}>{formatScore(row.bhavesha)}</td>
              <td className={VALUE_CELL}>{formatScore(row.drig1 + row.drig2)}</td>
              <td className={VALUE_CELL}>{formatScore(row.drig3 + row.drig4)}</td>
              <td className={VALUE_CELL}>{formatScore(row.occupantTotal)}</td>
              <td className={VALUE_CELL}>{formatScore(row.kendra)}</td>
              <td className={TOTAL_CELL}>{formatScore(row.total)}</td>
            </tr>
          ))}
        </ScrollTable>
      </div>
    </div>
  );
}
