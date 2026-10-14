// A password for a backup file. The backup is encrypted in the browser with AES-GCM; the key comes from the password
// with PBKDF2 (SHA-256) and a random salt. Nothing is sent anywhere, and a lost password cannot be recovered.

export const ENCRYPTED_FORMAT = 'bhrigu-code-backup-encrypted';
const ITERATIONS = 600_000;

export interface EncryptedBackup {
  format: typeof ENCRYPTED_FORMAT;
  version: 1;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;
  iv: string;
  data: string;
}

const toBase64 = (bytes: Uint8Array) => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
};
const fromBase64 = (text: string) => Uint8Array.from(atob(text), char => char.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** True when the text is an encrypted backup (a password is needed before it can be read). */
export function isEncryptedBackup(text: string): boolean {
  try {
    return (JSON.parse(text) as { format?: unknown })?.format === ENCRYPTED_FORMAT;
  } catch {
    return false;
  }
}

export async function encryptBackupText(text: string, password: string, iterations = ITERATIONS): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, iterations);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, new TextEncoder().encode(text)));
  const envelope: EncryptedBackup = { format: ENCRYPTED_FORMAT, version: 1, kdf: 'PBKDF2-SHA256', iterations, salt: toBase64(salt), iv: toBase64(iv), data: toBase64(data) };
  return JSON.stringify(envelope);
}

/** Throws when the password is wrong or the file has been changed (AES-GCM checks both). */
export async function decryptBackupText(text: string, password: string): Promise<string> {
  const envelope = JSON.parse(text) as Partial<EncryptedBackup>;
  if (envelope.format !== ENCRYPTED_FORMAT || envelope.version !== 1 || envelope.kdf !== 'PBKDF2-SHA256') throw new Error('Unsupported encrypted backup');
  const { iterations, salt, iv, data } = envelope;
  if (typeof iterations !== 'number' || iterations < 1 || iterations > 5_000_000 || typeof salt !== 'string' || typeof iv !== 'string' || typeof data !== 'string') throw new Error('Unsupported encrypted backup');
  const key = await deriveKey(password, fromBase64(salt), iterations);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) as BufferSource }, key, fromBase64(data) as BufferSource);
  return new TextDecoder().decode(plain);
}
