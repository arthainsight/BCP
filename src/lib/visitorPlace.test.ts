import assert from 'node:assert/strict';
import { fetchVisitorPlace, isValidTimeZone, placeFromHeaders, visitorPlaceFromJson } from './visitorPlace';

// The place of the visitor from the x-vercel-ip-* headers of the hosting platform.
const headers = (values: Record<string, string>) => (name: string) => values[name] ?? null;
const HELSINKI = { 'x-vercel-ip-city': 'Helsinki', 'x-vercel-ip-country': 'FI', 'x-vercel-ip-latitude': '60.1695', 'x-vercel-ip-longitude': '24.9354', 'x-vercel-ip-timezone': 'Europe/Helsinki' };

assert.deepEqual(placeFromHeaders(headers(HELSINKI)), { city: 'Helsinki', country: 'FI', latitude: 60.1695, longitude: 24.9354, timezone: 'Europe/Helsinki' });
// The platform percent-encodes the names of towns.
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-city': 'Z%C3%BCrich' }))?.city, 'Zürich');
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-city': 'S%C3%A3o%20Paulo' }))?.city, 'São Paulo');
// A name that is not valid percent-encoding is taken as it is, and cannot carry markup or control characters, or be long.
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-city': '100%' }))?.city, '100%');
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-city': '<b>Oulu</b>\u0007' }))?.city, 'bOulu/b');
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-city': 'x'.repeat(500) }))?.city.length, 80);
// No town: the country stands in for it; no town and no country: an empty name, the coordinates still give a place.
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-city': '' }))?.city, 'FI');
assert.equal(placeFromHeaders(headers({ 'x-vercel-ip-latitude': '60.1', 'x-vercel-ip-longitude': '24.9', 'x-vercel-ip-timezone': 'Europe/Helsinki' }))?.city, '');

// What a chart cannot be cast for gives nothing: no headers at all (another host, a local run), no zone, a zone nobody knows,
// no coordinates, coordinates off the Earth, text that is not a number, and 0°, 0° (what a failed lookup gives).
assert.equal(placeFromHeaders(headers({})), null);
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-timezone': '' })), null);
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-timezone': 'Nowhere/Nothing' })), null);
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-latitude': '' })), null);
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-latitude': '91' })), null);
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-longitude': '-181' })), null);
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-latitude': 'abc' })), null);
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-latitude': '1e3' })), null);
assert.equal(placeFromHeaders(headers({ ...HELSINKI, 'x-vercel-ip-latitude': '0', 'x-vercel-ip-longitude': '0' })), null);
// The southern and western hemispheres.
assert.deepEqual(placeFromHeaders(headers({ 'x-vercel-ip-latitude': '-33.8688', 'x-vercel-ip-longitude': '151.2093', 'x-vercel-ip-timezone': 'Australia/Sydney', 'x-vercel-ip-city': 'Sydney' }))?.latitude, -33.8688);
assert.equal(placeFromHeaders(headers({ 'x-vercel-ip-latitude': '40.7128', 'x-vercel-ip-longitude': '-74.006', 'x-vercel-ip-timezone': 'America/New_York' }))?.longitude, -74.006);

assert.ok(isValidTimeZone('Europe/Helsinki') && isValidTimeZone('Asia/Kolkata') && isValidTimeZone('UTC'));
assert.ok(!isValidTimeZone('') && !isValidTimeZone('Nowhere/Nothing') && !isValidTimeZone('x'.repeat(100)));

// What the page reads back from the route: a place with every part right, or nothing (the route answers {} where there is none).
assert.deepEqual(visitorPlaceFromJson({ city: 'Helsinki', country: 'FI', latitude: 60.17, longitude: 24.94, timezone: 'Europe/Helsinki' }), { city: 'Helsinki', country: 'FI', latitude: 60.17, longitude: 24.94, timezone: 'Europe/Helsinki' });
for (const bad of [{}, null, undefined, 'x', 3, { latitude: 60, longitude: 24 }, { latitude: '60', longitude: 24, timezone: 'Europe/Helsinki' }, { latitude: 95, longitude: 24, timezone: 'Europe/Helsinki' }, { latitude: NaN, longitude: 24, timezone: 'Europe/Helsinki' }, { latitude: 60, longitude: 24, timezone: 'Nowhere/Nothing' }]) {
  assert.equal(visitorPlaceFromJson(bad), null, JSON.stringify(bad));
}
assert.equal(visitorPlaceFromJson({ latitude: 60, longitude: 24, timezone: 'Europe/Helsinki', city: 5 })?.city, '');

// The fetch: the place, nothing when the answer is empty or wrong, and nothing (not an error) when the route cannot be reached or is slow.
const answer = (body: unknown, ok = true) => async () => ({ ok, json: async () => body }) as Response;
async function main() {
  const real = globalThis.fetch;
  try {
    globalThis.fetch = answer({ city: 'Helsinki', country: 'FI', latitude: 60.17, longitude: 24.94, timezone: 'Europe/Helsinki' }) as typeof fetch;
    assert.equal((await fetchVisitorPlace())?.city, 'Helsinki');
    globalThis.fetch = answer({}) as typeof fetch;
    assert.equal(await fetchVisitorPlace(), null, 'an empty answer');
    globalThis.fetch = answer({ latitude: 60 }, false) as typeof fetch;
    assert.equal(await fetchVisitorPlace(), null, 'an error status');
    globalThis.fetch = (async () => { throw new Error('offline'); }) as typeof fetch;
    assert.equal(await fetchVisitorPlace(), null, 'offline');
    let aborted = false;
    globalThis.fetch = ((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => { init?.signal?.addEventListener('abort', () => { aborted = true; reject(new Error('aborted')); }); })) as typeof fetch;
    const started = Date.now();
    assert.equal(await fetchVisitorPlace(50), null, 'too slow');
    assert.ok(aborted && Date.now() - started < 1000, 'the request is given up, not waited for');
  } finally {
    globalThis.fetch = real;
  }
  console.log('Visitor place tests passed');
}
void main();
