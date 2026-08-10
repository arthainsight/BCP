import type { ChartData, PlanetData } from '@/types';
import { calculateGrahaDrishti } from './drishti';
import { calcSolarTimes } from './panchang/solar';

const CLASSICAL = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;
const PLANET_NUMBER: Record<string, number> = { Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 9 };
const EXALTATION: Record<string, number> = { Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7 };
const DEBILITATION: Record<string, number> = { Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1 };
const OWN_SIGNS: Record<string, number[]> = { Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6], Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11] };
const MOOLATRIKONA: Record<string, number> = { Sun: 5, Moon: 2, Mars: 1, Mercury: 6, Jupiter: 9, Venus: 7, Saturn: 11 };
const SIGN_LORD = ['', 'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const FRIENDS: Record<string, string[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'], Saturn: ['Mercury', 'Venus'],
};
const ENEMIES: Record<string, string[]> = {
  Sun: ['Venus', 'Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'], Venus: ['Sun', 'Moon'], Saturn: ['Sun', 'Moon', 'Mars'],
};
const COMBUST_ORB: Record<string, number> = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
const SAYANADI = ['Śayana', 'Upaveśana', 'Netrāṇi', 'Prakāśa', 'Gamana', 'Āgamana', 'Sabhā', 'Āgama', 'Bhojana', 'Nṛtyalipsā', 'Kautuka', 'Nidrā'];

export type AvasthaResult = {
  planet: string;
  baladi: string;
  jagratadi: string;
  deeptadi: string;
  lajjitadi: string[];
  sayanadi: string;
  reasons: { baladi: string; jagratadi: string; deeptadi: string; lajjitadi: string; sayanadi: string };
};

function angularDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

function relationship(planet: string, sign: number): 'friend' | 'enemy' | 'neutral' {
  const lord = SIGN_LORD[sign];
  if (FRIENDS[planet]?.includes(lord)) return 'friend';
  if (ENEMIES[planet]?.includes(lord)) return 'enemy';
  return 'neutral';
}

export function calculateBaladi(planet: PlanetData): { value: string; reason: string } {
  const odd = planet.sign % 2 === 1;
  const segment = Math.min(4, Math.floor(planet.degree / 6));
  const names = ['Bāla', 'Kumāra', 'Yuva', 'Vṛddha', 'Mṛta'];
  const index = odd ? segment : 4 - segment;
  return { value: names[index], reason: `${odd ? 'odd' : 'even'} sign · ${planet.degree.toFixed(2)}°` };
}

export function calculateJagratadi(planet: PlanetData): { value: string; reason: string } {
  const odd = planet.sign % 2 === 1;
  const third = Math.min(2, Math.floor(planet.degree / 10));
  const names = ['Jāgrat', 'Svapna', 'Suṣupta'];
  const index = odd ? third : 2 - third;
  return { value: names[index], reason: `${odd ? 'odd' : 'even'} sign · ${planet.degree.toFixed(2)}°` };
}

function calculateDeeptadi(planet: PlanetData, sun: PlanetData | undefined): { value: string; reason: string } {
  if (!CLASSICAL.includes(planet.name as typeof CLASSICAL[number])) return { value: '—', reason: 'Classical dignity state is shown for Sun–Saturn.' };
  if (planet.name !== 'Sun' && sun && angularDistance(planet.longitude, sun.longitude) <= (COMBUST_ORB[planet.name] ?? 0)) {
    return { value: 'Vikala', reason: `combust · ${angularDistance(planet.longitude, sun.longitude).toFixed(2)}° from Sun` };
  }
  if (planet.sign === EXALTATION[planet.name]) return { value: 'Dīpta', reason: 'exaltation sign' };
  if (planet.sign === DEBILITATION[planet.name]) return { value: 'Duḥkhita', reason: 'debilitation sign' };
  if (OWN_SIGNS[planet.name]?.includes(planet.sign)) return { value: 'Svastha', reason: 'own sign' };
  const relation = relationship(planet.name, planet.sign);
  if (relation === 'friend') return { value: 'Mudita', reason: `friend's sign (${SIGN_LORD[planet.sign]})` };
  if (relation === 'enemy') return { value: 'Dīna', reason: `enemy's sign (${SIGN_LORD[planet.sign]})` };
  return { value: 'Śānta', reason: `neutral sign (${SIGN_LORD[planet.sign]})` };
}

function calculateLajjitadi(planet: PlanetData, planets: PlanetData[]): { values: string[]; reason: string } {
  if (!CLASSICAL.includes(planet.name as typeof CLASSICAL[number])) return { values: [], reason: 'Classical states are evaluated for Sun–Saturn; nodes act as afflictors.' };
  const conjunct = planets.filter((p) => p.name !== planet.name && p.sign === planet.sign).map((p) => p.name);
  const aspecting = calculateGrahaDrishti(planets)
    .filter((a) => a.aspectedPlanets.includes(planet.name))
    .map((a) => a.planet);
  const values: string[] = [];
  const why: string[] = [];
  const malefics = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];
  const enemies = ENEMIES[planet.name] ?? [];
  const benefics = ['Moon', 'Mercury', 'Jupiter', 'Venus'];

  if (planet.house === 5 && conjunct.some((name) => malefics.includes(name))) { values.push('Lajjita'); why.push('5th house with a malefic/node'); }
  if (planet.sign === EXALTATION[planet.name] || planet.sign === MOOLATRIKONA[planet.name]) { values.push('Garvita'); why.push('exaltation/mūlatrikoṇa'); }
  if (relationship(planet.name, planet.sign) === 'enemy' || conjunct.some((name) => enemies.includes(name)) || aspecting.includes('Saturn')) { values.push('Kṣudhita'); why.push('enemy sign/conjunction or Saturn aspect'); }
  if ([4, 8, 12].includes(planet.sign) && aspecting.some((name) => enemies.includes(name)) && !aspecting.some((name) => benefics.includes(name))) { values.push('Tṛṣita'); why.push('water sign with enemy aspect and no benefic aspect'); }
  if (relationship(planet.name, planet.sign) === 'friend' || conjunct.includes('Jupiter') || aspecting.some((name) => FRIENDS[planet.name]?.includes(name))) { values.push('Mudita'); why.push('friend sign/contact or Jupiter conjunction'); }
  if (conjunct.includes('Sun') && (aspecting.some((name) => malefics.includes(name)) || conjunct.some((name) => enemies.includes(name)))) { values.push('Kṣobhita'); why.push('Sun conjunction plus malefic/enemy affliction'); }
  return { values, reason: why.join('; ') || 'no Lajjitādi condition triggered' };
}

function parseBirth(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  return { year: +match[1], month: +match[2], day: +match[3], hours: +match[4] + +match[5] / 60 + +(match[6] ?? 0) / 3600 };
}

function previousDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day - 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function ghatiAtBirth(chart: ChartData, birthDatetime: string): number | null {
  const birth = parseBirth(birthDatetime);
  const debug = chart.debug;
  if (!birth || !debug) return null;
  const offset = debug.utcOffset;
  let sunrise = calcSolarTimes(birth.year, birth.month, birth.day, debug.latitude, debug.longitude).sunrise;
  if (sunrise === null) return null;
  sunrise = ((sunrise + offset) % 24 + 24) % 24;
  let elapsed = birth.hours - sunrise;
  if (elapsed < 0) {
    const prev = previousDate(birth.year, birth.month, birth.day);
    const prevSunriseUtc = calcSolarTimes(prev.year, prev.month, prev.day, debug.latitude, debug.longitude).sunrise;
    if (prevSunriseUtc === null) return null;
    const prevSunrise = ((prevSunriseUtc + offset) % 24 + 24) % 24;
    elapsed = birth.hours + 24 - prevSunrise;
  }
  return Math.max(1, Math.min(60, Math.floor(elapsed * 2.5) + 1));
}

function calculateSayanadi(planet: PlanetData, chart: ChartData, birthDatetime: string): { value: string; reason: string } {
  const planetNumber = PLANET_NUMBER[planet.name];
  const moon = chart.planets.find((p) => p.name === 'Moon');
  const ghati = ghatiAtBirth(chart, birthDatetime);
  if (!planetNumber || !moon || ghati === null) return { value: '—', reason: 'Birth time, coordinates and sunrise are required.' };
  const planetNakshatra = Math.floor(planet.longitude / (360 / 27)) + 1;
  const birthNakshatra = Math.floor(moon.longitude / (360 / 27)) + 1;
  const navamsa = Math.min(9, Math.floor(planet.degree / (30 / 9)) + 1);
  const total = planetNakshatra * planetNumber * navamsa + birthNakshatra + ghati + chart.ascendant.sign;
  const index = ((total - 1) % 12 + 12) % 12;
  return { value: SAYANADI[index], reason: `(${planetNakshatra}×${planetNumber}×${navamsa} + ${birthNakshatra} + ghati ${ghati} + lagna ${chart.ascendant.sign}) mod 12` };
}

export function calculateAvasthas(chart: ChartData, birthDatetime: string): AvasthaResult[] {
  const sun = chart.planets.find((p) => p.name === 'Sun');
  return chart.planets
    .filter((planet) => PLANET_NUMBER[planet.name])
    .map((planet) => {
      const baladi = calculateBaladi(planet);
      const jagratadi = calculateJagratadi(planet);
      const deeptadi = calculateDeeptadi(planet, sun);
      const lajjitadi = calculateLajjitadi(planet, chart.planets);
      const sayanadi = calculateSayanadi(planet, chart, birthDatetime);
      return {
        planet: planet.name,
        baladi: baladi.value,
        jagratadi: jagratadi.value,
        deeptadi: deeptadi.value,
        lajjitadi: lajjitadi.values,
        sayanadi: sayanadi.value,
        reasons: { baladi: baladi.reason, jagratadi: jagratadi.reason, deeptadi: deeptadi.reason, lajjitadi: lajjitadi.reason, sayanadi: sayanadi.reason },
      };
    });
}