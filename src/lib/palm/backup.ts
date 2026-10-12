import type { BackupPalm } from '../localBackup';
import type { PalmRecord } from './storage';

// Palm photographs in a backup file: the picture as a data URL, the rest as it is kept.

const CHUNK = 0x8000;

/** A blob as a data URL (base64). */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += CHUNK) binary += String.fromCharCode(...bytes.subarray(index, index + CHUNK));
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

/** A base64 data URL as a blob, or null when it is not one. */
export function dataUrlToBlob(url: string): Blob | null {
  const match = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]*)$/.exec(url);
  if (!match) return null;
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: match[1] });
  } catch {
    return null;
  }
}

export async function palmsToBackup(records: PalmRecord[]): Promise<BackupPalm[]> {
  return Promise.all(records.map(async record => ({
    id: record.id,
    name: record.name,
    side: record.side,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    width: record.width,
    height: record.height,
    annotations: record.annotations,
    ...(record.scale ? { scale: record.scale } : {}),
    image: await blobToDataUrl(record.image),
  })));
}

/** The palms of a backup as records; one whose picture cannot be read is left out. */
export function backupToPalms(items: BackupPalm[]): PalmRecord[] {
  const records: PalmRecord[] = [];
  for (const item of items) {
    const image = dataUrlToBlob(item.image);
    if (!image) continue;
    records.push({
      id: item.id,
      name: item.name,
      side: item.side,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      image,
      width: item.width,
      height: item.height,
      annotations: item.annotations as PalmRecord['annotations'],
      ...(item.scale ? { scale: item.scale } : {}),
    });
  }
  return records;
}
