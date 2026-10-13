// Dates and times as the app writes them: day first, 24-hour clock, in the local time of the Date.

export const pad2 = (value: number): string => String(value).padStart(2, '0');

/** DD.MM.YYYY, and with `withTime` DD.MM.YYYY HH:MM. */
export function formatDate(date: Date, withTime = false): string {
  const day = `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
  return withTime ? `${day} ${formatTime(date)}` : day;
}

/** HH:MM */
export const formatTime = (date: Date): string => `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

/** DD.MM.YYYY HH:MM */
export const formatDateTime = (date: Date): string => formatDate(date, true);

/** YYYY-MM-DD, as the date fields hold it. */
export const isoDate = (date: Date): string => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
