// The place a visitor opens the page from, as the hosting platform works it out from the address of the request (Vercel puts it in
// the x-vercel-ip-* headers of every request). It is approximate (the town, not the street) and it can be wrong: a VPN, a company
// network or a mobile network puts a visitor in another town. Nothing is stored here, and nothing is asked of a third party.

export interface VisitorPlace {
  /** The town, or the country when the platform gives no town; what the city lookup of the form is given. */
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  /** The IANA zone of the place, which the clock of the chart is read in. */
  timezone: string;
}

export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return zone.length > 0 && zone.length <= 64;
  } catch {
    return false;
  }
}

/** A header value that is percent-encoded text (the platform encodes the names of towns), made plain and short, or '' when it cannot be. */
function plainText(value: string | null): string {
  if (!value) return '';
  let text = value;
  try { text = decodeURIComponent(value); } catch { /* not encoded: as it is */ }
  return text.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 80);
}

const number = (value: string | null): number | null => {
  if (value === null || !/^[+-]?\d+(\.\d+)?$/.test(value.trim())) return null;
  return Number(value);
};

/**
 * The place from the headers of a request, or null when they do not give one a chart can be cast for: no coordinates or no zone, a
 * coordinate off the Earth, 0°, 0° (what a lookup that failed gives), or a zone the runtime does not know.
 */
export function placeFromHeaders(get: (name: string) => string | null): VisitorPlace | null {
  const latitude = number(get('x-vercel-ip-latitude'));
  const longitude = number(get('x-vercel-ip-longitude'));
  const timezone = (get('x-vercel-ip-timezone') ?? '').trim();
  if (latitude === null || longitude === null || !isValidTimeZone(timezone)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  if (latitude === 0 && longitude === 0) return null;
  const country = plainText(get('x-vercel-ip-country'));
  const city = plainText(get('x-vercel-ip-city')) || country;
  return { city, country, latitude, longitude, timezone };
}

/** What the page reads from the answer of /api/locale: a place with every part right, or null. */
export function visitorPlaceFromJson(value: unknown): VisitorPlace | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const { city, country, latitude, longitude, timezone } = item;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof timezone !== 'string') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  if (!isValidTimeZone(timezone)) return null;
  return { city: typeof city === 'string' ? city.slice(0, 80) : '', country: typeof country === 'string' ? country.slice(0, 80) : '', latitude, longitude, timezone };
}

/**
 * Asks the app's own route for the place of the visitor, and gives up after `timeoutMs` (the chart is not kept waiting for a
 * slow answer): the place, or null when there is none, the answer is not one, or the route cannot be reached.
 */
export async function fetchVisitorPlace(timeoutMs = 3000): Promise<VisitorPlace | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('/api/locale', { cache: 'no-store', signal: controller.signal });
    return response.ok ? visitorPlaceFromJson(await response.json()) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

