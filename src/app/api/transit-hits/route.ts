import { NextRequest, NextResponse } from 'next/server';
import { calculateSlowTransitSeries } from '@/lib/ephemeris';

const DAY_MS = 86_400_000;
const MAX_DAYS = 3 * 366;

// Daily sidereal longitudes of Jupiter, Saturn, Rahu and Ketu from a start
// date, for the transit-hit list. The crossings themselves are found in the
// browser (lib/transitHits), so this stays a plain position table.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = Date.parse(`${searchParams.get('start') ?? ''}T12:00:00Z`);
  const days = Math.min(MAX_DAYS, Math.max(1, parseInt(searchParams.get('days') || '366')));
  if (Number.isNaN(start)) {
    return NextResponse.json({ error: 'start must be YYYY-MM-DD' }, { status: 400 });
  }
  try {
    const longitudes = await calculateSlowTransitSeries(
      start,
      days,
      searchParams.get('ayanamsa') || 'lahiri',
      searchParams.get('nodeMode') || 'mean',
      parseFloat(searchParams.get('ayanamsaOffset') || '0'),
    );
    return NextResponse.json({ start, step: DAY_MS, longitudes });
  } catch (error) {
    console.error('Transit series error:', error);
    return NextResponse.json({ error: 'Failed to calculate transits' }, { status: 500 });
  }
}
