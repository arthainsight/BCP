// A link that carries a chart's birth data in the part of the address after the #. That part is never sent to a
// server, so the data goes only to whoever is given the link; opening the link fills the form and calculates the chart.
// Only the birth data travels: the person who opens it keeps their own settings.

export interface SharedChart {
  /** As typed in the form, for example 15.08.1947 09.15.00. */
  birthDatetime: string;
  city: string;
  lat: string;
  lng: string;
  ianaTimezone: string;
  /** The UTC offset set by hand, in hours; empty for the automatic one. */
  tzOverride: string;
}

const VERSION = 1;
const PREFIX = 'c=';

function toBase64Url(text: string): string {
  let binary = '';
  new TextEncoder().encode(text).forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
  } catch {
    return null;
  }
}

/** The part of an address (without the #) that carries the chart. */
export function encodeShare(chart: SharedChart): string {
  const { birthDatetime, city, lat, lng, ianaTimezone, tzOverride } = chart;
  return PREFIX + toBase64Url(JSON.stringify([VERSION, birthDatetime, city, lat, lng, ianaTimezone, tzOverride]));
}

export function shareUrl(base: string, chart: SharedChart): string {
  return `${base.split('#')[0]}#${encodeShare(chart)}`;
}

const coordinate = (value: unknown, limit: number): string | null => {
  if (typeof value !== 'string' || !/^-?\d+(\.\d+)?$/.test(value.trim())) return null;
  const number = Number(value);
  return Math.abs(number) <= limit ? String(number) : null;
};

/** The chart in an address (with or without the #), or null when there is none or it is not well formed. */
export function decodeShare(hash: string): SharedChart | null {
  const text = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!text.startsWith(PREFIX)) return null;
  const json = fromBase64Url(text.slice(PREFIX.length));
  if (json === null) return null;
  let data: unknown;
  try { data = JSON.parse(json); } catch { return null; }
  if (!Array.isArray(data) || data[0] !== VERSION || data.length < 7) return null;
  const [, birthDatetime, city, lat, lng, ianaTimezone, tzOverride] = data;
  if (typeof birthDatetime !== 'string' || !birthDatetime.trim() || birthDatetime.length > 40) return null;
  if (typeof city !== 'string' || city.length > 120) return null;
  const latitude = coordinate(lat, 90);
  const longitude = coordinate(lng, 180);
  if (latitude === null || longitude === null) return null;
  if (typeof ianaTimezone !== 'string' || (ianaTimezone !== '' && !/^[A-Za-z0-9_/+-]{1,64}$/.test(ianaTimezone))) return null;
  if (typeof tzOverride !== 'string' || (tzOverride !== '' && coordinate(tzOverride, 14) === null)) return null;
  return { birthDatetime: birthDatetime.trim(), city, lat: latitude, lng: longitude, ianaTimezone, tzOverride: tzOverride === '' ? '' : String(Number(tzOverride)) };
}
