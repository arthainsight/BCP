import { NextRequest, NextResponse } from 'next/server';
import { calculateSignChangeSeries, SIGN_CHANGE_STEP_HOURS, type SignChangeBody } from '@/lib/ephemeris';

const MAX_DAYS = 31 * 366;
// What one request may sample: Jupiter, Saturn, Rahu and Ketu for thirty years, or the four faster grahas for ten, take a second or two.
const MAX_SAMPLES = 160_000;
// The Moon changes sign every two or three days and would be hundreds of stays a year.
type TransitBody = Exclude<SignChangeBody, 'Moon'>;
const BODIES = (Object.keys(SIGN_CHANGE_STEP_HOURS) as SignChangeBody[]).filter((body): body is TransitBody => body !== 'Moon');

// Sidereal longitudes of the chosen grahas for years from a start date, for the aspect view of the transits: the stays in the signs and the exact
// crossings are found in the browser, so this stays a position table, sampled at the step that suits each graha (see SIGN_CHANGE_STEP_HOURS).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = Date.parse(`${searchParams.get('start') ?? ''}T00:00:00Z`);
  const days = Math.min(MAX_DAYS, Math.max(1, parseInt(searchParams.get('days') || '366')));
  if (Number.isNaN(start)) {
    return NextResponse.json({ error: 'start must be YYYY-MM-DD' }, { status: 400 });
  }
  const bodies = (searchParams.get('bodies') ?? BODIES.join(','))
    .split(',')
    .filter((body): body is TransitBody => BODIES.includes(body as TransitBody));
  if (bodies.length === 0) {
    return NextResponse.json({ error: 'bodies must name at least one graha' }, { status: 400 });
  }
  const samples = bodies.reduce((sum, body) => sum + (days * 24) / SIGN_CHANGE_STEP_HOURS[body], 0);
  if (samples > MAX_SAMPLES) {
    return NextResponse.json({ error: 'That many grahas for that many years is too much to calculate at once' }, { status: 400 });
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
    console.error('Transit series error:', error);
    return NextResponse.json({ error: 'Failed to calculate transits' }, { status: 500 });
  }
}
