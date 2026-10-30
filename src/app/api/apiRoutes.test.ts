import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET as chart } from './chart/route';
import { GET as muhurta } from './muhurta/route';
import { GET as muhurtaFinder } from './muhurta-finder/route';
import { GET as signChanges } from './sign-changes/route';
import { GET as transitHits } from './transit-hits/route';
import { GET as transitSeries } from './transit-series/route';
import { GET as pravesha } from './pravesha/route';
import { GET as sudarshana } from './sudarshana/route';
import { GET as tithiPravesha } from './tithi-pravesha/route';
import { GET as varshaphala } from './varshaphala/route';

// The routes answer what they are asked at once, or say why they will not: these tests call the real handlers.
type Handler = (request: NextRequest) => Promise<Response>;
const call = async (handler: Handler, query: string) => {
  const started = Date.now();
  const response = await handler(new NextRequest(`http://localhost/api/x?${query}`));
  return { status: response.status, body: (await response.json()) as Record<string, unknown>, ms: Date.now() - started };
};
/** A query with one parameter set to a value (replacing the one that was there). */
const withParam = (query: string, key: string, value: string) => { const params = new URLSearchParams(query); params.set(key, value); return params.toString(); };
const BIRTH = 'year=1947&month=8&day=15&hour=9&minute=15&second=0&lat=28.6&lng=77.2&tz=5.5';

async function main() {
  // /api/chart: a chart for a good request, an error for a request that is not one.
  const good = await call(chart, BIRTH);
  assert.equal(good.status, 200);
  assert.ok(Array.isArray(good.body.planets), 'a chart has planets');
  for (const bad of ['', 'year=1947&month=8', 'year=abc&month=8&day=15', withParam(BIRTH, 'lat', '91'), withParam(BIRTH, 'lng', 'NaN'), withParam(BIRTH, 'tz', '99'), withParam(BIRTH, 'hour', '24'),
    `${BIRTH}&ayanamsaOffset=Infinity`, 'year=99999999&month=8&day=15', 'year=0&month=8&day=15']) {
    const result = await call(chart, bad);
    assert.equal(result.status, 400, bad);
    assert.equal(typeof result.body.error, 'string', bad);
  }
  assert.equal((await call(chart, `${BIRTH}&ayanamsa=nonsense&nodeMode=nonsense&sunrise=nonsense`)).status, 200, 'an unknown setting falls back to the usual one');

  // /api/sign-changes: a graha asked for again and again is calculated once; a request that is too long is refused.
  const one = await call(signChanges, 'start=2024-01-01&days=30&bodies=Moon');
  assert.equal(one.status, 200);
  const repeated = await call(signChanges, `start=2024-01-01&days=30&bodies=${Array(2000).fill('Moon').join(',')}`);
  assert.equal(repeated.status, 200);
  assert.deepEqual(Object.keys(repeated.body.series as object), ['Moon'], 'one series for the repeated graha');
  assert.deepEqual(repeated.body.series, one.body.series, 'the same series as for one mention');
  assert.ok(repeated.ms < one.ms * 5 + 1000, `a repeated name does not repeat the work (${repeated.ms} ms against ${one.ms} ms)`);
  const everything = await call(signChanges, 'start=2024-01-01&days=99999');
  assert.equal(everything.status, 200, 'all the grahas for the longest time are allowed');
  for (const name of ['constructor', 'toString', '__proto__']) {
    const result = await call(signChanges, `start=2024-01-01&days=5&bodies=${name}`);
    assert.equal(result.status, 400, `${name} is not a graha`);
  }
  assert.equal((await call(signChanges, 'start=2024-01-01&bodies=')).status, 400, 'no graha');
  assert.equal((await call(signChanges, 'start=nonsense')).status, 400);
  assert.equal((await call(signChanges, 'start=2024-01-01&days=5&bodies=Sun&ayanamsaOffset=abc')).status, 400);
  assert.equal((await call(signChanges, 'start=2024-01-01&days=abc&bodies=Sun')).status, 200, 'days that is not a number is the usual length');

  // /api/transit-series and /api/transit-hits.
  const series = await call(transitSeries, `start=2024-01-01&days=60&bodies=${Array(500).fill('Saturn').join(',')}`);
  assert.equal(series.status, 200);
  assert.deepEqual(Object.keys(series.body.series as object), ['Saturn']);
  assert.equal((await call(transitSeries, 'start=2024-01-01&bodies=Moon')).status, 400, 'the Moon is left out of the transits');
  assert.equal((await call(transitSeries, 'start=2024-01-01&days=99999&step=2')).status, 400, 'every graha every two days for 140 years is too much');
  assert.equal((await call(transitSeries, 'start=2024-01-01&days=60&ayanamsaOffset=NaN')).status, 400);
  assert.equal((await call(transitHits, 'start=2024-01-01&days=abc')).status, 200, 'days that is not a number is the usual length');
  assert.equal((await call(transitHits, 'start=2024-01-01&days=10&ayanamsaOffset=1e999')).status, 400);

  // /api/muhurta: the place is required and has to be on the Earth.
  assert.equal((await call(muhurta, 'date=2024-06-01&lat=60.17&lng=24.94&tz=3')).status, 200);
  for (const bad of ['date=2024-06-01', 'date=2024-06-01&lat=60&lng=24', 'date=2024-06-01&lat=95&lng=24&tz=3', 'date=2024-06-01&lat=60&lng=24&tz=abc', 'date=2024-06-01&lat=60&lng=24&tz=20', 'date=2024-6-1&lat=60&lng=24&tz=3']) {
    assert.equal((await call(muhurta, bad)).status, 400, bad);
  }

  // /api/muhurta-finder: the stretches in which every condition holds; a condition left out is no condition.
  const finder = 'start=2026-11-01&days=10&lat=60.47&lng=26.95&tz=2&zone=Europe/Helsinki';
  const noCondition = await call(muhurtaFinder, finder);
  assert.equal(noCondition.status, 200);
  assert.equal((noCondition.body.windows as unknown[]).length, 1, 'no condition is the whole span');
  const thursdays = await call(muhurtaFinder, `${finder}&vara=4`);
  assert.equal(thursdays.status, 200);
  assert.ok((thursdays.body.windows as unknown[]).length >= 1 && (thursdays.body.windows as unknown[]).length <= 2, 'a Thursday in ten days');
  assert.deepEqual((await call(muhurtaFinder, `${finder}&vara=`)).body.windows, [], 'an empty list can never be met');
  assert.equal((await call(muhurtaFinder, `${finder}&tithi=1,2,3&sign_Moon=0,1,2,3,4,5&sign_Asc=0,1,2,3,4,5,6,7,8,9,10,11`)).status, 200);
  for (const bad of ['', 'start=2026-11-01', 'start=2026-13-01&lat=60&lng=25&tz=2', 'start=2026-11-1&lat=60&lng=25&tz=2', `${finder}&vara=7`, `${finder}&vara=a`, `${finder}&tithi=0`, `${finder}&tithi=31`, `${finder}&nakshatra=27`, `${finder}&yoga=-1`,
    `${finder}&karana=11`, `${finder}&sign_Moon=12`, `${finder}&sign_Asc=1.5`, `${finder}&sign_Mars=1,,2`, withParam(finder, 'lat', '95'), withParam(finder, 'tz', 'abc'), `${finder}&ayanamsaOffset=Infinity`]) {
    assert.equal((await call(muhurtaFinder, bad)).status, 400, bad);
  }
  assert.equal((await call(muhurtaFinder, `${finder}&sign_Pluto=1`)).status, 200, 'a name that is not a graha of the grid is not read');
  assert.equal((await call(muhurtaFinder, `${finder}&sign_Ketu=1`)).status, 200, 'Ketu is in the grid');
  // Chandrabala: the sign of the Moon at birth and the houses from it that suit.
  const chandraAll = await call(muhurtaFinder, `${finder}&chandra=1:1,3,6,7,10,11`);
  assert.equal(chandraAll.status, 200);
  assert.ok((chandraAll.body.windows as unknown[]).length >= 1);
  assert.deepEqual((await call(muhurtaFinder, `${finder}&chandra=1:`)).body.windows, [], 'no house can never be met');
  assert.equal(((await call(muhurtaFinder, `${finder}&chandra=1:1,2,3,4,5,6,7,8,9,10,11,12`)).body.windows as unknown[]).length, 1, 'every house is no condition');
  for (const bad of ['chandra=', 'chandra=1', 'chandra=12:1', 'chandra=a:1', 'chandra=1:0', 'chandra=1:13', 'chandra=1:1:2']) assert.equal((await call(muhurtaFinder, `${finder}&${bad}`)).status, 400, bad);
  // The Mahādoṣas to keep clear of: `avoid` names them, `natal` gives the birth signs for the Aṣṭama Lagna, `sankrantiHours` the time around a Saṅkrānti.
  const avoided = await call(muhurtaFinder, `${finder}&avoid=panchanga,sankranti`);
  assert.equal(avoided.status, 200);
  assert.ok((avoided.body.windows as unknown[]).length >= 1);
  assert.equal(avoided.body.stepMinutes, 15);
  assert.equal((await call(muhurtaFinder, `${finder}&avoid=kartari&natal=3:5`)).body.stepMinutes, 5, 'a doṣa of the Ascendant');
  assert.equal((await call(muhurtaFinder, `${finder}&avoid=`)).status, 200, 'none');
  assert.equal(((await call(muhurtaFinder, `${finder}&avoid=sankranti&sankrantiHours=0`)).body.windows as unknown[]).length >= 1, true);
  for (const bad of ['avoid=vishaGhati', 'avoid=panchanga,nope', 'natal=12:1', 'natal=1', 'natal=a:b', 'sankrantiHours=49', 'sankrantiHours=abc', 'sankrantiHours=-1']) assert.equal((await call(muhurtaFinder, `${finder}&${bad}`)).status, 400, bad);
  // Tarabala: the nakshatra of the Moon at birth and the taras (1 to 9) of the Moon's nakshatra that suit.
  const taraSome = await call(muhurtaFinder, `${finder}&tara=3:2,4,6,8,9`);
  assert.equal(taraSome.status, 200);
  assert.ok((taraSome.body.windows as unknown[]).length >= 1);
  assert.deepEqual((await call(muhurtaFinder, `${finder}&tara=3:`)).body.windows, [], 'no tara can never be met');
  assert.equal(((await call(muhurtaFinder, `${finder}&tara=3:1,2,3,4,5,6,7,8,9`)).body.windows as unknown[]).length, 1, 'every tara is no condition');
  for (const bad of ['tara=', 'tara=3', 'tara=27:1', 'tara=a:1', 'tara=3:0', 'tara=3:10', 'tara=3:1:2']) assert.equal((await call(muhurtaFinder, `${finder}&${bad}`)).status, 400, bad);
  // Wishes: the groups that score by their weights instead of limiting, and the lowest score listed.
  const wished = await call(muhurtaFinder, `${finder}&chandra=1:1,3,6,7,10,11&tara=3:2,4,6,8,9&prefer=chandra,tara`);
  assert.equal(wished.status, 200);
  const wishedWindows = wished.body.windows as { score: number; maxScore: number }[];
  assert.ok(wishedWindows.length >= 3 && wishedWindows.every(window => window.maxScore === 160 && [0, 60, 100, 160].includes(window.score)));
  const bestOnly = await call(muhurtaFinder, `${finder}&chandra=1:1,3,6,7,10,11&tara=3:2,4,6,8,9&prefer=chandra,tara&minScore=160`);
  assert.ok((bestOnly.body.windows as { score: number }[]).every(window => window.score === 160) && (bestOnly.body.windows as unknown[]).length >= 1);
  assert.equal((await call(muhurtaFinder, `${finder}&prefer=`)).status, 200, 'no wishes');
  assert.equal(((await call(muhurtaFinder, `${finder}&tithi=&prefer=tithi`)).body.windows as unknown[]).length, 1, 'a wish with nothing chosen limits nothing');
  assert.deepEqual((await call(muhurtaFinder, `${finder}&tithi=`)).body.windows, [], 'but a condition with nothing chosen is never met');
  for (const bad of ['prefer=nope', 'prefer=tithi,asc', 'minScore=-1', 'minScore=1001', 'minScore=abc', 'minScore=1.5']) assert.equal((await call(muhurtaFinder, `${finder}&${bad}`)).status, 400, bad);
  // Rules about the houses from the Ascendant: any number up to twelve, each any|none:grahas:houses.
  const moonInLagna = await call(muhurtaFinder, `${finder}&rule=any:Moon:1`);
  assert.equal(moonInLagna.status, 200);
  assert.equal(moonInLagna.body.stepMinutes, 5);
  assert.ok((moonInLagna.body.windows as unknown[]).length >= 3, 'the Moon rises with its sign for hours each day or two');
  assert.deepEqual((await call(muhurtaFinder, `${finder}&rule=any:Moon:`)).body.windows, [], 'a rule with no house can never be met');
  assert.equal((await call(muhurtaFinder, `${finder}&rule=any:Venus,Moon:1&rule=none:Sun,Mars,Saturn,Rahu,Ketu:8,12`)).status, 200);
  const twelve = Array.from({ length: 13 }, () => '&rule=any:Moon:1').join('');
  for (const bad of ['rule=', 'rule=any', 'rule=some:Moon:1', 'rule=any:Asc:1', 'rule=any:Pluto:1', 'rule=any:Moon:0', 'rule=any:Moon:13', 'rule=any:Moon:x', 'rule=any:Moon:1:2', twelve.slice(1)]) {
    const result = await call(muhurtaFinder, `${finder}&${bad.replace(/^&/, '')}`);
    assert.equal(result.status, 400, bad.slice(0, 40));
  }
  assert.equal((await call(muhurtaFinder, withParam(finder, 'days', '99999'))).status, 200, 'a span that is too long is cut to the longest');

  // The annual routes share one reading of the request.
  const annual = `${BIRTH}&target=2024-06-01`;
  for (const [name, handler, extra] of [['pravesha', pravesha, '&kind=nakshatra'], ['sudarshana', sudarshana, ''], ['tithi-pravesha', tithiPravesha, ''], ['varshaphala', varshaphala, '']] as const) {
    const ok = await call(handler, annual + extra);
    assert.equal(ok.status, 200, `${name}: ${JSON.stringify(ok.body).slice(0, 200)}`);
    for (const bad of [`${BIRTH}${extra}`, withParam(annual + extra, 'lat', 'NaN'), withParam(annual + extra, 'tz', '40'), `${annual}${extra}&tpYear=99999999`, withParam(annual + extra, 'hour', 'abc'),
      `${BIRTH}&target=2024-13-45${extra}`, `${BIRTH}&target=0000-01-01${extra}`, `${annual}${extra}&ayanamsaOffset=Infinity`, `month=8&day=15&target=2024-06-01${extra}`]) {
      const result = await call(handler, bad);
      assert.equal(result.status, 400, `${name} ${bad}`);
    }
  }
  assert.equal((await call(pravesha, `${annual}&kind=other`)).status, 400, 'pravesha needs a kind');
  assert.equal((await call(varshaphala, `${BIRTH}&tpYear=2024`)).status, 200, 'a year instead of a target date');
}

main().then(() => console.log('API route tests passed'));
