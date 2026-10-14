import assert from 'node:assert/strict';
import { calculateChart } from './ephemeris';
import { orderGrahas } from './grahaOrder';

const names = (list: { name: string }[]) => list.map(item => item.name);

// The outer planets move behind the nodes; the others keep their order.
assert.deepEqual(
  names(orderGrahas(['Sun', 'Moon', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Rahu', 'Ketu'].map(name => ({ name })))),
  ['Sun', 'Moon', 'Saturn', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto'],
);
assert.deepEqual(names(orderGrahas([])), []);
const input = [{ name: 'Pluto' }, { name: 'Sun' }];
orderGrahas(input);
assert.deepEqual(names(input), ['Pluto', 'Sun'], 'the list given is not changed');

async function main() {
  // A real chart lists the seven grahas, Rahu and Ketu, and then Uranus, Neptune and Pluto.
  const chart = await calculateChart(1990, 7, 15, 12, 0, 0, 60.17, 24.94, 3);
  assert.deepEqual(names(chart.planets), ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'Uranus', 'Neptune', 'Pluto']);
  console.log('grahaOrder tests passed');
}
void main();
