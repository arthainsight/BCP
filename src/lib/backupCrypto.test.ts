import assert from 'node:assert/strict';
import { decryptBackupText, encryptBackupText, isEncryptedBackup } from './backupCrypto';

async function main() {
  const secret = JSON.stringify({ format: 'bhrigu-code-backup', version: 1, entries: { 'bcp_charts': '[{"name":"Ä Ö 😀"}]' } });
  // A low iteration count keeps the test fast; the real default is far higher.
  const encrypted = await encryptBackupText(secret, 'salasana-ÄÖ', 1000);
  assert.ok(isEncryptedBackup(encrypted));
  assert.ok(!isEncryptedBackup(secret));
  assert.ok(!isEncryptedBackup('not json'));
  assert.ok(!encrypted.includes('Ä Ö'), 'the plain text is not in the file');
  assert.equal(await decryptBackupText(encrypted, 'salasana-ÄÖ'), secret);
  await assert.rejects(decryptBackupText(encrypted, 'wrong'));
  // A changed file is refused, not read as nonsense.
  const envelope = JSON.parse(encrypted);
  const bytes = Buffer.from(envelope.data, 'base64');
  bytes[0] ^= 1;
  await assert.rejects(decryptBackupText(JSON.stringify({ ...envelope, data: bytes.toString('base64') }), 'salasana-ÄÖ'));
  // Two encryptions of the same text differ (random salt and iv).
  assert.notEqual(await encryptBackupText(secret, 'x', 1000), await encryptBackupText(secret, 'x', 1000));
  await assert.rejects(decryptBackupText(JSON.stringify({ ...envelope, iterations: 1e12 }), 'salasana-ÄÖ'));
  // A large text (photographs make backups large) survives.
  const big = 'x'.repeat(2_000_000);
  assert.equal(await decryptBackupText(await encryptBackupText(big, 'p', 1000), 'p'), big);
  console.log('backupCrypto tests passed');
}
void main();
