import { NextRequest, NextResponse } from 'next/server';
import { calculateSignChangeSeries, SIGN_CHANGE_STEP_HOURS, type SignChangeBody } from '@/lib/ephemeris';

const MAX_DAYS = 3 * 366;

// Sidereal longitudes of the chosen grahas from a start date, sampled at a step
// that suits each graha, for the sign-change list. The sign changes themselves
// are found in the browser (lib/signChanges), so this stays a position table.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = Date.parse(`${searchParams.get('start') ?? ''}T00:00:00Z`);
  const days = Math.min(MAX_DAYS, Math.max(1, parseInt(searchParams.get('days') || '90')));
  if (Number.isNaN(start)) {
    return NextResponse.json({ error: 'start must be YYYY-MM-DD' }, { status: 400 });
  }
  const bodies = (searchParams.get('bodies') ?? Object.keys(SIGN_CHANGE_STEP_HOURS).join(','))
    .split(',')
    .filter((body): body is SignChangeBody => body in SIGN_CHANGE_STEP_HOURS);
  if (bodies.length === 0) {
    return NextResponse.json({ error: 'bodies must name at least one graha' }, { status: 400 });
  }
  try {
    const series = await calculateSignChangeSeries(
      bodies,
      start,
      days,
      searchParams.get('ayanamsa') || 'lahiri',
      searchParams.get('nodeMode') || 'mean',
      parseFloat(searchParams.get('ayanamsaOffset') || '0'),
    );
    return NextResponse.json({ start, series });
  } catch (error) {
    console.error('Sign change series error:', error);
    return NextResponse.json({ error: 'Failed to calculate sign changes' }, { status: 500 });
  }
}
