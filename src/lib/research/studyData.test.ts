import assert from 'node:assert/strict';
import type { SavedChart, SavedChartData } from '@/lib/savedCharts';
import { DEFAULT_CALCULATION_SETTINGS } from '@/types';
import { birthTimeOf, chartRequestUrl, researchSources, studyEventsOf } from './studyData';

const data = (over: Partial<SavedChartData> = {}): SavedChartData => ({
  birthDatetime: '15.08.1947 09.15.00', city: 'New Delhi', manualLat: '28.6139', manualLng: '77.209', ianaTimezone: 'Asia/Kolkata', tzOverride: '',
  targetDate: '2026-10-19', showCoords: true, ...over,
});
const saved = (id: string, name: string, chartData: SavedChartData, client?: string): SavedChart => ({ id, name, client, createdAt: '', updatedAt: '', chartData });
const events = (birth: string) => (birth === '15.08.1947 09.15.00'
  ? JSON.stringify([{ id: 'a', name: 'Moved', date: '1970-05-01', category: 'home', varga: 'D1', notes: '', tags: ['abroad'], significance: 3 }, { id: 'b', name: 'Odd', date: '1970-13-45x', category: 'work', varga: 'D1', notes: '', tags: [], significance: 3 }])
  : birth === '01.01.1980 12.00.00' ? '{broken' : null);

// --- The saved charts with their events, once for each birth moment and place --------------------------------------------------------------------
{
  const list = [
    saved('1', 'Riku', data(), 'Family'),
    saved('2', 'Riku (copy)', data()),
    saved('3', 'Same moment, another place', data({ manualLat: '60.17', manualLng: '24.94' })),
    saved('4', 'Broken events', data({ birthDatetime: '01.01.1980 12.00.00' })),
    saved('5', 'No events', data({ birthDatetime: '02.02.1990 12.00.00' })),
  ];
  const sources = researchSources(list, events);
  assert.deepEqual(sources.map(source => source.id), ['1', '3', '4', '5'], 'a chart saved twice for one moment and place counts once, under the first name');
  assert.equal(sources[0].client, 'Family');
  assert.equal(sources[0].events.length, 2, 'the events of the birth moment');
  assert.equal(sources[2].events.length, 0, 'a list that cannot be read is no events');
  assert.equal(sources[3].events.length, 0);
}

// --- The events as the study takes them: a real day at noon; a day that is not one is left out ---------------------------------------------------------
{
  const [first, ...rest] = studyEventsOf(researchSources([saved('1', 'Riku', data())], events)[0].events);
  assert.equal(rest.length, 0, 'the event on a day that does not exist is left out');
  assert.equal(new Date(first.time).getHours(), 12);
  assert.deepEqual([first.id, first.category, first.tags], ['a', 'home', ['abroad']]);
}

// --- The birth moment ------------------------------------------------------------------------------------------------------------------------------
assert.equal(new Date(birthTimeOf(data())!).getFullYear(), 1947);
assert.equal(birthTimeOf(data({ birthDatetime: 'nonsense' })), null);

// --- The address of the chart ----------------------------------------------------------------------------------------------------------------------
{
  const url = new URL(chartRequestUrl(data())!, 'http://x');
  assert.equal(url.pathname, '/api/chart');
  assert.deepEqual([url.searchParams.get('year'), url.searchParams.get('month'), url.searchParams.get('day'), url.searchParams.get('hour')], ['1947', '08', '15', '09']);
  assert.equal(url.searchParams.get('lat'), '28.6139');
  assert.equal(url.searchParams.get('tz'), '5.5', 'India is five and a half hours ahead of UTC');
  assert.equal(url.searchParams.get('ayanamsa'), 'lahiri');
  assert.equal(url.searchParams.get('sunrise'), 'true');
  // The settings the chart was saved with win over the fallback; a typed offset wins over the time zone.
  const own = new URL(chartRequestUrl(data({ tzOverride: '2', calculationSettings: { ...DEFAULT_CALCULATION_SETTINGS, ayanamsa: 'raman', sunriseMode: 'mean' } }))!, 'http://x');
  assert.equal(own.searchParams.get('tz'), '2');
  assert.equal(own.searchParams.get('ayanamsa'), 'raman');
  assert.equal(own.searchParams.get('sunrise'), 'mean');
  // Without the data to calculate it there is no address.
  assert.equal(chartRequestUrl(data({ manualLat: '' })), null);
  assert.equal(chartRequestUrl(data({ birthDatetime: '1947' })), null);
  assert.equal(chartRequestUrl(data({ ianaTimezone: '', tzOverride: '' })), null);
}

console.log('Research data tests passed');
