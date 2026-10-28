import { NextRequest, NextResponse } from 'next/server';
import { calculateSignChangeSeries, SIGN_CHANGE_STEP_HOURS, type SignChangeBody } from '@/lib/ephemeris';
import { AYANAMSA_OFFSET_RANGE, readBodies, readClampedInt, readNumbers } from '@/lib/apiValidation';

const MAX_DAYS = 31 * 366;
// With a coarser step (a day count of 2 to 7) a table can run to a long life, as the research needs it.
const MAX_DAYS_COARSE = 140 * 366;
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
  const stepDays = readClampedInt(searchParams, 'step', { min: 0, max: 7, fallback: 0 });
  const days = readClampedInt(searchParams, 'days', { min: 1, max: stepDays > 1 ? MAX_DAYS_COARSE : MAX_DAYS, fallback: 366 });
  if (Number.isNaN(start)) {
    return NextResponse.json({ error: 'start must be YYYY-MM-DD' }, { status: 400 });
  }
  const offset = readNumbers(searchParams, { ayanamsaOffset: AYANAMSA_OFFSET_RANGE });
  if ('error' in offset) return NextResponse.json({ error: offset.error }, { status: 400 });
  const bodies = readBodies(searchParams.get('bodies'), BODIES);
  if (bodies.length === 0) {
    return NextResponse.json({ error: 'bodies must name at least one graha' }, { status: 400 });
  }
  const stepHours = stepDays > 0 ? stepDays * 24 : undefined;
  const samples = bodies.reduce((sum, body) => sum + (days * 24) / (stepHours ?? SIGN_CHANGE_STEP_HOURS[body]), 0);
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
      offset.values.ayanamsaOffset,
      stepHours,
    );
    // A coarse table is long: four decimals (a few seconds of arc) are plenty for the signs and the exact hits.
    if (stepHours) for (const sample of Object.values(series)) sample.longitudes = sample.longitudes.map(longitude => Math.round(longitude * 10_000) / 10_000);
    return NextResponse.json({ start, series });
  } catch (error) {
    console.error('Transit series error:', error);
    return NextResponse.json({ error: 'Failed to calculate transits' }, { status: 500 });
  }
}
