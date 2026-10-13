'use client';

import { useState } from 'react';
import { createBcpBackup, parseBcpBackup, restoreBcpBackup, type BcpBackup } from '@/lib/localBackup';
import { backupToPalms, palmsToBackup } from '@/lib/palm/backup';
import { listPalms, replacePalms, storageAvailable } from '@/lib/palm/storage';
import { fill, useT } from '@/lib/i18n';
import { saveFile } from '@/lib/download';

/** Palm photographs make a backup large; this is the most the panel will read back. */
const MAX_BACKUP_BYTES = 150_000_000;

function download(content: string) {
  saveFile(`bhrigu-code-backup-${new Date().toISOString().slice(0, 10)}.json`, content, 'application/json');
}

export default function BackupPanel() {
  const t = useT();
  const [preview, setPreview] = useState<BcpBackup | null>(null);
  const [message, setMessage] = useState('');
  const [withPalms, setWithPalms] = useState(true);
  const [busy, setBusy] = useState(false);

  async function exportAll() {
    setBusy(true);
    try {
      const palms = withPalms && storageAvailable() ? await palmsToBackup(await listPalms()) : undefined;
      const backup = createBcpBackup(localStorage, palms);
      // Pictures are long lines anyway: a backup with photographs is not indented.
      download(JSON.stringify(backup, null, palms?.length ? 0 : 2));
      setMessage(fill(t(palms?.length ? 'Backed up {records} local data records and {palms} palm photographs.' : 'Backed up {records} local data records.'), { records: Object.keys(backup.entries).length, palms: palms?.length ?? 0 }));
    } catch {
      setMessage(t('The backup could not be made.'));
    } finally {
      setBusy(false);
    }
  }

  async function read(file?: File) {
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) return setMessage(t('Backup exceeds the 150 MB limit.'));
    try {
      setPreview(parseBcpBackup(await file.text()));
      setMessage('');
    } catch {
      setPreview(null);
      setMessage(t('Invalid or unsupported BCP backup.'));
    }
  }

  async function restore() {
    if (!preview) return;
    setBusy(true);
    try {
      // The photographs go first, in one step: if they cannot be kept, nothing has changed.
      if (preview.palms && storageAvailable()) await replacePalms(backupToPalms(preview.palms));
    } catch {
      setBusy(false);
      setMessage(t('The palm photographs could not be restored, so nothing was changed.'));
      return;
    }
    const count = restoreBcpBackup(preview, localStorage);
    setBusy(false);
    setMessage(fill(t('Restored {records} records. Reloading…'), { records: count }));
    setPreview(null);
    window.setTimeout(() => window.location.reload(), 400);
  }

  const palmCount = preview?.palms?.length ?? 0;

  return (
    <div className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
      <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">{t('Full local backup')}</div>
      <p className="text-[10px] text-zinc-500">{t('Includes saved charts, all Event Lists, calculation and display settings, Dasha methods and, if you like, the palm photographs with their drawings.')}</p>
      <label className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-300">
        <input type="checkbox" checked={withPalms} onChange={event => setWithPalms(event.target.checked)} />
        {t('include the palm photographs')}
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void exportAll()} className="rounded border border-emerald-400 px-2 py-1.5 text-xs text-emerald-700 disabled:opacity-50 dark:text-emerald-300">
          {t('Download backup')}
        </button>
        <label className="cursor-pointer rounded border border-cyan-400 px-2 py-1.5 text-xs text-cyan-700 dark:text-cyan-300">
          {t('Choose backup')}
          <input type="file" accept=".json,application/json" className="hidden" onChange={event => { void read(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
      </div>
      {preview && (
        <div className="rounded border border-amber-300 bg-amber-50 p-2 text-[10px] dark:border-amber-800 dark:bg-amber-950/20">
          <p>
            <strong>{Object.keys(preview.entries).length}</strong> {t('records')}
            {preview.palms ? <> · <strong>{palmCount}</strong> {t('palm photographs')}</> : null} · {t('created')} {preview.createdAt || t('unknown')}.{' '}
            {t('Restoring replaces all current BCP local data on this device.')}
            {preview.palms ? ` ${t('The palm photographs on this device are replaced too.')}` : ''}
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setPreview(null)} className="rounded border px-2 py-1">{t('Cancel')}</button>
            <button type="button" disabled={busy} onClick={() => void restore()} className="rounded bg-amber-700 px-2 py-1 font-semibold text-white disabled:opacity-50">{t('Replace and restore')}</button>
          </div>
        </div>
      )}
      {message && <p className="text-[10px] text-zinc-500">{message}</p>}
    </div>
  );
}
