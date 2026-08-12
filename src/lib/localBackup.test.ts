import assert from 'node:assert/strict';
import { createBcpBackup, parseBcpBackup, restoreBcpBackup } from './localBackup';
class MemoryStorage { data = new Map<string, string>(); get length() { return this.data.size; } key(index: number) { return [...this.data.keys()][index] ?? null; } getItem(key: string) { return this.data.get(key) ?? null; } setItem(key: string, value: string) { this.data.set(key, value); } removeItem(key: string) { this.data.delete(key); } }
const storage = new MemoryStorage(); storage.setItem('dashaSettings', '{}'); storage.setItem('bhrigu:dasha-events:test', '[]'); storage.setItem('unrelated', 'keep');
const backup = createBcpBackup(storage as unknown as Storage); assert.equal(Object.keys(backup.entries).length, 2); assert.equal(backup.entries.unrelated, undefined);
storage.setItem('dashaSettings', 'changed'); restoreBcpBackup(parseBcpBackup(JSON.stringify(backup)), storage as unknown as Storage);
assert.equal(storage.getItem('dashaSettings'), '{}'); assert.equal(storage.getItem('unrelated'), 'keep'); assert.throws(() => parseBcpBackup('{}'));
console.log('Local backup tests passed');
