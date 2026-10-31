// A link that opens a moment as a chart of its own: the muhūrta chart of a time found in the Muhūrta Finder. It is a share link
// (shareLink.ts) with the moment as the birth moment and the place of the search as the place, so it opens in a new tab and the
// chart that is open stays as it is.

import { localParts } from './muhurtaFinder';
import { decodeShare, encodeShare, shareUrl, type SharedChart } from './shareLink';

export interface MuhurtaChartPlace {
  /** The name of the place; the coordinates take its place when there is none. */
  name: string;
  lat: number;
  lng: number;
  /** The IANA zone of the place, which knows its daylight-saving time; the fixed `tz` offset (hours) is used without one. */
  zone?: string;
  tz: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

/** The moment (milliseconds since 1970, UTC) as the birth data line of the form, DD.MM.YYYY HH.MM.SS, by the clock of the place; the seconds are 00. */
export function momentText(ms: number, zone: string | undefined, tz: number): string {
  const at = localParts(Math.floor(ms / 60_000) * 60_000, zone, tz);
  return `${pad(at.day)}.${pad(at.month)}.${at.year} ${pad(at.hour)}.${pad(at.minute)}.00`;
}

/** The chart of the moment at the place, as a link; null where it cannot be put in a link. */
export function muhurtaChartLink(base: string, ms: number, place: MuhurtaChartPlace): string | null {
  const shared: SharedChart = {
    birthDatetime: momentText(ms, place.zone, place.tz),
    city: place.name || `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`,
    lat: String(place.lat),
    lng: String(place.lng),
    ianaTimezone: place.zone ?? '',
    tzOverride: place.zone ? '' : String(place.tz),
  };
  return decodeShare(encodeShare(shared)) ? shareUrl(base, shared) : null;
}
