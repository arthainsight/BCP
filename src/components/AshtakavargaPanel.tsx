'use client';

import { buildAshtakavarga } from '@/lib/ashtakavarga';

export default function AshtakavargaPanel({ chart }: any) {
  if (!chart) return null;

  const { bav, sav } = buildAshtakavarga(chart);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-mono text-zinc-500">&gt; ashtakavarga.bav</div>
        <div className="overflow-x-auto border rounded">
          <table className="text-xs font-mono min-w-[720px]">
            <thead>
              <tr>
                <th>Planet</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i}>H{i + 1}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {bav.map((row) => (
                <tr key={row.planet}>
                  <td>{row.planet}</td>
                  {row.houses.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                  <td>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="text-xs font-mono text-zinc-500">&gt; ashtakavarga.sav</div>
        <div className="overflow-x-auto border rounded">
          <table className="text-xs font-mono min-w-[720px]">
            <thead>
              <tr>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i}>H{i + 1}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {sav.houses.map((v, i) => (
                  <td key={i}>{v}</td>
                ))}
                <td>{sav.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
