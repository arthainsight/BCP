// A moment of the Muhūrta Finder as the link of a chart of its own (worked by hand).
import assert from 'node:assert/strict';
import { momentText, muhurtaChartLink } from './muhurtaChartLink';
import { decodeShare } from './shareLink';

// 29 November 2026 at 04:25 in Helsinki, which is UTC+2 then: 02:25 UTC.
const utc = Date.UTC(2026, 10, 29, 2, 25, 40);
assert.equal(momentText(utc, 'Europe/Helsinki', 2), '29.11.2026 04.25.00', 'the clock of the place, the seconds taken off');
assert.equal(momentText(utc, undefined, 2), '29.11.2026 04.25.00', 'a fixed offset gives the same');
// In summer Helsinki is UTC+3: 15 July 2026 at 06:00 UTC is 09:00.
assert.equal(momentText(Date.UTC(2026, 6, 15, 6, 0, 0), 'Europe/Helsinki', 2), '15.07.2026 09.00.00', 'the daylight-saving time of the date is known to the zone');
// Across midnight: 23:30 UTC on 31 December is 01:30 on 1 January in Helsinki.
assert.equal(momentText(Date.UTC(2026, 11, 31, 23, 30, 0), 'Europe/Helsinki', 2), '01.01.2027 01.30.00');

const link = muhurtaChartLink('https://example.test/app?x=1#old', utc, { name: 'Helsinki', lat: 60.1699, lng: 24.9384, zone: 'Europe/Helsinki', tz: 2 })!;
assert.ok(link.startsWith('https://example.test/app?x=1#c='), 'the old part after the # is replaced');
assert.deepEqual(decodeShare(link.slice(link.indexOf('#'))), {
  birthDatetime: '29.11.2026 04.25.00', city: 'Helsinki', lat: '60.1699', lng: '24.9384', ianaTimezone: 'Europe/Helsinki', tzOverride: '',
});
// Without a name the coordinates are the place; without a zone the offset is set by hand.
const bare = decodeShare(muhurtaChartLink('https://example.test/', utc, { name: '', lat: 60.1699, lng: 24.9384, tz: 2 })!.split('#')[1].replace(/^/, '#'))!;
assert.equal(bare.city, '60.1699, 24.9384');
assert.equal(bare.ianaTimezone, '');
assert.equal(bare.tzOverride, '2');
// A place that is not on the earth cannot be a link.
assert.equal(muhurtaChartLink('https://example.test/', utc, { name: 'x', lat: 95, lng: 0, tz: 0 }), null);
