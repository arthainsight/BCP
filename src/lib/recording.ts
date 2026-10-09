// Helpers of the screen recorder: which video format the browser can make, what the file is called,
// and how the running time and the size are written.

/** The formats to try, best first: WebM with VP9, then VP8, then plain WebM; Safari makes MP4. */
export const RECORDING_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
] as const;

/** The first of the formats the browser says it can record, or null when it can record none of them. */
export function pickMimeType(isSupported: (mime: string) => boolean): string | null {
  return RECORDING_MIME_TYPES.find(isSupported) ?? null;
}

/** The file extension of a recording: mp4 for MP4, otherwise webm. */
export function recordingExtension(mime: string): string {
  return mime.toLowerCase().startsWith('video/mp4') ? 'mp4' : 'webm';
}

/** For example bhrigu-code-2026-10-09-1432.webm, from the local time. */
export function recordingFileName(now: Date, mime: string): string {
  const two = (value: number) => String(value).padStart(2, '0');
  const day = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
  return `bhrigu-code-${day}-${two(now.getHours())}${two(now.getMinutes())}.${recordingExtension(mime)}`;
}

/** The running time as m:ss, or h:mm:ss from an hour. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const two = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${two(minutes)}:${two(seconds)}` : `${minutes}:${two(seconds)}`;
}

/** The size of a file: 640 kB, 8.3 MB. */
export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
