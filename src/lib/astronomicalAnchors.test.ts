import assert from 'node:assert/strict';
import { calculateChart } from './ephemeris';

// ---------------------------------------------------------------------------
// The Sun and the Moon at moments the astronomical almanacs give, which no other program is needed for: the equinoxes
// and solstices are where the Sun's apparent tropical longitude is 0°, 90°, 180° and 270°, a new Moon where the Sun and
// the Moon are at the same longitude and a full Moon where they are opposite. The times are given to the minute (UTC),
// which is 0.0007° of the Sun's travel and 0.0085° of the Moon's against the Sun.
// ---------------------------------------------------------------------------
const wrap = (degrees: number) => ((((degrees % 360) + 540) % 360) - 180);

async function tropicalSunAndMoon(year: number, month: number, day: number, hour: number, minute: number) {
  const chart = await calculateChart(year, month, day, hour, minute, 0, 0, 0, 0, 'tropical', 'mean', 0, 'mean');
  const longitude = (name: string) => chart.planets.find(planet => planet.name === name)!.longitude;
  return { sun: longitude('Sun'), moon: longitude('Moon') };
}

async function main() {
  const seasons: [string, [number, number, number, number, number], number][] = [
    ['March equinox 2020', [2020, 3, 20, 3, 50], 0],
    ['March equinox 2021', [2021, 3, 20, 9, 37], 0],
    ['March equinox 2022', [2022, 3, 20, 15, 33], 0],
    ['March equinox 2023', [2023, 3, 20, 21, 24], 0],
    ['March equinox 2024', [2024, 3, 20, 3, 6], 0],
    ['June solstice 2024', [2024, 6, 20, 20, 51], 90],
    ['September equinox 2024', [2024, 9, 22, 12, 44], 180],
    ['December solstice 2024', [2024, 12, 21, 9, 21], 270],
  ];
  let worstSun = 0;
  for (const [label, when, longitude] of seasons) {
    const { sun } = await tropicalSunAndMoon(...when);
    const error = Math.abs(wrap(sun - longitude));
    worstSun = Math.max(worstSun, error);
    assert.ok(error <= 0.003, `${label}: the Sun is ${wrap(sun - longitude).toFixed(5)}° from ${longitude}°`);
  }

  const phases: [string, [number, number, number, number, number], number][] = [
    ['full Moon 25 March 2024', [2024, 3, 25, 7, 0], 180],
    ['new Moon 8 April 2024', [2024, 4, 8, 18, 21], 0],
    ['full Moon 23 April 2024', [2024, 4, 23, 23, 49], 180],
    ['new Moon 8 May 2024', [2024, 5, 8, 3, 22], 0],
  ];
  let worstMoon = 0;
  for (const [label, when, elongation] of phases) {
    const { sun, moon } = await tropicalSunAndMoon(...when);
    const error = Math.abs(wrap(moon - sun - elongation));
    worstMoon = Math.max(worstMoon, error);
    assert.ok(error <= 0.01, `${label}: the Moon is ${wrap(moon - sun - elongation).toFixed(5)}° from ${elongation}° of the Sun`);
  }

  console.log(`Astronomical anchor tests passed: the Sun within ${worstSun.toFixed(4)}° at the equinoxes and solstices, the Moon within ${worstMoon.toFixed(4)}° of the phases.`);
}

main().catch(error => { console.error(error); process.exit(1); });
