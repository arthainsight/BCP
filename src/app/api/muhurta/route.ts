import { NextRequest, NextResponse } from 'next/server';
import { sweJulday } from '@/lib/ephemerisAdapter';
import { calculateSunTimes } from '@/lib/sunTimes';

// Sunrise, sunset and the following sunrise of a date at a place, as local hours
// since midnight of that date; the muhūrta times are cut from them in the browser.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(searchParams.get('date') ?? '');
  const lat = parseFloat(searchParams.get('lat') ?? '');
  const lng = parseFloat(searchParams.get('lng') ?? '');
  const tz = parseFloat(searchParams.get('tz') ?? '');
  if (!match) return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
  if ([lat, lng, tz].some(Number.isNaN) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'lat, lng and tz must be numbers' }, { status: 400 });
  }
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
