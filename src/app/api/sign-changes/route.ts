import { NextRequest, NextResponse } from 'next/server';
import { calculateSignChangeSeries, SIGN_CHANGE_STEP_HOURS, type SignChangeBody } from '@/lib/ephemeris';
import { AYANAMSA_OFFSET_RANGE, readBodies, readClampedInt, readNumbers } from '@/lib/apiValidation';

const MAX_DAYS = 3 * 366;
// All nine grahas for the longest time are 22 000 positions (a few seconds); no request may ask for more than this.
const MAX_SAMPLES = 30_000;
const BODIES = Object.keys(SIGN_CHANGE_STEP_HOURS) as SignChangeBody[];

// Sidereal longitudes of the chosen grahas from a start date, sampled at a step
// that suits each graha, for the sign-change list. The sign changes themselves
// are found in the browser (lib/signChanges), so this stays a position table.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = Date.parse(`${searchParams.get('start') ?? ''}T00:00:00Z`);
  const days = readClampedInt(searchParams, 'days', { min: 1, max: MAX_DAYS, fallback: 90 });
  if (Number.isNaN(start)) {
    return NextResponse.json({ error: 'start must be YYYY-MM-DD' }, { status: 400 });
  }
  const offset = readNumbers(searchParams, { ayanamsaOffset: AYANAMSA_OFFSET_RANGE });
  if ('error' in offset) return NextResponse.json({ error: offset.error }, { status: 400 });
  // Each graha once: asking for the same one again would be the same work again.
  const bodies = readBodies(searchParams.get('bodies'), BODIES);
  if (bodies.length === 0) {
    return NextResponse.json({ error: 'bodies must name at least one graha' }, { status: 400 });
  }
  const samples = bodies.reduce((sum, body) => sum + (days * 24) / SIGN_CHANGE_STEP_HOURS[body], 0);
  if (samples > MAX_SAMPLES) {
    return NextResponse.json({ error: 'That many grahas for that many days is too much to calculate at once' }, { status: 400 });
  }
  try {
    const series = await calculateSignChangeSeries(
      bodies,
      start,
      days,
      searchParams.get('ayanamsa') || 'lahiri',
      searchParams.get('nodeMode') || 'mean',
      offset.values.ayanamsaOffset,
    );
    return NextResponse.json({ start, series });
  } catch (error) {
    console.error('Sign change series error:', error);
    return NextResponse.json({ error: 'Failed to calculate sign changes' }, { status: 500 });
  }
}
