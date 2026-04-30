export type BhavaBalaRow = {
  house: number;
  sign: string;
  lord: string;
  drig1: number;
  drig2: number;
  drig3: number;
  drig4: number;
  bhavesha: number;
  kendra: number;
  total: number;
};

type ChartPlanet = {
  name: string;
  longitude: number;
  sign: number;
  house?: number;
};

type ChartLike = {
  ascendant?: { sign?: number };
  planets?: ChartPlanet[];
};

type ShadbalaLike = {
  planet: string;
  total?: number;
  totalVirupa?: number;
};

const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const BENEFICS = ['Moon', 'Mercury', 'Jupiter', 'Venus'];

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getPlanet(chart: ChartLike, name: string): ChartPlanet | undefined {
  return chart.planets?.find((planet) => planet.name === name);
}

function getHouseSignIndex(ascendantSign: number | undefined, house: number): number | null {
  if (typeof ascendantSign !== 'number') return null;
  return (ascendantSign + house - 2 + 12) % 12;
}

function getHouseMidLongitude(ascendantSign: number | undefined, house: number): number | null {
  const signIndex = getHouseSignIndex(ascendantSign, house);
  if (typeof signIndex !== 'number') return null;
  return signIndex * 30 + 15;
}

function aspectOrbStrength(diff: number, exact: number, orb: number): number {
  const delta = Math.abs(diff - exact);
  return delta <= orb ? 1 - delta / orb : 0;
}

export function getClassicalAspectStrength(fromName: string, fromLongitude: number, toLongitude: number): number {
  const diff = normalizeDegrees(toLongitude - fromLongitude);
  let strength = aspectOrbStrength(diff, 180, 45);

  if (fromName === 'Mars') {
    strength = Math.max(strength, aspectOrbStrength(diff, 90, 35), aspectOrbStrength(diff, 210, 35));
  }
  if (fromName === 'Jupiter') {
    strength = Math.max(strength, aspectOrbStrength(diff, 120, 35), aspectOrbStrength(diff, 240, 35));
  }
  if (fromName === 'Saturn') {
    strength = Math.max(strength, aspectOrbStrength(diff, 60, 35), aspectOrbStrength(diff, 270, 35));
  }

  return clamp(strength, 0, 1);
}

function calculateBhavaDrig(chart: ChartLike, house: number): Pick<BhavaBalaRow, 'drig1' | 'drig2' | 'drig3' | 'drig4'> {
  const midpoint = getHouseMidLongitude(chart.ascendant?.sign, house);
  const result = { drig1: 0, drig2: 0, drig3: 0, drig4: 0 };
  if (typeof midpoint !== 'number') return result;

  PLANETS.forEach((name) => {
    const planet = getPlanet(chart, name);
    if (typeof planet?.longitude !== 'number') return;

    const aspect = getClassicalAspectStrength(name, planet.longitude, midpoint);
    if (!aspect) return;

    if (BENEFICS.includes(name)) {
      if (aspect >= 0.66) result.drig1 += 180 * aspect;
      else result.drig2 += 100 * aspect;
    } else if (aspect >= 0.66) {
      result.drig3 -= 90 * aspect;
    } else {
      result.drig4 -= 60 * aspect;
    }
  });

  return result;
}

function createShadbalaMap(shadbala: ShadbalaLike[]): Record<string, number> {
  return Object.fromEntries(
    shadbala.map((row) => [
      row.planet,
      typeof row.totalVirupa === 'number'
        ? row.totalVirupa
        : typeof row.total === 'number'
          ? row.total * 60
          : 0,
    ]),
  );
}

export function buildClassicalBhavaBala(chart: ChartLike, shadbala: ShadbalaLike[]): BhavaBalaRow[] {
  const ascendantSign = chart.ascendant?.sign;
  const shadbalaMap = createShadbalaMap(shadbala);

  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const signIndex = getHouseSignIndex(ascendantSign, house);
    const lord = typeof signIndex === 'number' ? SIGN_LORDS[signIndex] : '—';
    const drig = calculateBhavaDrig(chart, house);
    const bhavesha = shadbalaMap[lord] ?? 0;
    const kendra = [1, 4, 7, 10].includes(house) ? 15 : 0;
    const total = drig.drig1 + drig.drig2 + drig.drig3 + drig.drig4 + bhavesha + kendra;

    return {
      house,
      sign: typeof signIndex === 'number' ? SIGN_ABBR[signIndex] : '—',
      lord,
      ...drig,
      bhavesha,
      kendra,
      total,
    };
  });
}
