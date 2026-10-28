import { NextRequest, NextResponse } from 'next/server';
import { sweJulday } from '@/lib/ephemerisAdapter';
import { calculateSunTimes } from '@/lib/sunTimes';
import { PLACE_RANGES, readNumbers } from '@/lib/apiValidation';

// Sunrise, sunset and the following sunrise of a date at a place, as local hours
// since midnight of that date; the muhūrta times are cut from them in the browser.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(searchParams.get('date') ?? '');
  if (!match) return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
  // The place is required here: sunrise at the equator and Greenwich is not an answer to a missing place.
  const place = readNumbers(searchParams, { lat: { min: -90, max: 90 }, lng: { min: -180, max: 180 }, tz: { min: PLACE_RANGES.tz.min, max: PLACE_RANGES.tz.max } });
  if ('error' in place) return NextResponse.json({ error: place.error }, { status: 400 });
  const { lat, lng, tz } = place.values;
  try {
    const [, year, month, day] = match.map(Number);
    const times = await calculateSunTimes(await sweJulday(year, month, day, -tz), lat, lng);
    if (times.sunrise === undefined || times.sunset === undefined || times.nextSunrise === undefined) {
      return NextResponse.json({ error: 'The Sun does not rise and set on this date at this place.' }, { status: 422 });
    }
    return NextResponse.json({ sunrise: times.sunrise, sunset: times.sunset, nextSunrise: times.nextSunrise });
  } catch (error) {
    console.error('Muhurta error:', error);
    return NextResponse.json({ error: 'Failed to calculate sunrise and sunset' }, { status: 500 });
  }
}
