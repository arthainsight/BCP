export const EVENT_CATEGORIES = ['work', 'money', 'relationship', 'health', 'home', 'family', 'spiritual', 'other'] as const;
export const EVENT_VARGAS = ['D1', 'D7', 'D9', 'D10', 'D12', 'D60'] as const;
export type ImportedCategory = typeof EVENT_CATEGORIES[number];
export type ImportedVarga = typeof EVENT_VARGAS[number];
export interface ImportedEvent { name: string; date: string; category: ImportedCategory; varga: ImportedVarga; notes: string; tags: string[]; significance: number; }
export interface ImportResult { events: ImportedEvent[]; rejected: number; format: 'CSV' | 'JSON'; }

const CATEGORY_ALIASES: Record<string, ImportedCategory> = {
  work: 'work', money: 'money', relationship: 'relationship', health: 'health', home: 'home', 'home / move': 'home', family: 'family', spiritual: 'spiritual', other: 'other',
  // The same in Finnish, for lists written by hand.
  'työ': 'work', 'ura': 'work', raha: 'money', parisuhde: 'relationship', terveys: 'health', koti: 'home', muutto: 'home', perhe: 'family', henkinen: 'spiritual', muu: 'other',
};
const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
const normalize = (item: Record<string, unknown>): ImportedEvent | null => {
  const name = String(item.name ?? item.event ?? '').trim();
  const date = String(item.date ?? '').trim();
  const category = CATEGORY_ALIASES[String(item.category ?? 'other').trim().toLocaleLowerCase()] ?? 'other';
  const candidateVarga = String(item.varga ?? 'D1').trim().toUpperCase();
  const varga = EVENT_VARGAS.includes(candidateVarga as ImportedVarga) ? candidateVarga as ImportedVarga : 'D1';
  const notes = String(item.notes ?? item.description ?? '').trim();
  const tags = Array.isArray(item.tags) ? item.tags.map(String).map(tag => tag.trim()).filter(Boolean) : String(item.tags ?? '').split(/[;,]/).map(tag => tag.trim()).filter(Boolean);
  const rawSignificance = Number(item.significance ?? 3); const significance = Number.isFinite(rawSignificance) ? Math.min(5, Math.max(1, Math.round(rawSignificance))) : 3;
  return name && validDate(date) ? { name, date, category, varga, notes, tags, significance } : null;
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

export interface TextImportResult { events: ImportedEvent[]; /** The lines that could not be read. */ invalid: string[]; }
export interface TextImportDefaults { category: ImportedCategory; varga: ImportedVarga }

/** A day written as 15.6.2015, 15/6/2015 (day first) or 2015-06-15, as an ISO date; null when it is not a real day. */
function isoFromParts(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
const DATE_SOURCE = String.raw`(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})[./](\d{1,2})[./](\d{4})`;
const DATE_AT_START = new RegExp(`^(?:${DATE_SOURCE})(?![\\d])`);
const DATE_AT_END = new RegExp(`(?<![\\d])(?:${DATE_SOURCE})$`);
function dateFromMatch(match: RegExpExecArray): string | null {
  return match[1] ? isoFromParts(Number(match[1]), Number(match[2]), Number(match[3])) : isoFromParts(Number(match[6]), Number(match[5]), Number(match[4]));
}
const SEPARATORS = /^[\s;,:|\-–—]+|[\s;,:|\-–—]+$/g;

/**
 * Many events from pasted text, one on each line: a date and the name of the event, "15.6.2015 Moved abroad". The date
 * can be first or last (15.6.2015, 15/6/2015 or 2015-06-15) and is told from the name by a space, a tab, ; , : or a dash.
 * A line copied from a spreadsheet or written with semicolons can go on with the category, the varga, the significance
 * (1-5) and the notes: "15.6.2015; Moved abroad; home; D1; 4; the second move". What is missing takes the defaults.
 */
export function parseDashaEventText(text: string, defaults: TextImportDefaults): TextImportResult {
  const events: ImportedEvent[] = []; const invalid: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const start = DATE_AT_START.exec(trimmed); const end = start ? null : DATE_AT_END.exec(trimmed);
    const match = start ?? end;
    const date = match ? dateFromMatch(match) : null;
    if (!match || !date) { invalid.push(trimmed); continue; }
    const rest = start ? trimmed.slice(match[0].length) : trimmed.slice(0, match.index);
    const body = rest.replace(SEPARATORS, '');
    const columns = (body.includes('\t') ? body.split('\t') : body.includes(';') ? body.split(';') : [body]).map(value => value.trim());
    const [name = '', categoryText = '', vargaText = '', significanceText = '', ...noteParts] = columns;
    const category = CATEGORY_ALIASES[categoryText.toLocaleLowerCase()] ?? defaults.category;
    const varga = EVENT_VARGAS.includes(vargaText.toUpperCase() as ImportedVarga) ? vargaText.toUpperCase() : defaults.varga;
    const event = normalize({ name, date, category, varga, significance: significanceText === '' ? 3 : significanceText, notes: noteParts.join('; ') });
    if (event) events.push(event); else invalid.push(trimmed);
  }
  return { events: unique(events), invalid };
}
