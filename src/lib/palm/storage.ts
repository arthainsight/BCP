import { sanitizeAnnotations, type Annotation } from './annotations';

// The palm photographs and what is drawn on them, kept in the browser's
// IndexedDB. Nothing is sent to a server: a client's palm stays on this device.

export type PalmSide = 'left' | 'right' | 'other';

export interface PalmRecord {
  id: string;
  /** Whose palm, or what the photo shows. */
  name: string;
  side: PalmSide;
  createdAt: number;
  updatedAt: number;
  /** The photo (JPEG) and its size in pixels. */
  image: Blob;
  width: number;
  height: number;
  annotations: Annotation[];
}

const DB_NAME = 'bcp-palm';
const STORE = 'palms';

export function storageAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(db => new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = work(transaction.objectStore(STORE));
    transaction.oncomplete = () => { db.close(); resolve(request.result); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
    transaction.onabort = () => { db.close(); reject(transaction.error); };
  }));
}

/** All saved palms, the most recently changed first. */
export async function listPalms(): Promise<PalmRecord[]> {
  const records = await run<PalmRecord[]>('readonly', store => store.getAll());
  return records
    .filter(record => record.image instanceof Blob)
    .map(record => ({ ...record, annotations: sanitizeAnnotations(record.annotations) }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function putPalm(record: PalmRecord): Promise<void> {
  await run('readwrite', store => store.put(record));
}

export async function deletePalm(id: string): Promise<void> {
  await run('readwrite', store => store.delete(id));
}
