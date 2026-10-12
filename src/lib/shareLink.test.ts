import assert from 'node:assert/strict';
import { decodeShare, encodeShare, shareUrl, type SharedChart } from './shareLink';

const chart: SharedChart = { birthDatetime: '15.08.1947 09.15.00', city: 'Jyväskylä, Suomi', lat: '62.2415', lng: '25.7209', ianaTimezone: 'Europe/Helsinki', tzOverride: '' };

// The chart goes into an address and comes back the same, scandinavian letters and all.
assert.deepEqual(decodeShare(encodeShare(chart)), chart);
assert.deepEqual(decodeShare('#' + encodeShare(chart)), chart, 'with the # in front');
assert.match(encodeShare(chart), /^c=[A-Za-z0-9_-]+$/, 'an address needs no escaping');
assert.equal(shareUrl('https://bcp-five.vercel.app/#old', chart), `https://bcp-five.vercel.app/#${encodeShare(chart)}`, 'an old # is replaced');
assert.deepEqual(decodeShare(encodeShare({ ...chart, tzOverride: '5.5', lat: '-33.86', lng: '151.2' })), { ...chart, tzOverride: '5.5', lat: '-33.86', lng: '151.2' });
assert.equal(decodeShare(encodeShare({ ...chart, ianaTimezone: '' }))?.ianaTimezone, '', 'a chart may have no time zone name');

// Anything else is not a chart.
assert.equal(decodeShare(''), null);
assert.equal(decodeShare('#'), null);
assert.equal(decodeShare('#other=1'), null);
assert.equal(decodeShare('c=@@@'), null, 'not base64');
assert.equal(decodeShare('c=' + Buffer.from('not json').toString('base64url')), null);
const encode = (value: unknown) => 'c=' + Buffer.from(JSON.stringify(value)).toString('base64url');
assert.deepEqual(decodeShare(encode([1, '15.08.1947 09.15.00', 'x', '28.6', '77.2', '', ''])), { birthDatetime: '15.08.1947 09.15.00', city: 'x', lat: '28.6', lng: '77.2', ianaTimezone: '', tzOverride: '' });
assert.equal(decodeShare(encode([2, '15.08.1947 09.15.00', 'x', '28.6', '77.2', '', ''])), null, 'another version');
assert.equal(decodeShare(encode([1, '15.08.1947 09.15.00', 'x', '28.6', '77.2'])), null, 'too short');
assert.equal(decodeShare(encode({ birthDatetime: 'x' })), null);
assert.equal(decodeShare(encode([1, '', 'x', '28.6', '77.2', '', ''])), null, 'no birth time');
assert.equal(decodeShare(encode([1, 'x'.repeat(41), 'x', '28.6', '77.2', '', ''])), null, 'too long');
assert.equal(decodeShare(encode([1, '1.1.2000 1.0.0', 'x', '95', '77.2', '', ''])), null, 'latitude beyond the pole');
assert.equal(decodeShare(encode([1, '1.1.2000 1.0.0', 'x', '28.6', '181', '', ''])), null, 'longitude beyond the date line');
assert.equal(decodeShare(encode([1, '1.1.2000 1.0.0', 'x', 'abc', '77.2', '', ''])), null, 'coordinates are numbers');
assert.equal(decodeShare(encode([1, '1.1.2000 1.0.0', 'x', 28.6, 77.2, '', ''])), null, 'as text');
assert.equal(decodeShare(encode([1, '1.1.2000 1.0.0', 'x', '28.6', '77.2', '../../etc', ''])), null, 'a time zone is a name');
assert.equal(decodeShare(encode([1, '1.1.2000 1.0.0', 'x', '28.6', '77.2', '', '99'])), null, 'an offset is within a day');
assert.equal(decodeShare(encode([1, '1.1.2000 1.0.0', 'y'.repeat(121), '28.6', '77.2', '', ''])), null);

console.log('Share link tests passed');
