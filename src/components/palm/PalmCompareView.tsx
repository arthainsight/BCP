'use client';

import { useState } from 'react';
import { pairFor } from '@/lib/palm/compare';
import type { PalmRecord } from '@/lib/palm/storage';
import type { LinkedView } from '@/lib/palm/viewport';
import { useT } from '@/lib/i18n';
import PalmCanvas from './PalmCanvas';
import { useObjectUrl } from './useObjectUrl';
import { useOverlay } from '@/hooks/useOverlay';

type Props = {
  records: PalmRecord[];
  /** The photograph that is open, which is shown on the left. */
  firstId: string;
  onClose: () => void;
};

function Side({ record, records, label, onPick, linked, onViewChange }: {
  record: PalmRecord;
  records: PalmRecord[];
  label: string;
  onPick: (id: string) => void;
  linked: LinkedView | null | undefined;
  onViewChange: ((view: LinkedView) => void) | undefined;
}) {
  const t = useT();
  const imageUrl = useObjectUrl(record.image);
  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-1" data-palm-side={label}>
      <div className="flex items-center gap-2">
        <select
          value={record.id}
          onChange={event => onPick(event.target.value)}
          aria-label={label}
          className="min-w-0 flex-1 rounded-md border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100"
        >
          {records.map(option => (
            <option key={option.id} value={option.id}>
              {option.name} · {t(option.side === 'right' ? 'Right hand' : option.side === 'left' ? 'Left hand' : 'Other')}
            </option>
          ))}
        </select>
      </div>
      <div className="min-h-0 flex-1">
        {imageUrl && (
          <PalmCanvas
            key={record.id}
            imageUrl={imageUrl}
            width={record.width}
            height={record.height}
            annotations={record.annotations}
            tool="view"
            color="#ef4444"
            strokeUnits={4}
            selectedId={null}
            readOnly
            scale={record.scale}
            linkedView={linked}
            onViewChange={onViewChange}
            onSelect={() => {}}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Two palm photographs side by side, with their drawings, to compare the hands. The zoom and the place are shared
 * by default: move or zoom one and the other goes to the same place at the same zoom.
 */
export default function PalmCompareView({ records, firstId, onClose }: Props) {
  const t = useT();
  const [leftId, setLeftId] = useState(firstId);
  const [rightId, setRightId] = useState(() => pairFor(records, firstId));
  const [link, setLink] = useState(true);
  const [view, setView] = useState<LinkedView | null>(null);
  const left = records.find(record => record.id === leftId) ?? records[0];
  const right = records.find(record => record.id === rightId) ?? records[records.length - 1];

  useOverlay(onClose);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-zinc-950 text-zinc-100" role="dialog" aria-modal="true" aria-label={t('Compare palms')} data-palm="compare">
      <div className="flex flex-wrap items-center gap-3 px-3 py-2">
        <div className="min-w-0 flex-1 truncate text-sm font-mono">{t('Compare palms')}</div>
        <label className="flex items-center gap-1.5 text-xs font-mono">
          <input type="checkbox" checked={link} onChange={event => setLink(event.target.checked)} />
          {t('link the zoom')}
        </label>
        <button type="button" onClick={onClose} aria-label={t('Close')} className="min-h-9 rounded-md border border-zinc-500 bg-zinc-800 px-3 text-sm">✕</button>
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-2 gap-2 px-3 pb-3 md:grid-cols-2 md:grid-rows-1">
        <Side record={left} records={records} label={t('photograph on the left')} onPick={setLeftId} linked={link ? view : undefined} onViewChange={link ? setView : undefined} />
        <Side record={right} records={records} label={t('photograph on the right')} onPick={setRightId} linked={link ? view : undefined} onViewChange={link ? setView : undefined} />
      </div>
    </div>
  );
}
