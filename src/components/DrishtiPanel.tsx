'use client';

import { buildDrishti } from '@/lib/drishti';

export default function DrishtiPanel({ chart }: any) {
  if (!chart) return null;

  const { graha, rashi, houses } = buildDrishti(chart);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-mono text-zinc-500">&gt; graha.drishti</div>
        <div className="overflow-x-auto border rounded">
          <table className="text-xs font-mono min-w-[600px]">
            <thead>
              <tr>
                <th>Planet</th>
                <th>From</th>
                <th>Aspects</th>
              </tr>
            </thead>
            <tbody>
              {graha.map((row) => (
                <tr key={row.planet}>
                  <td>{row.planet}</td>
                  <td>H{row.fromHouse}</td>
                  <td>{row.labels.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-xs font-mono text-zinc-500">&gt; rashi.drishti</div>
        <div className="overflow-x-auto border rounded">
          <table className="text-xs font-mono min-w-[600px]">
            <thead>
              <tr>
                <th>Sign</th>
                <th>Aspects</th>
              </tr>
            </thead>
            <tbody>
              {rashi.map((row) => (
                <tr key={row.sign}>
                  <td>{row.signLabel}</td>
                  <td>{row.labels.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-xs font-mono text-zinc-500">&gt; drishti.house.summary</div>
        <div className="overflow-x-auto border rounded">
          <table className="text-xs font-mono min-w-[600px]">
            <thead>
              <tr>
                <th>House</th>
                <th>Graha</th>
                <th>Rashi</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {houses.map((row) => (
                <tr key={row.house}>
                  <td>H{row.house}</td>
                  <td>{row.graha.join(', ')}</td>
                  <td>{row.rashi.join(', ')}</td>
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
