import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { PlanetData } from '@/types';
import NorthIndianChart from './NorthIndianChart';
import SouthIndianChart from './SouthIndianChart';
import { buildLayerControls } from './chartLayers';
import { ChartFillContext } from './chartFill';
import { DEFAULT_CHART_DISPLAY } from '@/types';

// ---------------------------------------------------------------------------
// The North and South Indian charts, rendered to markup on the server.
// ---------------------------------------------------------------------------
const planet = (name: string, sign: number, house: number, degree = 10): PlanetData =>
  ({ name, sign, house, degree, longitude: (sign - 1) * 30 + degree });

// Virgo rising, as in the 15.08.1947 test chart.
const planets = [planet('Sun', 6, 1, 18.5), planet('Moon', 4, 11), planet('Jupiter', 7, 2, 25.9)];
const transits = [planet('Mars', 4, 11)];
const paraya = [{ body: 'Jupiter' as const, house: 9, degree: 4.3 }];

const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const base = { activeYearHouse: 0, activeMonthHouse: 0, ascendantSign: 6, planets };

for (const [name, Chart] of [['North', NorthIndianChart], ['South', SouthIndianChart]] as const) {
  // --- The ascendant degree is shown once, in the 1st house -----------------
  const withAsc = text(renderToStaticMarkup(createElement(Chart, { ...base, ascendantDegree: 12.3 })));
  assert.match(withAsc, /Asc 12°18'/i, `${name}: ascendant degree`);
  assert.equal(withAsc.match(/Asc 12°18'/gi)?.length, 1, `${name}: ascendant degree shown once`);
  const precise = text(renderToStaticMarkup(createElement(Chart, { ...base, ascendantDegree: 12.3, degreePrecision: 'degree' })));
  assert.match(precise, /Asc 12°(?!18)/i, `${name}: ascendant follows the degree precision`);

  // --- Layers drawn and listed in the legend ---------------------------------
  const full = renderToStaticMarkup(createElement(Chart, {
    ...base, transitPlanets: transits, showTransitPlanets: true, bnnMajorHouse: 3, nadiParayaHouses: paraya,
  }));
  assert.match(text(full), /BNN Major/, `${name}: BNN Major legend`);
  assert.match(text(full), /Paraya/, `${name}: Paraya legend`);
  assert.match(text(full), /Ju 4\.3°/, `${name}: Paraya point`);
  assert.match(text(full), /Transit/, `${name}: transit legend`);
  assert.doesNotMatch(full, /<button/, `${name}: legend is plain text without controls`);

  // --- Without data, a layer leaves no trace ---------------------------------
  const bare = text(renderToStaticMarkup(createElement(Chart, base)));
  for (const label of ['BNN Major', 'Paraya', 'Transit']) assert.doesNotMatch(bare, new RegExp(label), `${name}: no ${label} legend`);

  // --- Legend controls: an off layer stays in the legend as a pressed-off button
  const toggled: string[] = [];
  const settings = { ...DEFAULT_CHART_DISPLAY, showNadiParaya: false };
  const controls = buildLayerControls(settings, { transit: true, paraya: true, bnnMajor: false }, key => toggled.push(key));
  assert.deepEqual(controls?.map(c => [c.key, c.on]), [['transit', true], ['paraya', false]]);
  const withControls = renderToStaticMarkup(createElement(Chart, {
    ...base, transitPlanets: transits, showTransitPlanets: true, layerControls: controls,
  }));
  assert.equal(withControls.match(/<button/g)?.length, 2, `${name}: one button per layer`);
  assert.match(withControls, /aria-pressed="false"[^>]*>(?:(?!<\/button>).)*Paraya/, `${name}: Paraya is off`);
  assert.match(withControls, /aria-pressed="true"[^>]*>(?:(?!<\/button>).)*Transit/, `${name}: transit is on`);
  assert.doesNotMatch(text(withControls), /Ju 4\.3°/, `${name}: an off layer is not drawn`);
  controls?.forEach(c => c.onToggle());
  assert.deepEqual(toggled, ['showTransitOverlay', 'showNadiParaya']);
}

assert.equal(buildLayerControls(DEFAULT_CHART_DISPLAY, { transit: true }), undefined, 'no controls without a toggle handler');

// --- Compact charts for the Vargas grid ----------------------------------------
for (const [name, Chart] of [['North', NorthIndianChart], ['South', SouthIndianChart]] as const) {
  const compact = renderToStaticMarkup(createElement(Chart, {
    ...base, compact: true, transitPlanets: transits, showTransitPlanets: true, nadiParayaHouses: paraya,
  }));
  assert.doesNotMatch(text(compact), /Transit|Paraya/, `${name}: compact charts have no legend`);
  assert.match(text(compact), /Su/, `${name}: compact charts still draw planets`);

  const highlighted = renderToStaticMarkup(createElement(Chart, { ...base, highlightPlanet: 'Moon', onPlanetClick: () => {} }));
  assert.equal(highlighted.match(/underline/g)?.length, 1, `${name}: only the followed planet is highlighted`);
  assert.match(highlighted, /underline[^>]*>Mo</, `${name}: the Moon is the highlighted label`);
}

// --- Full screen: charts drop their usual width cap and fit the screen --------
for (const [name, Chart, cap] of [['North', NorthIndianChart, 'max-w-[620px]'], ['South', SouthIndianChart, 'max-w-[520px]']] as const) {
  const normal = renderToStaticMarkup(createElement(Chart, base));
  assert.ok(normal.includes(cap), `${name}: capped width normally`);
  const filled = renderToStaticMarkup(createElement(ChartFillContext.Provider, { value: true }, createElement(Chart, base)));
  assert.ok(!filled.includes(cap), `${name}: no width cap in full screen`);
  assert.match(filled, /max-width:min\(100%, calc\(100dvh - 9rem\)\)/, `${name}: fits the screen height in full screen`);
}

// --- Running dasha lords are marked on the natal planets -----------------------
for (const [name, Chart] of [['North', NorthIndianChart], ['South', SouthIndianChart]] as const) {
  const marked = text(renderToStaticMarkup(createElement(Chart, { ...base, dashaLords: { md: 'Sun', ad: 'Moon' } })));
  assert.match(marked, /Suᴹ/, `${name}: mahadasha lord marked`);
  assert.match(marked, /Moᴬ/, `${name}: antardasha lord marked`);
  assert.match(marked, /ᴹᴬ Su–Mo/, `${name}: legend names the running lords`);
  const same = text(renderToStaticMarkup(createElement(Chart, { ...base, dashaLords: { md: 'Moon', ad: 'Moon' } })));
  assert.match(same, /Moᴹᴬ/, `${name}: one lord can hold both`);
  assert.doesNotMatch(text(renderToStaticMarkup(createElement(Chart, base))), /ᴹ|ᴬ/, `${name}: no marks without lords`);
}
