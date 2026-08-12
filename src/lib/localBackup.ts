export interface BcpBackup { format: 'bhrigu-code-backup'; version: 1; createdAt: string; entries: Record<string, string>; }

const KNOWN_KEYS = new Set(['chartDisplaySettings', 'calculationSettings', 'dashaSettings', 'uiMode', 'workspace_panels', 'bcp_saved_charts', 'bcp_active_chart']);
export function isBcpStorageKey(key: string): boolean { return KNOWN_KEYS.has(key) || key.startsWith('bhrigu:') || key.startsWith('bcp_'); }
export function createBcpBackup(storage: Pick<Storage, 'length' | 'key' | 'getItem'>): BcpBackup {
  const entries: Record<string, string> = {};
  for (let index = 0; index < storage.length; index++) { const key = storage.key(index); if (key && isBcpStorageKey(key)) { const value = storage.getItem(key); if (value != null) entries[key] = value; } }
  return { format: 'bhrigu-code-backup', version: 1, createdAt: new Date().toISOString(), entries };
}
export function parseBcpBackup(text: string): BcpBackup {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup');
  const item = parsed as Partial<BcpBackup>;
  if (item.format !== 'bhrigu-code-backup' || item.version !== 1 || !item.entries || typeof item.entries !== 'object') throw new Error('Unsupported backup');
  const entries = Object.fromEntries(Object.entries(item.entries).filter(([key, value]) => isBcpStorageKey(key) && typeof value === 'string'));
  if (!Object.keys(entries).length) throw new Error('Empty backup');
  return { format: item.format, version: 1, createdAt: String(item.createdAt ?? ''), entries };
}
export function restoreBcpBackup(backup: BcpBackup, storage: Pick<Storage, 'length' | 'key' | 'removeItem' | 'setItem'>): number {
  const current: string[] = []; for (let index = 0; index < storage.length; index++) { const key = storage.key(index); if (key && isBcpStorageKey(key)) current.push(key); }
  current.forEach(key => storage.removeItem(key)); Object.entries(backup.entries).forEach(([key, value]) => storage.setItem(key, value)); return Object.keys(backup.entries).length;
}
