// Dates as the input fields hold them: the target date as YYYY-MM-DD and the
// transit moment as DD.MM.YYYY HH.MM.SS, both in local time.

export function getTodayString(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function getNowDateTimeString(): string {
  const d = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`;
}

export function parseTargetDateString(value: string): Date | null {
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day, 12, 0, 0);
}

export type DateStep = 'day' | 'month' | 'year';

function formatTargetDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Moves a YYYY-MM-DD target date by whole days, months or years. A month or
 * year step keeps the day of the month where it exists and otherwise stops at
 * the month's last day (31 January + 1 month = 28 or 29 February).
 */
export function shiftTargetDate(value: string, step: DateStep, amount: number): string {
  const date = parseTargetDateString(value);
  if (!date) return value;
  if (step === 'day') {
    date.setDate(date.getDate() + amount);
    return formatTargetDate(date);
  }
  const months = step === 'month' ? amount : amount * 12;
  const day = date.getDate();
  const shifted = new Date(date.getFullYear(), date.getMonth() + months, 1, 12);
  const lastDay = new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate();
  shifted.setDate(Math.min(day, lastDay));
  return formatTargetDate(shifted);
}

/** Local time of day as HH:MM, for the target moment. */
export function getNowTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Moves a target moment (YYYY-MM-DD and HH:MM) by whole hours, rolling the date over midnight. */
export function shiftTargetHours(date: string, time: string, hours: number): { date: string; time: string } {
  const parsed = parseTargetDateString(date);
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!parsed || !match) return { date, time };
  // Count in minutes from the date's midnight so a daylight-saving change does not shift the clock.
  const total = Number(match[1]) * 60 + Number(match[2]) + hours * 60;
  const days = Math.floor(total / 1440);
  const minutes = ((total % 1440) + 1440) % 1440;
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    date: days === 0 ? date : shiftTargetDate(date, 'day', days),
    time: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
  };
}

/** The transit moment string (DD.MM.YYYY HH.MM.SS) for a target date and time. */
export function targetMomentToTransit(date: string, time: string): string {
  const [year, month, day] = date.split('-');
  const [hour = '12', minute = '00'] = time.split(':');
  if (!year || !month || !day) return '';
  return `${day}.${month}.${year} ${hour.padStart(2, '0')}.${minute.padStart(2, '0')}.00`;
}

/** The target date and time for a transit moment string (DD.MM.YYYY HH.MM[.SS]). */
export function transitToTargetMoment(value: string): { date: string; time: string } | null {
  const match = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s(\d{2})\.(\d{2})(?:\.\d{2})?)?$/);
  if (!match) return null;
  const [, day, month, year, hour = '12', minute = '00'] = match;
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
}
