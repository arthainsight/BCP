export const EVENT_CATEGORIES = ['work', 'money', 'relationship', 'health', 'home', 'family', 'spiritual', 'other'] as const;
export const EVENT_VARGAS = ['D1', 'D7', 'D9', 'D10', 'D12', 'D60'] as const;
export type ImportedCategory = typeof EVENT_CATEGORIES[number];
export type ImportedVarga = typeof EVENT_VARGAS[number];
export interface ImportedEvent { name: string; date: string; category: ImportedCategory; varga: ImportedVarga; }
export interface ImportResult { events: ImportedEvent[]; rejected: number; format: 'CSV' | 'JSON'; }

const CATEGORY_ALIASES: Record<string, ImportedCategory> = { work: 'work', money: 'money', relationship: 'relationship', health: 'health', home: 'home', 'home / move': 'home', family: 'family', spiritual: 'spiritual', other: 'other' };
const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
const normalize = (item: Record<string, unknown>): ImportedEvent | null => {
  const name = String(item.name ?? item.event ?? '').trim();
  const date = String(item.date ?? '').trim();
  const category = CATEGORY_ALIASES[String(item.category ?? 'other').trim().toLocaleLowerCase()] ?? 'other';
  const candidateVarga = String(item.varga ?? 'D1').trim().toUpperCase();
  const varga = EVENT_VARGAS.includes(candidateVarga as ImportedVarga) ? candidateVarga as ImportedVarga : 'D1';
  return name && validDate(date) ? { name, date, category, varga } : null;
};
const unique = (events: ImportedEvent[]) => [...new Map(events.map(item => [`${item.name.toLocaleLowerCase()}|${item.date}|${item.category}|${item.varga}`, item])).values()];

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[index + 1] === '\n') index += 1; row.push(cell); if (row.some(value => value.trim())) rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  row.push(cell); if (row.some(value => value.trim())) rows.push(row); return rows;
}

export function parseDashaEventImport(text: string, filename: string): ImportResult {
  if (filename.toLocaleLowerCase().endsWith('.json')) {
    const parsed: unknown = JSON.parse(text);
    const source = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' && Array.isArray((parsed as { events?: unknown }).events) ? (parsed as { events: unknown[] }).events : [];
    const normalized = source.map(item => item && typeof item === 'object' ? normalize(item as Record<string, unknown>) : null);
    return { events: unique(normalized.filter((item): item is ImportedEvent => item != null)), rejected: normalized.filter(item => item == null).length, format: 'JSON' };
  }
  const rows = parseCsvRows(text); const headers = rows.shift()?.map(value => value.trim().toLocaleLowerCase().replace(/^\ufeff/, '')) ?? [];
  const normalized = rows.map(row => normalize(Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))));
  return { events: unique(normalized.filter((item): item is ImportedEvent => item != null)), rejected: normalized.filter(item => item == null).length, format: 'CSV' };
}

export function eventIdentity(item: ImportedEvent): string { return `${item.name.trim().toLocaleLowerCase()}|${item.date}|${item.category}|${item.varga}`; }
