import { NextRequest, NextResponse } from 'next/server';
import { AYANAMSA_OFFSET_RANGE, PLACE_RANGES, readClampedInt, readIntList, readNumbers } from '@/lib/apiValidation';
import { FINDER_GRAHAS, FINDER_SIZES, parseChandra, parseRule, type FinderCriteria, type FinderRule } from '@/lib/muhurtaFinder';
import { MAX_FINDER_DAYS, MAX_FINDER_STEPS, finderStepCount, finderStepMinutes, runMuhurtaFinder } from '@/lib/muhurtaFinderRun';

const MAX_RULES = 12;

// The stretches of time, from a start date for a number of days at a place, in which every condition the query names
// holds at once: weekday (vara), tithi, nakshatra, yoga, karana, the signs the Ascendant and the grahas may be in, and
// rules about the houses from the Ascendant (`rule=any:Venus,Moon:1`, `rule=none:Sun,Mars:8,12`, up to 12 of them),
// and the Chandrabala (`chandra=1:1,3,6,7,10,11`: the sign of the Moon at birth, 0 Aries to 11 Pisces, then the houses from it the Moon may be in).
// A condition that is left out is not a condition; one given as an empty list can never be met.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(searchParams.get('start') ?? '');
  if (!match || Number.isNaN(Date.parse(`${match[0]}T00:00:00Z`))) return NextResponse.json({ error: 'start must be YYYY-MM-DD' }, { status: 400 });
  const days = readClampedInt(searchParams, 'days', { min: 1, max: MAX_FINDER_DAYS, fallback: 30 });
  // The place is required: the Ascendant and the sunrise belong to one.
  const place = readNumbers(searchParams, { lat: { min: -90, max: 90 }, lng: { min: -180, max: 180 }, tz: PLACE_RANGES.tz, ayanamsaOffset: AYANAMSA_OFFSET_RANGE });
  if ('error' in place) return NextResponse.json({ error: place.error }, { status: 400 });

  const lists = {
    vara: readIntList(searchParams, 'vara', { min: 0, max: FINDER_SIZES.vara - 1 }),
    tithi: readIntList(searchParams, 'tithi', { min: 1, max: FINDER_SIZES.tithi }),
    nakshatra: readIntList(searchParams, 'nakshatra', { min: 0, max: FINDER_SIZES.nakshatra - 1 }),
    yoga: readIntList(searchParams, 'yoga', { min: 0, max: FINDER_SIZES.yoga - 1 }),
    karana: readIntList(searchParams, 'karana', { min: 0, max: FINDER_SIZES.karana - 1 }),
  };
  const signs: FinderCriteria['signs'] = {};
  for (const graha of FINDER_GRAHAS) {
    const list = readIntList(searchParams, `sign_${graha}`, { min: 0, max: 11 });
    if (list !== undefined && 'error' in list) return NextResponse.json({ error: list.error }, { status: 400 });
    if (list !== undefined) signs[graha] = list;
  }
  for (const list of Object.values(lists)) {
    if (list !== undefined && 'error' in list) return NextResponse.json({ error: list.error }, { status: 400 });
  }
  const rules: FinderRule[] = [];
  const ruleTexts = searchParams.getAll('rule');
  if (ruleTexts.length > MAX_RULES) return NextResponse.json({ error: `at most ${MAX_RULES} rules` }, { status: 400 });
  for (const text of ruleTexts) {
    const rule = parseRule(text);
    if ('error' in rule) return NextResponse.json({ error: rule.error }, { status: 400 });
    rules.push(rule);
  }
  let chandra: FinderCriteria['chandra'];
  const chandraText = searchParams.get('chandra');
  if (chandraText !== null) {
    const parsed = parseChandra(chandraText);
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    chandra = parsed;
  }
  const all = (size: number, first = 0) => Array.from({ length: size }, (_, index) => first + index);
  const given = (list: number[] | undefined | { error: string }, size: number, first = 0): number[] => (list === undefined ? all(size, first) : (list as number[]));
  const criteria: FinderCriteria = {
    vara: given(lists.vara, FINDER_SIZES.vara),
    tithi: given(lists.tithi, FINDER_SIZES.tithi, 1),
    nakshatra: given(lists.nakshatra, FINDER_SIZES.nakshatra),
    yoga: given(lists.yoga, FINDER_SIZES.yoga),
    karana: given(lists.karana, FINDER_SIZES.karana),
    signs,
    rules,
    chandra,
  };
  if (finderStepCount(days, finderStepMinutes(criteria)) > MAX_FINDER_STEPS) {
    return NextResponse.json({ error: 'That many days is too many to search with these conditions' }, { status: 400 });
  }

  try {
    const result = await runMuhurtaFinder({
      start: match[0],
      days,
      lat: place.values.lat,
      lng: place.values.lng,
      zone: searchParams.get('zone') || undefined,
      tz: place.values.tz,
      ayanamsa: searchParams.get('ayanamsa') || 'lahiri',
      nodeMode: searchParams.get('nodeMode') || 'mean',
      ayanamsaOffset: place.values.ayanamsaOffset,
      criteria,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Muhurta finder error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
