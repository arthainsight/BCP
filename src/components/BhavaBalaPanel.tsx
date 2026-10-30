'use client';

import type { ChartData } from '@/types';
import { buildShadbalaRows } from '@/lib/shadbala';
import type { BalaOptions } from '@/lib/balaOptions';
import { buildClassicalBhavaBala } from '@/lib/bhavaBala';
import { formatScore } from '@/lib/vargaMatrix';
import { BHAVA_OK_FROM, BHAVA_STRONG_FROM, STATUS_ICON, bhavaStrength, type BalaStatus } from '@/lib/balaView';
import { useT } from '@/lib/i18n';
import { HorizontalBars, SERIES_COLORS, STATUS_COLORS, StackedColumns } from './BalaCharts';
import { Heading, ManualLink, NAME_CELL, ROW, ScrollTable, TOTAL_CELL, VALUE_CELL } from './balaShared';

const STATUS_COLOR: Record<BalaStatus, string> = { weak: STATUS_COLORS.critical, ok: STATUS_COLORS.warning, strong: STATUS_COLORS.good };

/** Bhāva Bala: the strength of each of the twelve houses, as a column for each house and the table. */
export default function BhavaBalaPanel({ chart, options }: { chart: ChartData; options?: BalaOptions }) {
  const t = useT();
  const rows = buildClassicalBhavaBala(chart, buildShadbalaRows(chart, options), options);
  const houses = bhavaStrength(rows);
  const series = [{ key: 'total', label: t('Total'), color: SERIES_COLORS[0] }];

  return (
    <div className="min-w-0 space-y-4">
      <HorizontalBars
        title={t('Bhāva Bala of the houses against the limits')}
        note={t('Each house in one colour: its total in virūpa. The verses give no minimum strength for a house, so the limits are a reading of this application, not of the text: under 420 (7 rūpa) is weak, from 420 ok, from 480 (8 rūpa) strong.')}
        legend={(['weak', 'ok', 'strong'] as BalaStatus[]).map(status => ({ label: `${STATUS_ICON[status]} ${t(status)}`, color: STATUS_COLOR[status] }))}
        ariaLabel={t('Bhāva Bala of the houses against the limits')}
        max={600}
        referenceAt={BHAVA_OK_FROM}
        referenceLabel={String(BHAVA_OK_FROM)}
        extraReferences={[{ at: BHAVA_STRONG_FROM, label: String(BHAVA_STRONG_FROM) }]}
        rows={rows.map((row, index) => {
          const { status } = houses[index];
          const total = Math.round(row.total);
          return {
            key: String(row.house),
            label: `H${row.house} ${row.sign}`,
            value: total,
            display: `${STATUS_ICON[status]} ${total} vp ${t(status)}`,
            color: STATUS_COLOR[status],
            title: `H${row.house} · ${row.sign} · ${row.lord}`,
            lines: [
              { label: t('Total'), value: `${total} vp` },
              { label: t('Status'), value: `${STATUS_ICON[status]} ${t(status)}` },
            ],
          };
        })}
      />

      <StackedColumns
        title={t('Bhāva Bala of the houses')}
        note={t('The total strength of each house in virūpa, the number over the column. What each total is made of is in the table below.')}
        ariaLabel={t('Bhāva Bala of the houses')}
        series={series}
        rows={rows.map(row => ({
          key: String(row.house),
          label: `H${row.house}`,
          values: { total: row.total },
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
