import { sanitizeAnnotations, type Annotation } from './palm/annotations';

/** A palm photograph in a backup: the picture is a data URL, so the whole backup is one file. */
export interface BackupPalm {
  id: string;
  name: string;
  side: 'left' | 'right' | 'other';
  createdAt: number;
  updatedAt: number;
  width: number;
  height: number;
  annotations: Annotation[];
  /** Pixels per centimetre, when the photograph has been given a scale. */
  scale?: number;
  image: string;
}

/** `palms` is left out of a backup made without the photographs; restoring such a backup leaves the photographs alone. */
export interface BcpBackup { format: 'bhrigu-code-backup'; version: 1; createdAt: string; entries: Record<string, string>; palms?: BackupPalm[]; }

const KNOWN_KEYS = new Set(['chartDisplaySettings', 'calculationSettings', 'dashaSettings', 'bcp_saved_charts', 'bcp_active_chart']);
export function isBcpStorageKey(key: string): boolean { return KNOWN_KEYS.has(key) || key.startsWith('bhrigu:') || key.startsWith('bcp_'); }
export function createBcpBackup(storage: Pick<Storage, 'length' | 'key' | 'getItem'>, palms?: BackupPalm[]): BcpBackup {
  const entries: Record<string, string> = {};
  for (let index = 0; index < storage.length; index++) { const key = storage.key(index); if (key && isBcpStorageKey(key)) { const value = storage.getItem(key); if (value != null) entries[key] = value; } }
  return { format: 'bhrigu-code-backup', version: 1, createdAt: new Date().toISOString(), entries, ...(palms ? { palms } : {}) };
}
export function parseBcpBackup(text: string): BcpBackup {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid backup');
  const item = parsed as Partial<BcpBackup>;
  if (item.format !== 'bhrigu-code-backup' || item.version !== 1 || !item.entries || typeof item.entries !== 'object') throw new Error('Unsupported backup');
  const entries = Object.fromEntries(Object.entries(item.entries).filter(([key, value]) => isBcpStorageKey(key) && typeof value === 'string'));
  const palms = Array.isArray(item.palms) ? item.palms.map(parsePalm).filter((palm): palm is BackupPalm => palm !== null) : undefined;
  if (!Object.keys(entries).length && !palms?.length) throw new Error('Empty backup');
  return { format: item.format, version: 1, createdAt: String(item.createdAt ?? ''), entries, ...(palms ? { palms } : {}) };
}

const SIDES = ['left', 'right', 'other'];
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

/** A palm of a backup file, or null when it is not well formed. */
function parsePalm(raw: unknown): BackupPalm | null {
  if (!raw || typeof raw !== 'object') return null;
  const palm = raw as Record<string, unknown>;
  if (typeof palm.id !== 'string' || !palm.id || typeof palm.image !== 'string' || !palm.image.startsWith('data:image/')) return null;
  if (!positive(palm.width) || !positive(palm.height)) return null;
  const now = Date.now();
  return {
    id: palm.id,
    name: typeof palm.name === 'string' ? palm.name : '',
    side: SIDES.includes(palm.side as string) ? (palm.side as BackupPalm['side']) : 'other',
    createdAt: typeof palm.createdAt === 'number' && Number.isFinite(palm.createdAt) ? palm.createdAt : now,
    updatedAt: typeof palm.updatedAt === 'number' && Number.isFinite(palm.updatedAt) ? palm.updatedAt : now,
    width: palm.width,
    height: palm.height,
    annotations: sanitizeAnnotations(palm.annotations),
    ...(positive(palm.scale) ? { scale: palm.scale } : {}),
    image: palm.image,
  };
}
export function restoreBcpBackup(backup: BcpBackup, storage: Pick<Storage, 'length' | 'key' | 'removeItem' | 'setItem'>): number {
  const current: string[] = []; for (let index = 0; index < storage.length; index++) { const key = storage.key(index); if (key && isBcpStorageKey(key)) current.push(key); }
  current.forEach(key => storage.removeItem(key)); Object.entries(backup.entries).forEach(([key, value]) => storage.setItem(key, value)); return Object.keys(backup.entries).length;
}
