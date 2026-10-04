// Request handling shared by the annual-chart routes (Tithi Praveśa and
// Varṣaphala): the birth moment, the place the annual chart is cast for, the
// calculation settings, and which year is wanted.

import { calculateChart } from './ephemeris';
import { jdFromLocal, localPartsFromJd } from './lunisolar';
import { getUtcOffsetHours } from './timezone';

export interface AnnualRequest {
  birth: { year: number; month: number; day: number; hour: number; minute: number; second: number };
  birthTz: number;
  birthJd: number;
  /** Place the annual chart is cast for: the birthplace or the residence that year. */
  lat: number;
  lng: number;
  /** IANA zone of that place; resolves daylight saving at the annual moment. */
  iana: string;
  ayanamsa: string;
  ayanamsaOffsetDegrees: number;
  nodeMode: string;
  /** An explicit Gregorian year, or null to use the year in force at targetJd. */
  year: number | null;
  targetJd: number;
}

export async function parseAnnualRequest(searchParams: URLSearchParams): Promise<AnnualRequest | { error: string }> {
  const num = (key: string) => parseFloat(searchParams.get(key) || '0');
  const birth = {
    year: num('year'), month: num('month'), day: num('day'),
    hour: num('hour'), minute: num('minute'), second: num('second'),
  };
  if (!birth.year || !birth.month || !birth.day) return { error: 'Missing required parameters: year, month, day' };
  const birthTz = num('tz');
  const birthJd = await jdFromLocal(birth.year, birth.month, birth.day, birth.hour, birth.minute, birth.second, birthTz);

  const requestedYear = parseInt(searchParams.get('tpYear') || '0');
  let targetJd = 0;
  if (!requestedYear) {
    const match = (searchParams.get('target') || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return { error: 'Provide tpYear or target as yyyy-mm-dd' };
    const [, y, m, d] = match.map(Number);
    targetJd = await jdFromLocal(y, m, d, 12, 0, 0, birthTz);
  }

  return {
    birth,
    birthTz,
    birthJd,
    lat: num('lat'),
    lng: num('lng'),
    iana: searchParams.get('iana') || '',
    ayanamsa: searchParams.get('ayanamsa') || 'lahiri',
    ayanamsaOffsetDegrees: num('ayanamsaOffset'),
    nodeMode: searchParams.get('nodeMode') || 'mean',
    year: requestedYear || null,
    targetJd,
  };
}

/** UTC offset at a moment, from the place's IANA zone when known, else the birth offset. */
export function offsetAt(req: AnnualRequest, jd: number): number {
  return req.iana ? getUtcOffsetHours(req.iana, new Date((jd - 2440587.5) * 86400000)) : req.birthTz;
}

/** Cast the chart for a moment at the request's place, in its local time. */
export async function castAt(req: AnnualRequest, jd: number) {
  const tzOffset = offsetAt(req, jd);
  const local = localPartsFromJd(jd, tzOffset);
  const chart = await calculateChart(
    local.year, local.month, local.day, local.hour, local.minute, local.second,
    req.lat, req.lng, tzOffset, req.ayanamsa, req.nodeMode, req.ayanamsaOffsetDegrees,
  );
  return { local, tzOffset, chart };
}

/** Annual period list with UT Julian days converted to local date-time parts. */
export function localizePeriods<T extends { startJd: number; endJd: number }>(req: AnnualRequest, periods: T[]) {
  return periods.map((p) => ({
    ...p,
    start: localPartsFromJd(p.startJd, offsetAt(req, p.startJd)),
    end: localPartsFromJd(p.endJd, offsetAt(req, p.endJd)),
  }));
}
