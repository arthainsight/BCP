import { NextRequest, NextResponse } from 'next/server';
import { AYANAMSA_OFFSET_RANGE, PLACE_RANGES, readClampedInt, readNumbers } from '@/lib/apiValidation';
import { MAX_STRIP_DAYS, runMuhurtaStrip } from '@/lib/muhurtaStrip';

// The sky for a month strip: from a start date for a number of days at a place, the stretches in which the vāra, tithi,
// nakṣatra, karaṇa and yoga are each the same, with the days of the span.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(searchParams.get('start') ?? '');
  if (!match || Number.isNaN(Date.parse(`${match[0]}T00:00:00Z`))) return NextResponse.json({ error: 'start must be YYYY-MM-DD' }, { status: 400 });
  const days = readClampedInt(searchParams, 'days', { min: 1, max: MAX_STRIP_DAYS, fallback: 31 });
  const place = readNumbers(searchParams, { lat: { min: -90, max: 90 }, lng: { min: -180, max: 180 }, tz: PLACE_RANGES.tz, ayanamsaOffset: AYANAMSA_OFFSET_RANGE });
  if ('error' in place) return NextResponse.json({ error: place.error }, { status: 400 });
  try {
    const result = await runMuhurtaStrip({
      start: match[0],
      days,
      lat: place.values.lat,
      lng: place.values.lng,
      zone: searchParams.get('zone') || undefined,
      tz: place.values.tz,
      ayanamsa: searchParams.get('ayanamsa') || 'lahiri',
      ayanamsaOffset: place.values.ayanamsaOffset,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Muhurta strip error:', error);
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 });
  }
}
