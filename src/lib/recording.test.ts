import assert from 'node:assert/strict';
import { RECORDING_MIME_TYPES, formatClock, formatSize, pickMimeType, recordingExtension, recordingFileName } from './recording';

// --- The format the browser can make --------------------------------------------------
assert.equal(pickMimeType(() => true), 'video/webm;codecs=vp9,opus', 'the best one when all work');
assert.equal(pickMimeType(mime => !mime.includes('vp9')), 'video/webm;codecs=vp8,opus', 'VP8 when VP9 does not');
assert.equal(pickMimeType(mime => mime === 'video/mp4'), 'video/mp4', 'MP4 in a browser that makes nothing else (Safari)');
assert.equal(pickMimeType(() => false), null, 'none when the browser can record none of them');
assert.ok(RECORDING_MIME_TYPES.length >= 3);

// --- The file --------------------------------------------------------------------------------
assert.equal(recordingExtension('video/webm;codecs=vp9,opus'), 'webm');
assert.equal(recordingExtension('video/mp4'), 'mp4');
assert.equal(recordingExtension('VIDEO/MP4;codecs=avc1'), 'mp4');
assert.equal(recordingExtension(''), 'webm', 'webm when the browser does not say');
assert.equal(recordingFileName(new Date(2026, 9, 9, 14, 5), 'video/webm'), 'bhrigu-code-2026-10-09-1405.webm', 'the local time, padded');
assert.equal(recordingFileName(new Date(2026, 0, 2, 3, 4), 'video/mp4'), 'bhrigu-code-2026-01-02-0304.mp4');

// --- The running time and the size ------------------------------------------------------------
assert.equal(formatClock(0), '0:00');
assert.equal(formatClock(999), '0:00', 'whole seconds');
assert.equal(formatClock(65_000), '1:05');
assert.equal(formatClock(3_599_000), '59:59');
assert.equal(formatClock(3_661_000), '1:01:01', 'hours from an hour');
assert.equal(formatClock(-5), '0:00');
assert.equal(formatSize(10), '1 kB');
assert.equal(formatSize(640 * 1024), '640 kB');
assert.equal(formatSize(8.3 * 1024 * 1024), '8.3 MB');

console.log('Recording tests passed');
