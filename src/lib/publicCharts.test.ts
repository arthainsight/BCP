import assert from 'node:assert/strict';
import { astroDatabankSearchUrl } from './publicCharts';

assert.equal(astroDatabankSearchUrl(''), 'https://www.astro.com/astro-databank/Main_Page');
const url = new URL(astroDatabankSearchUrl('Albert Einstein'));
assert.equal(url.hostname, 'www.astro.com');
assert.equal(url.searchParams.get('search'), 'Albert Einstein');
assert.equal(url.searchParams.get('title'), 'Special:Search');

console.log('Public Charts tests passed');