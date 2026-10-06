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
