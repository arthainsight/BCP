'use client';

import { BcpResult } from '@/types';
import { HOUSE_NAMES, HOUSE_MEANINGS } from '@/lib/houseData';

interface Props {
  bcp: BcpResult;
}

export default function BcpSummary({ bcp }: Props) {
  const yearHouseMeaning = HOUSE_MEANINGS[bcp.activeYearHouse] || '';
  const monthHouseMeaning = HOUSE_MEANINGS[bcp.activeMonthHouse] || '';

  return (
    <div className="w-full max-w-lg mx-auto space-y-3 text-sm">
      <h3 className="font-semibold text-lg">BCP Calculation Summary</h3>

      <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Completed Age:</div>
          <div>{bcp.completedAge} years</div>

          <div className="font-medium">Running Year of Life:</div>
          <div>{bcp.runningYear}</div>

          <div className="font-medium">BCP Cycle:</div>
          <div>Cycle {bcp.bcpCycle}</div>

          <div className="font-medium">Active Year House:</div>
          <div>
            <span className="font-semibold">House {bcp.activeYearHouse}</span>
            {' '}({HOUSE_NAMES[bcp.activeYearHouse]})
          </div>

          <div className="font-medium">Month in Running Year:</div>
          <div>Month {bcp.monthInRunningYear}</div>

          <div className="font-medium">Active Month House:</div>
          <div>
            <span className="font-semibold">House {bcp.activeMonthHouse}</span>
            {' '}({HOUSE_NAMES[bcp.activeMonthHouse]})
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <h4 className="font-medium">Year House Interpretation</h4>
        <p className="text-gray-700">
          House {bcp.activeYearHouse} ({HOUSE_NAMES[bcp.activeYearHouse]}) is active for this year.
          Focus areas: {yearHouseMeaning}.
        </p>
        {bcp.activeYearHouse === bcp.activeMonthHouse ? (
          <div className="mt-2 p-2 bg-purple-100 border border-purple-300 rounded">
            <span className="font-medium">Combined Year + Month:</span> The energy of House {bcp.activeYearHouse} is
            doubly emphasized this month. {yearHouseMeaning} matters are strongly activated.
          </div>
        ) : (
          <p className="text-gray-700 mt-1">
            This month, House {bcp.activeMonthHouse} ({HOUSE_NAMES[bcp.activeMonthHouse]}) is additionally active.
            Focus areas: {monthHouseMeaning}.
          </p>
        )}
      </div>
    </div>
  );
}
