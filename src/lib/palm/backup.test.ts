import assert from 'node:assert/strict';
import { backupToPalms, blobToDataUrl, dataUrlToBlob, palmsToBackup } from './backup';
import { createBcpBackup, parseBcpBackup } from '../localBackup';
import type { PalmRecord } from './storage';

async function main() {
  const empty = { length: 0, key: () => null, getItem: () => null };

  // A picture goes into a data URL and comes back byte for byte, including bigger than one chunk.
  const bytes = Uint8Array.from({ length: 70_000 }, (_, index) => (index * 7) % 256);
  const url = await blobToDataUrl(new Blob([bytes], { type: 'image/jpeg' }));
  assert.match(url, /^data:image\/jpeg;base64,/);
  const back = dataUrlToBlob(url)!;
  assert.equal(back.type, 'image/jpeg');
  assert.deepEqual(new Uint8Array(await back.arrayBuffer()), bytes);
  assert.equal(dataUrlToBlob('not a data url'), null);
  assert.equal(dataUrlToBlob('data:image/png;base64,@@@'), null, 'what is not base64 is refused');

  // A palm goes through a backup file and comes out as it went in, with its drawing and its scale.
  const record: PalmRecord = {
    id: 'p1', name: 'Maria, right hand', side: 'right', createdAt: 100, updatedAt: 200, width: 600, height: 800,
    image: new Blob([bytes.subarray(0, 100)], { type: 'image/jpeg' }),
    annotations: [{ id: 'a', kind: 'pin', color: '#ef4444', width: 4, at: { x: 5, y: 6 }, note: 'Fate' }],
    scale: 12.5,
  };
  const palms = await palmsToBackup([record]);
  const file = JSON.stringify(createBcpBackup(empty, palms));
  const parsed = parseBcpBackup(file);
  assert.equal(parsed.palms?.length, 1, 'a backup of photographs alone is not empty');
  const restored = backupToPalms(parsed.palms!);
  assert.equal(restored.length, 1);
  assert.deepEqual({ ...restored[0], image: undefined }, { ...record, image: undefined });
  assert.deepEqual(new Uint8Array(await restored[0].image.arrayBuffer()), bytes.subarray(0, 100));

  // A backup made without the photographs has none, so restoring it leaves the photographs alone.
  assert.equal(parseBcpBackup(JSON.stringify({ ...createBcpBackup({ length: 1, key: () => 'dashaSettings', getItem: () => '{}' }), createdAt: 'x' })).palms, undefined);

  // Palms that are not well formed are dropped; the rest stay.
  const messy = parseBcpBackup(JSON.stringify({
    format: 'bhrigu-code-backup', version: 1, createdAt: 'x', entries: { dashaSettings: '{}' },
    palms: [
      palms[0],
      { ...palms[0], id: '' },
      { ...palms[0], image: 'https://example.com/palm.jpg' },
      { ...palms[0], width: 0 },
      { ...palms[0], id: 'p2', side: 'upside-down', annotations: 'nonsense' },
      null,
    ],
  }));
  assert.deepEqual(messy.palms?.map(palm => palm.id), ['p1', 'p2']);
  assert.equal(messy.palms?.[1].side, 'other');
  assert.deepEqual(messy.palms?.[1].annotations, []);
  // A picture that cannot be read is left out of what is restored.
  assert.equal(backupToPalms([{ ...palms[0], image: 'data:image/png;base64,@@@' }]).length, 0);
  assert.throws(() => parseBcpBackup(JSON.stringify({ format: 'bhrigu-code-backup', version: 1, entries: {}, palms: [] })), 'nothing at all is empty');


  console.log('Palm backup tests passed');
}

main().catch(error => { console.error(error); process.exit(1); });
