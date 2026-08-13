import { normalizeDegrees } from './angles';
export type OccupantDetail = {
  name: string;
  nature: 'benefic' | 'malefic';
  shadbalaVirupa: number;
  shadbalaRatio: number | null;
  contribution: number;
  note: string;
};

export type DrigDetail = {
  planet: string;
  nature: 'benefic' | 'malefic';
  aspectStrength: number;
  contribution: number;
};

export type BhavaBalaRow = {
  house: number;
  sign: string;
  lord: string;
  // 1. Bhavadhipati Bala — house lord's Ṣaḍbala virupa
  bhavesha: number;
  bhaveshaRequired: number;
  bhaveshaRatio: number;
  bhaveshaSource: string;
  // 2. Bhava Drig Bala — simplified drishti to sign midpoint (~approx: sign*30+15°, not exact cusp)
  drig1: number;  // strong benefic (strength ≥ 0.66): +180 × strength
  drig2: number;  // weak benefic (strength < 0.66): +100 × strength
  drig3: number;  // strong malefic (strength ≥ 0.66): −90 × strength
  drig4: number;  // weak malefic (strength < 0.66): −60 × strength
  drigDetails: DrigDetail[];
  // 3. Occupant (Bhava Graha) contribution — ~approx: benefic +45×ratio, malefic −30×ratio
  occupants: OccupantDetail[];
  occupantTotal: number;
  // 4. ~Bhava Dig Bala — positional bonus: kendra +15, panapara +7.5, apoklima 0 (~approx)
  kendra: number;
  // Total in virupa
  total: number;
};

type ChartPlanet = {
  name: string;
  longitude: number;
  sign: number;   // 1-indexed (1=Aries … 12=Pisces)
  house?: number;
};

type ChartLike = {
  ascendant?: { sign?: number };  // sign is 1-indexed
  planets?: ChartPlanet[];
};

type ShadbalaLike = {
  planet: string;
  total?: number;
  totalVirupa?: number;
  requiredVirupa?: number;
};

type ShadbalaEntry = {
  virupa: number;
  required: number;
  ratio: number;
};

const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const BENEFICS = new Set(['Moon', 'Mercury', 'Jupiter', 'Venus']);

// Classical required Ṣaḍbala minimums — used as fallback when `requiredVirupa` is not passed in.
const SHADBALA_REQUIRED_VIRUPA: Record<string, number> = {
  Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300,
};


function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getPlanet(chart: ChartLike, name: string): ChartPlanet | undefined {
  return chart.planets?.find((planet) => planet.name === name);
}

// ascendantSign is 1-indexed; returns 0-indexed sign index for the Nth house.
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

// Simplified Bhava Drig Bala: orb-based drishti to the sign midpoint (sign * 30 + 15°).
// NOT cusp-based — the actual house cusp longitude is unavailable, so sign midpoint is a proxy.
// Benefic aspects: +180 vp (strong, str≥0.66) or +100 vp (weak). Malefic: −90 (strong) or −60 (weak).
// Returns drig1–4 totals plus per-planet drigDetails for debug display.
function calculateBhavaDrig(
  chart: ChartLike,
  house: number,
): { drig1: number; drig2: number; drig3: number; drig4: number; drigDetails: DrigDetail[] } {
  const midpoint = getHouseMidLongitude(chart.ascendant?.sign, house);
  const result = { drig1: 0, drig2: 0, drig3: 0, drig4: 0, drigDetails: [] as DrigDetail[] };
  if (typeof midpoint !== 'number') return result;

  PLANETS.forEach((name) => {
    const planet = getPlanet(chart, name);
    if (typeof planet?.longitude !== 'number') return;

    const aspect = getClassicalAspectStrength(name, planet.longitude, midpoint);
    if (!aspect) return;

    const isBenefic = BENEFICS.has(name);
    const nature = isBenefic ? 'benefic' : 'malefic' as 'benefic' | 'malefic';
    let contribution = 0;

    if (isBenefic) {
      if (aspect >= 0.66) {
        contribution = 180 * aspect;
        result.drig1 += contribution;
      } else {
        contribution = 100 * aspect;
        result.drig2 += contribution;
      }
    } else if (aspect >= 0.66) {
      contribution = -90 * aspect;
      result.drig3 += contribution;
    } else {
      contribution = -60 * aspect;
      result.drig4 += contribution;
    }

    result.drigDetails.push({ planet: name, nature, aspectStrength: aspect, contribution });
  });

  return result;
}

// Occupant (Bhava Graha) contribution — approximate.
// Finds planets occupying this house (via whole-sign match to planet.sign).
// Benefic planet: +45 × min(Ṣaḍbala ratio, 2.0) virupa.
// Malefic planet: −30 × min(Ṣaḍbala ratio, 2.0) virupa.
// Ratio defaults to 1.0 if Ṣaḍbala is not available.
// A stronger benefic occupant adds more; a stronger malefic subtracts more.
function calculateOccupants(
  chart: ChartLike,
  house: number,
  shadbalaMap: Record<string, ShadbalaEntry>,
): { occupants: OccupantDetail[]; occupantTotal: number } {
  const ascendantSign = chart.ascendant?.sign;
  const houseSignIndex = getHouseSignIndex(ascendantSign, house);
  if (typeof houseSignIndex !== 'number') return { occupants: [], occupantTotal: 0 };

  const houseSign1 = houseSignIndex + 1;  // convert to 1-indexed to match planet.sign
  const occupants: OccupantDetail[] = [];
  let occupantTotal = 0;

  PLANETS.forEach((name) => {
    const planet = getPlanet(chart, name);
    if (typeof planet?.sign !== 'number') return;
    if (planet.sign !== houseSign1) return;

    const isBenefic = BENEFICS.has(name);
    const nature = isBenefic ? 'benefic' : 'malefic' as 'benefic' | 'malefic';
    const entry = shadbalaMap[name];
    const shadbalaVirupa = entry?.virupa ?? 0;
    const shadbalaRequired = entry?.required ?? SHADBALA_REQUIRED_VIRUPA[name] ?? 0;
    const shadbalaRatio = shadbalaRequired > 0 && shadbalaVirupa > 0
      ? shadbalaVirupa / shadbalaRequired
      : null;
    const effectiveRatio = shadbalaRatio !== null ? Math.min(shadbalaRatio, 2.0) : 1.0;
    const base = isBenefic ? 45 : -30;
    const contribution = base * effectiveRatio;
    occupantTotal += contribution;

    const ratioLabel = shadbalaRatio !== null
      ? `${shadbalaRatio.toFixed(2)}× req`
      : 'no Ṣaḍbala';
    const note = `${ratioLabel}; ~${Math.abs(base)}×min(${effectiveRatio.toFixed(2)},2)`;

    occupants.push({ name, nature, shadbalaVirupa, shadbalaRatio, contribution, note });
  });

  return { occupants, occupantTotal };
}

function createShadbalaMap(shadbala: ShadbalaLike[]): Record<string, ShadbalaEntry> {
  return Object.fromEntries(
    shadbala.map((row) => {
      const virupa = typeof row.totalVirupa === 'number'
        ? row.totalVirupa
        : typeof row.total === 'number'
          ? row.total * 60
          : 0;
      const required = row.requiredVirupa ?? SHADBALA_REQUIRED_VIRUPA[row.planet] ?? 0;
      const ratio = required > 0 ? virupa / required : 0;
      return [row.planet, { virupa, required, ratio }];
    }),
  );
}

// Computes classical Bhava Bala using explicit subcomponents. All values in virupa (no 0–100 normalisation).
//
// Components included:
//   1. Bhavadhipati Bala  — lord's Ṣaḍbala total virupa (source shown in bhaveshaSource)
//   2. Bhava Drig Bala    — ~approx: orb-based drishti to sign midpoint (sign*30+15°)
//   3. Occupant Bala      — ~approx: benefic +45×ratio, malefic −30×ratio virupa
//   4. ~Bhava Dig Bala    — ~approx: kendra +15, panapara +7.5, apoklima 0 virupa
//
// Components NOT yet implemented (require additional inputs not currently available):
//   • Exact Bhava Drig Bala using house cusp longitudes instead of sign midpoints
//   • Classical Bhava Kala Bala (temporal house strength)
//
export function buildClassicalBhavaBala(chart: ChartLike, shadbala: ShadbalaLike[]): BhavaBalaRow[] {
  const ascendantSign = chart.ascendant?.sign;
  const shadbalaMap = createShadbalaMap(shadbala);

  return Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const signIndex = getHouseSignIndex(ascendantSign, house);
    const lord = typeof signIndex === 'number' ? SIGN_LORDS[signIndex] : '—';

    const drig = calculateBhavaDrig(chart, house);
    const { occupants, occupantTotal } = calculateOccupants(chart, house, shadbalaMap);

    const lordEntry = shadbalaMap[lord];
    const bhavesha = lordEntry?.virupa ?? 0;
    const bhaveshaRequired = lordEntry?.required ?? SHADBALA_REQUIRED_VIRUPA[lord] ?? 0;
    const bhaveshaRatio = lordEntry?.ratio ?? 0;
    const bhaveshaSource = lordEntry
      ? `Ṣaḍbala ${Math.round(bhavesha)} vp / ${bhaveshaRequired} req = ${bhaveshaRatio.toFixed(2)}×`
      : 'fallback: 0 vp (Ṣaḍbala not computed)';

    // ~Bhava Dig Bala: kendra (angular) +15, panapara (succedent) +7.5, apoklima (cadent) 0.
    // Approximate — full Bhava Dig Bala requires house cusp directional longitude.
    const kendra = [1, 4, 7, 10].includes(house) ? 15 : [2, 5, 8, 11].includes(house) ? 7.5 : 0;

    const total = drig.drig1 + drig.drig2 + drig.drig3 + drig.drig4
      + bhavesha + occupantTotal + kendra;

    return {
      house,
      sign: typeof signIndex === 'number' ? SIGN_ABBR[signIndex] : '—',
      lord,
      bhavesha,
      bhaveshaRequired,
      bhaveshaRatio,
      bhaveshaSource,
      ...drig,
      occupants,
      occupantTotal,
      kendra,
      total,
    };
  });
}
