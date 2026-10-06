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
