import { NextRequest, NextResponse } from 'next/server';
import { calculateSlowTransitSeries } from '@/lib/ephemeris';
import { DAY_MS } from '@/lib/time';
import { AYANAMSA_OFFSET_RANGE, readClampedInt, readNumbers } from '@/lib/apiValidation';

const MAX_DAYS = 3 * 366;

// Daily sidereal longitudes of Jupiter, Saturn, Rahu and Ketu from a start
// date, for the transit-hit list. The crossings themselves are found in the
// browser (lib/transitHits), so this stays a plain position table.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = Date.parse(`${searchParams.get('start') ?? ''}T12:00:00Z`);
  const days = readClampedInt(searchParams, 'days', { min: 1, max: MAX_DAYS, fallback: 366 });
  if (Number.isNaN(start)) {
    return NextResponse.json({ error: 'start must be YYYY-MM-DD' }, { status: 400 });
  }
  const offset = readNumbers(searchParams, { ayanamsaOffset: AYANAMSA_OFFSET_RANGE });
  if ('error' in offset) return NextResponse.json({ error: offset.error }, { status: 400 });
  try {
    const longitudes = await calculateSlowTransitSeries(
      start,
      days,
      searchParams.get('ayanamsa') || 'lahiri',
      searchParams.get('nodeMode') || 'mean',
      offset.values.ayanamsaOffset,
    );
    return NextResponse.json({ start, step: DAY_MS, longitudes });
  } catch (error) {
    console.error('Transit series error:', error);
    return NextResponse.json({ error: 'Failed to calculate transits' }, { status: 500 });
  }
}
