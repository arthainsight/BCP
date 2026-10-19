import { DASHA_EVENT_ACCURACIES, DASHA_EVENT_VARGAS, type DashaEventAccuracy, type DashaEventCategory, type DashaEventVarga, type StoredDashaEvent } from './dashaEventStore';

export type ImportedCategory = DashaEventCategory;
export type ImportedVarga = DashaEventVarga;
/** An event on its way into a list: everything a stored event has except the id it gets there. */
export type ImportedEvent = Omit<StoredDashaEvent, 'id'>;
export interface ImportResult { events: ImportedEvent[]; rejected: number; /** A short look at each entry that was rejected. */ rejectedItems: string[]; format: 'CSV' | 'JSON'; }

const CATEGORY_ALIASES: Record<string, ImportedCategory> = {
  work: 'work', money: 'money', relationship: 'relationship', health: 'health', home: 'home', 'home / move': 'home', family: 'family', spiritual: 'spiritual', other: 'other',
  // The same in Finnish, for lists written by hand.
  'työ': 'work', 'ura': 'work', raha: 'money', parisuhde: 'relationship', terveys: 'health', koti: 'home', muutto: 'home', perhe: 'family', henkinen: 'spiritual', muu: 'other',
};
const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
const normalize = (item: Record<string, unknown>): ImportedEvent | null => {
  const name = String(item.name ?? item.event ?? '').trim();
  const date = String(item.date ?? '').trim();
  const endText = String(item.endDate ?? item.end_date ?? item.end ?? '').trim();
  const endDate = validDate(endText) && endText >= date ? endText : undefined;
  const category = CATEGORY_ALIASES[String(item.category ?? 'other').trim().toLocaleLowerCase()] ?? 'other';
  const candidateVarga = String(item.varga ?? 'D1').trim().toUpperCase();
  const varga = DASHA_EVENT_VARGAS.includes(candidateVarga as ImportedVarga) ? candidateVarga as ImportedVarga : 'D1';
  const notes = String(item.notes ?? item.description ?? '').trim();
  const tags = Array.isArray(item.tags) ? item.tags.map(String).map(tag => tag.trim()).filter(Boolean) : String(item.tags ?? '').split(/[;,]/).map(tag => tag.trim()).filter(Boolean);
  const rawSignificance = Number(item.significance ?? 3); const significance = Number.isFinite(rawSignificance) ? Math.min(5, Math.max(1, Math.round(rawSignificance))) : 3;
  const accuracyText = String(item.accuracy ?? item['date accuracy'] ?? '').trim().toLocaleLowerCase();
  const accuracy = DASHA_EVENT_ACCURACIES.includes(accuracyText as DashaEventAccuracy) ? accuracyText as DashaEventAccuracy : undefined;
  return name && validDate(date) ? { name, date, ...(endDate ? { endDate } : {}), category, varga, notes, tags, significance, ...(accuracy ? { accuracy } : {}) } : null;
};
export function eventIdentity(item: ImportedEvent): string { return `${item.name.trim().toLocaleLowerCase()}|${item.date}|${item.endDate ?? ''}|${item.category}|${item.varga}`; }
const unique = (events: ImportedEvent[]) => [...new Map(events.map(item => [eventIdentity(item), item])).values()];
const glimpse = (text: string) => (text.length > 80 ? `${text.slice(0, 79)}…` : text);

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
    return { events: unique(normalized.filter((item): item is ImportedEvent => item != null)), rejected: normalized.filter(item => item == null).length, rejectedItems: source.filter((_, index) => normalized[index] == null).map(item => glimpse(JSON.stringify(item) ?? String(item))), format: 'JSON' };
  }
  const rows = parseCsvRows(text); const headers = rows.shift()?.map(value => value.trim().toLocaleLowerCase().replace(/^﻿/, '')) ?? [];
  const normalized = rows.map(row => normalize(Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']))));
  return { events: unique(normalized.filter((item): item is ImportedEvent => item != null)), rejected: normalized.filter(item => item == null).length, rejectedItems: rows.filter((_, index) => normalized[index] == null).map(row => glimpse(row.join(', '))), format: 'CSV' };
}

// ── Events written or pasted as text ────────────────────────────────────────────────────────────────────────────────────

export interface TextImportResult {
  events: ImportedEvent[];
  /** What could not be read: the lines of a list, or the entries of a pasted CSV or JSON. */
  invalid: string[];
  /** What the text turned out to be. */
  format: 'lines' | 'CSV' | 'JSON';
}
export interface TextImportDefaults { category: ImportedCategory; varga: ImportedVarga }

const APPROXIMATE_TAG = 'approx. date';

type DatePart = { kind: 'day' | 'month' | 'year'; year: number; month: number; day: number };
type Role = 'single' | 'from' | 'to';

/** A day written as 15.6.2015, 15/6/2015 (day first) or 2015-06-15, as an ISO date; null when it is not a real day. */
function isoFromParts(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * A date in the text: a day (15.6.2015, 15/6/2015, 2015-06-15), a month (3/2015, 3.2015, 2015-03) or a year (2015).
 * The groups carry the suffix, so that two of them can be told apart in a range.
 */
const dateSource = (suffix: string) => String.raw`(?:(?<y1${suffix}>\d{4})-(?<m1${suffix}>\d{1,2})-(?<d1${suffix}>\d{1,2})|(?<d2${suffix}>\d{1,2})[./](?<m2${suffix}>\d{1,2})[./](?<y2${suffix}>\d{4})|(?<y3${suffix}>\d{4})-(?<m3${suffix}>\d{1,2})(?![\d-])|(?<m4${suffix}>\d{1,2})[./](?<y4${suffix}>\d{4})|(?<y5${suffix}>1[89]\d\d|2[01]\d\d)(?!\d|[.\-/]\d))`;
const RANGE_SEPARATOR = String.raw`\s*(?:–|—|-|\.\.|\bto\b|\basti\b|\buntil\b)\s*`;
const DATE_AT_START = new RegExp(`^${dateSource('a')}(?:${RANGE_SEPARATOR}${dateSource('b')})?(?!\\d)`);
const DATE_AT_END = new RegExp(`(?<!\\d)(?:${dateSource('a')}${RANGE_SEPARATOR})?${dateSource('b')}$`);
const SEPARATORS = /^[\s;,:|\-–—]+|[\s;,:|\-–—]+$/g;

function readPart(groups: Record<string, string | undefined>, suffix: string): DatePart | null {
  const number = (key: string) => Number(groups[key + suffix]);
  const has = (key: string) => groups[key + suffix] !== undefined;
  if (has('y1')) return { kind: 'day', year: number('y1'), month: number('m1'), day: number('d1') };
  if (has('y2')) return { kind: 'day', year: number('y2'), month: number('m2'), day: number('d2') };
  if (has('y3')) return { kind: 'month', year: number('y3'), month: number('m3'), day: 0 };
  if (has('y4')) return { kind: 'month', year: number('y4'), month: number('m4'), day: 0 };
  if (has('y5')) return { kind: 'year', year: number('y5'), month: 0, day: 0 };
  return null;
}

/**
 * The day for a date that may be less exact. An event in a month is taken to be in the middle of it, one in a year in the
 * middle of it (1 July); at the beginning of a period they are its first day, and at the end of one its last.
 */
function resolvePart(part: DatePart, role: Role): string | null {
  if (part.kind === 'day') return isoFromParts(part.year, part.month, part.day);
  if (part.kind === 'month') {
    if (part.month < 1 || part.month > 12) return null;
    const day = role === 'single' ? 15 : role === 'from' ? 1 : new Date(part.year, part.month, 0).getDate();
    return isoFromParts(part.year, part.month, day);
  }
  return role === 'single' ? isoFromParts(part.year, 7, 1) : role === 'from' ? isoFromParts(part.year, 1, 1) : isoFromParts(part.year, 12, 31);
}

const HEADER_LINE = (line: string) => /\b(date|päivä|pvm)\b/i.test(line) && /\b(event|name|tapahtuma|nimi)\b/i.test(line);

/**
 * Many events from pasted text, one on each line: a date and the name of the event, "15.6.2015 Moved abroad". The date can
 * be first or last, and it is a day (15.6.2015, 15/6/2015 or 2015-06-15), a month (3/2015) or a year (2015); two of them,
 * "15.6.2015 - 20.8.2017 Studied abroad" or "2015-2017 Studied abroad", are an event that lasted for a while. A line copied
 * from a spreadsheet or written with semicolons can go on with the category, the varga, the significance (1-5) and the
 * notes: "15.6.2015; Moved abroad; home; D1; 4; the second move". What is missing takes the defaults. A first line that only
 * names the columns is skipped. Text that is a JSON list or a CSV file with a header is read as such.
 */
export function parseDashaEventText(text: string, defaults: TextImportDefaults): TextImportResult {
  const head = text.trimStart();
  if (head.startsWith('[') || head.startsWith('{')) {
    try {
      const result = parseDashaEventImport(text, 'pasted.json');
      return { events: result.events, invalid: result.rejectedItems, format: 'JSON' };
    } catch { return { events: [], invalid: ['This is not valid JSON.'], format: 'JSON' }; }
  }
  const firstLine = head.split(/\r?\n/, 1)[0] ?? '';
  if (firstLine.includes(',') && HEADER_LINE(firstLine) && !DATE_AT_START.test(firstLine.trim())) {
    const result = parseDashaEventImport(text, 'pasted.csv');
    return { events: result.events, invalid: result.rejectedItems, format: 'CSV' };
  }

  const events: ImportedEvent[] = []; const invalid: string[] = [];
  let first = true;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const wasFirst = first; first = false;
    const start = DATE_AT_START.exec(trimmed); const end = start ? null : DATE_AT_END.exec(trimmed);
    const match = start ?? end;
    if (!match?.groups) { if (!(wasFirst && HEADER_LINE(trimmed))) invalid.push(trimmed); continue; }
    // A range is two dates; at the start of the line they are the groups a and b, at the end b alone is a single date.
    const parts = [readPart(match.groups, 'a'), readPart(match.groups, 'b')].filter((part): part is DatePart => part !== null);
    const [from, to] = parts;
    const date = resolvePart(from, to ? 'from' : 'single'); const endDate = to ? resolvePart(to, 'to') : undefined;
    if (!date || (to && (!endDate || endDate < date))) { invalid.push(trimmed); continue; }
    const rest = start ? trimmed.slice(match[0].length) : trimmed.slice(0, match.index);
    const body = rest.replace(SEPARATORS, '');
    const columns = (body.includes('\t') ? body.split('\t') : body.includes(';') ? body.split(';') : [body]).map(value => value.trim());
    const [name = '', categoryText = '', vargaText = '', significanceText = '', ...noteParts] = columns;
    const category = CATEGORY_ALIASES[categoryText.toLocaleLowerCase()] ?? defaults.category;
    const varga = DASHA_EVENT_VARGAS.includes(vargaText.toUpperCase() as ImportedVarga) ? vargaText.toUpperCase() : defaults.varga;
    const event = normalize({ name, date, endDate, category, varga, significance: significanceText === '' ? 3 : significanceText, notes: noteParts.join('; '), tags: parts.some(part => part.kind !== 'day') ? [APPROXIMATE_TAG] : [], accuracy: !to && from.kind !== 'day' ? from.kind : undefined });
    if (event) events.push(event); else invalid.push(trimmed);
  }
  return { events: unique(events), invalid, format: 'lines' };
}
